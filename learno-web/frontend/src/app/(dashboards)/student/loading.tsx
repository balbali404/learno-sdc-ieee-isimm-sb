export default function StudentRouteLoading() {
  return (
    <div className="space-y-5">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200/60" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/60" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/60" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-200/60" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-slate-200/60" />
    </div>
  );
}
