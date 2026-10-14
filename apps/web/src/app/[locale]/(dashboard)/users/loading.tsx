export default function UsersLoading() {
  return (
    <div className="animate-pulse p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="h-7 bg-cafe-beige rounded-lg w-36" />
        <div className="h-9 bg-cafe-beige rounded-xl w-36" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-cafe-beige rounded-xl" />
        ))}
      </div>
    </div>
  );
}
