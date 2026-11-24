"use client";

import { useState } from "react";
import {
  MessageSquare,
  MessageSquarePlus,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";

import type { ConversationSummary } from "../../types";

interface ConversationHistoryProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  isDeleting: boolean;
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  onDelete: (conversationId: string) => void;
}

function ConversationHistory({
  conversations,
  activeConversationId,
  isLoading,
  isDeleting,
  onSelect,
  onNew,
  onDelete,
}: ConversationHistoryProps) {
  const [conversationToDelete, setConversationToDelete] =
    useState<ConversationSummary | null>(null);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));

  const handleConfirmDelete = async () => {
    if (!conversationToDelete || isDeleting) return;

    await onDelete(conversationToDelete.id);
    setConversationToDelete(null);
  };

  return (
    <>
      <aside className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/80 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200/80 p-4 dark:border-slate-700/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Chat History
            </h3>
          </div>

          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400 dark:hover:bg-teal-950"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />

              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No conversations yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Start a new conversation to see it here.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-2 rounded-xl border p-3 transition ${
                    isActive
                      ? "border-teal-200 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/40"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {conversation.title || "New conversation"}
                    </p>

                    <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(conversation.updated_at)}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setConversationToDelete(conversation)}
                    aria-label="Delete conversation"
                    className="rounded-lg p-2 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <Dialog
        open={Boolean(conversationToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setConversationToDelete(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-md gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <DialogHeader className="p-6 pb-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete conversation?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {conversationToDelete?.title || "this conversation"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConversationToDelete(null)}
              disabled={isDeleting}
              className="h-10 rounded-xl px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-10 rounded-xl bg-red-600 px-4 text-white hover:bg-red-700 focus-visible:border-red-500 focus-visible:ring-red-500/30 dark:bg-red-600 dark:hover:bg-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ConversationHistory;
