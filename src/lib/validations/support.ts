import * as z from "zod";

export const contactSupportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(255, "Email cannot exceed 255 characters"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject cannot exceed 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message cannot exceed 2000 characters"),
});

export type ContactSupportFormValues = z.infer<typeof contactSupportSchema>;
