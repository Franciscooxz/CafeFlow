export default function SettingsLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6 max-w-2xl">
      <div className="h-7 bg-cafe-beige rounded-lg w-40" />
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-cafe-beige rounded w-32" />
          <div className="h-10 bg-cafe-beige rounded-xl w-full" />
        </div>
      ))}
      <div className="h-10 bg-cafe-beige rounded-xl w-32" />
    </div>
  );
}
