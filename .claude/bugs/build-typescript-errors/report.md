# Bug Report

## Bug Summary
Next.js build fails with error "<Html> should not be imported outside of pages/_document" during 404 and 500 error page generation, preventing successful production builds.

## Bug Details

### Expected Behavior
The project should build successfully without errors related to Html imports, properly generating 404 and 500 error pages.

### Actual Behavior
Build process fails during static page generation with the error:
```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
```

### Steps to Reproduce
1. Run `npm run build`
2. Build compiles successfully
3. Linting passes with warnings
4. Fails during "Generating static pages" phase for /404 and /500 routes

### Environment
- **Version**: Next.js 15.5.3
- **Platform**: macOS Darwin 25.0.0
- **Configuration**: App Router with TypeScript

## Impact Assessment

### Severity
- [x] Critical - System unusable (Cannot deploy to production)

### Affected Users
All users - prevents production deployment

### Affected Features
- Production builds
- Error page generation
- CI/CD pipeline

## Additional Context

### Error Messages
```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
    at x (.next/server/chunks/5611.js:6:1351)
Error occurred prerendering page "/404". Read more: https://nextjs.org/docs/messages/prerender-error
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
    at x (.next/server/chunks/5611.js:6:1351)
Export encountered an error on /_error: /404, exiting the build.
```

### Related Issues
- This is a Next.js 15 App Router project (not Pages Router)
- No _document.js file exists (App Router doesn't use it)
- No explicit Html imports found in codebase

## Initial Analysis

### Suspected Root Cause
The error suggests Html component from 'next/document' is being imported somewhere, but:
1. App Router doesn't use _document.js
2. No direct imports of Html from 'next/document' found
3. Nested Next.js app was found in components/ui/my-app and removed, but error persists
4. Issue occurs specifically during error page generation (404, 500)

### Affected Components
- Next.js build system
- Error page generation
- Possibly bundling/chunking issue in .next/server/chunks/5611.js