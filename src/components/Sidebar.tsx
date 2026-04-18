"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Package,
  Wrench,
  Menu,
  X,
  LogOut,
  Anchor,
  Archive,
  SpellCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const leaderNav: NavItem[] = [
  { href: "/prosjekter", label: "Prosjekter", icon: FolderKanban },
  { href: "/rov-systemer", label: "ROV-systemer", icon: Anchor },
  { href: "/prosedyrer", label: "Prosedyrer", icon: FileText },
  { href: "/gjoremal", label: "Gjøremål", icon: CheckSquare },
  { href: "/lager", label: "Lager", icon: Package },
  { href: "/arkiv", label: "Arkiv", icon: Archive },
  { href: "/rettskriving", label: "Rettskriving", icon: SpellCheck },
];

const workshopNav: NavItem[] = [
  { href: "/verksted", label: "Verksted", icon: Wrench },
];

export function Sidebar({ role }: { role: "leader" | "workshop" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === "leader" ? leaderNav : workshopNav;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <span className="font-serif text-xl font-bold text-near-black">
          Prosjektstyring
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-terracotta text-white"
                  : "text-olive hover:bg-warm-sand hover:text-near-black"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-cream px-3 py-4 space-y-3">
        {/* Role badge */}
        <div className="flex items-center gap-2 rounded-lg bg-warm-sand px-3 py-2">
          {role === "leader" ? (
            <FolderKanban className="h-4 w-4 text-terracotta" />
          ) : (
            <Wrench className="h-4 w-4 text-coral" />
          )}
          <span className="text-xs font-medium text-charcoal">
            {role === "leader" ? "Prosjektleder" : "Verksted"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone transition-colors hover:bg-warm-sand hover:text-near-black"
        >
          <LogOut className="h-4 w-4" />
          Logg ut
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-ivory p-2.5 shadow-sm border border-border-cream md:hidden"
        aria-label="Åpne meny"
      >
        <Menu className="h-5 w-5 text-near-black" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-near-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-ivory border-r border-border-cream transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 rounded-lg p-1 text-stone hover:text-near-black"
          aria-label="Lukk meny"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border-cream bg-ivory md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
