# 04 - NPL Frontend Development Guide

> **For AI Agents**: This guide explains how NPL backend patterns directly inform frontend architecture. Read this BEFORE building any frontend components.

## Core Concept: The Backend Drives the Frontend

Unlike traditional REST APIs, NPL backends provide **rich metadata** with every response that tells your frontend:
- **What actions are available** (`@actions` array)
- **Who can perform them** (party/role matching via claims)
- **What state the protocol is in** (`@state`)

**Your frontend should NEVER hardcode visibility logic.** Instead, read this metadata from the API.

---
## 1. Understanding Parties and Authorization

This is **fundamental to NPL**. Authorization is based on **party claims**, not traditional roles.

### How It Works

1. **Users authenticate** via Keycloak → receive a JWT token
2. **JWT contains claims** like `{ "email": "alice@example.com" }`
3. **Protocols define party roles** like `protocol[issuer, payee]`
4. **Party roles are filled with claims** when creating instances
5. **NPL Engine checks** if user's JWT claims match a party's claims

### Party Structure

```typescript
// A Party is identified by claims (key-value pairs from JWT)
interface Party {
  claims: {
    [key: string]: string[];  // Each claim key can have multiple values
  }
}

// Example: Party identified by email
const alice: Party = {
  claims: {
    email: ["alice@example.com"]
  }
};
```

### Claim Matching Rule

A user **represents** a party if their JWT claims are a **superset** of the party's claims:

```
Party claims:    { email: ["alice@example.com"] }
User JWT claims: { email: ["alice@example.com"], groups: ["users"] }
Result: ✅ User can represent this party (user has all required claims)
```

### Helper Function for Email-Based Parties

```typescript
// Utility to create a party from an email
export function partyFromEmail(email: string): Party {
  return {
    claims: {
      email: [email]
    }
  };
}
```

---

## 2. Creating Protocol Instances - Specifying All Parties

When creating a protocol instance, you must provide claims for **every party role** defined in the protocol.

### ⚠️ Important: Party Claims JSON Format

The `@parties` object uses **`claims`** (not `entity` or other field names):

```json
{
  "@parties": {
    "issuer": {
      "claims": {
        "email": ["alice@example.com"]
      }
    },
    "payee": {
      "claims": {
        "email": ["bob@example.com"]
      }
    }
  },
  "forAmount": 100
}
```

**Common mistake**: Using `"entity"` instead of `"claims"` - this will cause API errors.

### Example: Two-Party Protocol

```npl
// NPL Backend: protocol[issuer, payee] Iou(var forAmount: Number)
```

```typescript
// Frontend: Creating an IOU
// - Current user (alice@example.com) will be the issuer
// - Someone else (bob@example.com) will be the payee

async function createIou(payeeEmail: string, amount: number) {
  const currentUserEmail = keycloak.tokenParsed?.email;

  const response = await client.POST('/npl/demo/Iou/', {
    body: {
      "@parties": {
        // Issuer: the current logged-in user
        issuer: partyFromEmail(currentUserEmail),
        // Payee: another user (from form input)
        payee: partyFromEmail(payeeEmail)
      },
      forAmount: amount
    }
  });

  return response.data;
}
```

### ❌ Common Mistake: Forgetting @parties

```typescript
// ❌ WRONG: Missing @parties - will fail!
await client.POST('/npl/demo/Iou/', {
  body: { forAmount: 100 }
});

// ✅ CORRECT: Always include @parties
await client.POST('/npl/demo/Iou/', {
  body: {
    "@parties": {
      issuer: partyFromEmail(currentUser),
      payee: partyFromEmail(otherUser)
    },
    forAmount: 100
  }
});
```

---

## 3. The `@actions` Array - Your UI Control Center

Every protocol instance response includes an `@actions` array listing **exactly which permissions the current user can invoke**.

### How It Works

