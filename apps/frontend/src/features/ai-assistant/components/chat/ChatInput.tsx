// ChatInput.tsx
"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Paperclip, Send, Loader2, FileText } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFilesSelected: (files: File[]) => void;
  isPending?: boolean;
  isAdmin?: boolean;
  isUploading?: boolean;
  uploadedFiles?: string[];
}

const ACCEPTED_FILES = ".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.pptx";

function ChatInput({
  onSend,
  onFilesSelected,
  isPending = false,
  isAdmin = false,
  isUploading = false,
  uploadedFiles = [],
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isPending || isUploading) return;

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onFilesSelected(files);
    }

    event.target.value = "";
  };

  const isDisabled = isPending || isUploading;

  return (
    <div className="space-y-3">
      {/* Uploaded files chips */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {uploadedFiles.map((filename, index) => (
            <span
              key={`${filename}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-800 shadow-sm backdrop-blur-sm dark:border-teal-800/50 dark:bg-teal-950/50 dark:text-teal-200"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="max-w-[140px] truncate sm:max-w-[200px]">
                {filename}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="group relative flex items-end gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm transition-shadow focus-within:border-teal-300/70 focus-within:shadow-md focus-within:shadow-teal-500/5 dark:border-slate-700/80 dark:bg-slate-800/90 dark:focus-within:border-teal-700/60 sm:gap-3 sm:p-2.5"
      >
        {isAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              title="Attach files"
              aria-label="Attach files"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-teal-400"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </>
        )}

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your medical assistant..."
          rows={1}
          maxLength={8000}
          disabled={isDisabled}
          className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500 sm:px-2"
        />

        <button
          type="submit"
          disabled={!message.trim() || isDisabled}
          aria-label={isPending ? "Sending" : isUploading ? "Uploading" : "Send message"}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 sm:px-4"
        >
          {isPending || isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">
                {isPending ? "Sending..." : "Uploading..."}
              </span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;