import { requireAuth } from '@/lib/auth/utils';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - will redirect to login if not authenticated
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark-text-primary">Yönetim Paneli</h2>
          <div className="text-dark-text-secondary">
            Hoş geldiniz, {session.user?.name || session.user?.email}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
