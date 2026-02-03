# NPL + React Replit Template

## 🛑 STOP - READ THIS FIRST

**DO NOT run npm commands directly. DO NOT start the dev server yet.**

This project requires setup before it can run. The setup process:
1. Configures connection to Noumena Cloud
2. Opens a browser for authentication (user must log in)
3. Deploys the backend
4. Generates TypeScript types

---

## MANDATORY FIRST STEPS

**Before doing ANYTHING else, complete these steps in order:**

### Step 1: Edit `noumena.config`
```
NPL_TENANT=your-tenant-name
NPL_APP=your-app-name
```
Ask the user for these values if you don't know them.

### Step 2: Add Keycloak Secrets (in Replit Secrets tab)
```
KEYCLOAK_ADMIN_USER=admin-username
KEYCLOAK_ADMIN_PASSWORD=admin-password
```
These are needed for `make users` and `make keycloak` commands.

### Step 3: Run setup
```bash
make setup
```
This will open a browser for Noumena Cloud login - the user must authenticate.

Agent: When prompting the user to log in, please provide link with device code included for the user to click.

**⚠️ The frontend WILL NOT WORK without completing all three steps.**

