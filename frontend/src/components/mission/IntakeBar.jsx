"use client";

import React from "react";
import { User } from "lucide-react";
import { REAL_TICKETS } from "@/services/api";

export default function IntakeBar({ 
  onSelectTicket, 
  selectedTicketId = "TCK-1001",
  tickets = REAL_TICKETS
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "AWAITING_APPROVAL":
        return {
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          label: "Awaiting Approval"
        };
      case "INVESTIGATING":
      case "TRIAGED":
      case "PROPOSED":
        return {
          bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
          label: status === "INVESTIGATING" ? "Investigating" : status
        };
      case "RESOLVED":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          label: "Resolved"
        };
      case "REJECTED":
        return {
          bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
          label: "Rejected"
        };
      case "OPEN":
      default:
        return {
          bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
          label: "Open"
        };
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "PERMISSIONS":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      case "SERVICE_FAILURE":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      case "CONFIG_DRIFT":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
          Select Ticket to Inspect
        </span>
        <span className="font-mono text-[11px] text-zinc-400">
          {tickets.length} tickets in queue
        </span>
      </div>

      {/* Compact List of Ticket Cards: No Description Paragraph */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tickets.map((t) => {
          const isSelected = t.id === selectedTicketId;
          const statusBadge = getStatusBadge(t.status);
          const categoryClass = getCategoryBadge(t.category);

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTicket?.(t.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md scale-[1.01]"
                  : "bg-white/95 dark:bg-[#14151a]/95 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              <div>
                {/* Top Row: Ticket ID, Category Tag & Status Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected 
                        ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {t.id}
                    </span>
                    {t.category && (
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${
                        isSelected 
                          ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900 border-transparent" 
                          : categoryClass
                      }`}>
                        {t.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900 border-transparent"
                      : statusBadge.bg
                  }`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Title (Truncated to single line) */}
                <h4 className="text-xs font-semibold truncate leading-snug">
                  {t.title}
                </h4>
              </div>

              {/* Bottom Row: Employee Name + Role, Relative Time */}
              <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10.5px] font-mono ${
                isSelected 
                  ? "border-zinc-700/60 dark:border-zinc-300/60 opacity-90" 
                  : "border-zinc-100 dark:border-zinc-800 text-zinc-400"
              }`}>
                <div className="flex items-center gap-1 truncate max-w-[150px]">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="font-semibold truncate">{t.employeeId}</span>
                  <span className="opacity-75 truncate">({t.employeeRole})</span>
                </div>
                <span className="flex-shrink-0 ml-1">{t.createdAt}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
