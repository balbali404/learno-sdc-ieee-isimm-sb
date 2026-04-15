export default function AdminRouteLoading() {
  return (
    <div className="space-y-5">
      <div className="h-14 w-72 rounded-2xl bg-slate-200/60 animate-pulse" />
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

