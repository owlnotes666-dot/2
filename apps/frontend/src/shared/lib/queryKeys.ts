export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },

  dashboard: {
    stats: ["dashboard", "stats"] as const,
    appointments: ["dashboard", "appointments"] as const,
    todayAppointments: ["dashboard", "todayAppointments"] as const,
    operationsInsights: ["dashboard", "operationsInsights"] as const,
  },

  appointments: {
    all: ["appointments"] as const,
    lists: () => [...queryKeys.appointments.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    stats: () => [...queryKeys.appointments.all, "stats"] as const,
    formOptions: () => [...queryKeys.appointments.all, "formOptions"] as const,
  },

  profile: {
    me: ["profile"] as const,
  },

  medicalRecords: {
    all: ["medicalRecords"] as const,
    lists: () => [...queryKeys.medicalRecords.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.medicalRecords.lists(), filters] as const,
    details: () => [...queryKeys.medicalRecords.all, "detail"] as const,

    detail: (id: string) =>
      [...queryKeys.medicalRecords.details(), id] as const,
  },

  staff: {
  all: ["staff"] as const,
  lists: () => [...queryKeys.staff.all, "list"] as const,
},
};
