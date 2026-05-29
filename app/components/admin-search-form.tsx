"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  AUTO_SCROLL_PARAM,
  AUTO_SCROLL_RESPONSE_VALUE,
} from "@/app/lib/auto-scroll";
import {
  type AdminSearchFieldErrors,
  validateAdminSearchInput,
} from "@/app/lib/search-validation";

import { LoadingSpinner } from "./loading-spinner";

const inputClassName = `
  mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4
  py-3 text-base text-slate-900 outline-none transition
  focus:border-sky-400 focus:ring-4 focus:ring-sky-100
`;

function resolveInputClassName(hasError: boolean) {
  return `${inputClassName} ${
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : ""
  }`;
}

function buildAdminSearchUrl(reference: string) {
  const params = new URLSearchParams();

  if (reference) {
    params.set("reference", reference);
  }

  params.set(AUTO_SCROLL_PARAM, AUTO_SCROLL_RESPONSE_VALUE);

  return `/admin?${params.toString()}`;
}

export function AdminSearchForm({
  initialReference,
}: {
  initialReference: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference);
  const [fieldErrors, setFieldErrors] = useState<AdminSearchFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateAdminSearchInput({ reference });

    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setReference(validation.data.reference);

    startTransition(() => {
      router.push(buildAdminSearchUrl(validation.data.reference));
    });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={`
        rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5
      `}
    >
      <label htmlFor="reference" className="text-sm font-semibold text-slate-900">
        Booking reference
      </label>
      <input
        id="reference"
        name="reference"
        value={reference}
        placeholder="BRN00001"
        autoComplete="off"
        aria-invalid={fieldErrors.reference ? "true" : "false"}
        aria-describedby={fieldErrors.reference ? "admin-reference-error" : undefined}
        className={resolveInputClassName(Boolean(fieldErrors.reference))}
        onChange={(event) => {
          setReference(event.target.value);
          setFieldErrors({});
        }}
      />
      {fieldErrors.reference ? (
        <p id="admin-reference-error" className="mt-2 text-sm text-rose-600">
          {fieldErrors.reference}
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Leave empty to show the upcoming active queue.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className={`
          mt-5 inline-flex min-h-12 items-center justify-center gap-2
          rounded-full bg-slate-950 px-5 text-sm font-semibold text-white
          transition hover:bg-slate-800 disabled:bg-slate-400
        `}
      >
        {isPending ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            Searching...
          </>
        ) : (
          "Search bookings"
        )}
      </button>
    </form>
  );
}
