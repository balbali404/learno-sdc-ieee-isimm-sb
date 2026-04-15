export default function TeacherRouteLoading() {
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-4">
      <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="h-72 rounded-xl bg-slate-200/60 animate-pulse" />
    </div>
  );
}
