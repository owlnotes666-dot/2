"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";

import { DataTablePagination } from "@/shared/components/data-table";
import { useStaff } from "../hooks/useStaff";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import { useUpdateStaffStatus } from "../hooks/useUpdateStaffStatus";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";

import { STAFF_ROLES } from "../constants/staff.constants";
import type { StaffMember } from "../types/staff.types";

const STAFF_PAGE_SIZE = 5;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

export default function StaffClient() {
  const { data: staff = [], isLoading, isError, error, refetch } = useStaff();

  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  const updateStatusMutation = useUpdateStaffStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [pageIndex, setPageIndex] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((member) => member.status === "Active").length,
      inactive: staff.filter((member) => member.status === "Inactive").length,
      roles: new Set(staff.map((member) => member.role)).size,
    }),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(normalizedSearch) ||
        (member.email ?? "").toLowerCase().includes(normalizedSearch) ||
        (member.phone ?? "").toLowerCase().includes(normalizedSearch);

      const matchesRole =
        selectedRole === "All Roles" || member.role === selectedRole;

      const matchesStatus =
        selectedStatus === "All Statuses" || member.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, selectedRole, selectedStatus]);

  const pageCount = Math.ceil(filteredStaff.length / STAFF_PAGE_SIZE);
  const currentPage = Math.min(pageIndex, Math.max(pageCount - 1, 0));

  const paginatedStaff = filteredStaff.slice(
    currentPage * STAFF_PAGE_SIZE,
    (currentPage + 1) * STAFF_PAGE_SIZE,
  );

  const handleStatusChange = (member: StaffMember) => {
    if (!isAdmin || isAdminLoading || updateStatusMutation.isPending) {
      return;
    }

    const nextStatus = member.status === "Active" ? "Inactive" : "Active";

    updateStatusMutation.mutate({
      id: member.id,
      status: nextStatus,
    });
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
            CLINIC MANAGEMENT
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Staff
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage staff members, roles, and contact information.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: isAdmin && !isAdminLoading ? 1.03 : 1 }}
          whileTap={{ scale: isAdmin && !isAdminLoading ? 0.97 : 1 }}
          onClick={() => setIsAddModalOpen(true)}
          disabled={!isAdmin || isAdminLoading}
          title={
            isAdmin
              ? "Add a new staff member"
              : "Only administrators can add staff."
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg leading-none">+</span>
          Add Staff
        </motion.button>
      </motion.div>

      {/* Statistics */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Total Staff", value: stats.total },
          { label: "Active Staff", value: stats.active },
          { label: "Inactive Staff", value: stats.inactive },
          { label: "Staff Roles", value: stats.roles },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Staff Directory */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Staff Directory
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredStaff.length} of {staff.length} staff members
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="staff-search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Search staff
            </label>

            <input
              id="staff-search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPageIndex(0);
              }}
              placeholder="Search by name, email or phone..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="staff-role"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filter by role
            </label>

            <select
              id="staff-role"
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="All Roles">All Roles</option>

              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="staff-status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filter by status
            </label>

            <select
              id="staff-status"
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Mutation Error */}
        {updateStatusMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            Failed to update staff status:{" "}
            {updateStatusMutation.error instanceof Error
              ? updateStatusMutation.error.message
              : "Something went wrong."}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading staff...
          </p>
        ) : isError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <p>
              Failed to load staff:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredStaff.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No staff members match your search or selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedStaff.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900 dark:text-white">
                      {member.full_name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {member.role}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {member.email || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                      {member.phone || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          member.status === "Active"
                            ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(member)}
                          disabled={!isAdmin || isAdminLoading}
                          title={
                            isAdmin
                              ? "Edit staff member"
                              : "Only administrators can edit staff."
                          }
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-950/40"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(member)}
                          disabled={
                            !isAdmin ||
                            isAdminLoading ||
                            updateStatusMutation.isPending
                          }
                          title={
                            isAdmin
                              ? `${member.status === "Active" ? "Deactivate" : "Activate"} staff member`
                              : "Only administrators can change staff status."
                          }
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            member.status === "Active"
                              ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              : "text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                          }`}
                        >
                          {updateStatusMutation.isPending
                            ? "Updating..."
                            : member.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && filteredStaff.length > 0 && (
          <>
            <div className="px-4 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currentPage * STAFF_PAGE_SIZE + 1}-
                  {Math.min(
                    (currentPage + 1) * STAFF_PAGE_SIZE,
                    filteredStaff.length,
                  )}
                </span>{" "}
                of {filteredStaff.length} staff members
              </p>
            </div>

            <DataTablePagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPageIndex}
              showSinglePage
              variant="teal"
            />
          </>
        )}
        <AddStaffModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        {selectedStaff && (
          <EditStaffModal
            isOpen={!!selectedStaff}
            onClose={() => setSelectedStaff(null)}
            staff={selectedStaff}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
