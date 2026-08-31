export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-muted h-8 w-56 rounded" />
      <div className="bg-card grid overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 border-b p-5 sm:border-r xl:border-b-0" />)}
      </div>
      <div className="bg-card h-80 rounded-lg border" />
    </div>
  );
}
