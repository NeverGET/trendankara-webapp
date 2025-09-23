'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui-adapters/TextareaAdapter';
import { Input } from '@/components/ui/Input';
import {
  FiType,
  FiImage,
  FiSquare,
  FiList,
  FiCreditCard,
  FiAlertCircle,
  FiMinusSquare,
  FiTrash2,
  FiCopy,
  FiMove,
  FiChevronUp,
  FiChevronDown,
  FiSettings,
  FiLayout
} from 'react-icons/fi';

interface ComponentType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const componentTypes: ComponentType[] = [
  {
    id: 'text',
    type: 'text',
    label: 'Metin',
    icon: <FiType className="w-5 h-5" />,
    description: 'Metin ekle'
  },
  {
    id: 'image',
    type: 'image',
    label: 'Sponsor Görseli',
    icon: <FiImage className="w-5 h-5" />,
    description: 'Sponsor logosu ekle'
  },
  {
    id: 'spacer',
    type: 'spacer',
    label: 'Boşluk',
    icon: <FiMinusSquare className="w-5 h-5" />,
    description: 'Boşluk ekle'
  }
];

interface ContentEditorProps {
  selectedComponent?: any;
  onAddComponent?: (type: string) => void;
  onUpdateComponent?: (id: string, props: any) => void;
  onDeleteComponent?: (id: string) => void;
  onDuplicateComponent?: (id: string) => void;
  onMoveComponent?: (id: string, direction: 'up' | 'down') => void;
  className?: string;
}

export function ContentEditor({
  selectedComponent,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  className
}: ContentEditorProps) {
  const renderComponentEditor = () => {
    if (!selectedComponent) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FiSettings className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Düzenlemek için bir bileşen seçin</p>
        </div>
      );
    }

    const { id, type, props } = selectedComponent;

    return (
      <div className="space-y-4">
        {/* Component Actions */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <Badge variant="purple" size="small">
            {componentTypes.find(c => c.type === type)?.label || type}
          </Badge>
          <div className="flex gap-1">
            <button
              onClick={() => onMoveComponent?.(id, 'up')}
              className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMoveComponent?.(id, 'down')}
              className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicateComponent?.(id)}
              className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiCopy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteComponent?.(id)}
              className="p-1.5 hover:bg-accent rounded text-destructive hover:text-destructive/80 transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Component Properties */}
        <div className="space-y-3">
          {type === 'text' && (
            <>
              <Textarea
                label="Metin İçeriği"
                value={props.content || ''}
                onChange={(e) => onUpdateComponent?.(id, { ...props, content: e.target.value })}
                rows={3}
                placeholder="Metin içeriğini girin"
              />
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Hizalama
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => onUpdateComponent?.(id, { ...props, align })}
                      className={cn(
                        "px-3 py-1 rounded text-sm",
                        props.align === align
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {align === 'left' ? 'Sol' : align === 'center' ? 'Orta' : 'Sağ'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Boyut
                </label>
                <div className="flex gap-2">
                  {['small', 'normal', 'large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdateComponent?.(id, { ...props, size })}
                      className={cn(
                        "px-3 py-1 rounded text-sm",
                        props.size === size
                          ? "bg-purple-500 text-white"
                          : "bg-dark-surface-secondary text-dark-text-secondary hover:bg-dark-surface-tertiary"
                      )}
                    >
                      {size === 'small' ? 'Küçük' : size === 'normal' ? 'Normal' : 'Büyük'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Sponsor Görseli URL
                </label>
                <Input
                  type="text"
                  value={props.src || ''}
                  onChange={(e) => onUpdateComponent?.(id, { ...props, src: e.target.value })}
                  placeholder="https://example.com/sponsor-logo.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Sponsor Adı
                </label>
                <Input
                  type="text"
                  value={props.alt || ''}
                  onChange={(e) => onUpdateComponent?.(id, { ...props, alt: e.target.value })}
                  placeholder="Sponsor ismi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Görsel Boyutu
                </label>
                <div className="flex gap-2">
                  {['h-24', 'h-32', 'h-48'].map((height) => (
                    <button
                      key={height}
                      onClick={() => onUpdateComponent?.(id, { ...props, height })}
                      className={cn(
                        "px-3 py-1 rounded text-sm",
                        props.height === height
                          ? "bg-purple-500 text-white"
                          : "bg-dark-surface-secondary text-dark-text-secondary hover:bg-dark-surface-tertiary"
                      )}
                    >
                      {height === 'h-24' ? 'Mini' : height === 'h-32' ? 'Küçük' : 'Orta'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'spacer' && (
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Boşluk Boyutu
              </label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateComponent?.(id, { ...props, size })}
                    className={cn(
                      "px-3 py-1 rounded text-sm",
                      props.size === size
                        ? "bg-purple-500 text-white"
                        : "bg-dark-surface-secondary text-dark-text-secondary hover:bg-dark-surface-tertiary"
                    )}
                  >
                    {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("bg-background rounded-xl border border-border/50", className)}>
      {/* Component Palette */}
      <div className="border-b border-border/50">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Bileşenler
          </h3>
          <p className="text-sm text-muted-foreground">
            Eklemek için tıklayın
          </p>
        </div>
        <div className="p-4 pt-0 grid grid-cols-2 gap-2">
          {componentTypes.map((component) => (
            <button
              key={component.id}
              onClick={() => onAddComponent?.(component.type)}
              className="p-3 bg-muted hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-background rounded-lg mb-2 text-primary group-hover:text-primary/80">
                  {component.icon}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {component.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {component.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Component Editor */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Özellikler
        </h3>
        {renderComponentEditor()}
      </div>
    </div>
  );
}