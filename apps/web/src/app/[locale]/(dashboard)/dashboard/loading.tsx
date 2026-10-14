export default function DashboardPageLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="h-7 bg-cafe-beige rounded-lg w-48" />
      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-cafe-beige rounded-2xl" />
        ))}
      </div>
      {/* Chart */}
      <div className="h-72 bg-cafe-beige rounded-2xl" />
      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-52 bg-cafe-beige rounded-2xl" />
        <div className="h-52 bg-cafe-beige rounded-2xl" />
      </div>
    </div>
  );
}
