# Fix for News Edit Cancel Button Infinite Loop

## Problem
When clicking the "İptal" (Cancel) button in the news edit modal, the app makes too many requests and eventually redirects to the admin home page.

## Root Cause
There were two `useEffect` hooks both calling `loadNews()` function with overlapping dependencies:
1. First useEffect: Triggered by `[currentPage, searchQuery, filterCategory]`
2. Second useEffect: Also triggered by `[searchQuery, currentPage, filterCategory]` with debouncing

This created an infinite loop where both effects would trigger each other when dependencies changed, causing repeated API calls.

## Solution
Removed the duplicate useEffect and consolidated the logic into a single useEffect with conditional debouncing:

### Before:
```typescript
// Load data on component mount and when filters change
useEffect(() => {
  loadNews(currentPage, searchQuery, filterCategory);
}, [currentPage, searchQuery, filterCategory]);

// Handle search with debounce
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (currentPage === 1) {
      loadNews(1, searchQuery, filterCategory);
    } else {
      setCurrentPage(1);
    }
  }, 500);

  return () => clearTimeout(timeoutId);
}, [searchQuery, currentPage, filterCategory]);
```

### After:
```typescript
// Load data on component mount and when filters change
useEffect(() => {
  const timeoutId = setTimeout(() => {
    loadNews(currentPage, searchQuery, filterCategory);
  }, searchQuery ? 500 : 0); // Only debounce for search, not for other changes

  return () => clearTimeout(timeoutId);
}, [currentPage, searchQuery, filterCategory]);
```

## Impact
- Eliminated infinite loop when closing modals
- Reduced unnecessary API calls
- Fixed redirect issue
- Maintained search debouncing functionality

## File Changed
- `src/app/admin/news/page.tsx` (lines 133-140)

## Testing
After this fix:
1. Opening and canceling the edit modal should not trigger multiple requests
2. Search input still has 500ms debounce
3. Category and page changes happen immediately
4. No redirect to admin home page