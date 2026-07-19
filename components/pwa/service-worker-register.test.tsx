import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceWorkerRegister } from "./service-worker-register";

describe("ServiceWorkerRegister", () => {
  const register = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    register.mockClear();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // @ts-expect-error -- test cleanup of a property we defined ourselves
    delete navigator.serviceWorker;
  });

  it("registers /sw.js when running a production build", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<ServiceWorkerRegister />);

    expect(register).toHaveBeenCalledExactlyOnceWith("/sw.js");
  });

  it("does not register outside production builds", () => {
    vi.stubEnv("NODE_ENV", "test");

    render(<ServiceWorkerRegister />);

    expect(register).not.toHaveBeenCalled();
  });

  it("renders nothing", () => {
    vi.stubEnv("NODE_ENV", "production");

    const { container } = render(<ServiceWorkerRegister />);

    expect(container).toBeEmptyDOMElement();
  });
});
