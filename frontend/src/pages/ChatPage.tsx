import { FormEvent, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AppLayoutContext } from "../App";
import { LoadingState } from "../components/LoadingState";
import { useAuthStore } from "../store/authStore";
import { Message } from "../types";
import { formatDateTime } from "../utils/format";

export const ChatPage = () => {
  const { selectedProjectId, refreshNotifications } = useOutletContext<AppLayoutContext>();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reactingMessageId, setReactingMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesSignatureRef = useRef("");

  const syncMessages = useCallback((nextMessages: Message[]) => {
    const lastMessage = nextMessages[nextMessages.length - 1];
    const reactionSignature = nextMessages.map((message) => `${message.id}:${message.reactionCount}:${message.reactedByMe ? 1 : 0}`).join("|");
    const signature = `${nextMessages.length}:${lastMessage?.id ?? "none"}:${lastMessage?.timestamp ?? "none"}:${reactionSignature}`;

    if (messagesSignatureRef.current === signature) {
      return;
    }

    messagesSignatureRef.current = signature;
    startTransition(() => setMessages(nextMessages));
  }, []);

  const loadMessages = useCallback(async (showLoading = false) => {
    if (!selectedProjectId) {
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await apiRequest<{ messages: Message[] }>(`/projects/${selectedProjectId}/messages`);
      syncMessages(data.messages);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load chat.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [selectedProjectId, syncMessages]);

  useEffect(() => {
    messagesSignatureRef.current = "";
    void loadMessages(true);
  }, [loadMessages, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      void loadMessages();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [loadMessages, selectedProjectId]);

  const groupedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        own: message.userId === user?.id
      })),
    [messages, user?.id]
  );

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !content.trim()) {
      return;
    }

    setSending(true);
    try {
      await apiRequest(`/projects/${selectedProjectId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: content.trim() })
      });
      setContent("");
      await Promise.all([loadMessages(), refreshNotifications()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (message: Message) => {
    if (!selectedProjectId || reactingMessageId === message.id) {
      return;
    }

    setReactingMessageId(message.id);
    try {
      const data = await apiRequest<{ message: Message }>(`/projects/${selectedProjectId}/messages/${message.id}/reactions/toggle`, {
        method: "POST"
      });
      messagesSignatureRef.current = "";
      startTransition(() =>
        setMessages((current) =>
          current.map((item) => (item.id === data.message.id ? data.message : item))
        )
      );
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to react to message.");
    } finally {
      setReactingMessageId(null);
    }
  };

  if (!selectedProjectId) {
    return <div className="glass-panel page-enter p-6 text-sm text-muted">Choose a project to open team chat.</div>;
  }

  return (
    <div className="glass-panel page-enter flex min-h-[78vh] flex-col overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <h1 className="panel-title font-display text-3xl font-semibold text-frost">Project Chat</h1>
        <p className="mt-2 text-sm text-muted">Use @mentions to trigger a notification for teammates.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,_rgba(15,23,42,0.28)_0%,_rgba(2,6,23,0.54)_100%)] p-6">
        {loading && messages.length === 0 ? <LoadingState label="Loading messages..." /> : null}
        {groupedMessages.map((message) => (
          <div key={message.id} className={`flex ${message.own ? "justify-end" : "justify-start"}`}>
            <div
              onDoubleClick={() => void toggleReaction(message)}
              className={`max-w-[70%] rounded-[24px] px-4 py-3 ${
                message.own
                  ? "border border-electric/25 bg-gradient-to-br from-electric/30 to-violet/24 text-white shadow-glow"
                  : "glass-subpanel text-frost"
              } ${reactingMessageId === message.id ? "opacity-80" : ""}`}
              title="Double-click to react with thumbs up"
            >
              <p className={`text-xs font-semibold ${message.own ? "text-white/70" : "text-muted"}`}>
                {message.user.name}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.content}</p>
              <p className={`mt-2 text-[11px] ${message.own ? "text-white/60" : "text-muted/80"}`}>
                {formatDateTime(message.timestamp)}
              </p>
              {message.reactionCount > 0 || message.reactedByMe ? (
                <div className="mt-3 flex">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                      message.reactedByMe
                        ? "border-electric/35 bg-electric/15 text-white"
                        : "border-white/10 bg-white/5 text-frost/85"
                    }`}
                  >
                    <span aria-hidden="true">👍</span>
                    <span>{message.reactionCount}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {!loading && messages.length === 0 ? <p className="text-sm text-muted">No messages yet. Start the conversation.</p> : null}
      </div>

      <form onSubmit={sendMessage} className="border-t border-white/10 bg-white/5 p-5">
        {error ? <p className="mb-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
        <div className="flex gap-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="soft-input min-h-[74px] flex-1 rounded-[24px] px-4 py-3"
            placeholder="Share an update, ask for help, or mention @teammate"
          />
          <button
            type="submit"
            disabled={sending}
            className="glow-button rounded-[24px] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};
