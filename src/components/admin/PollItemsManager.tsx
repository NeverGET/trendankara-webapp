'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { SimplifiedImagePicker } from '@/components/ui/SimplifiedImagePicker';
import { Trash2, Plus, GripVertical, Image as ImageIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableItemProps {
  item: PollItem;
  index: number;
  onItemChange: (index: number, field: keyof PollItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  itemsLength: number;
  readOnly: boolean;
}

function SortableItem({
  item,
  index,
  onItemChange,
  onRemoveItem,
  itemsLength,
  readOnly
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id || item.tempId || `item-${index}`,
    disabled: readOnly
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-3 ${isDragging ? 'shadow-lg' : ''}`}>
        <div className="flex gap-3">
          {/* Drag Handle */}
          {!readOnly && (
            <div
              className="flex items-start pt-2 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}

          {/* Image Section - Larger and more prominent */}
          <div className="flex-shrink-0">
            <SimplifiedImagePicker
              value={item.image_url || ''}
              onChange={(url) => onItemChange(index, 'image_url', url)}
              disabled={readOnly}
              imageClassName="w-32 h-32 md:w-40 md:h-40"
            />
          </div>

          {/* Item Details - Better spacing */}
          <div className="flex-1 space-y-2">
            <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">
                Seçenek Başlığı *
              </label>
              <Input
                value={item.title}
                onChange={(e) => onItemChange(index, 'title', e.target.value)}
                placeholder="Örn: Evet, Hayır, Kararsızım..."
                disabled={readOnly}
                className={item.title.trim() === '' ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">
                Açıklama (Opsiyonel)
              </label>
              <Input
                value={item.description || ''}
                onChange={(e) => onItemChange(index, 'description', e.target.value)}
                placeholder="Seçenek hakkında ek bilgi..."
                disabled={readOnly}
              />
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-dark-text-tertiary">
                Sıra: <span className="font-medium text-dark-text-secondary">{index + 1}</span>
              </div>
              {item.vote_count !== undefined && (
                <div className="text-dark-text-tertiary">
                  Oy: <span className="font-medium text-dark-text-secondary">{item.vote_count}</span>
                </div>
              )}
              {item.image_url && (
                <div className="text-dark-text-tertiary">
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Resim mevcut
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions - Better aligned */}
          {!readOnly && (
            <div className="flex items-start pt-2">
              <Button
                onClick={() => onRemoveItem(index)}
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={itemsLength <= 2}
                title={itemsLength <= 2 ? 'En az 2 seçenek gereklidir' : 'Seçeneği sil'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function PollItemsManager({
  pollId,
  items,
  onChange,
  onSave,
  readOnly = false
}: PollItemsManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
    onChange(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    // Prevent removal if only 2 items left (minimum requirement)
    if (items.length <= 2) return;

    const updatedItems = items.filter((_, i) => i !== index);
    // Reorder display_order
    updatedItems.forEach((item, i) => {
      item.display_order = i;
    });
    onChange(updatedItems);
  };

  const handleItemChange = (index: number, field: keyof PollItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    onChange(updatedItems);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item =>
        (item.id || item.tempId || `item-${items.indexOf(item)}`) === active.id
      );
      const newIndex = items.findIndex(item =>
        (item.id || item.tempId || `item-${items.indexOf(item)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedItems = arrayMove(items, oldIndex, newIndex);

        // Update display_order
        updatedItems.forEach((item, i) => {
          item.display_order = i;
        });

        onChange(updatedItems);
      }
    }
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
            size="sm"
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Seçenek Ekle
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id || item.tempId || `item-${items.indexOf(item)}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem
                key={item.id || item.tempId}
                item={item}
                index={index}
                onItemChange={handleItemChange}
                onRemoveItem={handleRemoveItem}
                itemsLength={items.length}
                readOnly={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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