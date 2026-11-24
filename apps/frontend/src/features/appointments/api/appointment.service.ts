import { createClient } from "@/lib/supabase/client";
import type {
  AppointmentFilters,
  AppointmentStats,
  AppointmentWithRelations,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentDoctor,
  AppointmentPatient,
} from "../types";

const APPOINTMENT_SELECT = `  id,
  patient_id,
  doctor_id,
  appointment_date,
  appointment_time,
  status,
  created_at,
  patients!appointments_patient_id_fkey (
    id,
    full_name,
    phone,
    email
  ),
  doctors!appointments_doctor_id_fkey (
    id,
    full_name,
    specialty
  )`;

export const appointmentService = {
  getFormOptions: async (): Promise<{
    patients: AppointmentPatient[];
    doctors: AppointmentDoctor[];
  }> => {
    const supabase = createClient();

    const [patientsResult, doctorsResult] = await Promise.all([
      supabase
        .schema("medical")
        .from("patients")
        .select("id, full_name, phone, email")
        .eq("status", "Active")
        .order("full_name"),

      supabase
        .schema("medical")
        .from("doctors")
        .select("id, full_name, specialty")
        .eq("status", "Active")
        .order("full_name"),
    ]);

    if (patientsResult.error) throw patientsResult.error;
    if (doctorsResult.error) throw doctorsResult.error;

    return {
      patients: patientsResult.data ?? [],
      doctors: doctorsResult.data ?? [],
    };
  },

  async getAppointments(
    filters: AppointmentFilters = {},
  ): Promise<AppointmentWithRelations[]> {
    const supabase = createClient();

    let query = supabase
      .schema("medical")
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: true });

    if (filters.status && filters.status !== "All") {
      query = query.eq("status", filters.status);
    }

    if (filters.date) {
      query = query.eq("appointment_date", filters.date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }

    let appointments = (data ?? []) as unknown as AppointmentWithRelations[];

    if (filters.doctorName?.trim()) {
      const doctorName = filters.doctorName.trim().toLowerCase();

      appointments = appointments.filter((appointment) =>
        appointment.doctors?.full_name?.toLowerCase().includes(doctorName),
      );
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim().toLowerCase();

      appointments = appointments.filter((appointment) => {
        const patientName =
          appointment.patients?.full_name?.toLowerCase() ?? "";
        const doctorName = appointment.doctors?.full_name?.toLowerCase() ?? "";

        return patientName.includes(search) || doctorName.includes(search);
      });
    }

    return appointments;
  },

  async getAppointmentById(id: string): Promise<AppointmentWithRelations> {
    const supabase = createClient();

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching appointment:", error);
      throw error;
    }

    return data as unknown as AppointmentWithRelations;
  },

  async getAppointmentStats(): Promise<AppointmentStats> {
    const supabase = createClient();
    const today = new Date().toLocaleDateString("en-CA");

    const [
      totalResult,
      todayResult,
      scheduledResult,
      confirmedResult,
      completedResult,
      cancelledResult,
    ] = await Promise.all([
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true }),
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", today),
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "Scheduled"),
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "Confirmed"),
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "Completed"),
      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "Cancelled"),
    ]);

    const error =
      totalResult.error ||
      todayResult.error ||
      scheduledResult.error ||
      confirmedResult.error ||
      completedResult.error ||
      cancelledResult.error;

    if (error) {
      console.error("Error fetching appointment stats:", error);
      throw error;
    }

    return {
      total: totalResult.count ?? 0,
      today: todayResult.count ?? 0,
      scheduled: scheduledResult.count ?? 0,
      confirmed: confirmedResult.count ?? 0,
      completed: completedResult.count ?? 0,
      cancelled: cancelledResult.count ?? 0,
    };
  },

  async createAppointment(
    input: CreateAppointmentInput,
  ): Promise<AppointmentWithRelations> {
    const supabase = createClient();

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .insert(input)
      .select(APPOINTMENT_SELECT)
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    return data as unknown as AppointmentWithRelations;
  },

  async updateAppointment(
    input: UpdateAppointmentInput,
  ): Promise<AppointmentWithRelations> {
    const supabase = createClient();
    const { id, ...updates } = input;

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select(APPOINTMENT_SELECT)
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }

    return data as unknown as AppointmentWithRelations;
  },

  async cancelAppointment(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .schema("medical")
      .from("appointments")
      .update({ status: "Cancelled" })
      .eq("id", id);

    if (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  },
};
