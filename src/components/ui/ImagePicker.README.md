# ImagePicker Component

A comprehensive image selection component that provides a streamlined interface for selecting images from the media library with support for both single and multiple image selection.

## Features

- **Unified Interface**: Combines input field with gallery picker
- **Multiple Selection**: Support for selecting multiple images
- **Live Preview**: Thumbnail previews with hover tooltips
- **URL Validation**: Built-in validation for image URLs
- **Form Integration**: Native support for react-hook-form and Formik
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance**: Lazy loading and image caching
- **Turkish UI**: Localized interface text

## Installation

The component is already part of the project's UI library. Import it from:

```tsx
import { ImagePicker, ImagePickerField } from '@/components/ui/ImagePicker';
```

## Basic Usage

### Single Image Selection

```tsx
import { useState } from 'react';
import { ImagePicker } from '@/components/ui/ImagePicker';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <ImagePicker
      label="Öne Çıkan Görsel"
      value={imageUrl}
      onChange={setImageUrl}
      placeholder="Resim seçmek için tıklayın..."
      showPreview={true}
    />
  );
}
```

### Multiple Image Selection

```tsx
import { useState } from 'react';
import { ImagePicker } from '@/components/ui/ImagePicker';

function MyComponent() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  return (
    <ImagePicker
      label="Galeri Resimleri"
      value={imageUrls}
      onChange={setImageUrls}
      multiple={true}
      maxSelection={5}
      placeholder="Çoklu resim seçimi için tıklayın..."
      showPreview={true}
    />
  );
}
```

## Form Integration

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { ImagePickerField } from '@/components/ui/ImagePicker';

interface FormData {
  featuredImage: string;
  galleryImages: string[];
}

function MyForm() {
  const { control, handleSubmit } = useForm<FormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Single image */}
      <ImagePickerField
        control={control}
        name="featuredImage"
        label="Öne Çıkan Görsel"
        rules={{ required: 'Görsel gereklidir' }}
        sizePreference="large"
      />

      {/* Multiple images */}
      <ImagePickerField
        control={control}
        name="galleryImages"
        label="Galeri"
        multiple={true}
        maxSelection={10}
        validate={(urls) => {
          if (urls.length < 2) {
            return 'En az 2 resim seçin';
          }
        }}
      />
    </form>
  );
}
```

### Formik

```tsx
import { Formik, Form } from 'formik';
import { ImagePickerFormik } from '@/components/ui/ImagePicker';

function MyForm() {
  return (
    <Formik
      initialValues={{ featuredImage: '' }}
      onSubmit={handleSubmit}
    >
      <Form>
        <ImagePickerFormik
          name="featuredImage"
          label="Öne Çıkan Görsel"
          sizePreference="large"
          required
        />
      </Form>
    </Formik>
  );
}
```

## Props Reference

### ImagePicker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| string[]` | - | Current value (URL or array of URLs) |
| `onChange` | `(url: string \| string[]) => void` | - | Callback when value changes |
| `onBlur` | `() => void` | - | Callback when input loses focus |
| `name` | `string` | - | Input field name for forms |
| `label` | `string` | - | Label text above the picker |
| `placeholder` | `string` | `'Resim seçmek için tıklayın...'` | Placeholder text |
| `required` | `boolean` | `false` | Whether field is required |
| `error` | `string` | - | Error message to display |
| `pattern` | `RegExp` | - | Validation pattern for URLs |
| `validate` | `(value) => string \| undefined` | - | Custom validation function |
| `multiple` | `boolean` | `false` | Enable multiple selection |
| `maxSelection` | `number` | - | Maximum images for multiple mode |
| `sizePreference` | `'thumbnail' \| 'medium' \| 'large' \| 'original'` | `'medium'` | Preferred image size |
| `showPreview` | `boolean` | `true` | Show image preview |
| `disabled` | `boolean` | `false` | Disable the picker |
| `category` | `string` | - | Filter images by category |
| `enableSearch` | `boolean` | `true` | Enable search in picker |
| `defaultSearchQuery` | `string` | - | Default search query |
| `className` | `string` | - | Additional CSS classes |

