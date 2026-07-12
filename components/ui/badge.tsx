import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-secondary text-muted-foreground",
        tone === "success" && "bg-success-soft text-success-strong",
        tone === "warning" && "bg-warning-soft text-warning-strong",
        tone === "danger" && "bg-danger-soft text-danger-strong",
        tone === "primary" && "bg-primary-soft text-primary-strong",
        className,
      )}
      {...props}
    />
  );
}
