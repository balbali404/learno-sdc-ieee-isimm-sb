interface LazyPageFallbackProps {
  title: string;
}

export function LazyPageFallback({ title }: LazyPageFallbackProps) {
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="h-72 rounded-xl bg-slate-200/60 animate-pulse" />
    </div>
  );
}
