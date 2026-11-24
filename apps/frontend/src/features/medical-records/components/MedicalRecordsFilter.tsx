"use client";

import type { MedicalRecordStatus } from "../types/medicalRecord.types";

interface FilterOption {
  id: string;
  full_name: string;
}

interface MedicalRecordsFilterProps {
  search: string;
  setSearch: (value: string) => void;

  status: MedicalRecordStatus | "All";
  setStatus: (value: MedicalRecordStatus | "All") => void;

  patientId: string;
  setPatientId: (value: string) => void;

  doctorId: string;
  setDoctorId: (value: string) => void;

  patients: FilterOption[];
  doctors: FilterOption[];

  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function MedicalRecordsFilter({
  search,
  setSearch,
  status,
  setStatus,
  patientId,
  setPatientId,
  doctorId,
  setDoctorId,
  patients,
  doctors,
  hasActiveFilters,
  onClearFilters,
}: MedicalRecordsFilterProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Search & Filters
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Find medical records using the filters below.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="self-start text-sm font-medium text-brand-500 transition hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 sm:self-auto"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Search */}
        <div className="xl:col-span-1">
          <label
            htmlFor="medical-record-search"
            className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Search
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              ⌕
            </span>

            <input
              id="medical-record-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-400"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="medical-record-status"
            className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Status
          </label>

          <select
            id="medical-record-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MedicalRecordStatus | "All")
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-400"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Patient */}
        <div>
          <label
            htmlFor="medical-record-patient"
            className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Patient
          </label>

          <select
            id="medical-record-patient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-400"
          >
            <option value="All">All Patients</option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label
            htmlFor="medical-record-doctor"
            className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Doctor
          </label>

          <select
            id="medical-record-doctor"
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-400"
          >
            <option value="All">All Doctors</option>

            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
