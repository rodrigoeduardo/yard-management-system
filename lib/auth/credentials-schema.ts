import { z } from "zod";

export const loginCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const registerCredentialsSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
  inviteCode: z.string().min(1),
});
