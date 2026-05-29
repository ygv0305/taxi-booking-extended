"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  AUTO_SCROLL_PARAM,
  AUTO_SCROLL_RESPONSE_VALUE,
} from "@/app/lib/auto-scroll";
import {
  type PortalLookupFieldErrors,
  validatePortalLookupInput,
} from "@/app/lib/search-validation";

import { LoadingSpinner } from "./loading-spinner";

const inputClassName = `
  mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3
  text-base text-slate-900 outline-none transition
  focus:border-sky-400 focus:ring-4 focus:ring-sky-100
`;

function resolveInputClassName(hasError: boolean) {
  return `${inputClassName} ${
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : ""
  }`;
}

function buildPortalLookupUrl(reference: string, phone: string) {
  const params = new URLSearchParams();
  params.set("reference", reference);
  params.set("phone", phone);
  params.set(AUTO_SCROLL_PARAM, AUTO_SCROLL_RESPONSE_VALUE);
  return `/portal?${params.toString()}`;
}

export function PortalLookupForm({
  initialReference,
  initialPhone,
}: {
  initialReference: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState(initialPhone);
  const [fieldErrors, setFieldErrors] = useState<PortalLookupFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validatePortalLookupInput({ reference, phone });

    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setReference(validation.data.reference);
    setPhone(validation.data.phone);

    startTransition(() => {
      router.push(
        buildPortalLookupUrl(validation.data.reference, validation.data.phone),
      );
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
        aria-describedby={fieldErrors.reference ? "portal-reference-error" : undefined}
        className={resolveInputClassName(Boolean(fieldErrors.reference))}
        onChange={(event) => {
          setReference(event.target.value);
          setFieldErrors((currentErrors) => ({
            ...currentErrors,
            reference: undefined,
          }));
        }}
      />
      {fieldErrors.reference ? (
        <p id="portal-reference-error" className="mt-2 text-sm text-rose-600">
          {fieldErrors.reference}
        </p>
      ) : null}

      <label
        htmlFor="phone"
        className="mt-4 block text-sm font-semibold text-slate-900"
      >
        Phone number
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        value={phone}
        placeholder="0212345678"
        autoComplete="tel"
        aria-invalid={fieldErrors.phone ? "true" : "false"}
        aria-describedby={fieldErrors.phone ? "portal-phone-error" : undefined}
        className={resolveInputClassName(Boolean(fieldErrors.phone))}
        onChange={(event) => {
          setPhone(event.target.value);
          setFieldErrors((currentErrors) => ({
            ...currentErrors,
            phone: undefined,
          }));
        }}
      />
      {fieldErrors.phone ? (
        <p id="portal-phone-error" className="mt-2 text-sm text-rose-600">
          {fieldErrors.phone}
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-6 text-slate-500">
        Use the same phone number that was entered when the booking was created.
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
            Finding booking...
          </>
        ) : (
          "Find booking"
        )}
      </button>
    </form>
  );
}
