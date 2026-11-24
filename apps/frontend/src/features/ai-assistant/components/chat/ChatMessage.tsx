// ChatMessage.tsx
"use client";

import { useEffect, useState } from "react";
import { User, Bot, BookOpen, ExternalLink, Copy, Check } from "lucide-react";
import type { ChatSource, WebSource } from "../../types";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  webSources?: WebSource[];
  animate?: boolean;
}

function renderBoldText(text: string) {
  return text.split(/(\*\*[\s\S]+?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function ChatMessage({
  role,
  content,
  timestamp,
  sources = [],
  webSources = [],
  animate = false,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | null>(null);

  useEffect(() => {
    if (!copyStatus) return;

    const timeoutId = window.setTimeout(() => setCopyStatus(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const [animation, setAnimation] = useState({
    content: "",
    displayed: "",
    complete: false,
  });

  useEffect(() => {
    if (!animate || !content) {
      queueMicrotask(() => {
        setAnimation({
          content,
          displayed: content,
          complete: true,
        });
      });
      return;
    }

    const words = content.match(/\S+\s*/g) ?? [content];
    let currentIndex = 0;

    queueMicrotask(() => {
      setAnimation({
        content,
        displayed: "",
        complete: false,
      });
    });

    const interval = window.setInterval(() => {
      currentIndex += 1;

      const displayed = words.slice(0, currentIndex).join("");
      const complete = currentIndex >= words.length;

      setAnimation({
        content,
        displayed,
        complete,
      });

      if (complete) {
        window.clearInterval(interval);
      }
    }, 25);

    return () => window.clearInterval(interval);
  }, [content, animate]);

  const isAnimationComplete =
    !animate || (animation.content === content && animation.complete);

  const displayedContent = animate
    ? animation.content === content
      ? animation.displayed
      : ""
    : content;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        setCopyStatus("error");
        return;
      }

      await navigator.clipboard.writeText(content);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const formattedTimestamp = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));

  return (
    <div
      className={`group flex min-w-0 items-start gap-2.5 sm:gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${
          isUser
            ? "bg-teal-600 text-white shadow-sm"
            : "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
        ) : (
          <Bot className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
        )}
      </div>

      <div
        className={`flex min-w-0 max-w-[min(85%,28rem)] flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Bubble */}
        <div
          className={`max-w-full space-y-3 rounded-2xl px-3.5 py-2.5 shadow-sm sm:px-4 sm:py-3 ${
            isUser
              ? "rounded-br-md bg-teal-600 text-white"
              : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800 dark:border-slate-700/90 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          <p className="whitespace-pre-wrap text-[13.5px] leading-7 sm:text-sm">
            {isUser ? displayedContent : renderBoldText(displayedContent)}
          </p>

          {/* Knowledge Base Sources */}
          {!isUser && isAnimationComplete && sources.length > 0 && (
            <div className="border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Base
              </div>

              <ul className="space-y-1.5">
                {sources.map((source) => (
                  <li
                    key={`${source.article_id}-${source.chunk_index}`}
                    className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-snug text-slate-600 dark:bg-slate-900/60 dark:text-slate-300"
                  >
                    {source.article_title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Web Sources */}
          {!isUser && isAnimationComplete && webSources.length > 0 && (
            <div className="border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ExternalLink className="h-3.5 w-3.5" />
                Web Sources
              </div>

              <ul className="space-y-1.5">
                {webSources.map((source, index) => (
                  <li key={`${source.url}-${index}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-xs text-teal-600 underline-offset-2 transition-colors hover:text-teal-700 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      <span className="line-clamp-1">
                        {source.title || source.url}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          className={`flex min-h-7 w-full items-center gap-2 px-1 text-[11px] text-slate-400 transition-opacity duration-150 dark:text-slate-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <time dateTime={timestamp}>{formattedTimestamp}</time>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={
              copyStatus === "copied" ? "Message copied" : "Copy message"
            }
            title={copyStatus === "copied" ? "Copied" : "Copy message"}
            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {copyStatus === "copied" ? (
              <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copyStatus && (
              <span role="status">
                {copyStatus === "copied" ? "Copied" : "Copy failed"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