```typescript
// API Response for an IOU when alice@example.com is logged in
{
  "@id": "abc-123",
  "@state": "unpaid",
  "@parties": {
    "issuer": { "claims": { "email": ["alice@example.com"] } },
    "payee": { "claims": { "email": ["bob@example.com"] } }
  },
  "@actions": ["pay", "getAmountOwed"],  // ⭐ Alice can do these
  "forAmount": 100
}
```

The `@actions` array is computed by the NPL Engine based on:
1. **Current protocol state** - permissions have state constraints (e.g., `| unpaid`)
2. **User's JWT claims** - determines which party they represent
3. **Permission definitions** - who can invoke what

### Different Users See Different Actions

```typescript
// Same IOU, but bob@example.com is logged in (the payee)
{
  "@id": "abc-123",
  "@state": "unpaid",
  "@actions": ["forgive", "getAmountOwed"],  // Bob sees different actions!
  // ...
}

// Same IOU in final state - no actions for anyone
{
  "@id": "abc-123",
  "@state": "paid",
  "@actions": [],  // No actions in final state
  // ...
}
```

### Frontend Pattern: Action-Based Button Visibility

```typescript
function IouCard({ iou }: { iou: Iou }) {
  // ✅ CORRECT: Use @actions to determine what to show
  const canPay = iou["@actions"].includes("pay");
  const canForgive = iou["@actions"].includes("forgive");

  return (
    <div className="iou-card">
      <p>Amount: ${iou.forAmount}</p>
      <p>State: {iou["@state"]}</p>

      {/* Only render buttons for available actions */}
      {canPay && (
        <button onClick={() => handlePay(iou["@id"])}>
          Pay
        </button>
      )}
      {canForgive && (
        <button onClick={() => handleForgive(iou["@id"])}>
          Forgive
        </button>
      )}

      {/* Show message when no actions available */}
      {iou["@actions"].length === 0 && (
        <p className="no-actions">No actions available</p>
      )}
    </div>
  );
}
```

### ❌ Anti-Pattern: Hardcoded State/Role Checks

```typescript
// ❌ WRONG: Don't hardcode visibility logic
function IouCard({ iou, currentUser }) {
  // Don't do this! The backend already computed this for you
  const isIssuer = iou["@parties"].issuer.claims.email[0] === currentUser;
  const isUnpaid = iou["@state"] === "unpaid";
  const canPay = isIssuer && isUnpaid;  // ❌ Duplicating backend logic
}

// ✅ CORRECT: Trust @actions
function IouCard({ iou }) {
  const canPay = iou["@actions"].includes("pay");  // ✅ Backend already checked
}
```

### Using @actions for Role Detection (Admin vs User Views)

Beyond button visibility, use `@actions` to determine **which UI sections** to show:

```typescript
// A registry protocol might have admin-only actions
// @actions: ["registerUser"] for admins
// @actions: [] for regular users

function RegistryPage({ registry }) {
  // Detect if current user is an admin by checking for admin-only actions
  const isAdmin = registry["@actions"].includes("getUserCount") ||
                  registry["@actions"].includes("unregisterUser");

  return (
    <div>
      {/* Everyone sees the main content */}
      <h1>User Registry</h1>

      {/* Only admins see the admin panel */}
      {isAdmin && (
        <div className="admin-panel">
          <h2>Admin Tools</h2>
          <button onClick={handleExportUsers}>Export Users</button>
          <button onClick={handleViewStats}>View Statistics</button>
        </div>
      )}

      {/* Show registration button only if available */}
      {registry["@actions"].includes("registerUser") && (
        <button onClick={handleRegister}>Register</button>
      )}
    </div>
  );
}
```

**Key insight**: The `@actions` array tells you everything about what the current user can do. Use it to:
- Show/hide entire sections (admin panels, settings pages)
- Enable/disable navigation items
- Customize the UI based on user capabilities

---

## ⚠️ CRITICAL: API Path Format

The NPL Engine uses a **specific path format** that differs from common REST conventions.

### Path Format

```
WRONG:  /protocol/package.ProtocolName
WRONG:  /api/v1/package/ProtocolName
CORRECT: /npl/package/ProtocolName/
```

### Key Rules

