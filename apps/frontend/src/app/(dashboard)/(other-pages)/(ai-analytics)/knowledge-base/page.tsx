import { Metadata } from "next";

import KnowledgeBaseClient from "@/features/knowledge-base/components/KnowledgeBaseClient";

export const metadata: Metadata = {
  title: "Knowledge Base | Medical Dashboard",
  description: "Knowledge Base",
  // other metadata
};

function KnowledgeBasePage() {
  return <KnowledgeBaseClient />;
}

export default KnowledgeBasePage;
