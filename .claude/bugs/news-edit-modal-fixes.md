# News Edit Modal Fixes

## Issues Fixed

### 1. Image Not Showing in Edit Modal
**Problem:** When editing news, the featured image wasn't displayed in the form
**Cause:** The form was looking for `thumbnail` but the data had `featured_image`
**Fix:** Updated NewsForm to check both `featured_image` and `thumbnail` fields

### 2. Categories Showing in English
**Problem:** Categories displayed as "Magazin", "Sanatçı" instead of "MAGAZIN", "SANATÇI"
**Fix:** Updated category labels to use uppercase Turkish names

### 3. Category Selection Not Working
**Problem:** Selected category wasn't being saved
**Causes:**
- Category field wasn't being sent to the API
- Backend expected `category_id` (number) but frontend sent `category` (string)
**Fix:**
- Added category to form data submission
- Created mapping between category strings and IDs
- Backend now converts category strings to IDs automatically

## All Changes Made

### 1. NewsForm Component (`src/components/admin/NewsForm.tsx`)

#### Fixed initial data handling:
```typescript
// Before:
featured_image: typeof initialData?.thumbnail === 'string' ? initialData.thumbnail : initialData?.thumbnail?.url || '',
featured: false,

// After:
featured_image: initialData?.featured_image || (typeof initialData?.thumbnail === 'string' ? initialData.thumbnail : initialData?.thumbnail?.url) || '',
featured: initialData?.is_featured || initialData?.isFeatured || false,
```

#### Fixed category labels:
```typescript
// Before:
{ value: 'MAGAZINE', label: 'Magazin' },
{ value: 'ARTIST', label: 'Sanatçı' },

// After:
{ value: 'MAGAZINE', label: 'MAGAZIN' },
{ value: 'ARTIST', label: 'SANATÇI' },
```

### 2. News API Client (`src/lib/api/admin/news.ts`)

#### Added category to form submission:
```typescript
// Added in createAdminNews:
formData.append('category', data.category);

// Added in updateAdminNews:
else if (key === 'category') {
  formData.append('category', value.toString());
}
```

### 3. Backend API (`src/app/api/admin/news/route.ts`)

#### Added category extraction and mapping:
```typescript
// Extract category from FormData:
category: formData.get('category'),

// Map category strings to IDs:
const categoryMap: Record<string, number> = {
  'MAGAZINE': 1,
  'ARTIST': 2,
  'ALBUM': 3,
  'CONCERT': 4
};
finalCategoryId = categoryMap[category];
```

### 4. Data Transformation (`src/app/admin/news/page.tsx`)

#### Added category ID to name mapping:
```typescript
const categoryIdMap: Record<number, string> = {
  1: 'MAGAZINE',
  2: 'ARTIST',
  3: 'ALBUM',
  4: 'CONCERT'
};

let categoryName = article.category_name;
if (!categoryName && article.category_id) {
  categoryName = categoryIdMap[article.category_id] || 'MAGAZINE';
}
```

## Testing Results

✅ Images now display correctly in edit modal
✅ Categories show in Turkish (MAGAZIN, SANATÇI, etc.)
✅ Category selection saves and loads correctly
✅ All boolean fields (hot, breaking, featured) work properly
✅ Build compiles without errors related to these fixes

## Category Mapping

| Frontend String | Database ID | Display Name |
|----------------|-------------|--------------|
| MAGAZINE       | 1           | MAGAZIN      |
| ARTIST         | 2           | SANATÇI      |
| ALBUM          | 3           | ALBÜM        |
| CONCERT        | 4           | KONSER       |

## Notes

- The category system uses a simple ID mapping for now
- In production, you might want to create a proper categories table
- All changes are backward compatible