1. **Prefix is `/npl/`** - Not `/protocol/`, `/api/`, or anything else
2. **Package and protocol separated by `/`** - Not `.` (dot)
3. **Trailing slash `/` is required** - Many endpoints need it
4. **Case-sensitive** - Use exact protocol names as defined in NPL

### Path Mapping Examples

| NPL Protocol Definition | Correct API Path |
|------------------------|------------------|
| `package cooper; protocol DogProfile` | `/npl/cooper/DogProfile/` |
| `package cooper; protocol Command` | `/npl/cooper/Command/` |
| `package myapp.users; protocol User` | `/npl/myapp.users/User/` |
| `package orders; protocol Invoice` | `/npl/orders/Invoice/` |

### Finding Correct Paths

The OpenAPI specification is the **source of truth** for API paths:

```bash
# Find where OpenAPI spec is generated
find npl/target -name "*openapi*.yml" 2>/dev/null

# View the paths section
grep "^  /npl" npl/target/generated-sources/openapi/*-openapi.yml | head -30
```

### API Client Configuration

When writing or configuring the API client:

```typescript
// ❌ WRONG - Common mistake
const response = await axios.get('/protocol/cooper.DogProfile');
const response = await axios.get('/api/DogProfile');

// ✅ CORRECT - Use /npl/package/Protocol/ format
const response = await axios.get('/npl/cooper/DogProfile/');
```

See [14-TROUBLESHOOTING.md](./14-TROUBLESHOOTING.md) for more details on API path issues.

---

## ⛔ CHECKPOINT: Verify API Client Before Component Development

**Before proceeding to develop any frontend components (guides 05-09), you MUST verify:**

```bash
# 1. Check generated files exist
ls src/generated/
# ✅ Should see: api.ts (or similar API client file)

# 2. Check models were generated
ls src/generated/models/
# ✅ Should see TypeScript files for your protocols

# 3. Verify TypeScript compiles
npm run build
# ✅ Should complete without type errors
```

### ❌ DO NOT proceed to component development until:
- [ ] `src/generated/api.ts` exists
- [ ] `src/generated/models/` contains type definitions for your protocols
- [ ] `npm run build` completes without TypeScript errors

### Why This Matters

All frontend components (overview pages, detail pages, forms, action buttons) must:
- Import types from `src/generated/models/`
- Use API methods from `src/generated/api.ts`
- **NEVER use mock or hardcoded data**

If you try to develop components before the API client is generated:
- ❌ No type definitions available
- ❌ No API methods to call
- ❌ Forced to use forbidden mock data
- ❌ Will need complete rewrite when API client exists

---

## ⚠️ CRITICAL: No Mock Data in Frontend

**ALL data displayed in the frontend MUST come from the backend API.** This is a non-negotiable rule.

### Forbidden Patterns

```typescript
// ❌ FORBIDDEN - Hardcoded mock data
const mockDogs = [{ id: '1', name: 'Cooper', breed: 'Golden Retriever' }];

// ❌ FORBIDDEN - Fallback to fake data
const items = apiResponse || [{ id: '1', name: 'Sample' }];

// ❌ FORBIDDEN - Default values that look like real data
const [item, setItem] = useState({ name: 'Example', value: 42 });

// ❌ FORBIDDEN - Demo/sample data anywhere in components
const demoData = { ... };
```

### Required Patterns

```typescript
// ✅ CORRECT - Fetch from API with proper state handling
const [loading, setLoading] = useState(true);
const [items, setItems] = useState<Item[]>([]);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchItems();
}, []);

const fetchItems = async () => {
  try {
    setLoading(true);
    const response = await services.api.getItemList();
    setItems(response.items || []);
  } catch (e) {
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};

// ✅ CORRECT - Empty state when no data
if (items.length === 0) {
  return <EmptyState message="No items found. Create your first item." />;
}
```

### Acceptable Placeholders

- Form field placeholders: `placeholder="e.g., Example Name"` ✅
- Empty state messages: `"No items found"` ✅
- Loading indicators: `<CircularProgress />` ✅
- Error messages: `"Failed to load data"` ✅

