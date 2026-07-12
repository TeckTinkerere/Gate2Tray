export default function Loading() {
  return (
    <main className="min-h-screen bg-surface p-6" aria-label="Loading Gate2Tray OS">
      <div className="mx-auto max-w-5xl animate-pulse motion-reduce:animate-none">
        <div className="h-8 w-48 rounded-lg bg-secondary" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="h-24 rounded-xl bg-secondary" /><div className="h-24 rounded-xl bg-secondary" /><div className="h-24 rounded-xl bg-secondary" /></div>
        <div className="mt-6 h-72 rounded-xl bg-secondary" />
      </div>
    </main>
  );
}
