"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  Search, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  Database,
  ArrowRight,
  Filter,
  ChevronRight,
  ArrowLeft,
  X,
  PanelRight,
  Target,
  Zap,
  Terminal
} from "lucide-react";
import { askQuestion, searchDocs, fetchDocs, SEEDED_DOCUMENTS } from "@/services/api";

const SUGGESTED_PROMPTS = [
  {
    label: "Finance Page Access",
    query: "i cant open the finance page what do i need to get access?",
    hint: "RBAC & Runbook"
  },
  {
    label: "Reset VPN Password",
    query: "How do I reset my company VPN password when locked out?",
    hint: "IT Policy & IdP"
  },
  {
    label: "Billing API Scopes",
    query: "What scope does billing-api need?",
    hint: "Permission Reference"
  },
  {
    label: "Billing Dashboard 403",
    query: "Why did the billing dashboard return 403 missing_scope?",
    hint: "Incident Post-Mortem"
  },
  {
    label: "Database Pool Exhaustion",
    query: "Database Connection Pool Exhaustion Runbook",
    hint: "HikariCP Runbook"
  },
  {
    label: "Kafka Consumer Lag",
    query: "Kafka Consumer Lag Triage Runbook",
    hint: "Event Pipeline"
  }
];

export default function GleanChatView() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm Meri, your internal systems assistant. Ask any question about runbooks, permissions, infrastructure, or post-mortems.",
      timestamp: "Ready",
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Inspector and Side Panel state (Claude-style split view)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState("RESULTS"); // 'RESULTS' | 'DOCUMENT' | 'CORPUS'
  const [corpusDocs, setCorpusDocs] = useState(SEEDED_DOCUMENTS);
  const [queryResults, setQueryResults] = useState([]);
  const [currentQueryText, setCurrentQueryText] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(SEEDED_DOCUMENTS[0]);
  const [corpusFilter, setCorpusFilter] = useState("ALL");
  const [corpusSearch, setCorpusSearch] = useState("");

  const chatEndRef = useRef(null);

  // Fetch full document corpus on mount
  useEffect(() => {
    fetchDocs()
      .then((docs) => {
        if (Array.isArray(docs) && docs.length > 0) {
          setCorpusDocs(docs);
          setSelectedDoc(docs[0]);
        }
      })
      .catch((err) => console.warn("Failed to load documents", err));
  }, []);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Execute two-stage search: LLM Query Reformulation -> BM25 Retrieval -> LLM Answer
  const handleSendPrompt = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q || !q.trim() || isLoading) return;

    const trimmedQuery = q.trim();
    setInputQuery("");
    setIsLoading(true);
    setCurrentQueryText(trimmedQuery);

    const userMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: trimmedQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);

    // Automatically slide the side panel in like Claude when user asks
    setIsSidePanelOpen(true);
    setActiveSideTab("RESULTS");

    try {
      // 1. Call the Two-Stage Ask Service (LLM Intent Reformulation + BM25 Search + Answer)
      const askRes = await askQuestion(trimmedQuery);

      let synthesizedAnswer = "";
      let userIntent = null;
      let expandedQuery = null;
      let retrievedSources = [];

      if (askRes && askRes.answer) {
        synthesizedAnswer = askRes.answer;
        userIntent = askRes.userIntent;
        expandedQuery = askRes.expandedQuery;
        retrievedSources = (askRes.retrievedDocuments || []).map((r) => ({
          docId: r.id || r.title,
          id: r.id || r.title,
          title: r.title,
          type: r.type,
          excerpt: r.content,
          content: r.content,
          score: r.score
        }));
      } else {
        // Fallback: direct BM25 keyword search if LLM backend is offline
        const directResults = await searchDocs(trimmedQuery, 5);
        retrievedSources = directResults.map((r) => ({
          docId: r.id || r.title,
          id: r.id || r.title,
          title: r.title,
          type: r.type,
          excerpt: r.content,
          content: r.content,
          score: r.score
        }));

        if (retrievedSources.length > 0) {
          synthesizedAnswer = `I found **${retrievedSources.length} relevant document(s)** in the internal knowledge base:\n\n` +
            retrievedSources.slice(0, 3).map((r, i) => `${i + 1}. **${r.title}** [[${r.title}]]\n> "${r.content}"`).join("\n\n");
        } else {
          synthesizedAnswer = `I couldn't find any specific documentation matching your query. You can try asking about "billing-api scopes", "403 Forbidden", "database connection pool", or "Kafka consumer lag".`;
        }
      }

      setQueryResults(retrievedSources);
      if (retrievedSources.length > 0) {
        setSelectedDoc(retrievedSources[0]);
      }

      const assistantMessage = {
        id: "ast-" + Date.now(),
        role: "assistant",
        content: synthesizedAnswer,
        userIntent: userIntent,
        expandedQuery: expandedQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: retrievedSources
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Query Search Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "Sorry, I encountered an issue querying the document search index. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Helper to open a cited document in the Inspector side panel
  const handleInspectDocument = (doc) => {
    if (typeof doc === "string") {
      const match = queryResults.find((r) => r.title.toLowerCase() === doc.toLowerCase()) ||
                    corpusDocs.find((d) => d.title.toLowerCase() === doc.toLowerCase()) ||
                    { title: doc, content: "Referenced document title: " + doc, type: "RUNBOOK" };
      setSelectedDoc(match);
    } else {
      setSelectedDoc(doc);
    }
    setActiveSideTab("DOCUMENT");
    setIsSidePanelOpen(true);
  };

  // Reset conversation to initial state
  const handleResetConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm Meri, your internal systems assistant. Ask any question about runbooks, permissions, infrastructure, or post-mortems.",
        timestamp: "Ready",
        sources: []
      }
    ]);
    setQueryResults([]);
    setCurrentQueryText("");
    setIsSidePanelOpen(false);
  };

  // Render text containing inline citation tags [[Title]] as clean monochrome interactive buttons
  // and backticks `code` as crisp monochrome code chips
  const renderFormattedText = (rawText, sources = []) => {
    if (!rawText) return null;

    // Split on [[Document Title]]
    const parts = rawText.split(/(\[\[[^\]]+\]\])/g);

    return parts.map((part, index) => {
      const citationMatch = part.match(/^\[\[([^\]]+)\]\]$/);
      if (citationMatch) {
        const citationTitle = citationMatch[1].trim();
        const matchedSource = 
          sources.find((s) => s.title.toLowerCase() === citationTitle.toLowerCase()) ||
          corpusDocs.find((d) => d.title.toLowerCase() === citationTitle.toLowerCase()) ||
          { title: citationTitle, content: citationTitle, type: "DOC" };

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleInspectDocument(matchedSource)}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer align-baseline transition-colors shadow-2xs"
            title={`Inspect source: ${citationTitle}`}
          >
            <BookOpen className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            <span className="truncate max-w-[210px]">
              [{citationTitle.length > 28 ? citationTitle.slice(0, 26) + "..." : citationTitle}]
            </span>
          </button>
        );
      }

      // Highlight backticks `code` using monochrome code tag
      const subparts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {subparts.map((sub, sIdx) => {
            if (sub.startsWith("`") && sub.endsWith("`") && sub.length > 2) {
              return (
                <code
                  key={sIdx}
                  className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] font-semibold tracking-tight mx-0.5"
                >
                  {sub.slice(1, -1)}
                </code>
              );
            }
            // Highlight bold **bold**
            const boldParts = sub.split(/(\*\*[^*]+\*\*)/g);
            return (
              <span key={sIdx}>
                {boldParts.map((bPart, bIdx) => {
                  if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
                    return (
                      <strong key={bIdx} className="font-bold text-zinc-950 dark:text-zinc-50">
                        {bPart.slice(2, -2)}
                      </strong>
                    );
                  }
                  return bPart;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  // Render message body handling lists, lines, and citations
  const renderMessageContentWithCitations = (text, sources = []) => {
    if (!text) return null;

    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-zinc-800 dark:text-zinc-200">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lIdx} className="h-1" />;
          }

          // Bullet list: * or -
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 mt-1.5 flex-shrink-0" />
                <span className="flex-1">{renderFormattedText(trimmed.slice(2), sources)}</span>
              </div>
            );
          }

          // Numbered list: 1. 2. etc
          const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (numMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 mt-0.5 flex-shrink-0 border border-zinc-300 dark:border-zinc-700">
                  {numMatch[1]}
                </span>
                <span className="flex-1">{renderFormattedText(numMatch[2], sources)}</span>
              </div>
            );
          }

          return <p key={lIdx}>{renderFormattedText(line, sources)}</p>;
        })}
      </div>
    );
  };

  const filteredCorpus = corpusDocs.filter((doc) => {
    if (corpusFilter !== "ALL" && doc.type !== corpusFilter) return false;
    if (corpusSearch) {
      const q = corpusSearch.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.content?.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="font-sans w-full h-[calc(100vh-130px)] min-h-[580px] transition-all duration-300">
      {/* Main Container: Centered when side panel is closed, 2-column split when open */}
      <div className={`h-full transition-all duration-300 ${isSidePanelOpen ? "grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch" : "max-w-4xl mx-auto w-full"}`}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CHAT INTERFACE WITH MERI (Strict Monochrome Black & White) */}
        {/* ========================================================================= */}
        <div className={`${isSidePanelOpen ? "lg:col-span-7" : "w-full"} h-full raised-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 backdrop-blur-md shadow-sm overflow-hidden flex flex-col transition-all`}>
          
          {/* Top Bar of Chat */}
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-xs border border-zinc-700/60 dark:border-zinc-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Meri
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" title="Online" />
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                    Okapi BM25 Copilot
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans truncate">
                  Internal Systems &amp; Runbook Copilot
                </div>
              </div>
            </div>

            {/* Header Controls: Toggle Side Panel & Reset */}
            <div className="flex items-center gap-1.5">
              {!isSidePanelOpen && (queryResults.length > 0 || corpusDocs.length > 0) && (
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(true)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Open side panel to inspect referenced documents"
                >
                  <PanelRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    {queryResults.length > 0 ? `Sources (${queryResults.length})` : "Docs"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Scrolling Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 text-xs leading-relaxed ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs font-bold text-xs border border-zinc-700/60 dark:border-zinc-300">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 space-y-2 relative shadow-2xs ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none font-medium"
                      : "bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-tl-none font-sans"
                  }`}
                >
                  {/* Speaker Label */}
                  <div className="text-[10px] font-mono text-zinc-400 font-semibold mb-0.5 flex items-center justify-between">
                    <span>{msg.role === "user" ? "You" : "Meri"}</span>
                    <span className="opacity-60 text-[9.5px]">{msg.timestamp}</span>
                  </div>

                  {/* IDENTIFIED INTENT BADGE (Monochrome technical styling) */}
                  {msg.userIntent && (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <Target className="w-3 h-3 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
                        <span>Identified Intent</span>
                      </div>
                      <div className="text-xs font-sans font-medium text-zinc-900 dark:text-zinc-200 leading-snug">
                        {msg.userIntent}
                      </div>
                      {msg.expandedQuery && (
                        <div className="pt-1.5 mt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                          <Zap className="w-3 h-3 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">BM25 Terms:</span>
                          <span className="truncate font-mono text-zinc-600 dark:text-zinc-400">{msg.expandedQuery}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="leading-relaxed text-xs">
                    {msg.role === "assistant"
                      ? renderMessageContentWithCitations(msg.content, msg.sources)
                      : msg.content}
                  </div>

                  {/* Retrieved Sources Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2.5 mt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                        <BookOpen className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" />
                        <span>Ranked BM25 Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInspectDocument(src)}
                            className="px-2 py-1 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-[10.5px] font-mono text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                              {src.title}
                            </span>
                            {src.score && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {Number(src.score).toFixed(1)}
                              </span>
                            )}
                            <span className="text-[8.5px] px-1 py-0.2 rounded font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                              {src.type || "Doc"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Footer: Copy */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-end text-[10px] opacity-60 font-mono pt-1">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:opacity-100 flex items-center gap-1 cursor-pointer transition text-zinc-500 dark:text-zinc-400"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                            <span className="text-zinc-900 dark:text-zinc-100">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center animate-pulse shadow-xs font-bold">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-sans text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                  <span>Identifying intent and executing Okapi BM25 retrieval...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggested Queries */}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
            <div className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
              <span>Suggested Queries:</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(prompt.query)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-black dark:hover:text-white text-[11px] font-sans flex-shrink-0 transition cursor-pointer text-left flex items-center gap-1.5 group disabled:opacity-50"
                >
                  <span className="font-medium">
                    {prompt.label}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                    {prompt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar: Clean Black & White Monospace/Sans */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask anything (e.g. 'i cant open finance page', 'vpn reset', 'billing-api scopes')..."
                  disabled={isLoading}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl py-2.5 pl-4 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-sans focus:outline-hidden focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/30 transition shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-xs border border-zinc-700 dark:border-zinc-300"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CLAUDE-STYLE SIDE PANEL (Strict Monochrome Black & White) */}
        {/* ========================================================================= */}
        {isSidePanelOpen && (
          <div className="lg:col-span-5 h-full raised-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 backdrop-blur-md shadow-md overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-200">
            
            {/* Side Panel Header with Mode Switcher & Close 'X' Button */}
            <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {queryResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSideTab("RESULTS")}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      activeSideTab === "RESULTS"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Search className="w-3 h-3" />
                    <span>Sources ({queryResults.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSideTab("DOCUMENT")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeSideTab === "DOCUMENT"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSideTab("CORPUS")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeSideTab === "CORPUS"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>All Docs ({corpusDocs.length})</span>
                </button>
              </div>

              {/* Close Button to return to full-width chat */}
              <button
                type="button"
                onClick={() => setIsSidePanelOpen(false)}
                title="Close panel (return to full chat)"
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TAB 1: QUERY RESULTS (Ranked BM25 Documents) */}
            {activeSideTab === "RESULTS" && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {/* Query Header */}
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between text-zinc-800 dark:text-zinc-200">
                  <div className="truncate mr-2">
                    <span className="text-[9.5px] uppercase font-mono text-zinc-400 block font-semibold">BM25 Matches for:</span>
                    <span className="font-bold font-sans text-zinc-900 dark:text-zinc-100 truncate block text-xs">
                      &quot;{currentQueryText || "Recent Query"}&quot;
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono font-bold border border-zinc-300 dark:border-zinc-700 flex-shrink-0">
                    {queryResults.length} Found
                  </span>
                </div>

                {queryResults.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 font-mono text-xs">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p>No query results yet.</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Enter your query to retrieve documentation.</p>
                  </div>
                ) : (
                  queryResults.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      onClick={() => handleInspectDocument(doc)}
                      className={`p-3 rounded-xl border text-xs transition cursor-pointer space-y-1.5 ${
                        selectedDoc?.title === doc.title
                          ? "border-zinc-900 dark:border-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/80 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                            #{idx + 1}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {doc.type}
                          </span>
                        </div>
                        {doc.score ? (
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                            BM25: {Number(doc.score).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-mono text-zinc-500 font-semibold">
                            Relevant
                          </span>
                        )}
                      </div>

                      <div className="font-sans font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                        {doc.title}
                      </div>

                      <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 line-clamp-2 font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                        {doc.content}
                      </p>

                      <div className="pt-0.5 flex items-center justify-between text-[9.5px] font-mono text-zinc-400">
                        <span>{doc.content?.length || 0} chars</span>
                        <span className="text-zinc-900 dark:text-zinc-200 font-bold flex items-center gap-0.5 hover:underline">
                          Read Document <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: FULL DOCUMENT VIEWER */}
            {activeSideTab === "DOCUMENT" && selectedDoc && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[9.5px] text-zinc-400 uppercase">
                    <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                      {selectedDoc.type}
                    </span>
                    {selectedDoc.score && (
                      <span className="text-[9.5px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        BM25 Score: {Number(selectedDoc.score).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {selectedDoc.title}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider font-semibold">
                    Document Content:
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.content || selectedDoc.excerpt}
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  {queryResults.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSideTab("RESULTS")}
                      className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sources ({queryResults.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSideTab("CORPUS")}
                    className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs font-semibold cursor-pointer"
                  >
                    All Docs ({corpusDocs.length})
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ALL DOCUMENTS (CORPUS SEARCH) */}
            {activeSideTab === "CORPUS" && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {/* Search filter in corpus */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={corpusSearch}
                      onChange={(e) => setCorpusSearch(e.target.value)}
                      placeholder={`Search ${corpusDocs.length} documentation files...`}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 transition"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 font-mono text-[9.5px]">
                    {[
                      { id: "ALL", label: `All (${corpusDocs.length})` },
                      { id: "RUNBOOK", label: "Runbooks" },
                      { id: "POLICY", label: "Policies" },
                      { id: "POSTMORTEM", label: "Post-Mortems" },
                      { id: "PERMISSION_DOC", label: "Permissions" },
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        type="button"
                        onClick={() => setCorpusFilter(flt.id)}
                        className={`px-2 py-0.5 rounded transition cursor-pointer flex-shrink-0 ${
                          corpusFilter === flt.id
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        }`}
                      >
                        {flt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Cards */}
                <div className="space-y-2">
                  {filteredCorpus.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      onClick={() => handleInspectDocument(doc)}
                      className={`p-3 rounded-xl border text-xs transition cursor-pointer space-y-1 ${
                        selectedDoc?.title === doc.title
                          ? "border-zinc-900 dark:border-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/80 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {doc.type}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {doc.content?.length || 0} chars
                        </span>
                      </div>

                      <div className="font-sans font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                        {doc.title}
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 font-mono">
                        {doc.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
