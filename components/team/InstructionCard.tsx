import React from "react";

type Status = "ready" | "locked" | "submitted";

const messages: Record<Status, { title: string; body: string }> = {
  ready: {
    title: "Ready",
    body: "Select one of the two cards below. Your selection will lock and open the submission flow.",
  },
  locked: {
    title: "Locked",
    body: "Your choice is locked. Complete the submission form to finalize your entry.",
  },
  submitted: {
    title: "Submitted",
    body: "Final submission received. You may not change your selection.",
  },
};

export default function InstructionCard({ status, instructions }: { status: Status; instructions?: string }) {
  const msg = messages[status];
  return (
    <section className="rounded-xl p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white shadow-md max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-semibold">{msg.title}</h3>
        <div className="text-sm text-gray-300">Status: {status}</div>
      </div>
      <p className="mt-2 text-sm text-gray-300">
        {instructions ? instructions : msg.body}
      </p>
    </section>
  );
}
