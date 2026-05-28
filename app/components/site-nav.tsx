"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Booking" },
  { href: "/admin", label: "Admin" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className={`
        flex items-center gap-2 rounded-full border border-slate-200
        bg-white/85 p-1 shadow-sm
      `}
    >
      {navLinks.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === link.href
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`
              rounded-full px-4 py-2 text-sm font-semibold transition
              ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm shadow-slate-950/20"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }
            `}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
