export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">G2</span>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-[-0.02em]">Gate2Tray</div>
        <div className="text-xs text-muted-foreground">Operations system</div>
      </div>
    </div>
  );
}
