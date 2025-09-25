'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Wifi,
  Battery,
  Signal,
  Home,
  Newspaper,
  BarChart3,
  User,
  Play,
  Pause,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Settings
} from 'lucide-react';

export interface MobileComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  order: number;
}

interface MobilePreviewProps {
  components: MobileComponent[];
  selectedComponentId?: string;
  onSelectComponent?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  onDuplicateComponent?: (id: string) => void;
  onMoveComponent?: (id: string, direction: 'up' | 'down') => void;
  onEditComponent?: (id: string) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  title?: string;
  className?: string;
  editable?: boolean;
  scale?: number;
}

export function MobilePreview({
  components,
  selectedComponentId,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  onEditComponent,
  onDrop,
  onDragOver,
  title = 'Ana Sayfa',
  className,
  editable = true,
  scale = 1
}: MobilePreviewProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const renderComponent = (component: MobileComponent, index: number) => {
    const isSelected = component.id === selectedComponentId;

    const wrapperClasses = cn(
      "relative group transition-all duration-200",
      editable && "cursor-pointer hover:bg-gray-800/20",
      isSelected && editable && "ring-2 ring-blue-500 bg-blue-500/10"
    );

    const handleClick = (e: React.MouseEvent) => {
      if (editable && onSelectComponent) {
        e.stopPropagation();
        onSelectComponent(component.id);
      }
    };

    // Component Actions Toolbar (shown when selected and editable)
    const ComponentActions = () => {
      if (!editable || !isSelected) return null;

      return (
        <div className="absolute -top-8 right-0 z-20 flex items-center gap-1 bg-gray-900 rounded-lg p-1 shadow-lg border border-gray-700">
          {onMoveComponent && index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveComponent(component.id, 'up');
              }}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Yukarı taşı"
            >
              <MoveUp className="h-3 w-3" />
            </button>
          )}
          {onMoveComponent && index < components.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveComponent(component.id, 'down');
              }}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Aşağı taşı"
            >
              <MoveDown className="h-3 w-3" />
            </button>
          )}
          {onDuplicateComponent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateComponent(component.id);
              }}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Kopyala"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {onEditComponent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditComponent(component.id);
              }}
              className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Düzenle"
            >
              <Settings className="h-3 w-3" />
            </button>
          )}
          {onDeleteComponent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteComponent(component.id);
              }}
              className="p-1.5 hover:bg-gray-800 rounded text-red-400 hover:text-red-300"
              title="Sil"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    };

    // Render different component types
    switch (component.type) {
      case 'hero':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div
              className="relative h-48 bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center"
              style={{
                backgroundImage: component.props.backgroundImage ? `url(${component.props.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="text-center text-white p-4">
                <h2 className="text-2xl font-bold mb-2">{component.props.title || 'Hero Başlık'}</h2>
                <p className="text-sm opacity-90">{component.props.subtitle || 'Alt başlık'}</p>
              </div>
            </div>
          </div>
        );

      case 'carousel':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="relative h-40 bg-gray-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <ChevronLeft className="absolute left-2 h-6 w-6 text-white/50" />
                <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
                <ChevronRight className="absolute right-2 h-6 w-6 text-white/50" />
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      i === activeTab ? "bg-white" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4">
              <p
                className={cn(
                  "text-gray-300",
                  component.props.alignment === 'center' && "text-center",
                  component.props.alignment === 'right' && "text-right",
                  component.props.fontSize === 'small' && "text-sm",
                  component.props.fontSize === 'large' && "text-lg"
                )}
              >
                {component.props.content || 'Metin içeriği'}
              </p>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-2">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                {component.props.src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={component.props.src}
                    alt={component.props.alt || ''}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    <span className="text-3xl">🖼️</span>
                  </div>
                )}
                {component.props.caption && (
                  <p className="text-xs text-gray-500 text-center p-2">
                    {component.props.caption}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-2">
              <div className="relative bg-black rounded-lg overflow-hidden h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span>00:00</span>
                    <div className="flex-1 h-1 bg-white/30 rounded">
                      <div className="h-full w-0 bg-white rounded" />
                    </div>
                    <span>03:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'audio_player':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                </button>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Trend Ankara FM</p>
                  <p className="text-gray-400 text-xs">Canlı Yayın</p>
                </div>
                <Volume2 className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        );

      case 'poll':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4 bg-gray-900/30">
              <h3 className="text-white font-medium mb-3">Anket Başlığı</h3>
              <div className="space-y-2">
                {['Seçenek A', 'Seçenek B', 'Seçenek C'].map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-lg p-2 text-sm text-gray-300">
                      {option}
                    </div>
                    <span className="text-xs text-gray-500">{30 - i * 10}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'news_list':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4 space-y-3">
              {['Haber 1', 'Haber 2', 'Haber 3'].map((news, i) => (
                <div key={i} className="flex gap-3 bg-gray-900/30 rounded-lg p-2">
                  <div className="w-16 h-16 bg-gray-800 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{news}</p>
                    <p className="text-gray-500 text-xs mt-1">2 saat önce</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'button':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4">
              <button
                className={cn(
                  "px-4 py-2 rounded-lg font-medium",
                  component.props.variant === 'primary' ? "bg-red-600 text-white" :
                  component.props.variant === 'secondary' ? "bg-gray-700 text-white" :
                  "bg-gray-800 border border-gray-700 text-gray-300",
                  component.props.fullWidth && "w-full"
                )}
              >
                {component.props.text || 'Buton'}
              </button>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="px-4 py-2">
              <div
                className="border-t"
                style={{
                  borderColor: component.props.color || '#374151',
                  borderWidth: component.props.thickness || 1
                }}
              />
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div
              style={{ height: component.props.height || 20 }}
              className="relative"
            >
              {isSelected && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 flex items-center justify-center">
                  <span className="text-xs text-blue-500 bg-gray-950 px-1">
                    {component.props.height || 20}px
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'social_links':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4">
              <div className={cn(
                "flex gap-3",
                component.props.alignment === 'center' && "justify-center",
                component.props.alignment === 'right' && "justify-end"
              )}>
                {['📘', '🐦', '📷', '▶️'].map((icon, i) => (
                  <div key={i} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <span>{icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'contact_form':
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4 bg-gray-900/30">
              <h3 className="text-white font-medium mb-3">{component.props.title || 'İletişim Formu'}</h3>
              <div className="space-y-2">
                <div className="bg-gray-800 rounded-lg p-2 text-sm text-gray-500">Adınız</div>
                <div className="bg-gray-800 rounded-lg p-2 text-sm text-gray-500">E-posta</div>
                <div className="bg-gray-800 rounded-lg p-2 h-20 text-sm text-gray-500">Mesajınız</div>
                <button className="w-full bg-red-600 text-white rounded-lg py-2 text-sm">Gönder</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={wrapperClasses} onClick={handleClick}>
            <ComponentActions />
            <div className="p-4 bg-gray-900/30 text-center text-gray-500">
              <p className="text-xs">Bilinmeyen bileşen</p>
              <p className="text-xs font-mono">{component.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("flex items-center justify-center min-h-screen p-8", className)}>
      {/* iPhone Frame */}
      <div
        className="relative"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        {/* Phone Shell */}
        <div className="relative w-[375px] h-[812px] bg-gray-900 rounded-[3rem] shadow-2xl border-[14px] border-gray-900">
          {/* Notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-40 mx-auto" />

          {/* Screen */}
          <div className="relative w-full h-full bg-black rounded-[2.5rem] overflow-hidden">
            {/* Status Bar */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-2 pb-1 text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3 h-3" />
              </div>
            </div>

            {/* App Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex items-center">
              <div className="text-white text-2xl mr-3">📻</div>
              <div className="flex-1">
                <h1 className="text-white font-bold">Trend Ankara</h1>
                <p className="text-white/80 text-xs">Radyo & Müzik</p>
              </div>
            </div>

            {/* App Content */}
            <div
              className="h-[calc(100%-120px)] overflow-y-auto bg-gray-950"
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              {/* Page Title */}
              {title && (
                <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800">
                  <h2 className="text-white font-medium">{title}</h2>
                </div>
              )}

              {/* Components */}
              {components.length > 0 ? (
                <div className="relative">
                  {components
                    .sort((a, b) => a.order - b.order)
                    .map((component, index) => (
                      <div key={component.id}>
                        {renderComponent(component, index)}
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-full text-gray-600"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">📱</div>
                    <p>İçerik eklemek için</p>
                    <p className="text-sm">sol panelden bileşen sürükleyin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
              <div className="flex justify-around">
                <button className="p-2 text-red-500">
                  <Home className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500">
                  <Newspaper className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500">
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
      </div>
    </div>
  );
}