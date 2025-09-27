/**
 * Mobile Card List Component
 * Displays and manages mobile cards with drag-and-drop reordering
 * Requirements: 2.2, 2.3, 2.6 - Card listing and reordering
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-reui';
import { Button } from '@/components/ui/button-reui';
import { Badge } from '@/components/ui/badge-reui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table-reui';
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  GripVertical,
  Eye,
  EyeOff,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import type { MobileCard } from '@/types/mobile';

interface MobileCardListProps {
  cards: MobileCard[];
  onEdit: (card: MobileCard) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onReorder: (cards: { id: number; order: number }[]) => void;
  isLoading?: boolean;
}

export function MobileCardList({
  cards,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  isLoading = false
}: MobileCardListProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const reorderedCards = [...cards];
      const [movedCard] = reorderedCards.splice(draggedItem, 1);
      reorderedCards.splice(dragOverItem, 0, movedCard);

      // Create new order mapping
      const orderMap = reorderedCards.map((card, index) => ({
        id: card.id,
        order: index
      }));

      onReorder(orderMap);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const featuredCards = cards.filter(c => c.isFeatured);
  const normalCards = cards.filter(c => !c.isFeatured);

  const renderCardRow = (card: MobileCard, index: number, isFeaturedSection: boolean) => {
    const actualIndex = isFeaturedSection 
      ? index 
      : featuredCards.length + index;

    return (
      <TableRow
        key={card.id}
        draggable
        onDragStart={(e) => handleDragStart(e, actualIndex)}
        onDragOver={(e) => handleDragOver(e, actualIndex)}
        onDragEnd={handleDragEnd}
        className={`
          cursor-move transition-colors
          ${dragOverItem === actualIndex ? 'bg-gray-100' : ''}
          ${!card.isActive ? 'opacity-60' : ''}
        `}
      >
        <TableCell className="w-10">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </TableCell>
        <TableCell className="w-20">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-16 h-16 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{card.title}</div>
            {card.description && (
              <div className="text-sm text-gray-500 line-clamp-2">
                {card.description}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {card.redirectUrl && (
            <a
              href={card.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {card.redirectUrl.length > 30 
                ? `${card.redirectUrl.substring(0, 30)}...` 
                : card.redirectUrl}
            </a>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={card.isFeatured ? 'default' : 'secondary'}>
            {card.isFeatured && <Star className="h-3 w-3 mr-1" />}
            {card.isFeatured ? 'Öne Çıkan' : 'Normal'}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={card.isActive ? 'default' : 'secondary'}>
            {card.isActive ? (
              <><Eye className="h-3 w-3 mr-1" />Aktif</>
            ) : (
              <><EyeOff className="h-3 w-3 mr-1" />Pasif</>
            )}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {card.displayOrder}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(card)}
              disabled={isLoading}
              title="Düzenle"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(card.id, !card.isActive)}
              disabled={isLoading}
              title={card.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
            >
              {card.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(card.id)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Featured Cards */}
      {featuredCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Öne Çıkan Kartlar ({featuredCards.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-20">Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yönlendirme</TableHead>
                  <TableHead className="text-center">Tür</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-center">Sıra</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredCards.map((card, index) => renderCardRow(card, index, true))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Normal Cards */}
      {normalCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Normal Kartlar ({normalCards.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-20">Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yönlendirme</TableHead>
                  <TableHead className="text-center">Tür</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-center">Sıra</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalCards.map((card, index) => renderCardRow(card, index, false))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {cards.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Henüz kart eklenmemiş</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}