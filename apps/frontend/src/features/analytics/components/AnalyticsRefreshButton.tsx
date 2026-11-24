"use client";

import { useState } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

export default function AnalyticsRefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({
    queryKey: ["analytics"],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || isFetching > 0) return;

    setIsRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["analytics"],
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isRefreshing || isFetching > 0;

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
    >
      <RefreshCw
        size={16}
        className={isLoading ? "animate-spin" : ""}
      />

      {isLoading ? "Refreshing..." : "Refresh"}
    </button>
  );
}