import * as z from "zod";

export const registerSchema = z.object({
  fullName: z.string()
    .min(1, "Full Name is required")
    .max(20, "Full Name cannot exceed 20 characters"),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .regex(/^[A-Z]/, "Password must start with an uppercase letter")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+/, "Password must contain a special character")
    .refine(s => !/\s/.test(s), "No spaces allowed in password"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters")
});

export type LoginFormValues = z.infer<typeof loginSchema>;
