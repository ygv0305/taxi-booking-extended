"use client";

import { useFormStatus } from "react-dom";

import { LoadingSpinner } from "./loading-spinner";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        inline-flex min-h-12 items-center justify-center gap-2 rounded-full
        bg-slate-950 px-6 text-sm font-semibold text-white transition
        hover:bg-slate-800 disabled:bg-slate-400
      `}
    >
      {pending ? (
        <>
          <LoadingSpinner className="h-4 w-4" />
          Saving...
        </>
      ) : (
        "Book"
      )}
    </button>
  );
}