### ImagePickerField Props

Extends `ImagePicker` props with react-hook-form specific props:

| Prop | Type | Description |
|------|------|-------------|
| `control` | `Control<TFieldValues>` | React Hook Form control |
| `name` | `TName` | Field name in the form |
| `defaultValue` | `string \| string[]` | Default field value |
| `rules` | `ValidationRules` | React Hook Form validation rules |

### ImagePickerFormik Props

Extends `ImagePicker` props with Formik specific props:

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name in Formik form |

## Advanced Usage

### Custom Validation

```tsx
<ImagePicker
  value={imageUrl}
  onChange={setImageUrl}
  pattern={/^https:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i}
  validate={(url) => {
    if (url && !url.includes('cdn.example.com')) {
      return 'Sadece CDN linklerine izin verilir';
    }
  }}
/>
```

### Category Filtering

```tsx
<ImagePicker
  value={imageUrl}
  onChange={setImageUrl}
  category="news"
  enableSearch={true}
  defaultSearchQuery="breaking"
/>
```

### Size Preferences

```tsx
// For thumbnails
<ImagePicker
  sizePreference="thumbnail"
  // Returns thumbnail URLs for better performance
/>

// For high quality
<ImagePicker
  sizePreference="original"
  // Returns original high-res URLs
/>
```

## Keyboard Navigation

- **Enter**: Open media picker dialog
- **Escape**: Close media picker dialog
- **Tab**: Navigate between UI elements
- **Space/Enter**: Activate preview images

## Accessibility Features

- Full ARIA support with proper labels
- Screen reader compatible
- Keyboard navigation
- Focus management
- Error announcements

## Performance

### Lazy Loading
The MediaPickerDialog is lazy loaded only when needed:

```tsx
// Component is loaded only when picker opens
const MediaPickerDialog = React.lazy(() => import('@/components/admin/MediaPickerDialog'));
```

### Image Caching
Preview images are cached for 30 minutes:

```tsx
// Automatic caching prevents duplicate requests
const previewCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
```

## Error Handling

The component handles various error scenarios:

- **Network Errors**: "Bağlantı hatası - Lütfen tekrar deneyin"
- **Invalid URLs**: "Geçersiz resim URL'i"
- **Load Failures**: "Bağlantı hatası - Resim yüklenemedi"

All errors include retry mechanisms where applicable.

## Examples

### News Article Form

```tsx
import { ImagePickerField } from '@/components/ui/ImagePicker';

function NewsForm() {
  return (
    <ImagePickerField
      control={control}
      name="featured_image"
      label="Öne Çıkan Görsel"
      sizePreference="large"
      category="news"
      validate={(url) => {
        if (url && !url.match(/\.(jpg|jpeg|png|webp)$/i)) {
          return 'Sadece JPG, PNG ve WebP formatları desteklenir';
        }
      }}
    />
  );
}
```

### Poll Items Manager

```tsx
import { ImagePicker } from '@/components/ui/ImagePicker';

function PollItem({ item, onChange }) {
  return (
    <ImagePicker
      value={item.image_url || ''}
      onChange={(url) => onChange('image_url', url)}
      placeholder="Seçenek resmi..."
      sizePreference="medium"
      category="polls"
      className="w-full"
    />
  );
}
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Check URL validity and network connectivity
2. **Preview not showing**: Ensure `showPreview={true}` and valid image URL
3. **Multiple selection not working**: Set `multiple={true}` prop
4. **Form validation errors**: Ensure proper form integration with `control` prop

### Debug Mode

Enable debug logging by checking browser console for:
- Cache hits/misses
- URL validation results
- Image load errors

## Browser Support

- Modern browsers with ES6+ support
- Requires support for:
  - Promises
  - Fetch API
  - Map/Set
  - React 18+

## Version History

- **v1.0.0**: Initial release with basic functionality
- **v1.1.0**: Added multiple selection support
- **v1.2.0**: Added form library integrations
- **v1.3.0**: Added performance optimizations and caching