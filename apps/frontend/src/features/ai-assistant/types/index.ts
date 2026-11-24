export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  history?: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatSource {
  article_id: string;
  article_title: string;
  chunk_index: number;
  similarity: number;
}

export interface WebSource {
  title: string;
  url: string;
  score: number;
}

export interface ChatResponse {
  conversation_id: string | null;
  message: string;
  provider: string;
  model: string;
  usage: ChatUsage | null;
  sources: ChatSource[];
  web_sources: WebSource[];
}

export interface FileUploadResponse {
  conversation_id: string;
  filename: string;
  message: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  web_sources: WebSource[];
  usage: ChatUsage | null;
  created_at: string;
}

export interface ConversationHistory {
  conversation: ConversationSummary & {
    owner_id: string;
  };
  messages: ConversationMessage[];
}
