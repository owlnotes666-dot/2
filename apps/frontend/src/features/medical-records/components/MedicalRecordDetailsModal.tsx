"use client";

import { createPortal } from "react-dom";
import { useMedicalRecordDetails } from "../hooks/useMedicalRecordDetails";
import type { MedicalRecordStatus } from "../types/medicalRecord.types";

interface MedicalRecordDetailsModalProps {
  recordId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<MedicalRecordStatus, string> = {
  Pending:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  Reviewed:
    "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
  Completed:
    "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
        {value ?? "Not provided"}
      </p>
    </div>
  );
}

export default function MedicalRecordDetailsModal({
  recordId,
  isOpen,
  onClose,
}: MedicalRecordDetailsModalProps) {
  const { data, isLoading, isError, error, refetch } =
    useMedicalRecordDetails(recordId);

  if (!isOpen || typeof document === "undefined") return null;

  const record = data?.record;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medical-record-details-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2
              id="medical-record-details-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Medical Record Details
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record information and status history
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {isLoading && (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading medical record details...
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-error-200 bg-error-50 p-5 dark:border-error-500/30 dark:bg-error-500/10">
              <p className="text-sm font-medium text-error-700 dark:text-error-400">
                Could not load medical record details.
              </p>
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700"
              >
                Try Again
              </button>
            </div>
          )}

          {record && !isLoading && (
            <>
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Medical Record
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {record.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[record.status]}`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Created At"
                    value={formatDate(record.created_at)}
                  />
                  <DetailItem label="Record ID" value={record.id} />
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                    {record.description || "No description provided."}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Patient Information
                </h3>

                {record.patient ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Full Name"
                      value={record.patient.full_name}
                    />
                    <DetailItem label="Age" value={record.patient.age} />
                    <DetailItem label="Gender" value={record.patient.gender} />
                    <DetailItem label="Phone" value={record.patient.phone} />
                    <DetailItem label="Email" value={record.patient.email} />
                    <DetailItem
                      label="Condition"
                      value={record.patient.condition}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Patient information is unavailable.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Doctor Information
                </h3>

                {record.doctor ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Full Name"
                      value={record.doctor.full_name}
                    />
                    <DetailItem
                      label="Specialty"
                      value={record.doctor.specialty}
                    />
                    <DetailItem label="Email" value={record.doctor.email} />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Doctor information is unavailable.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Status History
                </h3>

                {data.statusHistory.length > 0 ? (
                  <div className="space-y-4">
                    {data.statusHistory.map((item) => (
                      <div
                        key={item.id}
                        className="relative border-l-2 border-gray-200 pb-2 pl-5 last:pb-0 dark:border-gray-700"
                      >
                        <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-brand-500" />

                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {item.old_status ?? "Initial"} → {item.new_status}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(item.changed_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No status changes recorded yet.
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
