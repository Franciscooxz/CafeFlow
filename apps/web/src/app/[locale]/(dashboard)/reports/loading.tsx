export default function ReportsLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="h-7 bg-cafe-beige rounded-lg w-44" />
      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 bg-cafe-beige rounded-xl w-44" />
        <div className="h-10 bg-cafe-beige rounded-xl w-32" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-cafe-beige rounded-2xl" />
        ))}
      </div>
      {/* Chart */}
      <div className="h-64 bg-cafe-beige rounded-2xl" />
      {/* Table */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-cafe-beige rounded-xl" />
        ))}
      </div>
    </div>
  );
}
