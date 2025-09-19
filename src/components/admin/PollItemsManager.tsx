'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, GripVertical, Upload, X } from 'lucide-react';

interface PollItem {
  id?: number;
  title: string;
  description?: string;
  image_url?: string;
  display_order: number;
  vote_count?: number;
  is_active: boolean;
  tempId?: string;
}

interface PollItemsManagerProps {
  pollId?: number;
  items: PollItem[];
  onChange: (items: PollItem[]) => void;
  onSave?: (items: PollItem[]) => Promise<void>;
  readOnly?: boolean;
}

export function PollItemsManager({
  pollId,
  items: initialItems,
  onChange,
  onSave,
  readOnly = false
}: PollItemsManagerProps) {
  const [items, setItems] = useState<PollItem[]>(initialItems || []);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  const handleAddItem = () => {
    const newItem: PollItem = {
      tempId: `temp-${Date.now()}`,
      title: '',
      description: '',
      image_url: '',
      display_order: items.length,
      is_active: true
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Reorder display_order
    updatedItems.forEach((item, i) => {
      item.display_order = i;
    });
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const handleItemChange = (index: number, field: keyof PollItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const handleImageUpload = async (index: number, file: File) => {
    // TODO: Implement actual image upload to MinIO
    // For now, just create a local URL
    const imageUrl = URL.createObjectURL(file);
    handleItemChange(index, 'image_url', imageUrl);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const draggedContent = items[draggedItem];
    const updatedItems = [...items];

    // Remove dragged item
    updatedItems.splice(draggedItem, 1);

    // Insert at new position
    updatedItems.splice(dropIndex, 0, draggedContent);

    // Update display_order
    updatedItems.forEach((item, i) => {
      item.display_order = i;
    });

    setItems(updatedItems);
    onChange(updatedItems);
    setDraggedItem(null);
  };

  const handleSaveAll = async () => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      await onSave(items);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = items.every(item => item.title.trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Anket Seçenekleri</h3>
        {!readOnly && (
          <Button
            onClick={handleAddItem}
            size="small"
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Seçenek Ekle
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card
            key={item.id || item.tempId}
            className={`p-4 ${!readOnly ? 'cursor-move' : ''}`}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex gap-4">
              {!readOnly && (
                <div className="flex items-center">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
              )}

              {/* Image Upload */}
              <div className="flex-shrink-0">
                {item.image_url ? (
                  <div className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover rounded"
                    />
                    {!readOnly && (
                      <button
                        onClick={() => handleItemChange(index, 'image_url', '')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : !readOnly ? (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(index, file);
                      }}
                    />
                    <Upload className="h-6 w-6 text-gray-400" />
                  </label>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded" />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 space-y-2">
                <Input
                  value={item.title}
                  onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                  placeholder="Seçenek başlığı *"
                  disabled={readOnly}
                  className={item.title.trim() === '' ? 'border-red-500' : ''}
                />
                <Input
                  value={item.description || ''}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Açıklama (opsiyonel)"
                  disabled={readOnly}
                />
                {item.vote_count !== undefined && (
                  <div className="text-sm text-gray-500">
                    Oy sayısı: {item.vote_count}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="flex items-center">
                  <Button
                    onClick={() => handleRemoveItem(index)}
                    size="small"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {`Henüz seçenek eklenmemiş. "Seçenek Ekle" butonuna tıklayarak başlayın.`}
        </div>
      )}

      {onSave && !readOnly && items.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={!isValid || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      )}
    </div>
  );
}