import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("AI API URL is not configured.");
  }

  const { requiresAuth = true, ...requestOptions } = options;

  const headers = new Headers(requestOptions.headers);

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new ApiError("Authentication required.", 401);
    }

    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
    {
      ...requestOptions,
      headers,
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new ApiError(
      errorBody?.detail || "An unexpected API error occurred.",
      response.status,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}