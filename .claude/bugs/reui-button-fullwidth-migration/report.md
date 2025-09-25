# Bug Report

## Bug Summary
TypeScript build errors occur when using the `fullWidth` prop on Button components that have been migrated to ReUI components. The ReUI Button component doesn't support the `fullWidth` prop, causing compilation failures.

## Bug Details

### Expected Behavior
Button components should render full-width when specified, either through a `fullWidth` prop or equivalent styling mechanism, and the build should complete successfully.

### Actual Behavior
The TypeScript build fails with the error:
```
Type error: Property 'fullWidth' does not exist on type 'IntrinsicAttributes & ClassAttributes<HTMLButtonElement>...'
```

### Steps to Reproduce
1. Run `npm run build` in the webapp directory
2. TypeScript compilation begins
3. Build fails at ImageUploadZone.tsx:201:13
4. Error message shows `fullWidth` prop is not recognized

### Environment
- **Version**: Next.js 15.5.3, React 19.1.0
- **Platform**: Node.js, TypeScript
- **Configuration**: ReUI component library migration in progress

## Impact Assessment

### Severity
- [x] High - Major functionality broken (Build fails, cannot deploy)
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All developers and deployment pipeline - the application cannot be built or deployed until this is resolved.

### Affected Features
- Image upload functionality
- Poll voting interface
- Admin password change
- Stream testing interface
- Various UI components using fullWidth buttons

## Additional Context

### Error Messages
```
./src/components/admin/ImageUploadZone.tsx:201:13
Type error: Type '{ children: (string | number | Element)[]; type: "button"; variant: "default"; size: "default"; fullWidth: true; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<...> & { ...; }'.
  Property 'fullWidth' does not exist on type 'IntrinsicAttributes & ClassAttributes<HTMLButtonElement> & ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<...> & { ...; }'.
```

### Screenshots/Media
N/A - Compilation error

### Related Issues
This is part of the larger ReUI component migration initiative. The project is transitioning from legacy custom components to ReUI components for better maintainability.

## Initial Analysis

### Suspected Root Cause
During the ReUI component migration, some files were updated to import the new ReUI Button component (`@/components/ui/button` or `@/components/ui/button-reui`) which doesn't have a `fullWidth` prop. The legacy Button component supported this prop, but it wasn't properly migrated to the ReUI API.

### Affected Components
Based on comprehensive codebase search, the following files are affected:

**Production Files (7):**
1. `/src/components/admin/ImageUploadZone.tsx` - Line 201
2. `/src/components/polls/PollCard.tsx` - Line 173
3. `/src/components/admin/StreamTestButton.tsx` - Line 203
4. `/src/components/admin/PasswordChangeForm.tsx` - Line 190
5. `/src/components/ui-legacy/ConfirmDialog.tsx` - Lines 246, 257, 268
6. `/src/components/admin/MobilePreview.tsx` - Line 348
7. `/src/components/admin/ComponentPalette.tsx` - Line 166

**Test Files (2):**
8. `/src/components/ui-adapters/__tests__/integration.test.tsx` - Line 49
9. `/src/components/ui-adapters/__tests__/ButtonAdapter.test.tsx` - Line 72

### Migration Pattern Discovered
The codebase has a ButtonAdapter component (`/src/components/ui-adapters/ButtonAdapter.tsx`) that properly handles the `fullWidth` prop by converting it to `className="w-full"`. Files should either:
1. Import from ButtonAdapter instead of the base ReUI Button
2. Replace `fullWidth` prop with `className="w-full"` when using ReUI Button directly

### Important Note on Fix Strategy
**This error or similar ones can occur after fixing another**, so the fix must cover potential and similar situations. The build process may reveal additional instances of:
- Other legacy props being used with ReUI components (e.g., `loading`, `icon`, custom size values)
- Similar issues with other migrated components (Input, Select, Modal, etc.)
- Mixed usage patterns where some components in a file use legacy props while others don't

The fix should be systematic and comprehensive to prevent cascading build failures.

---