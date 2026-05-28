"use client";

import { useFormStatus } from "react-dom";

export function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        inline-flex min-h-11 items-center justify-center rounded-full
        bg-slate-950 px-5 text-sm font-semibold text-white transition
        hover:bg-slate-800 disabled:bg-slate-400
      `}
    >
      {pending ? "Saving changes..." : "Save changes"}
    </button>
  );
}
