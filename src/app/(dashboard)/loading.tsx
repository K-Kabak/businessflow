export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-muted h-8 w-56 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card h-28 rounded-xl border" />
        ))}
      </div>
      <div className="bg-card h-80 rounded-xl border" />
    </div>
  );
}
