import { createClient } from "@/lib/supabase/client";
import type {
  AnalyticsStats,
  PatientMonthlyData,
  AnalyticsDateRange,
  AppointmentStatusData,
  MedicalRecordStatusData,
} from "../types/analytics.types";

export const analyticsService = {
  getAnalyticsStats: async (
    dateRange: AnalyticsDateRange,
  ): Promise<AnalyticsStats> => {
    const supabase = createClient();

    const [
      patients,
      doctors,
      appointments,
      medicalRecords,
      activeDoctors,
      scheduledAppointments,
      pendingMedicalRecords,
    ] = await Promise.all([
      supabase
        .schema("medical")
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dateRange.startDate)
        .lte("created_at", dateRange.endDate),

      supabase
        .schema("medical")
        .from("doctors")
        .select("*", { count: "exact", head: true }),

      supabase
        .schema("medical")
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", dateRange.startDate.split("T")[0])
        .lte("appointment_date", dateRange.endDate.split("T")[0]),

      supabase
        .schema("medical")
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dateRange.startDate)
        .lte("created_at", dateRange.endDate),

      supabase
        .schema("medical")
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active"),

      supabase
        .schema("medical")
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "Scheduled")
        .gte("appointment_date", dateRange.startDate.split("T")[0])
        .lte("appointment_date", dateRange.endDate.split("T")[0]),

      supabase
        .schema("medical")
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending")
        .gte("created_at", dateRange.startDate)
        .lte("created_at", dateRange.endDate),
    ]);

    const results = [
      patients,
      doctors,
      appointments,
      medicalRecords,
      activeDoctors,
      scheduledAppointments,
      pendingMedicalRecords,
    ];

    const error = results.find((result) => result.error)?.error;

    if (error) throw error;

    return {
      totalPatients: patients.count ?? 0,
      totalDoctors: doctors.count ?? 0,
      totalAppointments: appointments.count ?? 0,
      totalMedicalRecords: medicalRecords.count ?? 0,
      activeDoctors: activeDoctors.count ?? 0,
      scheduledAppointments: scheduledAppointments.count ?? 0,
      pendingMedicalRecords: pendingMedicalRecords.count ?? 0,
    };
  },

  getPatientMonthlyStats: async (
    dateRange: AnalyticsDateRange,
  ): Promise<PatientMonthlyData[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .schema("medical")
      .from("patients")
      .select("created_at")
      .gte("created_at", dateRange.startDate)
      .lte("created_at", dateRange.endDate)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const monthlyStats: PatientMonthlyData[] = [];

    const currentMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );

    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentMonth <= lastMonth) {
      const year = currentMonth.getFullYear();
      const monthIndex = currentMonth.getMonth();

      const month = currentMonth.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const total = (data ?? []).filter((patient) => {
        const patientDate = new Date(patient.created_at);

        return (
          patientDate.getMonth() === monthIndex &&
          patientDate.getFullYear() === year
        );
      }).length;

      monthlyStats.push({ month, total });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return monthlyStats;
  },
};

export const getAppointmentStatusStats = async (
  dateRange: AnalyticsDateRange,
): Promise<AppointmentStatusData[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("appointments")
    .select("status")
    .gte("appointment_date", dateRange.startDate.split("T")[0])
    .lte("appointment_date", dateRange.endDate.split("T")[0]);

  if (error) throw error;

  const statuses: AppointmentStatusData["status"][] = [
    "Scheduled",
    "Completed",
    "Cancelled",
  ];

  return statuses.map((status) => ({
    status,
    total: (data ?? []).filter((appointment) => appointment.status === status)
      .length,
  }));
};

export const getMedicalRecordStatusStats = async (
  dateRange: AnalyticsDateRange,
): Promise<MedicalRecordStatusData[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("medical_records")
    .select("status")
    .gte("created_at", dateRange.startDate)
    .lte("created_at", dateRange.endDate);

  if (error) throw error;

  const statuses: MedicalRecordStatusData["status"][] = [
    "Pending",
    "Reviewed",
    "Completed",
  ];

  return statuses.map((status) => ({
    status,
    total: (data ?? []).filter((record) => record.status === status).length,
  }));
};
