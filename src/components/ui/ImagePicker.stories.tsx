import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { ImagePicker } from './ImagePicker';

const meta: Meta<typeof ImagePicker> = {
  title: 'UI/ImagePicker',
  component: ImagePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive image selection component that provides a streamlined interface for selecting images from the media library.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sizePreference: {
      control: { type: 'select' },
      options: ['thumbnail', 'medium', 'large', 'original'],
    },
    multiple: {
      control: { type: 'boolean' },
    },
    showPreview: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
    enableSearch: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Template for controlled stories
const Template = (args: any) => {
  const [value, setValue] = useState(args.value || '');

  return (
    <div className="w-96 p-4">
      <ImagePicker
        {...args}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          action('onChange')(newValue);
        }}
      />
    </div>
  );
};

const MultipleTemplate = (args: any) => {
  const [value, setValue] = useState<string[]>(args.value || []);

  return (
    <div className="w-96 p-4">
      <ImagePicker
        {...args}
        value={value}
        onChange={(newValue) => {
          setValue(newValue as string[]);
          action('onChange')(newValue);
        }}
        multiple={true}
      />
    </div>
  );
};

// Basic usage story
export const Default: Story = {
  render: Template,
  args: {
    label: 'Resim Seç',
    placeholder: 'Resim seçmek için tıklayın...',
    showPreview: true,
    sizePreference: 'medium',
  },
};

// With initial value
export const WithValue: Story = {
  render: Template,
  args: {
    label: 'Öne Çıkan Görsel',
    value: 'https://picsum.photos/400/300',
    placeholder: 'Resim seçmek için tıklayın...',
    showPreview: true,
    sizePreference: 'medium',
  },
};

// Required field
export const Required: Story = {
  render: Template,
  args: {
    label: 'Zorunlu Görsel',
    placeholder: 'Resim seçmek için tıklayın...',
    required: true,
    showPreview: true,
    sizePreference: 'medium',
  },
};

// With error state
export const WithError: Story = {
  render: Template,
  args: {
    label: 'Hatalı Görsel',
    value: 'invalid-url',
    placeholder: 'Resim seçmek için tıklayın...',
    error: 'Geçersiz resim URL\'i',
    showPreview: true,
    sizePreference: 'medium',
  },
};

// Disabled state
export const Disabled: Story = {
  render: Template,
  args: {
    label: 'Devre Dışı Görsel',
    value: 'https://picsum.photos/400/300',
    placeholder: 'Resim seçmek için tıklayın...',
    disabled: true,
    showPreview: true,
    sizePreference: 'medium',
  },
};

// Multiple selection
export const Multiple: Story = {
  render: MultipleTemplate,
  args: {
    label: 'Çoklu Görsel Seçimi',
    value: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3',
    ],
    placeholder: 'Çoklu resim seçimi için tıklayın...',
    multiple: true,
    maxSelection: 5,
    showPreview: true,
    sizePreference: 'medium',
  },
};

// Multiple selection empty
export const MultipleEmpty: Story = {
  render: MultipleTemplate,
  args: {
    label: 'Çoklu Görsel Seçimi (Boş)',
    placeholder: 'Çoklu resim seçimi için tıklayın...',
    multiple: true,
    maxSelection: 10,
    showPreview: true,
    sizePreference: 'medium',
  },
};

// Without preview
export const WithoutPreview: Story = {
  render: Template,
  args: {
    label: 'Önizleme Olmadan',
    value: 'https://picsum.photos/400/300',
    placeholder: 'Resim seçmek için tıklayın...',
    showPreview: false,
    sizePreference: 'medium',
  },
};

// With category filter
export const WithCategory: Story = {
  render: Template,
  args: {
    label: 'Kategori Filtreli',
    placeholder: 'Haber resmi seçin...',
    category: 'news',
    enableSearch: true,
    defaultSearchQuery: 'breaking',
    showPreview: true,
    sizePreference: 'large',
  },
};

// With custom validation
export const WithValidation: Story = {
  render: Template,
  args: {
    label: 'Özel Doğrulama',
    placeholder: 'Sadece JPG/PNG dosyaları...',
    showPreview: true,
    sizePreference: 'medium',
    pattern: /\.(jpg|jpeg|png)$/i,
    validate: (value: string | string[]) => {
      if (typeof value === 'string' && value && !value.includes('picsum')) {
        return 'Sadece Picsum linkleri kabul edilir';
      }
    },
  },
};

// Large size preference
export const LargeSize: Story = {
  render: Template,
  args: {
    label: 'Büyük Boyut',
    placeholder: 'Yüksek çözünürlük için...',
    showPreview: true,
    sizePreference: 'large',
  },
};

// Thumbnail size preference
export const ThumbnailSize: Story = {
  render: Template,
  args: {
    label: 'Küçük Boyut',
    placeholder: 'Küçük resim için...',
    showPreview: true,
    sizePreference: 'thumbnail',
  },
};

// Form integration example
const FormExampleComponent = () => {
  const [featuredImage, setFeaturedImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  return (
      <div className="w-96 p-4 space-y-6">
        <h3 className="text-lg font-semibold">Form Entegrasyonu</h3>

        <ImagePicker
          label="Öne Çıkan Görsel"
          value={featuredImage}
          onChange={setFeaturedImage}
          placeholder="Ana resim seçin..."
          required={true}
          showPreview={true}
          sizePreference="large"
        />

        <ImagePicker
          label="Galeri Resimleri"
          value={gallery}
          onChange={setGallery}
          placeholder="Galeri resimleri seçin..."
          multiple={true}
          maxSelection={5}
          showPreview={true}
          sizePreference="medium"
        />

        <div className="p-4 bg-gray-100 rounded">
          <h4 className="font-medium mb-2">Form Değerleri:</h4>
          <p className="text-sm">
            <strong>Öne Çıkan:</strong> {featuredImage || 'Boş'}
          </p>
          <p className="text-sm">
            <strong>Galeri:</strong> {gallery.length} resim seçili
          </p>
        </div>
      </div>
  );
};

export const FormExample: Story = {
  render: () => <FormExampleComponent />,
};

// Error states showcase
export const ErrorStates: Story = {
  render: () => {
    return (
      <div className="w-96 p-4 space-y-6">
        <h3 className="text-lg font-semibold">Hata Durumları</h3>

        <ImagePicker
          label="Geçersiz URL"
          value="not-a-url"
          onChange={() => {}}
          error="Geçersiz URL formatı"
          showPreview={true}
        />

        <ImagePicker
          label="Zorunlu Alan Hatası"
          value=""
          onChange={() => {}}
          required={true}
          error="Bu alan zorunludur"
          showPreview={true}
        />

        <ImagePicker
          label="Özel Doğrulama Hatası"
          value="https://example.com/image.gif"
          onChange={() => {}}
          error="Sadece JPG ve PNG formatları desteklenir"
          showPreview={true}
        />
      </div>
    );
  },
};