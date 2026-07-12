"use client";

import Link from "next/link";
import { ClipboardList, Menu, QrCode, RotateCcw, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { href: "/operator", label: "Operator", icon: ClipboardList, current: true },
  { href: "/order/MC201", label: "Passenger order", icon: QrCode },
  { href: "/crew/MC201", label: "Crew service", icon: UsersRound },
];

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const { resetDemo, connectionStatus } = useDemo();
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
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-foreground">Demo controls</p><Badge tone={connectionStatus === "live" ? "success" : connectionStatus === "offline" ? "danger" : "warning"}>{connectionStatus}</Badge></div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">SQLite keeps every demo screen in sync.</p>
          <ResetDemoButton onReset={resetDemo} className="mt-2 w-full justify-start" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-sticky border-b border-border bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <BrandMark />
            <Sheet>
              <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open product navigation"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Gate2Tray surfaces</SheetTitle><SheetDescription>Move between operator, passenger, and crew views without losing synchronized demo state. Connection: {connectionStatus}.</SheetDescription></SheetHeader>
                <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Product navigation">
                  {links.map(({ href, label, icon: Icon, current }) => (
                    <SheetClose key={href} asChild><Link href={href} className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${current ? "bg-primary-soft text-primary-strong" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`} aria-current={current ? "page" : undefined}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link></SheetClose>
                  ))}
                </nav>
                <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"><ResetDemoButton onReset={resetDemo} className="w-full justify-start" /></div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function ResetDemoButton({ onReset, className }: { onReset: () => Promise<void>; className?: string }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className={className}><RotateCcw className="h-4 w-4" /> Reset demo</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset every synthetic flight?</AlertDialogTitle><AlertDialogDescription>This clears all demo mutations and restores the five scenario fixtures. It does not affect any real airline, passenger, or payment system.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current state</AlertDialogCancel><AlertDialogAction onClick={() => void onReset()}>Reset all scenarios</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
