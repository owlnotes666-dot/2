"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SessionTokenPanel() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSession() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!data.session) {
        setToken("");
        setEmail("");
        setExpiresAt(null);
        setMessage("No active session found. Please sign in first.");
        return;
      }

      setToken(data.session.access_token);
      setEmail(data.session.user.email ?? "");
      setExpiresAt(data.session.expires_at ?? null);
      setMessage("Session loaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load session."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setMessage("Access Token copied to clipboard.");
    } catch {
      setMessage("Clipboard access failed. Check browser permissions.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Development Session Token
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Retrieve your current Supabase session token for local API testing.
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Account</p>
          <p className="text-sm text-gray-600">
            {email || "No session loaded"}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium">Expires at</p>
          <p className="text-sm text-gray-600">
            {expiresAt
              ? new Date(expiresAt * 1000).toLocaleString()
              : "—"}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium">Access Token</p>

          <textarea
            readOnly
            value={token}
            placeholder="Load your session first..."
            rows={5}
            className="w-full rounded-lg border bg-gray-500 p-3 font-mono text-xs"
            style={{
              WebkitTextSecurity: visible ? "none" : "disc",
            } as React.CSSProperties}
          />

          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="text-sm text-blue-600"
          >
            {visible ? "Hide token" : "Show token"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadSession}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Session"}
          </button>

          <button
            type="button"
            onClick={copyToken}
            disabled={!token}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Copy Access Token
          </button>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600" aria-live="polite">
            {message}
          </p>
        )}
      </div>

      <p className="text-xs text-amber-700">
        Warning: Treat this token like a password. Never share it or commit it
        to Git.
      </p>
    </main>
  );
}