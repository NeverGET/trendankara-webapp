export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        {children}
      </div>
    </div>
  );
}
