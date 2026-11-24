export type StaffStatus = "Active" | "Inactive";

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: StaffStatus;
  created_at: string;
}

export interface CreateStaffInput {
  full_name: string;
  role: string;
  email: string;
  phone: string;
}

export interface UpdateStaffInput {
  id: string;
  full_name: string;
  role: string;
  email: string;
  phone: string;
}

export interface UpdateStaffStatusInput {
  id: string;
  status: StaffStatus;
}