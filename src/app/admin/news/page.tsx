import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

export default function AdminNewsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Haber Yönetimi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Site haberlerini yönetin ve düzenleyin
          </p>
        </div>
        <Button variant="primary" size="medium">
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Haber
        </Button>
      </div>

      {/* News Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border-primary">
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Başlık
                </th>
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Kategori
                </th>
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Tarih
                </th>
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Durum
                </th>
                <th className="text-right py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark-border-primary hover:bg-dark-surface-secondary">
                <td className="py-3 px-4">
                  <p className="text-dark-text-primary">Örnek Haber Başlığı</p>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-dark-surface-primary text-xs rounded">
                    MAGAZIN
                  </span>
                </td>
                <td className="py-3 px-4 text-dark-text-secondary text-sm">
                  18.09.2025
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                    Yayında
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-1 hover:bg-dark-surface-tertiary rounded">
                      <FiEye className="w-4 h-4 text-dark-text-secondary" />
                    </button>
                    <button className="p-1 hover:bg-dark-surface-tertiary rounded">
                      <FiEdit className="w-4 h-4 text-dark-text-secondary" />
                    </button>
                    <button className="p-1 hover:bg-dark-surface-tertiary rounded">
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
