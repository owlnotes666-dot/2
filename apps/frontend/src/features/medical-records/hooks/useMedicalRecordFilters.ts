"use client";

import { useMemo, useState } from "react";

import type {
  MedicalRecordWithRelations,
  MedicalRecordStatus,
} from "../types/medicalRecord.types";

export function useMedicalRecordFilters(records: MedicalRecordWithRelations[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MedicalRecordStatus | "All">("All");
  const [patientId, setPatientId] = useState("All");
  const [doctorId, setDoctorId] = useState("All");

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        record.title.toLowerCase().includes(normalizedSearch) ||
        (record.patient?.full_name ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (record.doctor?.full_name ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus = status === "All" || record.status === status;

      const matchesPatient =
        patientId === "All" || record.patient_id === patientId;

      const matchesDoctor = doctorId === "All" || record.doctor_id === doctorId;

      return matchesSearch && matchesStatus && matchesPatient && matchesDoctor;
    });
  }, [records, search, status, patientId, doctorId]);

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setPatientId("All");
    setDoctorId("All");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "All" ||
    patientId !== "All" ||
    doctorId !== "All";

  return {
    search,
    setSearch,

    status,
    setStatus,

    patientId,
    setPatientId,

    doctorId,
    setDoctorId,

    filteredRecords,
    clearFilters,
    hasActiveFilters,
  };
}
