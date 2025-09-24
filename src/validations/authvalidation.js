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

export const UpdateUserSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  address: z.object({
    name: z.string().min(3).max(100).trim(),
    phone: z.string().min(3).max(100).trim(),
    street: z.string().min(3).max(100).trim(),
    city: z.string().min(3).max(100).trim(),
    state: z.string().min(3).max(100).trim(),
    pincode: z.string().min(3).max(100).trim(),
    country: z.string().min(3).max(100).trim(),
  }),
});
