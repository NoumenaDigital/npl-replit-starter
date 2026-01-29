# 01 - Project Setup for Replit

## What is NPL?

**NPL (Noumena Protocol Language)** is a language for modeling secure-by-design multi-party business processes with:
- Built-in state machines
- Multi-party permissions
- Automatic REST API generation
- Automatic persistence

## Replit + Noumena Cloud Architecture

This template is optimized for Replit and connects to Noumena Cloud:
- NPL backend runs on Noumena Cloud (no local Docker needed)
- React frontend runs on Replit
- Authentication via Keycloak on Noumena Cloud
- All configuration via `noumena.config` and `.env`
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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         REPLIT                              │
│  ┌──────────────────┐    ┌─────────────────────────────┐    │
│  │  React + Vite    │────│  Generated TypeScript       │    │
│  │  Frontend        │    │  API Client                 │    │
│  └──────────────────┘    └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼ (HTTPS + JWT)
┌─────────────────────────────────────────────────────────────┐
│                    NOUMENA CLOUD                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐    │
│  │ Engine   │  │ Keycloak │  │ Readmodel│  │ Connectors│    │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── .replit              # Replit configuration
├── replit.nix           # System dependencies
├── replit.md            # AI Agent workflow instructions
├── Makefile             # Setup commands
├── docs/
│   ├── NPL_DEVELOPMENT.md         # THIS FILE - NPL reference
│   └── NPL_FRONTEND_DEVELOPMENT.md # Frontend patterns - parties, claims, @actions
├── scripts/
│   ├── setup-env.sh          # Generate .env from tenant/app
│   ├── install-npl-cli.sh    # Install NPL CLI
│   ├── deploy-npl.sh         # Deploy NPL to Noumena Cloud
│   ├── generate-client.sh    # Generate TypeScript API client
│   ├── provision-users.sh    # Create seed users in Keycloak
│   ├── configure-keycloak-client.sh  # Configure Keycloak for Replit
│   ├── deploy-frontend.sh    # Deploy frontend to Noumena Cloud
│   └── preflight-check.sh    # Validate environment setup
├── npl/
│   └── src/
│       └── main/
│           ├── migration.yml  # Deployment entry point
│           └── npl-1.0/
│               └── demo/
│                   └── iou.npl
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── auth/
│   │   └── keycloak.ts
│   ├── api/
│   │   └── npl-client.ts
│   └── generated/       # (Auto-generated from OpenAPI)
└── public/
    └── silent-check-sso.html
```

## Prerequisites

### Platform Version

**Always use the latest Noumena Platform version.** Check Maven Central for the current release:

- **Maven Central:** https://central.sonatype.com/artifact/com.noumenadigital.platform/npl-maven-plugin
- **Release Notes:** https://documentation.noumenadigital.com/releases/platform/

> ⚠️ **Important:** This guide uses `2025.2.6` as the current latest version. Always check Maven Central for newer releases before starting a new project.



