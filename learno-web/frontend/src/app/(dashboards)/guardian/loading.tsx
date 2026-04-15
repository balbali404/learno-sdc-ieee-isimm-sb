export default function GuardianRouteLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 rounded-lg bg-slate-200/60 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="h-28 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-28 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-28 rounded-xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="h-80 rounded-xl bg-slate-200/60 animate-pulse" />
    </div>
  );
}