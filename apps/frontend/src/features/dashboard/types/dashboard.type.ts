export interface DashboardStats {
  totalPatients: number;
  patientsGrowth: number;
  appointmentsToday: number;
  appointmentsGrowth: number;
  activeDoctors: number;
  doctorsGrowth: number;
  pendingReports: number;
  reportsGrowth: number;
}

export interface AppointmentData {
  id: string;
  month: string;
  appointments: number;
}

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  status: "Active" | "Discharged" | "Critical";
  lastVisit: string;
}

export interface DashboardTarget {
  target: number;
  completed: number;
  today: number;
  progress: number;
  growth: number;
}

export interface DepartmentData {
  id: string;
  department: string;
  patients: number;
  percentage: number;
}

export interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  patients: number;
  status: "Available" | "Busy" | "Off Duty";
}

export interface DashboardData {
  stats: DashboardStats;
  appointments: AppointmentData[];
}

export interface RecentAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled";
}