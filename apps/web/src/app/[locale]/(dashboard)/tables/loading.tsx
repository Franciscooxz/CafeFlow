export default function TablesLoading() {
  return (
    <div className="animate-pulse p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="h-7 bg-cafe-beige rounded-lg w-40" />
        <div className="h-9 bg-cafe-beige rounded-xl w-32" />
      </div>
      {/* Floor plan grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24 bg-cafe-beige rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
