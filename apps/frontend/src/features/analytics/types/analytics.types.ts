export interface AnalyticsStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalMedicalRecords: number;

  activeDoctors: number;
  scheduledAppointments: number;
  pendingMedicalRecords: number;
}

export interface PatientMonthlyData {
  month: string;
  total: number;
}

export type AnalyticsPeriod = "7d" | "30d" | "3m" | "6m" | "year" | "custom";

export interface AnalyticsDateRange {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
}

export interface AppointmentStatusData {
  status: "Scheduled" | "Completed" | "Cancelled";
  total: number;
}

export interface MedicalRecordStatusData {
  status: "Pending" | "Reviewed" | "Completed";
  total: number;
}