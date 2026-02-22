"use client";

import React from "react";

export interface SubtaskSummary {
  id: string;
  title: string;
  description?: string;
  points?: number;
}

type Props = {
  subtask: SubtaskSummary;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
};

export default function SubtaskCard({
  subtask,
  selected,
  disabled,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(subtask.id)}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-lg transition-colors border-2 ${
        selected
          ? "border-lime-400 bg-gradient-to-r from-green-900 to-green-800 shadow-lg"
          : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-300">Subtask</div>
          <div className="mt-1 font-semibold text-white">{subtask.title}</div>
          <div className="mt-2 text-xs text-gray-400">
            {subtask.description}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Points</div>
          <div className="font-medium text-white">{subtask.points ?? 0}</div>
        </div>
      </div>
    </button>
  );
}
