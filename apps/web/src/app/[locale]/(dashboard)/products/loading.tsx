export default function ProductsLoading() {
  return (
    <div className="animate-pulse p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-7 bg-cafe-beige rounded-lg w-40" />
        <div className="h-9 bg-cafe-beige rounded-xl w-36" />
      </div>
      {/* Search bar */}
      <div className="h-10 bg-cafe-beige rounded-xl w-full max-w-sm" />
      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-cafe-beige rounded-xl" />
        ))}
      </div>
    </div>
  );
}
