export default function AuditLoading() {
  return (
    <div className="animate-pulse p-6 space-y-5">
      <div className="h-7 bg-cafe-beige rounded-lg w-40" />
      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 bg-cafe-beige rounded-xl w-48" />
        <div className="h-10 bg-cafe-beige rounded-xl w-36" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-cafe-beige rounded-xl" />
        ))}
      </div>
    </div>
  );
}
