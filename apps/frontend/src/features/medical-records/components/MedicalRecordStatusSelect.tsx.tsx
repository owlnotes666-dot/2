"use client";

import { useUpdateMedicalRecordStatus } from "../hooks/useUpdateMedicalRecordStatus";
import type { MedicalRecordStatus } from "../types/medicalRecord.types";

interface MedicalRecordStatusSelectProps {
  recordId: string;
  status: MedicalRecordStatus;
  isAdmin: boolean;
}

const statusStyles: Record<MedicalRecordStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const availableStatuses: MedicalRecordStatus[] = [
  "Pending",
  "Reviewed",
  "Completed",
];

export default function MedicalRecordStatusSelect({
  recordId,
  status,
  isAdmin,
}: MedicalRecordStatusSelectProps) {
  const updateMutation = useUpdateMedicalRecordStatus();

  const isUpdating =
    updateMutation.isPending && updateMutation.variables?.id === recordId;

  const handleStatusChange = async (newStatus: MedicalRecordStatus) => {
    if (newStatus === status || !isAdmin || isUpdating) return;

    try {
      await updateMutation.mutateAsync({
        id: recordId,
        status: newStatus,
      });
    } catch {
      // Mutation error is displayed below the select.
    }
  };

  if (!isAdmin) {
    return (
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
      >
        {status}
      </span>
    );
  }

  return (
    <div className="min-w-32 space-y-1.5">
      <select
        value={status}
        disabled={isUpdating}
        onChange={(event) =>
          handleStatusChange(event.target.value as MedicalRecordStatus)
        }
        className={`w-full cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-teal-100 disabled:cursor-wait disabled:opacity-60 ${statusStyles[status]}`}
        aria-label="Change medical record status"
      >
        {availableStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {isUpdating && (
        <p className="text-xs text-slate-400">Updating status...</p>
      )}

      {updateMutation.isError && updateMutation.variables?.id === recordId && (
        <p className="text-xs text-red-500">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : "Failed to update status."}
        </p>
      )}
    </div>
  );
}
