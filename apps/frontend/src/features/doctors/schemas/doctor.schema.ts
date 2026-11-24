import { z } from "zod";

export const doctorSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Doctor name must be at least 2 characters.")
    .max(100, "Doctor name is too long."),

  specialty: z
    .string()
    .trim()
    .min(2, "Please enter a specialty.")
    .max(100, "Specialty is too long."),

  email: z.string().trim().email("Please enter a valid email address."),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;

export const updateDoctorSchema = doctorSchema.extend({
  id: z.string().uuid("Invalid doctor ID."),
});

export type UpdateDoctorFormValues = z.infer<typeof updateDoctorSchema>;
