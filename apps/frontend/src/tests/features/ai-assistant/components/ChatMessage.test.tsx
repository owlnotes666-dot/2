import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ChatMessage from "@/features/ai-assistant/components/chat/ChatMessage";

let originalClipboard: PropertyDescriptor | undefined;

afterEach(() => {
  vi.useRealTimers();

  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
    originalClipboard = undefined;
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

describe("ChatMessage", () => {
  it("renders Markdown bold markers as bold text in assistant messages", async () => {
    await act(async () => {
      render(
        <ChatMessage
          role="assistant"
          content="This is **important**."
          timestamp="2026-11-17T05:00:00.000Z"
        />,
      );
    });

    expect(screen.getByText("important").tagName).toBe("STRONG");

    expect(screen.getByText("important").closest("p")).toHaveTextContent(
      "This is important.",
    );
  });

  it("keeps Markdown markers literal in user messages", async () => {
    await act(async () => {
      render(
        <ChatMessage
          role="user"
          content="This is **literal**."
          timestamp="2026-11-17T05:00:00.000Z"
        />,
      );
    });

    expect(screen.getByText("This is **literal**.")).toBeInTheDocument();
  });

  it("resets copy feedback after two seconds", async () => {
    vi.useFakeTimers();
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <ChatMessage
        role="assistant"
        content="A response."
        timestamp="2026-11-17T05:00:00.000Z"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
      await Promise.resolve();
    });

    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});