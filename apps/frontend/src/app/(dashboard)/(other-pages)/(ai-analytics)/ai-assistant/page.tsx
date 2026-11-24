import { Metadata } from "next";

import ChatWindow from "@/features/ai-assistant/components/chat/ChatWindow";

export const metadata: Metadata = {
  title: "AI Assistant | Medical Dashboard",
  description: "AI Assistant",
};

function AiAssistant() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-gray-900)] dark:text-white">
          AI Assistant
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your intelligent medical assistant.
        </p>
      </div>

      <ChatWindow />
    </div>
  );
}

export default AiAssistant;
