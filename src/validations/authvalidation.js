import { z } from "zod";

export const RegisterSchema = z.strictObject({
  name: z.string().min(3).max(100).trim(),

  email: z.email().min(3).max(100).trim(),

  password: z.string().min(3).max(100).trim(),
});

export const LoginSchema = z.strictObject({
  email: z.email().min(3).max(100).trim(),

  password: z.string().min(3).max(100).trim(),
});
