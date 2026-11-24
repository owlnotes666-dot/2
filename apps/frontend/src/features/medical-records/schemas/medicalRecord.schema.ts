import { z } from "zod";

export const medicalRecordSchema = z.object({
  patient_id: z.string().uuid("Please select a valid patient."),
  doctor_id: z.string().uuid("Please select a valid doctor."),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title must not exceed 150 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters."),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;
