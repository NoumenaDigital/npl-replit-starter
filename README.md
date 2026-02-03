# NPL + React Replit Template

Build React frontends on Replit that connect to NPL backends running on [Noumena Cloud](https://noumena.cloud).

![NPL + React](https://img.shields.io/badge/NPL-Noumena%20Cloud-6366f1)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)

## Prerequisites: Noumena Cloud Account

You'll need a **Noumena Cloud subscription** (free trial available) to deploy the NPL backend and (optionally) the React frontend:

1. **Register at [https://portal.noumena.cloud/](https://portal.noumena.cloud/)**
   - Sign up for an account
   - Create a **tenant** (this is your bucket for all deployments)
   - Select a subscription plan (start with the free trial)

2. **Create an application**
   - Once your tenant is created, create a new **application** in Noumena Cloud
   - Note down the **tenant** and **app** slugs from the URL: `https://portal.noumena.cloud/{tenant}/{app}`
   - You'll need these values when configuring your project

---

## 📥 Use This Template

### Option 1: From GitHub (Recommended)

1. Go to [Replit](https://replit.com)
2. Click **Import code or design** → **Import from GitHub**
3. Paste this URL: `https://github.com/NoumenaDigital/replit-template`
4. Click **Import from GitHub**

### Option 2: Fork on GitHub First

1. Fork this repository on GitHub
2. In Replit, click **Import code or design** → **Import from GitHub**
3. Select your forked repository

### Option 3: Use as Replit Template

If this is published as a Replit template, simply click **Use Template**.

---

## 🚀 Quick Start: With Replit Agent

👉 Start by telling the Replit Agent:
```
Please run first-time setup for this project.
```
Follow the indications about next steps provided by the Agent.

## 🚀 Quick Start: With Preconfiguration and Makefile

### 1. Configure Your Project

**Edit the `noumena.config` file in the project root:**

```
NPL_TENANT=tenant
NPL_APP=app
```

Find these values at: `portal.noumena.cloud/{tenant}/{app}` (see above)

All other URLs (NPL Engine, Keycloak) are **automatically derived** from these!

**Add Keycloak Secrets**

To configure Keycloak and create test users, add these in Replit's **Secrets** tab (🔒):

| Secret | Description |
|--------|-------------|
| `KEYCLOAK_ADMIN_USER` | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password |

These enable the optional Keycloak configuration steps during setup.

### 2. Run Full Setup (Interactive)

```bash
make setup
```

This **interactive** setup will:
1. Generate `.env` file with derived URLs
2. Install the NPL CLI and npm dependencies
3. **Prompt you to login** to Noumena Cloud (opens browser)
4. Deploy your NPL code to Noumena Cloud
5. Generate TypeScript API client
6. **Ask if you want to configure Keycloak** (enables dev mode login)
7. **Ask if you want to provision test users** (alice, bob, etc.)

> **Already logged in?** Use `make setup-quick` to skip the login prompt.