### Why This Matters

1. **Data Integrity**: Mock data creates confusion about what's real vs fake
2. **Debugging**: Fake data masks API issues and makes debugging harder
3. **User Trust**: Users must see only their actual data
4. **Testing**: The app should fail obviously if the API is unreachable



### Key Implementation Rules

1. **Use `initializingRef`** — Add a `useRef(false)` to prevent React StrictMode from initializing Keycloak twice:
   ```typescript
   const initializingRef = useRef(false);

   useEffect(() => {
     if (initializingRef.current) return;
     initializingRef.current = true;
     // ... Keycloak init code
   }, []);
   ```

2. **Never use `login-required`** — Always use `check-sso` mode

3. **Handle login in init callback** — Do NOT use a separate `useEffect` for login redirect. This is the #1 cause of redirect loops.

4. **Set `checkLoginIframe: false`** — Avoids iframe-related issues

5. **Use `silentCheckSsoRedirectUri`** — Points to the silent-check-sso.html file

### How It Works

1. Keycloak `init()` is called with `check-sso` mode
2. Keycloak checks if user is already authenticated (using the silent-check-sso.html file)
3. `init()` resolves with `auth = true` (authenticated) or `auth = false` (not authenticated)
4. If `auth = false`, we call `kc.login()` directly in the callback
5. User is redirected to Keycloak login page
6. After login, Keycloak redirects back to the app
7. `init()` is called again and resolves with `auth = true`

### Common Redirect Loop Causes

| Cause | Solution |
|-------|----------|
| Using `login-required` mode | Use `check-sso` instead |
| Login redirect in separate `useEffect` | Move login to init callback |
| React StrictMode double initialization | Use `initializingRef` guard |
| Missing `silent-check-sso.html` | Create the file in `public/` |
| `checkLoginIframe: true` with CORS issues | Set to `false` |

### Verification

After creating the file, verify it's accessible:

```bash
# In development (Vite on Replit)
curl http://localhost:5000/silent-check-sso.html

# Should return the HTML content
```

### Directory Structure

Your `frontend/public/` directory should look like this:

```
frontend/
├── public/
│   ├── silent-check-sso.html  # ✅ REQUIRED for SSO
│   └── (other static assets)
└── src/
    └── ...
```

## Landing Page (Required)

Every application needs a **public landing page** that users see before logging in. This page should:

1. Welcome users to the application
2. Provide a "Sign In" button that triggers Keycloak login
3. Show demo credentials (for development)

### Why Landing Page is Required

With `check-sso` authentication mode:
- The app checks if user is already logged in
- If not, it should display the landing page (NOT auto-redirect to Keycloak)
- User clicks "Sign In" to trigger authentication

### LandingPage Component

**File:** `src/components/LandingPage.tsx`

> ⚠️ **Important:** The LandingPage is **outside** the `AuthProvider` context, so it **cannot** use `useAuth()`. Instead, navigate to a protected route to trigger authentication.

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import LoginIcon from '@mui/icons-material/Login';

/**
 * Public landing page - displayed before authentication.
 *
 * This page is outside the AuthProvider context, so it cannot use useAuth().
 * Instead, it navigates to a protected route which triggers authentication.
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = () => {
    // Navigate to a protected route - this will trigger authentication
    // via the AuthenticatedApp wrapper and ProtectedRoute
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={12} sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Stack spacing={4} alignItems="center">
            <PetsIcon sx={{ fontSize: 80, color: 'primary.main' }} />

            <Typography variant="h3" fontWeight="bold" color="primary">
              Your App Name
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Your app description here.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              sx={{ px: 6, py: 1.5 }}
            >
              Sign In to Continue
            </Button>

            <Typography variant="caption" color="text.secondary">
              Demo: user@example.com / welcome
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
```

### AuthenticatedApp Wrapper (Critical Pattern)

> ⚠️ **Critical:** Do NOT wrap the entire app in `AuthProvider` in `main.tsx`. This causes Keycloak to initialize even for public routes like the landing page.

Instead, create an `AuthenticatedApp` wrapper that provides auth context only for protected routes:

**File:** `src/components/shared/AuthenticatedApp.tsx`

```tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../AuthProvider';
import { ServiceProvider } from '../../ServiceProvider';
import { UserProvider } from '../../UserProvider';

/**
 * Wrapper component that provides authentication context for protected routes.
 * This is used inside the router so that public routes (like the landing page)
 * can render without initializing Keycloak.
 */
