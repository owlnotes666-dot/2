import { z } from "zod";

export const staffSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters.")
    .max(100, "Full name must not exceed 100 characters."),

  role: z
    .string()
    .trim()
    .min(2, "Please select a valid staff role.")
    .max(50, "Role must not exceed 50 characters."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(20, "Phone number must not exceed 20 characters."),
});

export type StaffFormValues = z.infer<typeof staffSchema>;

export const updateStaffSchema = staffSchema.extend({
  id: z.string().uuid("Invalid staff ID."),
});

export type UpdateStaffFormValues = z.infer<typeof updateStaffSchema>;
