import type { DashboardStats, AppointmentData } from "../types";
import { createClient } from "@/lib/supabase/client";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const supabase = createClient();
    const now = new Date();

    const today = now.toLocaleDateString("en-CA");

    const sameDayLastWeek = new Date(now);
    sameDayLastWeek.setDate(now.getDate() - 7);
    const previousWeekDate = sameDayLastWeek.toLocaleDateString("en-CA");

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).toISOString();

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).toISOString();

    const formatMonth = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

    const currentSnapshotMonth = formatMonth(now);

    const previousSnapshotDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const previousSnapshotMonth = formatMonth(previousSnapshotDate);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;

      return Math.round(((current - previous) / previous) * 100);
    };

    const [
      patientsResult,
      currentMonthPatients,
      previousMonthPatients,
      todayAppointments,
      previousWeekAppointments,
      doctorsResult,
      reportsResult,
      currentSnapshotResult,
      previousSnapshotResult,
    ] = await Promise.all([
      supabase
        .schema("medical")
        .from("patients")
        .select("id", { count: "exact", head: true }),

      supabase
        .schema("medical")
        .from("patients")
        .select("id", { count: "exact", head: true })
        .gte("created_at", currentMonthStart)
        .lt("created_at", nextMonthStart),

      supabase
        .schema("medical")
        .from("patients")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previousMonthStart)
        .lt("created_at", currentMonthStart),

      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", today),

      supabase
        .schema("medical")
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", previousWeekDate),

      supabase
        .schema("medical")
        .from("doctors")
        .select("id", { count: "exact", head: true })
        .eq("status", "Active"),

      supabase
        .schema("medical")
        .from("medical_records")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending"),

      supabase
        .schema("medical")
        .from("monthly_snapshots")
        .select("active_doctors, pending_reports")
        .eq("snapshot_month", currentSnapshotMonth)
        .maybeSingle(),

      supabase
        .schema("medical")
        .from("monthly_snapshots")
        .select("active_doctors, pending_reports")
        .eq("snapshot_month", previousSnapshotMonth)
        .maybeSingle(),
    ]);

    const error =
      patientsResult.error ||
      currentMonthPatients.error ||
      previousMonthPatients.error ||
      todayAppointments.error ||
      previousWeekAppointments.error ||
      doctorsResult.error ||
      reportsResult.error ||
      currentSnapshotResult.error ||
      previousSnapshotResult.error;

    if (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }

    const currentPatients = currentMonthPatients.count ?? 0;
    const previousPatients = previousMonthPatients.count ?? 0;

    const currentAppointments = todayAppointments.count ?? 0;
    const previousAppointments = previousWeekAppointments.count ?? 0;

    const currentSnapshot = currentSnapshotResult.data;
    const previousSnapshot = previousSnapshotResult.data;

    const hasSnapshotComparison =
      currentSnapshot !== null && previousSnapshot !== null;

    return {
      totalPatients: patientsResult.count ?? 0,

      patientsGrowth: calculateGrowth(currentPatients, previousPatients),

      appointmentsToday: currentAppointments,

      appointmentsGrowth: calculateGrowth(
        currentAppointments,
        previousAppointments,
      ),

      activeDoctors: doctorsResult.count ?? 0,

      doctorsGrowth: hasSnapshotComparison
        ? calculateGrowth(
            currentSnapshot.active_doctors,
            previousSnapshot.active_doctors,
          )
        : 0,

      pendingReports: reportsResult.count ?? 0,

      reportsGrowth: hasSnapshotComparison
        ? calculateGrowth(
            currentSnapshot.pending_reports,
            previousSnapshot.pending_reports,
          )
        : 0,
    };
  },

  async appointments(): Promise<AppointmentData[]> {
    const supabase = createClient();

    const startDate = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0];

    const endDate = new Date(new Date().getFullYear() + 1, 0, 1)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .select("appointment_date")
      .gte("appointment_date", startDate)
      .lt("appointment_date", endDate);

    if (error) {
      throw error;
    }

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(new Date().getFullYear(), index, 1).toLocaleString(
        "en-US",
        {
          month: "short",
        },
      ),
      appointments: 0,
    }));

    data.forEach((appointment) => {
      const monthIndex = new Date(
        `${appointment.appointment_date}T00:00:00`,
      ).getMonth();

      months[monthIndex].appointments += 1;
    });

    return months.map((item, index) => ({
      id: String(index + 1),
      ...item,
    }));
  },

  async getTodayAppointments() {
    const supabase = createClient();

    const today = new Date().toLocaleDateString("en-CA");

    const { data, error } = await supabase
      .schema("medical")
      .from("appointments")
      .select(
        `
  id,
  appointment_date,
  appointment_time,
  status,
  patients!appointments_patient_id_fkey (
    full_name
  ),
  doctors!appointments_doctor_id_fkey (
    full_name,
    specialty
  )
`,
      )
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("Error fetching today's appointments:", error);
      throw error;
    }

    console.log("Appointment details:", JSON.stringify(data, null, 2));

    return data;
  },
  async getOperationsInsights() {
    const supabase = createClient();

    const [appointmentsResult, departmentsResult, pendingReportsResult] =
      await Promise.all([
        supabase.schema("medical").from("appointments").select("status"),

        supabase.schema("medical").from("doctors").select(`
        specialty,
        appointments (
          id
        )
      `),

        supabase
          .schema("medical")
          .from("medical_records")
          .select(
            `
        id,
        title,
        created_at,
        patients (
          full_name
        )
      `,
          )
          .eq("status", "Pending")
          .order("created_at", { ascending: false }),
      ]);

    const error =
      appointmentsResult.error ||
      departmentsResult.error ||
      pendingReportsResult.error;

    if (error) {
      console.error("Error fetching clinic insights:", error);
      throw error;
    }

    // Appointment status distribution
    const statusCounts = (appointmentsResult.data ?? []).reduce(
      (acc, appointment) => {
        const status = appointment.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const appointmentDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    // Department activity
    // Department activity - aggregate appointments by specialty
    const departmentMap = new Map<string, number>();

    (departmentsResult.data ?? []).forEach((doctor) => {
      const specialty = doctor.specialty;
      const appointmentCount = doctor.appointments?.length ?? 0;

      departmentMap.set(
        specialty,
        (departmentMap.get(specialty) ?? 0) + appointmentCount,
      );
    });

    const departmentActivity = Array.from(
      departmentMap.entries(),
      ([specialty, appointments]) => ({
        specialty,
        appointments,
      }),
    ).sort((a, b) => b.appointments - a.appointments);

    // Operational alerts
    const operationalAlerts = (pendingReportsResult.data ?? []).map(
      (record) => {
        const patient = record.patients as unknown as {
          full_name: string;
        } | null;

        return {
          id: record.id,
          title: record.title,
          patientName: patient?.full_name ?? "Unknown Patient",
          createdAt: record.created_at,
          type: "Pending Medical Report",
        };
      },
    );

    return {
      appointmentDistribution,
      departmentActivity,
      operationalAlerts,
    };
  },
};
