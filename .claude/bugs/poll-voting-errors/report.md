# Bug Report: Poll Voting Errors

## Bug ID
poll-voting-errors

## Summary
Multiple critical errors occur when users attempt to vote on polls in the public interface, including JavaScript null reference errors, component casing issues, and API request failures.

## Priority
HIGH - User-facing functionality is broken

## Affected Components
- `/public/share-modal.js` - Null reference error
- `/src/components/ui/Button.tsx` and `/src/components/ui/button.tsx` - Casing conflict
- `/src/lib/api/polls.ts` - Vote submission failure
- `/src/components/polls/PollCard.tsx` - Error handling

## Description

### Issue 1: Share Modal Null Reference Error
```
share-modal.js:1 Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at share-modal.js:1:135
```
The share modal script attempts to add an event listener to a null element, causing a runtime error.

### Issue 2: Button Component Casing Conflict
```
./src/components/ui/Button.tsx
There are multiple modules with names that only differ in casing.
```
Both `Button.tsx` and `button.tsx` exist in the same directory, causing module resolution issues and potential build failures on case-sensitive file systems.

### Issue 3: Poll Voting API Failure
```
polls.ts:116  POST http://localhost:3000/api/polls/vote 400 (Bad Request)
Error submitting vote: Error: Failed to submit vote
```
The voting API endpoint returns a 400 error when users attempt to submit votes.

## Reproduction Steps
1. Navigate to the public homepage
2. Locate an active poll
3. Select an option and click the vote button
4. Observe console errors

## Expected Behavior
- Share modal should initialize without errors
- No component casing conflicts should exist
- Voting should successfully submit and update poll results

## Actual Behavior
- Share modal throws null reference error on page load
- Webpack warns about casing conflicts
- Vote submission fails with 400 error
- Multiple error logs in console

## Environment
- Next.js application
- Development environment (localhost:3000)
- React 18.x
- TypeScript

## Impact
- Users cannot participate in polls
- Console errors degrade user experience
- Build warnings may cause production issues

## Additional Context
The errors appear to be related to recent changes in the UI component library integration and poll voting system.