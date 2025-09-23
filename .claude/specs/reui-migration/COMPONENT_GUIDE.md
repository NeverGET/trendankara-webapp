# ReUI Component Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Component Usage](#component-usage)
3. [Migration Patterns](#migration-patterns)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Overview

This guide documents the migrated ReUI components and their usage patterns in the Trend Ankara web application.

### Feature Flag System

All components are controlled by the `NEXT_PUBLIC_USE_REUI` environment variable:

```bash
# Enable ReUI components
NEXT_PUBLIC_USE_REUI=true

# Use legacy components (default)
NEXT_PUBLIC_USE_REUI=false
```

## Component Usage

### Button Component

The Button component supports multiple variants and states:

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="outline">Outline</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium (default)</Button>
<Button size="large">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// With icon
<Button icon={<SaveIcon />}>Save</Button>
```

### Input Component

Input component with label and error handling:

```tsx
import { Input } from '@/components/ui/Input';

// Basic usage
<Input
  label="Email"
  name="email"
  type="email"
  placeholder="user@example.com"
/>

// With error
<Input
  label="Password"
  name="password"
  type="password"
  error="Password is required"
  required
/>

// Disabled
<Input
  label="Username"
  name="username"
  disabled
  value="john_doe"
/>
```

### Textarea Component

Auto-resizing textarea with character count:

```tsx
import { Textarea } from '@/components/ui/Textarea';

<Textarea
  label="Description"
  name="description"
  placeholder="Enter description..."
  maxLength={500}
  showCount
  autoResize
  error={errors.description}
/>
```

### Card Component

Versatile card component with gradient support:

```tsx
import { Card } from '@/components/ui/Card';

// Basic card
<Card>
  <p>Card content</p>
</Card>

// With title and subtitle
<Card
  title="Dashboard"
  subtitle="Overview of your account"
>
  <p>Card body</p>
</Card>

// Gradient and hoverable
<Card hasGradient hoverable>
  <p>Interactive gradient card</p>
</Card>

// With footer
<Card
  title="Action Card"
  footer={
    <div className="flex justify-end space-x-2">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  }
>
  <p>Card with actions</p>
</Card>
```

### Select Component

Dropdown select with options:

```tsx
import { Select } from '@/components/ui/Select';

<Select
  label="Country"
  placeholder="Choose a country"
  value={country}
  onValueChange={setCountry}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia', disabled: true },
  ]}
  error={errors.country}
  required
/>
```

### Checkbox Component

Checkbox with label and error state:

```tsx
import { Checkbox } from '@/components/ui/Checkbox';

<Checkbox
  label="I agree to the terms and conditions"
  checked={agreed}
  onCheckedChange={setAgreed}
  error={errors.terms}
  required
/>
```

### Alert Component

Alert notifications with variants:

```tsx
import { Alert } from '@/components/ui/Alert';

// Success alert
<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

// Error alert (dismissible)
<Alert
  variant="error"
  title="Error"
  dismissible
  onDismiss={() => setShowError(false)}
>
  Failed to save changes.
</Alert>

// Warning alert
<Alert variant="warning" title="Warning">
  This action cannot be undone.
</Alert>

// Info alert
<Alert variant="info" title="Note">
  New features are available.
</Alert>
```

### Badge Component

Status badges with colors:

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="default">Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">New</Badge>
```

### Progress Component

Progress indicator with variants:

```tsx
import { Progress } from '@/components/ui/Progress';

<Progress
  value={75}
  max={100}
  label="Upload Progress"
  showLabel
  variant="success"
  size="md"
/>
```

### Modal/Dialog Component

Modal dialogs for user interactions:

```tsx
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Basic modal
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Profile"
>
  <form>
    {/* Form content */}
  </form>
</Modal>

// Confirm dialog
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
/>
```

### Table Component

Responsive table with sorting and pagination:

```tsx
import {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell
} from '@/components/ui/ResponsiveTable';

<ResponsiveTable
  data={tableData}
  sortable
  paginate
  itemsPerPage={10}
  currentPage={page}
  onPageChange={setPage}
  totalItems={totalItems}
>
  <ResponsiveTableHeader>
    <ResponsiveTableRow>
      <ResponsiveTableCell
        sortable
        sortKey="name"
        onSort={handleSort}
        sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
      >
        Name
      </ResponsiveTableCell>
      <ResponsiveTableCell sortable sortKey="email">
        Email
      </ResponsiveTableCell>
      <ResponsiveTableCell>Actions</ResponsiveTableCell>
    </ResponsiveTableRow>
  </ResponsiveTableHeader>
  <ResponsiveTableBody>
    {data.map(item => (
      <ResponsiveTableRow key={item.id}>
        <ResponsiveTableCell>{item.name}</ResponsiveTableCell>
        <ResponsiveTableCell>{item.email}</ResponsiveTableCell>
        <ResponsiveTableCell>
          <Button variant="ghost" size="small">Edit</Button>
        </ResponsiveTableCell>
      </ResponsiveTableRow>
    ))}
  </ResponsiveTableBody>
</ResponsiveTable>
```

