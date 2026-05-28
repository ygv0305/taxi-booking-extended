const statusStyles: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export function StatusBanner({
  status,
  message,
}: {
  status: string;
  message: string;
}) {
  return (
    <div
      className={`
        rounded-[1.5rem] border px-5 py-4 text-sm font-medium
        shadow-[0_10px_30px_rgba(15,23,42,0.04)]
        ${statusStyles[status] ?? statusStyles.info}
      `}
    >
      {message}
    </div>
  );
}
