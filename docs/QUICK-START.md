# Quick Start Guide for Replit

This guide provides a fast-track workflow for building NPL applications on Replit with Noumena Cloud.

## Architecture Overview

- **Frontend**: React + TypeScript running on Replit
- **Backend**: NPL protocols running on Noumena Cloud
- **Authentication**: Keycloak managed by Noumena Cloud
- **Deployment**: `make` commands handle everything

## ⚠️ CRITICAL: You MUST Follow These Phases in Order

**The development workflow has THREE PHASES that must be completed sequentially:**

```
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: BACKEND                                                 │
│ Create NPL → Compile → Generate OpenAPI                          │
│                                                                  │
│ ⛔ STOP: Do not proceed until OpenAPI exists!                    │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: API CLIENT                                              │
│ Generate TypeScript client from OpenAPI                          │
│                                                                  │
│ ⛔ STOP: Do not proceed until api.ts exists!                     │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: FRONTEND                                                │
│ Now develop React components using the generated API client      │
└──────────────────────────────────────────────────────────────────┘
```

**Why this matters:** Frontend components require the generated TypeScript types and API methods. Without them, you would have to use mock data (which is FORBIDDEN) or guess at types (which will break).

---

## PHASE 1: Backend Development

### Step 1: Configure Replit Environment

**Follow:** [01-PROJECT-SETUP.md](./01-PROJECT-SETUP.md)

**What you'll configure:**
- `noumena.config` - Tenant and app name
- Keycloak secrets (in Replit Secrets tab)
- Run `make setup` to configure environment

### Step 2: Develop NPL Protocols

**Follow:** [02-NPL-DEVELOPMENT.md](./02-NPL-DEVELOPMENT.md)

**What you'll create:**
- NPL protocol files in `npl/src/main/npl-1.0/your-package/`
- Protocol definitions with `@api` annotations
- `@frontend` comments for UI generation
- Party declarations

**Example:**
```npl
package yourpackage

@api
protocol[party1, party2] YourProtocol(var name: Text) {
    initial state created;
    final state completed;
    
    @api
    permission[party1] doSomething() | created {
        become completed;
    };
}
```

### Step 3: Configure Parties and Authentication

Parties in NPL protocols define roles and authorization. Read about party automation:
- [02a-PARTY-AUTOMATION.md](./02a-PARTY-AUTOMATION.md) - Automatic party assignment rules
- [02b-NPL-TESTING.md](./02b-NPL-TESTING.md) - Unit testing your protocols

---

## ⛔ PHASE 1 CHECKPOINT: Deploy Backend to Noumena Cloud

**Before proceeding to Phase 2, you MUST complete these steps:**

```bash
# 1. Validate NPL code
make check

# 2. Deploy to Noumena Cloud
make deploy-npl

# 3. VERIFY: Deployment succeeded
# You should see: "Migration successful" or similar message
```

### ❌ DO NOT proceed to Phase 2 until:
- [ ] `make check` completes without errors
- [ ] `make deploy-npl` deploys successfully to Noumena Cloud
- [ ] No compilation or validation errors

---

## PHASE 2: API Client Generation

### Step 4: Generate TypeScript API Client

The template already has the frontend setup. Generate the API client from your deployed NPL:

```bash
make client
```

This will:
- Fetch OpenAPI spec from Noumena Cloud
- Generate TypeScript types and API client
- Place generated code in `frontend/src/generated/`

---

## ⛔ PHASE 2 CHECKPOINT: Verify API Client

**Before proceeding to Phase 3, you MUST verify:**

```bash
# 1. Check generated files exist
ls frontend/src/generated/
# ✅ Should see: openapi/ directory with generated types

# 2. Verify the client can connect
make run
# ✅ Dev server should start without TypeScript errors
```

### ❌ DO NOT proceed to Phase 3 until:
- [ ] `frontend/src/generated/` contains generated API client
- [ ] No TypeScript compilation errors
- [ ] Dev server starts successfully

---

## PHASE 3: Frontend Development

