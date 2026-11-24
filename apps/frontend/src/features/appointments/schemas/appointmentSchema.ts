import { z } from "zod";

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Please select a valid patient."),

  doctor_id: z.string().uuid("Please select a valid doctor."),

  appointment_date: z
    .string()
    .min(1, "Appointment date is required.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      return !Number.isNaN(date.getTime());
    }, "Please enter a valid date."),

  appointment_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Please enter a valid appointment time.",
    ),

  status: z.enum([
    "Scheduled",
    "Confirmed",
    "Completed",
    "Cancelled",
    "No-show",
  ]),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
