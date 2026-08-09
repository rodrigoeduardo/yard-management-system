import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function fakeCookieStore() {
  const store = new Map<string, string>();
  return {
    getAll: () =>
      Array.from(store.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
  };
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => fakeCookieStore()),
}));

const signUpMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/ssr-server", () => ({
  createSupabaseSsrServerClient: () => ({
    auth: { signUp: signUpMock },
  }),
}));

function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function validFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("name", "Maria Souza");
  formData.set("email", "maria@example.com");
  formData.set("password", "correct-horse");
  formData.set("inviteCode", requireTestEnv("REGISTER_INVITE_CODE"));
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("register action", () => {
  afterEach(() => {
    redirectMock.mockClear();
    signUpMock.mockReset();
  });

  it("redirects to /register with an input error and does not sign up when a required field is empty", async () => {
    const { register } = await import("./actions");
    const formData = validFormData({ name: "" });

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?error=invalid_input",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("redirects to /register with an input error and does not sign up when the invite code is missing", async () => {
    const { register } = await import("./actions");
    const formData = validFormData();
    formData.delete("inviteCode");

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?error=invalid_input",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("redirects with a code error and does not sign up when the invite code is wrong", async () => {
    const { register } = await import("./actions");
    const formData = validFormData({ inviteCode: "definitely-wrong-code" });

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?error=invalid_code",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("signs up with the display name in user metadata when the invite code is correct", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const { register } = await import("./actions");
    const formData = validFormData();

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?success=confirm_email",
    );

    expect(signUpMock).toHaveBeenCalledWith({
      email: "maria@example.com",
      password: "correct-horse",
      options: { data: { display_name: "Maria Souza" } },
    });
  });

  it("redirects into the app when signUp returns an active session", async () => {
    signUpMock.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });
    const { register } = await import("./actions");
    const formData = validFormData();

    await expect(register(formData)).rejects.toThrow("REDIRECT:/");
  });

  it("redirects with a signup error when Supabase signUp fails", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { message: "already registered" },
    });
    const { register } = await import("./actions");
    const formData = validFormData();

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?error=signup_failed",
    );
  });

  it("signs up with app_role: viewer in user metadata when the viewer invite code is used", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const { register } = await import("./actions");
    const formData = validFormData({
      inviteCode: requireTestEnv("VIEWER_INVITE_CODE"),
    });

    await expect(register(formData)).rejects.toThrow(
      "REDIRECT:/register?success=confirm_email",
    );

    expect(signUpMock).toHaveBeenCalledWith({
      email: "maria@example.com",
      password: "correct-horse",
      options: {
        data: { display_name: "Maria Souza", app_role: "viewer" },
      },
    });
  });

  it("rejects the viewer invite code as invalid when VIEWER_INVITE_CODE is unset", async () => {
    const viewerCode = requireTestEnv("VIEWER_INVITE_CODE");
    delete process.env.VIEWER_INVITE_CODE;
    try {
      const { register } = await import("./actions");
      const formData = validFormData({ inviteCode: viewerCode });

      await expect(register(formData)).rejects.toThrow(
        "REDIRECT:/register?error=invalid_code",
      );
      expect(signUpMock).not.toHaveBeenCalled();
    } finally {
      process.env.VIEWER_INVITE_CODE = viewerCode;
    }
  });
});