**Now and ONLY now should you develop frontend components!**

All frontend components must:
- ✅ Import types from `src/generated/models/`
- ✅ Use API methods from `src/generated/api.ts`
- ❌ NEVER use mock or hardcoded data

### Step 5: Customize Frontend Components

**Read the frontend development guide first:**

**[04-FRONTEND-SETUP.md](./04-FRONTEND-SETUP.md)** - Critical concepts: parties, claims, @actions

**Then customize components using these guides:**

#### Component Guides:
- [05-SIDEBAR-NAVIGATION.md](./05-SIDEBAR-NAVIGATION.md) - Sidebar navigation
- [06-OVERVIEW-PAGES.md](./06-OVERVIEW-PAGES.md) - Overview/list pages
- [07-DETAIL-PAGES.md](./07-DETAIL-PAGES.md) - Detail pages with actions
- [08-CREATION-FORMS.md](./08-CREATION-FORMS.md) - Creation forms
- [09-ACTION-BUTTONS.md](./09-ACTION-BUTTONS.md) - Action button patterns
- [10-CODE-TEMPLATES.md](./10-CODE-TEMPLATES.md) - Code templates and examples

### Step 6: Test and Deploy

```bash
# Start dev server in Replit
make run

# Or deploy to Noumena Cloud
make deploy
```

**Troubleshooting:** [14-TROUBLESHOOTING.md](./14-TROUBLESHOOTING.md)
**Seed Data:** [15-SEED-SCRIPTS.md](./15-SEED-SCRIPTS.md)

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: BACKEND (on Noumena Cloud)                            │
├─────────────────────────────────────────────────────────────────┤
│ 1. Configure Replit environment (01-PROJECT-SETUP.md)           │
│ 2. Develop NPL protocols (02-NPL-DEVELOPMENT.md)                │
│ 3. Configure parties (02a-PARTY-AUTOMATION.md)                  │
│                                                                 │
│ ⛔ CHECKPOINT: Deploy to Noumena Cloud                          │
│    make check                                                   │
│    make deploy-npl                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: API CLIENT                                             │
├─────────────────────────────────────────────────────────────────┤
│ 4. Generate TypeScript API client                               │
│    make client                                                   │
│                                                                 │
│ ⛔ CHECKPOINT: Verify generated client exists                   │
│    ls frontend/src/generated/                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: FRONTEND                                               │
├─────────────────────────────────────────────────────────────────┤
│ 5. Read frontend guide (04-FRONTEND-SETUP.md)                   │
│ 6. Customize components (05-10 guides)                          │
│    ├── Sidebar (05)                                             │
│    ├── Overview pages (06)                                      │
│    ├── Detail pages (07)                                        │
│    ├── Creation forms (08)                                      │
│    └── Action buttons (09)                                      │
│ 7. Test and deploy                                              │
│    make run  (or)  make deploy                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ✅ Complete Application
```

## Common Issues & Solutions

### Issue: NPL deployment fails
**Solution:** Run `make check` first, fix any validation errors

### Issue: API client not generated
**Solution:** Ensure NPL is deployed first with `make deploy-npl`, then run `make client`

### Issue: Frontend build fails
**Solution:** Verify generated types exist in `frontend/src/generated/`

### Issue: Keycloak authentication fails
**Solution:** Run `make keycloak` to configure Keycloak client for Replit

## Reference Documents

All guides are in the `docs/` folder:
- **[GUIDE-SUMMARY.md](./GUIDE-SUMMARY.md)** - Overview of all guides
- **[02-NPL-DEVELOPMENT.md](./02-NPL-DEVELOPMENT.md)** - NPL syntax and rules
- **[04-FRONTEND-SETUP.md](./04-FRONTEND-SETUP.md)** - Frontend patterns
- **[10-CODE-TEMPLATES.md](./10-CODE-TEMPLATES.md)** - Code templates
- **[14-TROUBLESHOOTING.md](./14-TROUBLESHOOTING.md)** - Troubleshooting guide

