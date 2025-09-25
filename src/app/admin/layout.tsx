import { requireAuth } from '@/lib/auth/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

// Force dynamic rendering for all admin pages since they require authentication
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - will redirect to login if not authenticated
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="md:ml-56 lg:ml-64 min-h-screen">
        <div className="p-3">
          {/* Top Bar */}
          <div className="mb-3 flex justify-between items-center">
            <div className="md:hidden w-12" /> {/* Spacer for mobile menu button */}
            <div className="text-xs md:text-sm text-dark-text-secondary">
              Hoş geldiniz, <span className="text-dark-text-primary font-medium">
                {session.user?.name || session.user?.email}
              </span>
            </div>
          </div>

          {/* Page Content */}
          <main className="animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
