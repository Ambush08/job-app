import z, { email } from 'zod';

export const registerSchema = z.object({
    email: z.email(),
    firstName: z.string().trim().toLowerCase(),
    lastName: z.string().trim().toLowerCase(),
    password: z.string().trim(),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().trim()
});