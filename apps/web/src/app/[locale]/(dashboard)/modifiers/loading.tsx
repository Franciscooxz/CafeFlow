export default function ModifiersLoading() {
  return (
    <div className="animate-pulse p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="h-7 bg-cafe-beige rounded-lg w-52" />
        <div className="h-9 bg-cafe-beige rounded-xl w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-cafe-beige rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
