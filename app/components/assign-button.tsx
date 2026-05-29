"use client";

import { useFormStatus } from "react-dom";

import { LoadingSpinner } from "./loading-spinner";

export function AssignButton({
  disabled,
  idleLabel = "Assign",
  pendingLabel = "Assigning...",
  disabledLabel = "Assigned",
}: {
  disabled: boolean;
  idleLabel?: string;
  pendingLabel?: string;
  disabledLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`
        inline-flex min-h-10 items-center justify-center gap-2 rounded-full
        px-4
        text-sm font-semibold transition
        ${
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-emerald-300"
        }
      `}
    >
      {disabled ? (
        disabledLabel
      ) : pending ? (
        <>
          <LoadingSpinner className="h-4 w-4" />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
