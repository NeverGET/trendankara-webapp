import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiPlus, FiEdit, FiTrash2, FiBarChart } from 'react-icons/fi';

export default function AdminPollsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Anket Yönetimi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Anketleri oluşturun ve yönetin
          </p>
        </div>
        <Button variant="primary" size="medium">
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Anket
        </Button>
      </div>

      {/* Active Polls */}
      <Card title="Aktif Anketler">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-dark-text-primary">
                {"Haftanın Top 50'si"}
              </h3>
              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                Aktif
              </span>
            </div>
            <p className="text-sm text-dark-text-secondary mb-3">
              25 Aday • 1,234 Oy
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="small">
                <FiBarChart className="w-4 h-4 mr-1" />
                Sonuçlar
              </Button>
              <Button variant="ghost" size="small">
                <FiEdit className="w-4 h-4 mr-1" />
                Düzenle
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Past Polls */}
      <Card title="Geçmiş Anketler">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border-primary">
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Anket Adı
                </th>
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Tarih Aralığı
                </th>
                <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
                  Toplam Oy
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
                  <p className="text-dark-text-primary">{"Ayın Top 10'u"}</p>
                </td>
                <td className="py-3 px-4 text-dark-text-secondary text-sm">
                  01.08.2025 - 31.08.2025
                </td>
                <td className="py-3 px-4 text-dark-text-secondary">
                  5,432
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-gray-900/30 text-gray-400 text-xs rounded">
                    Tamamlandı
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-1 hover:bg-dark-surface-tertiary rounded">
                      <FiBarChart className="w-4 h-4 text-dark-text-secondary" />
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