export const AuthenticatedApp: React.FC = () => {
  return (
    <AuthProvider>
      <ServiceProvider>
        <UserProvider>
          <Outlet />
        </UserProvider>
      </ServiceProvider>
    </AuthProvider>
  );
};
```

### main.tsx Structure

The entry point should NOT include AuthProvider:

**File:** `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import { RuntimeConfigurationProvider } from './RuntimeConfigurationProvider';
import { router } from './Router';
import { ThemeContextProvider, useColorMode } from './ThemeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const ThemedApp: React.FC = () => {
  const { colorMode } = useColorMode();
  const theme = createAppTheme(colorMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router()} />
    </ThemeProvider>
  );
};

// Note: AuthProvider, ServiceProvider, and UserProvider are inside
// AuthenticatedApp (in Router), NOT wrapping the entire app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <RuntimeConfigurationProvider>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </RuntimeConfigurationProvider>
  </ErrorBoundary>
);
```

### Router Configuration

The router separates public and protected routes:

```tsx
import { LandingPage } from './components/LandingPage';
import { AuthenticatedApp } from './components/shared/AuthenticatedApp';

export const router = () => createBrowserRouter([
  // =========================================================================
  // PUBLIC ROUTES (no authentication required, no Keycloak initialization)
  // =========================================================================
  {
    path: '/',
    element: <LandingPage />
  },

  // =========================================================================
  // PROTECTED ROUTES (authentication required)
  // AuthenticatedApp provides: AuthProvider -> ServiceProvider -> UserProvider
  // =========================================================================
  {
    element: <AuthenticatedApp />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/dashboard',
            element: <ProtectedRoute><Dashboard /></ProtectedRoute>
          },
          // ... other protected routes
        ]
      }
    ]
  }
]);
```

> ⚠️ **Important:**
> - Do NOT redirect `/` to a protected route. The landing page must be the entry point.
> - Do NOT wrap `AuthProvider` around the entire app in `main.tsx`.
> - Protected routes must be children of `AuthenticatedApp` in the router.

## ⚠️ CRITICAL: API Authentication Headers

**All API calls to the backend MUST include the Authorization header with the bearer token.**

Without proper auth headers, API calls will fail with:
```
"No Authorization header found on request"
```

### Solution: Axios Interceptor in ServiceProvider

The `ServiceProvider` must use an **axios request interceptor** to automatically add the Authorization header to all API requests. This is handled centrally so every API call includes the token.

```typescript
// In ServiceProvider.tsx
import axios from 'axios';

// Add axios request interceptor to inject Authorization header
axios.interceptors.request.use(
  async (config) => {
    const kc = keycloakRef.current;

    if (kc?.authenticated) {
      // Refresh token if needed
      await kc.updateToken(70);

      // Add Authorization header
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${kc.token}`;
    }

    return config;
  }
);
```

### Key Points

1. **Use axios interceptor** — Intercepts ALL axios requests and adds the bearer token
2. **Use a ref for keycloak** — Ensures the interceptor always has access to the current keycloak instance
3. **Auto token refresh** — Calls `updateToken(70)` before each request to keep the token fresh
4. **Centralized** — Auth header logic is in one place, not duplicated in every API call

See [10-CODE-TEMPLATES.md](./10-CODE-TEMPLATES.md) for the full ServiceProvider implementation.

## Next Steps

Once frontend setup is complete, proceed to:
- [05-SIDEBAR-NAVIGATION.md](./05-SIDEBAR-NAVIGATION.md) - Generate sidebar navigation from NPL packages

