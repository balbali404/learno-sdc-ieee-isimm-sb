interface LazyPageFallbackProps {
  title: string;
}

export function LazyPageFallback({ title }: LazyPageFallbackProps) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="h-96 rounded-2xl bg-slate-200/60 animate-pulse" />
    </div>
  );
}

