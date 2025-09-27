/**
 * Mobile Cards Admin Page
 * Admin interface for managing mobile cards
 * Requirements: 3.1, 3.2 - Card management page
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button-reui';
import { MobileCardForm } from '@/components/admin/mobile/MobileCardForm';
import { MobileCardList } from '@/components/admin/mobile/MobileCardList';
import { MobileStatsCard } from '@/components/admin/mobile/MobileStatsCard';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog-reui';
import type { MobileCard, CardInput } from '@/types/mobile';
import { CreditCard, Star, Eye, EyeOff } from 'lucide-react';

export default function MobileCardsPage() {
  const [cards, setCards] = useState<MobileCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MobileCard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Statistics
  const totalCards = cards.length;
  const featuredCards = cards.filter(c => c.isFeatured).length;
  const activeCards = cards.filter(c => c.isActive).length;
  const inactiveCards = totalCards - activeCards;

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/admin/mobile/cards');
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      } else {
        toast.error('Kartlar yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Kartlar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCard = async (data: CardInput) => {
    try {
      const response = await fetch('/api/admin/mobile/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Kart başarıyla oluşturuldu');
        setIsFormOpen(false);
        await fetchCards();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kart oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Kart oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdateCard = async (data: CardInput) => {
    if (!selectedCard) return;

    try {
      const response = await fetch(`/api/admin/mobile/cards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Kart başarıyla güncellendi');
        setIsFormOpen(false);
        setSelectedCard(null);
        await fetchCards();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kart güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Kart güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Bu kartı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mobile/cards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kart başarıyla silindi');
        await fetchCards();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kart silinemedi');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Kart silinirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/mobile/cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(isActive ? 'Kart etkinleştirildi' : 'Kart devre dışı bırakıldı');
        await fetchCards();
      } else {
        toast.error('Kart durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Error toggling card status:', error);
      toast.error('Kart durumu güncellenirken bir hata oluştu');
    }
  };

  const handleReorder = async (orders: { id: number; order: number }[]) => {
    try {
      const response = await fetch('/api/admin/mobile/cards/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      if (response.ok) {
        toast.success('Kartlar yeniden sıralandı');
        await fetchCards();
      } else {
        toast.error('Kartlar yeniden sıralanamadı');
      }
    } catch (error) {
      console.error('Error reordering cards:', error);
      toast.error('Kartlar sıralanırken bir hata oluştu');
    }
  };

  const handleEdit = (card: MobileCard) => {
    setSelectedCard(card);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCard(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mobil Kartlar</h1>
          <p className="text-gray-500 mt-1">
            Mobil uygulamada gösterilecek kartları yönetin
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kart
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MobileStatsCard
          title="Toplam Kart"
          value={totalCards}
          icon={CreditCard}
          color="blue"
          description="Tüm kartlar"
        />
        <MobileStatsCard
          title="Öne Çıkan"
          value={featuredCards}
          icon={Star}
          color="yellow"
          description="Öne çıkarılan kartlar"
        />
        <MobileStatsCard
          title="Aktif"
          value={activeCards}
          icon={Eye}
          color="green"
          description="Görünür kartlar"
        />
        <MobileStatsCard
          title="Pasif"
          value={inactiveCards}
          icon={EyeOff}
          color="red"
          description="Gizli kartlar"
        />
      </div>

      {/* Card List */}
      {!isLoading && (
        <MobileCardList
          cards={cards}
          onEdit={handleEdit}
          onDelete={handleDeleteCard}
          onToggleActive={handleToggleActive}
          onReorder={handleReorder}
        />
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCard ? 'Kartı Düzenle' : 'Yeni Kart Oluştur'}
            </DialogTitle>
          </DialogHeader>
          <MobileCardForm
            card={selectedCard}
            onSubmit={selectedCard ? handleUpdateCard : handleCreateCard}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}