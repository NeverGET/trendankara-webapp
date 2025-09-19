'use client';

import React from 'react';
import {
  Type,
  Image,
  Film,
  Music,
  BarChart3,
  List,
  Square,
  Minus,
  Space,
  Share2,
  Mail,
  Layout,
  Layers
} from 'lucide-react';

export type ComponentType =
  | 'hero'
  | 'carousel'
  | 'text'
  | 'image'
  | 'video'
  | 'audio_player'
  | 'poll'
  | 'news_list'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'social_links'
  | 'contact_form';

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  category: 'layout' | 'content' | 'media' | 'interactive';
  defaultProps: Record<string, any>;
  description: string;
}

const componentDefinitions: ComponentDefinition[] = [
  // Layout Components
  {
    type: 'hero',
    label: 'Hero Banner',
    icon: <Layout className="h-5 w-5" />,
    category: 'layout',
    defaultProps: {
      title: 'Başlık',
      subtitle: 'Alt başlık',
      backgroundImage: '',
      height: 'medium',
      alignment: 'center'
    },
    description: 'Büyük başlık ve arka plan görseli'
  },
  {
    type: 'carousel',
    label: 'Carousel',
    icon: <Layers className="h-5 w-5" />,
    category: 'layout',
    defaultProps: {
      items: [],
      autoPlay: true,
      interval: 3000,
      showIndicators: true
    },
    description: 'Resim veya içerik kaydırıcı'
  },

  // Content Components
  {
    type: 'text',
    label: 'Metin',
    icon: <Type className="h-5 w-5" />,
    category: 'content',
    defaultProps: {
      content: 'Metin içeriği',
      fontSize: 'medium',
      alignment: 'left',
      color: '#000000'
    },
    description: 'Basit metin bloğu'
  },
  {
    type: 'news_list',
    label: 'Haber Listesi',
    icon: <List className="h-5 w-5" />,
    category: 'content',
    defaultProps: {
      limit: 5,
      category: 'all',
      showImage: true,
      showSummary: true
    },
    description: 'Son haberler listesi'
  },

  // Media Components
  {
    type: 'image',
    label: 'Resim',
    icon: <Image className="h-5 w-5" />,
    category: 'media',
    defaultProps: {
      src: '',
      alt: '',
      caption: '',
      alignment: 'center',
      width: 'full'
    },
    description: 'Tek resim gösterimi'
  },
  {
    type: 'video',
    label: 'Video',
    icon: <Film className="h-5 w-5" />,
    category: 'media',
    defaultProps: {
      url: '',
      autoPlay: false,
      controls: true,
      loop: false
    },
    description: 'Video oynatıcı'
  },
  {
    type: 'audio_player',
    label: 'Ses Oynatıcı',
    icon: <Music className="h-5 w-5" />,
    category: 'media',
    defaultProps: {
      streamUrl: '',
      showVolume: true,
      showPlaylist: false
    },
    description: 'Radyo veya ses oynatıcı'
  },

  // Interactive Components
  {
    type: 'poll',
    label: 'Anket',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'interactive',
    defaultProps: {
      pollId: null,
      showResults: true,
      showVoteCount: true
    },
    description: 'Anket gösterimi'
  },
  {
    type: 'button',
    label: 'Buton',
    icon: <Square className="h-5 w-5" />,
    category: 'interactive',
    defaultProps: {
      text: 'Tıkla',
      url: '',
      variant: 'primary',
      size: 'medium',
      fullWidth: false
    },
    description: 'Tıklanabilir buton'
  },
  {
    type: 'social_links',
    label: 'Sosyal Medya',
    icon: <Share2 className="h-5 w-5" />,
    category: 'interactive',
    defaultProps: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      alignment: 'center'
    },
    description: 'Sosyal medya bağlantıları'
  },
  {
    type: 'contact_form',
    label: 'İletişim Formu',
    icon: <Mail className="h-5 w-5" />,
    category: 'interactive',
    defaultProps: {
      title: 'Bize Ulaşın',
      showName: true,
      showEmail: true,
      showPhone: true,
      showMessage: true
    },
    description: 'İletişim formu'
  },

  // Utility Components
  {
    type: 'divider',
    label: 'Ayırıcı',
    icon: <Minus className="h-5 w-5" />,
    category: 'layout',
    defaultProps: {
      style: 'solid',
      color: '#e5e7eb',
      thickness: 1
    },
    description: 'Yatay çizgi ayırıcı'
  },
  {
    type: 'spacer',
    label: 'Boşluk',
    icon: <Space className="h-5 w-5" />,
    category: 'layout',
    defaultProps: {
      height: 20
    },
    description: 'Dikey boşluk'
  }
];

interface ComponentPaletteProps {
  onAddComponent: (component: ComponentDefinition) => void;
  searchTerm?: string;
  selectedCategory?: 'all' | 'layout' | 'content' | 'media' | 'interactive';
}

export function ComponentPalette({
  onAddComponent,
  searchTerm = '',
  selectedCategory = 'all'
}: ComponentPaletteProps) {
  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'layout', label: 'Düzen' },
    { id: 'content', label: 'İçerik' },
    { id: 'media', label: 'Medya' },
    { id: 'interactive', label: 'Etkileşimli' }
  ];

  const [activeCategory, setActiveCategory] = React.useState(selectedCategory);

  const filteredComponents = componentDefinitions.filter(comp => {
    const matchesSearch = searchTerm === '' ||
      comp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = activeCategory === 'all' || comp.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('componentType', component.type);
    e.dataTransfer.setData('componentData', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white rounded-lg border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Bileşenler</h3>
        <p className="text-sm text-gray-500 mt-1">Sürükle ve bırak</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {filteredComponents.map((component) => (
            <div
              key={component.type}
              draggable
              onDragStart={(e) => handleDragStart(e, component)}
              onClick={() => onAddComponent(component)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors group"
            >
              <div className="flex-shrink-0 text-gray-600 group-hover:text-gray-900">
                {component.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{component.label}</p>
                <p className="text-xs text-gray-500 truncate">{component.description}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Bileşen bulunamadı</p>
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-3 border-t bg-gray-50">
        <p className="text-xs text-gray-600">
          💡 Bileşenleri sürükleyerek veya tıklayarak ekleyebilirsiniz
        </p>
      </div>
    </div>
  );
}

export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
  return componentDefinitions.find(def => def.type === type);
}

export function getDefaultProps(type: ComponentType): Record<string, any> {
  const definition = getComponentDefinition(type);
  return definition ? { ...definition.defaultProps } : {};
}