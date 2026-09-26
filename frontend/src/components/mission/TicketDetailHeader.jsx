"use client";

import React from "react";
import { User, Clock, Tag } from "lucide-react";

export default function TicketDetailHeader({ ticket }) {
  if (!ticket) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "AWAITING_APPROVAL":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "INVESTIGATING":
      case "TRIAGED":
      case "PROPOSED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "REJECTED":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
      case "OPEN":
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
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

  const status = ticket.status || "OPEN";
  const displayId = ticket.id?.length > 12 ? `${ticket.id.slice(0, 8)}...` : (ticket.id || "TCK");
  
  // Format createdAt safely
  let formattedTime = ticket.createdAt || "Recently";
  if (ticket.createdAt && !ticket.createdAt.includes("ago")) {
    try {
      const d = new Date(ticket.createdAt);
      if (!isNaN(d.getTime())) {
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60) formattedTime = "Just now";
        else if (diffSec < 3600) formattedTime = `${Math.floor(diffSec / 60)}m ago`;
        else if (diffSec < 86400) formattedTime = `${Math.floor(diffSec / 3600)}h ago`;
        else formattedTime = d.toLocaleDateString();
      }
    } catch (e) {}
  }

  return (
    <div className="raised-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-sm font-sans space-y-3">
      {/* Top Header Row: ID, Badges, Relative Time */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            {displayId}
          </span>
          <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(status)}`}>
            {status.replace("_", " ")}
          </span>
          {ticket.category && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${getCategoryBadge(ticket.category)}`}>
              {ticket.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ticket.employeeId || "employee"}</span>
            {ticket.employeeRole && (
              <span className="text-zinc-400">({ticket.employeeRole})</span>
            )}
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Ticket Title */}
      <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
        {ticket.title}
      </h2>

      {/* Full Description Paragraph (Relocated here from the list view cards) */}
      <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed bg-zinc-50/70 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
        {ticket.description}
      </p>
    </div>
  );
}
