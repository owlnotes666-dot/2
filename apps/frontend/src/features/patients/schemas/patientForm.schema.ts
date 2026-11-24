import { z } from "zod";

export const patientFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Please enter the patient's full name.")
    .max(120, "Full name must be 120 characters or fewer."),
  age: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) <= 150),
      "Age must be a whole number between 0 and 150.",
    ),
  gender: z.enum(["", "Male", "Female", "Other"]),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number must be 30 characters or fewer.")
    .refine(
      (value) =>
        value === "" || (/^[+()\d.\-\s]+$/.test(value) && /\d/.test(value)),
      "Please enter a valid phone number.",
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Please enter a valid email address.",
    ),
  condition: z
    .string()
    .trim()
    .max(200, "Medical condition must be 200 characters or fewer."),
  status: z.enum(["Active", "Inactive"]),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
