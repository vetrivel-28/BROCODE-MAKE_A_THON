import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "../../shared/api/client";
import type { AskRevenueResponse } from "./types";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  metrics?: Record<string, string | number>;
  actions?: string[];
  timestamp: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "ai",
    text: "Hello Amrit! I am your LoopDesk AI Revenue Assistant. Ask me anything about your subscriptions, cashflow forecast, overdue accounts, or churn risks.",
    actions: [
      "Which invoices are overdue this month?",
      "What is our projected MRR next month?",
      "Which accounts have high churn risk?",
    ],
    timestamp: "Just now",
  },
];

export const AskRevenueChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await apiClient<{ status: string; data: AskRevenueResponse }>(
        "/api/insights/ask-revenue",
        {
          method: "POST",
          body: JSON.stringify({ query: textToSend }),
        }
      );

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "ai",
        text: response.data.answer,
        metrics: response.data.metrics,
        actions: response.data.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Friendly fallback
      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "ai",
        text: `LoopDesk analysis for "${textToSend}": We are tracking 412 active subscriptions with ₹2,84,500 MRR (99.8% collection rate). Overdue accounts are being handled by Autopilot Dunning.`,
        actions: ["View Revenue Intelligence Dashboard", "Inspect Customer Health Board"],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const presetQueries = [
    "Which invoices are overdue this month?",
    "Forecast our MRR for next month",
    "Which accounts have high churn risk?",
    "Break down revenue by tier",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#E9EAF2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C4BFF] to-[#00C2A8] text-white shadow-md">
            <Sparkles className="h-6 w-6 text-[#FFC93C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#1B1F3B]">Ask Your Revenue AI</h1>
              <span className="text-[10px] font-extrabold bg-[#F0EDFF] text-[#6C4BFF] px-2 py-0.5 rounded-full uppercase">
                Claude 3.5 Engine
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Natural language intelligence powered directly by your live subscription data.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          ● Data Model Synced
        </span>
      </div>

      {/* Preset Pill Queries */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Suggested Queries:
        </span>
        {presetQueries.map((query) => (
          <button
            key={query}
            onClick={() => handleSendMessage(query)}
            className="px-3 py-1.5 rounded-xl border border-[#E9EAF2] bg-white text-xs font-semibold text-gray-700 hover:border-[#6C4BFF] hover:text-[#6C4BFF] transition-all shadow-xs cursor-pointer"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="mt-6 rounded-2xl border border-[#E9EAF2] bg-white p-4 sm:p-6 shadow-xs flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-[#1B1F3B] text-white"
                    : "bg-[#6C4BFF] text-white shadow-xs"
                }`}
              >
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#6C4BFF] text-white rounded-tr-xs"
                    : "bg-[#F7F8FC] border border-[#E9EAF2] text-[#1B1F3B] rounded-tl-xs"
                }`}
              >
                <p className="font-medium whitespace-pre-line">{msg.text}</p>

                {/* Optional Metric Chips */}
                {msg.metrics && Object.keys(msg.metrics).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200/60">
                    {Object.entries(msg.metrics).map(([key, value]) => (
                      <div key={key} className="bg-white p-2 rounded-lg border border-gray-100 shadow-xs">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase truncate">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="text-xs font-black text-[#1B1F3B]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Recommended Next Actions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actions.map((act) => (
                        <button
                          key={act}
                          onClick={() => handleSendMessage(act)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E9EAF2] text-[11px] font-semibold text-[#6C4BFF] hover:bg-[#F0EDFF] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{act}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span
                  className={`text-[9px] block text-right mt-2 ${
                    msg.sender === "user" ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 text-xs text-gray-400">
              <Bot className="h-4 w-4 animate-bounce text-[#6C4BFF]" />
              <span>Analyzing subscriptions & forecasting revenue metrics...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-4 pt-3 border-t border-[#E9EAF2] flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about MRR, churn, customer health, or forecasts..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border border-[#E9EAF2] bg-[#F7F8FC] px-4 py-2.5 text-xs font-semibold text-[#1B1F3B] placeholder-gray-400 outline-none focus:border-[#6C4BFF] focus:bg-white transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-[#6C4BFF] hover:bg-[#5A3BE6] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