### Toast Notifications

Using Sonner for toast notifications:

```tsx
import { toast } from '@/components/ui/Toast';

// Success toast
toast.success('Changes saved successfully');

// Error toast
toast.error('Failed to save changes', {
  description: 'Please try again later',
});

// Promise toast
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved successfully!',
  error: 'Failed to save',
});

// Custom action
toast.info('New version available', {
  action: {
    label: 'Update',
    onClick: () => handleUpdate(),
  },
});
```

## Migration Patterns

### Adapter Pattern

All components use an adapter pattern to maintain backward compatibility:

```tsx
// Adapter structure
src/components/
├── ui/                    # Feature flag wrappers
│   └── Button.tsx        # Exports either legacy or ReUI
├── ui-adapters/          # Adapter components
│   └── ButtonAdapter.tsx # Maps legacy props to ReUI
├── ui-legacy/            # Original components
│   └── Button.tsx        # Legacy implementation
└── ui/*-reui.tsx         # Shadcn/ReUI components
    └── button-reui.tsx   # New ReUI component
```

### Prop Mapping

Adapters map legacy props to ReUI equivalents:

```tsx
// Legacy prop
<Button variant="primary" loading>Save</Button>

// Mapped to ReUI
<ReUIButton variant="default" disabled={loading}>
  {loading && <Spinner />}
  Save
</ReUIButton>
```

## Best Practices

### 1. Import from ui directory

Always import from the main ui directory, not directly from adapters:

```tsx
// ✅ Correct
import { Button } from '@/components/ui/Button';

// ❌ Wrong
import { Button } from '@/components/ui-adapters/ButtonAdapter';
```

### 2. Use semantic variants

Choose appropriate variants for context:

```tsx
// Primary actions
<Button variant="primary">Save</Button>

// Destructive actions
<Button variant="danger">Delete</Button>

// Secondary actions
<Button variant="secondary">Cancel</Button>
```

### 3. Provide feedback

Always provide user feedback for actions:

```tsx
const handleSave = async () => {
  try {
    await saveData();
    toast.success('Saved successfully');
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

### 4. Handle loading states

Show loading indicators during async operations:

```tsx
<Button loading={isLoading} onClick={handleSubmit}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### 5. Validate forms

Use error states for form validation:

```tsx
<Input
  label="Email"
  name="email"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
/>
```

## Troubleshooting

### Component not rendering

1. Check feature flag is set:
```bash
echo $NEXT_PUBLIC_USE_REUI
```

2. Restart dev server after changing env:
```bash
npm run dev
```

### Style conflicts

1. Check for duplicate class names
2. Ensure dark theme classes are applied
3. Verify Tailwind configuration

### TypeScript errors

1. Check imports are from `/ui` directory
2. Verify prop types match adapter interfaces
3. Run type check:
```bash
npx tsc --noEmit
```

### Missing components

1. Verify component is exported from wrapper
2. Check adapter exists in `ui-adapters`
3. Ensure shadcn component is installed

### Performance issues

1. Use React.memo for expensive components
2. Implement virtualization for large lists
3. Lazy load heavy components

## Component Status

| Component | Legacy | Adapter | ReUI | Status |
|-----------|--------|---------|------|--------|
| Button | ✅ | ✅ | ✅ | Complete |
| Input | ✅ | ✅ | ✅ | Complete |
| Textarea | ✅ | ✅ | ✅ | Complete |
| Card | ✅ | ✅ | ✅ | Complete |
| Select | ✅ | ✅ | ✅ | Complete |
| Checkbox | ✅ | ✅ | ✅ | Complete |
| Alert | ✅ | ✅ | ✅ | Complete |
| Badge | ✅ | ✅ | ✅ | Complete |
| Progress | ✅ | ✅ | ✅ | Complete |
| Modal | ✅ | ✅ | ✅ | Complete |
| Table | ✅ | ✅ | ✅ | Complete |
| Toast | N/A | ✅ | ✅ | Complete |

## Resources

- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated**: 2025-09-23
**Version**: 1.0.0
**Status**: Production Ready