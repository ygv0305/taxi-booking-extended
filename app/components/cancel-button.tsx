"use client";

import { useFormStatus } from "react-dom";

export function CancelButton({
  disabled = false,
  idleLabel = "Cancel booking",
  pendingLabel = "Cancelling...",
}: {
  disabled?: boolean;
  idleLabel?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`
        inline-flex min-h-10 items-center justify-center rounded-full
        border border-rose-200 bg-white px-4 text-sm font-semibold
        text-rose-700 transition hover:border-rose-300 hover:bg-rose-50
        disabled:cursor-not-allowed disabled:border-slate-200
        disabled:bg-slate-100 disabled:text-slate-400
      `}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
