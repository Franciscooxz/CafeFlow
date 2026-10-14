export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-4">
      <div className="h-8 bg-cafe-beige rounded-xl w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-cafe-beige rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-cafe-beige rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-cafe-beige rounded-2xl" />
        <div className="h-48 bg-cafe-beige rounded-2xl" />
      </div>
    </div>
  );
}
