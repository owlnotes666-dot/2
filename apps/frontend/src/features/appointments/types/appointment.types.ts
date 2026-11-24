export type AppointmentStatus =
| "Scheduled"
| "Confirmed"
| "Completed"
| "Cancelled"
| "No-show";

export interface Appointment {
id: string;
patient_id: string;
doctor_id: string;
appointment_date: string;
appointment_time: string;
status: AppointmentStatus;
created_at: string;
}

export interface AppointmentPatient {
id: string;
full_name: string;
phone: string | null;
email: string | null;
}

export interface AppointmentDoctor {
id: string;
full_name: string;
specialty: string;
}

export interface AppointmentWithRelations extends Appointment {
patients: AppointmentPatient | null;
doctors: AppointmentDoctor | null;
}


export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | "All";
  doctorName?: string;
  date?: string;
}



export interface CreateAppointmentInput {
patient_id: string;
doctor_id: string;
appointment_date: string;
appointment_time: string;
status: AppointmentStatus;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {
id: string;
}

export interface AppointmentStats {
total: number;
today: number;
scheduled: number;
confirmed: number;
completed: number;
cancelled: number;
}
