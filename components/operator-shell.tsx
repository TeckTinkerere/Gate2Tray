"use client";

import Link from "next/link";
import { ClipboardList, QrCode, RotateCcw, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";

const links = [
  { href: "/operator", label: "Operator", icon: ClipboardList, current: true },
  { href: "/order/MC201", label: "Passenger order", icon: QrCode },
  { href: "/crew/MC201", label: "Crew service", icon: UsersRound },
];

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const { resetDemo } = useDemo();
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-background p-4 lg:flex lg:flex-col">
        <div className="px-2 py-2"><BrandMark /></div>
        <nav className="mt-8 space-y-1" aria-label="Product navigation">
          {links.map(({ href, label, icon: Icon, current }) => (
            <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${current ? "bg-primary-soft text-primary-strong" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`} aria-current={current ? "page" : undefined}>
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-surface p-3">
          <p className="text-xs font-semibold text-foreground">Demo controls</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">SQLite keeps every demo screen in sync.</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={resetDemo}>
            <RotateCcw className="h-4 w-4" /> Reset demo
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-sticky border-b border-border bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <BrandMark />
            <Button variant="ghost" size="icon" onClick={resetDemo} aria-label="Reset demo"><RotateCcw className="h-5 w-5" /></Button>
          </div>
          <nav className="flex overflow-x-auto px-2 pb-2" aria-label="Product navigation">
            {links.map(({ href, label, current }) => (
              <Link key={href} href={href} className={`min-h-11 shrink-0 rounded-lg px-3 py-3 text-sm font-semibold ${current ? "bg-primary-soft text-primary-strong" : "text-muted-foreground"}`}>{label}</Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
