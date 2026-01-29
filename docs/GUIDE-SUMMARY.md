# NPL Replit Template - Guide Summary

## Overview

This template provides **complete instructions** for building NPL applications on Replit, including:
- NPL protocol development on Noumena Cloud
- Party automation and authorization
- React/TypeScript frontend with generated API clients

## Guide Files

### Quick Start & Setup
1. **QUICK-START.md** - Fast-track workflow for building NPL apps
2. **01-PROJECT-SETUP.md** - Replit environment setup and configuration

### Backend Development
3. **02-NPL-DEVELOPMENT.md** - NPL syntax, types, and protocol development
   - Protocol structure and best practices
   - Party declarations and @api annotations
   - Frontend commenting conventions
   - Common syntax rules and pitfalls

4. **02a-PARTY-AUTOMATION.md** - Party automation rules
   - Automatic party assignment from JWT claims
   - Extract, set, and require patterns
   - Frontend integration

5. **02b-NPL-TESTING.md** - NPL unit testing
   - Test file organization
   - Test syntax and assertions

### Frontend Development
6. **04-FRONTEND-SETUP.md** - Frontend patterns and NPL integration
   - Parties and authorization concepts
   - Creating protocol instances
   - The @actions array and UI control
   - API path formats
   - Authentication and Keycloak integration

7. **05-SIDEBAR-NAVIGATION.md** - Sidebar navigation component
   - Navigation from NPL packages
   - Role-based visibility
   - Responsive design

8. **06-OVERVIEW-PAGES.md** - Overview/list pages
   - Data tables with search and filter
   - Create buttons
   - Protocol instance lists

9. **07-DETAIL-PAGES.md** - Detail pages
   - Variable display
   - Action buttons integration
   - Section organization

10. **08-CREATION-FORMS.md** - Creation forms
    - Forms from protocol parameters
    - Validation logic
    - Party assignment

11. **09-ACTION-BUTTONS.md** - Action button patterns
    - Button components per permission
    - Dialog patterns
    - API integration

12. **10-CODE-TEMPLATES.md** - Code templates and examples
    - Service provider
    - Router configuration
    - Component examples

### Additional Resources
13. **14-TROUBLESHOOTING.md** - Common issues and solutions
14. **15-SEED-SCRIPTS.md** - Seed data and bootstrapping

## Key Features

### Replit-Optimized Setup
- **Noumena Cloud integration** - Backend runs on Noumena Cloud
- **Make commands** for all operations
- **Environment configuration** via `noumena.config`
- **Automatic API client generation** from deployed NPL

### NPL Development
- **Party automation** - Automatic party assignment from JWT
- **Protocol validation** - `make check` before deployment
- **Testing support** - Unit tests for NPL protocols

### Frontend Patterns
- **Protocol-centric** architecture
- **Backend @actions** as source of truth for UI
- **Generated TypeScript types** from OpenAPI
- **Party-based authorization** via JWT claims

## Workflow

1. **Read QUICK-START.md** for the complete workflow
2. **Configure environment** (01-PROJECT-SETUP.md)
3. **Develop NPL protocols** (02-NPL-DEVELOPMENT.md)
4. **Deploy to Noumena Cloud** (`make deploy-npl`)
5. **Generate API client** (`make client`)
6. **Customize frontend** (guides 04-10)
7. **Test and deploy** (`make run` or `make deploy`)

## What's Included

### Backend (NPL on Noumena Cloud)
- ✅ NPL protocol development guides
- ✅ Party automation configuration
- ✅ Testing framework
- ✅ Deployment scripts

### Frontend (React on Replit)
- ✅ Generated TypeScript API client
- ✅ Pre-built components (customizable)
- ✅ Sidebar navigation
- ✅ Overview pages, detail pages, forms
- ✅ Action button patterns
- ✅ Authentication with Keycloak

## Result

A **complete NPL application** with:
- NPL backend on Noumena Cloud
- React frontend on Replit
- Automatic role-based access control via parties
- Generated API types and client
- Customizable UI components

