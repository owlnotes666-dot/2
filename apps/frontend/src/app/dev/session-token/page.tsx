import SessionTokenPanel from "@/features/dev-tools/SessionTokenPanel";

export const metadata = {
  title: "Development Session Token",
};

export default function SessionTokenPage() {
  if (process.env.NODE_ENV !== "development") {
    return <div>Not available.</div>;
  }

  return <SessionTokenPanel />;
}