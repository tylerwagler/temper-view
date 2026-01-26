# React 19 Migration Plan

## Overview
This guide details how to upgrade the GPU Dashboard from React 18.3.1 to React 19.2.3.

---

## Breaking Changes Summary

| Change | Impact | Notes |
|--------|--------|-------|
| `Context.Provider` → `<Context>` | LOW | Code uses `createContext()` pattern |
| `forwardRef` removal | LOW | Codebase doesn't use `forwardRef` |
| `useFormState` → `useActionState` | LOW | Codebase doesn't use forms |
| New root options | LOW | Current root creation is simple |
| Ref callback cleanup | LOW | No cleanup functions used |
| Stylesheets with precedence | LOW | Tailwind handles styles |
| Async scripts support | LOW | No async scripts used |
| Resource preloading APIs | LOW | No external resources loaded |

**Overall Impact:** LOW - Most changes are backward compatible or not used in this codebase.

---

## Migration Steps

### Phase 1: Preparation

#### 1.1 Back Up Current Code
```bash
cd /home/antigravity/gview/gpu-dashboard
git add .
git commit -m "Before React 19 migration"
```

#### 1.2 Update Dependencies
```bash
npm uninstall react react-dom
npm install react@19 react-dom@19 --legacy-peer-deps
```

#### 1.3 Update TypeScript Definitions
Update `package.json` devDependencies:
```json
{
  "devDependencies": {
    "@types/react": "^19.2.9",
    "@types/react-dom": "^19.2.3"
  }
}
```

---

### Phase 2: Code Changes

#### 2.1 Update Root Creation (src/main.tsx)
**Current:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**After (React 19):**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Note:** No changes needed - code is already compatible.

---

#### 2.2 Check for React.useFormState (src/components/GPUDashboard.tsx, src/components/GPUSelector.tsx)
**Current:** Uses `useQuery` from `@tanstack/react-query`, not `useFormState`

**Action:** Verify no `useFormState` usage - none found.

---

#### 2.3 Check for Context.Provider Pattern
**Action:** Verify no direct `Context.Provider` usage - none found, uses `createContext()` pattern.

---

#### 2.4 Update ErrorBoundary (src/components/ErrorBoundary.tsx)
**Current:**
```typescript
componentDidCatch(error: any, errorInfo: any) {
  console.error('Error caught:', error, errorInfo);
  this.setState({ hasError: true, error });
}
```

**After (React 19):**
```typescript
componentDidCatch(error: any, errorInfo: any) {
  console.error('Error caught:', error, errorInfo);
  this.setState({ hasError: true, error });
}
```

**Note:** No changes needed - compatible.

---

#### 2.5 Update Suspense Boundaries (src/App.tsx)
**Current:**
```typescript
<ErrorBoundary>
  <GPUDashboard />
</ErrorBoundary>
```

**After:**
```typescript
<ErrorBoundary>
  <GPUDashboard />
</ErrorBoundary>
```

**Note:** No changes needed.

---

#### 2.6 Check for Ref Callbacks
**Action:** Verify no cleanup functions in ref callbacks - none found.

---

#### 2.7 Update @tanstack/react-query
**Current:** Uses `@tanstack/react-query@^5.90.20`

**Note:** This package is already compatible with React 19.

---

### Phase 3: Testing

#### 3.1 Build Test
```bash
npm run build
```

#### 3.2 Dev Server Test
```bash
npm run dev
```

#### 3.3 Browser Test
- Verify dashboard loads correctly
- Verify GPU metrics display
- Verify no console errors
- Verify all charts render

#### 3.4 Type Check
```bash
npx tsc --noEmit
```

#### 3.5 Lint Check
```bash
npm run lint
```

---

### Phase 4: Verification

#### 4.1 Verify React Version
```bash
npm list react react-dom
```

Expected output:
```
react@19.2.3
react-dom@19.2.3
```

#### 4.2 Verify TypeScript Types
```bash
npx tsc --noEmit
```

Should complete with no errors.

#### 4.3 Verify Dependencies
```bash
npm audit
```

Should show: `found 0 vulnerabilities`

---

## Files to Review/Modify

| File | Status | Notes |
|------|--------|-------|
| `package.json` | MODIFY | Update react/react-dom versions |
| `src/main.tsx` | REVIEW | Already compatible |
| `src/App.tsx` | REVIEW | Already compatible |
| `src/components/GPUDashboard.tsx` | REVIEW | Already compatible |
| `src/components/GPUSelector.tsx` | REVIEW | Already compatible |
| `src/components/ErrorBoundary.tsx` | REVIEW | Already compatible |
| `src/components/GPUDetailsModal.tsx` | REVIEW | Already compatible |

---

## Potential Issues & Solutions

### Issue: Type Errors with React 19
**Cause:** TypeScript types might not match React 19
**Solution:** Update `@types/react` and `@types/react-dom` to latest versions

### Issue: React Query Breaking Changes
**Cause:** `react-query` v4 is not compatible
**Solution:** Already using `@tanstack/react-query@^5.90.20` which is compatible

### Issue: Vite Configuration
**Cause:** Vite 7 might have React 19 support issues
**Solution:** Already using Vite 7.2.4 which supports React 19

---

## Rollback Plan

If issues occur:

```bash
# Revert to React 18
npm uninstall react react-dom
npm install react@18.3.1 react-dom@18.3.1 --legacy-peer-deps

# Revert React Query
npm uninstall @tanstack/react-query
npm install react-query@3.39.3

# Revert imports
# Manually change imports back from @tanstack/react-query to react-query
```

---

## References

- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://legacy.reactjs.org/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 Breaking Changes](https://legacy.reactjs.org/blog/2024/04/25/react-19-upgrade-guide#breaking-changes)
- [React 19 New Features](https://react.dev/blog/2024/12/05/react-19#new-features)

---

## Summary

**Risk Level:** LOW
**Estimated Time:** 10-15 minutes
**Files to Change:** 1 (package.json)
**Breaking Changes:** Minimal (codebase doesn't use deprecated patterns)

The upgrade is straightforward because:
1. No `forwardRef` usage
2. No form handling with `useFormState`
3. No `Context.Provider` direct usage
4. Simple root creation
5. No async scripts or resource preloading
6. No ref cleanup functions

---

*Prepared for user approval before implementation*
