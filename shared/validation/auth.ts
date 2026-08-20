import { z } from "zod";

/** Pakistan mobile: 03XXXXXXXXX or +923XXXXXXXXX */
export const PHONE_REGEX = /^(?:\+92|0)3\d{9}$/;

/** At least 8 chars, 1 letter, 1 number, 1 special character */
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => PHONE_REGEX.test(v), {
      message:
        "Enter a valid Pakistan mobile number (e.g. 03XXXXXXXXX or +923XXXXXXXXX)",
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(
      PASSWORD_REGEX,
      "Password must include letters, numbers, and a special character",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function validateRegisterClient(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): string | null {
  const result = registerSchema.safeParse(input);
  if (result.success) return null;
  const first = result.error.issues[0];
  return first?.message ?? "Invalid registration details";
}
