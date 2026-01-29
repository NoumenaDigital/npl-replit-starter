# 15 - Seed Scripts Generation

## ⚠️ CRITICAL: Client Request Only

**Seed scripts should ONLY be generated when explicitly requested by the client.** This is an optional feature that should not be included in the standard application build process unless the client specifically asks for it.

**When to generate seed scripts:**
- ✅ Client explicitly requests seed data or sample data
- ✅ Client asks for "test data" or "demo data"
- ✅ Client wants to populate the database with initial data

**When NOT to generate seed scripts:**
- ❌ Standard application builds
- ❌ Client hasn't mentioned seed data
- ❌ Automatic generation without request

---

## Overview

Seed scripts provide sample data for testing, development, and demonstration purposes. They generate realistic instances of NPL protocols that can be used to populate the database with initial data.

## Purpose

Seed scripts are useful for:
- **Development**: Quickly populate the database during development
- **Testing**: Provide consistent test data for automated tests
- **Demonstration**: Show the application with realistic sample data
- **Onboarding**: Help new developers understand the data structure

## When to Use This Guide

Only follow this guide when:
1. The client has explicitly requested seed scripts
2. You are working on a project that requires initial data
3. The build process includes the "Include Seed Scripts" option (NOUMENA-ONE)

## Prerequisites

Before generating seed scripts, ensure:
- ✅ All NPL protocols are complete and compiled
- ✅ OpenAPI specification is generated
- ✅ TypeScript API client is available
- ✅ Frontend structure is in place (for reference)

---

## Step 1: Analyze NPL Protocols

### 1.1 Identify Protocols for Seeding

Review all NPL protocol files to determine which protocols should have seed data:

**Protocols that typically need seed data:**
- Master data protocols (e.g., Wine, User, Category)
- Reference data protocols
- Configuration protocols

**Protocols that typically DON'T need seed data:**
- Transaction protocols (created through user actions)
- Event protocols
- Audit protocols

### 1.2 Extract Protocol Structure

For each protocol that needs seed data, extract:
- Protocol name and package
- Protocol parameters (for instantiation)
- Required fields (from `require()` statements)
- Party requirements
- State constraints

**Example Analysis:**

```npl
// From Wine.npl
@api
protocol[owner] Wine(
  var name: Text,
  var producer: Text,
  var vintage: Number,
  var region: Text
) {
  require(name.length() > 0, "Name must not be empty");
  require(vintage >= 1900 && vintage <= now().year(), "Vintage must be valid");
  // ...
}
```

**Seed data considerations:**
- `name`: Must be non-empty
- `vintage`: Must be between 1900 and current year
- `owner`: Party required for instantiation

---

## Step 2: Create Seed Script Structure

### 2.1 Directory Structure

Create the following structure in your project:

```
project-root/
├── scripts/
│   ├── seed.ts                 # Main seed execution script
│   ├── seed-data/
│   │   ├── wines.ts           # Seed data for Wine protocol
│   │   ├── bottles.ts         # Seed data for Bottle protocol
│   │   └── index.ts           # Export all seed data
│   └── README.md              # Instructions for running seeds
```

### 2.2 Main Seed Script

**File:** `scripts/seed.ts`

```typescript
#!/usr/bin/env ts-node

/**
 * Seed Script for [APP_NAME]
 * 
 * This script populates the database with sample data for development and testing.
 * 
 * Usage:
 *   npm run seed              # Run all seed scripts
 *   npm run seed -- --reset   # Reset database and seed
 */

import { DefaultService } from '../frontend/src/generated/services/DefaultService';
import { wineData } from './seed-data/wines';
import { bottleData } from './seed-data/bottles';

const API_BASE_URL = process.env.VITE_ENGINE_URL || 'http://localhost:12001';
const service = new DefaultService({ baseURL: API_BASE_URL });

async function seedWines() {
  console.log('🌱 Seeding wines...');
  
  for (const wine of wineData) {
    try {
      // Use the generated API client to create instances
      await service.createWine({
        name: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        region: wine.region,
        // ... other fields
      });
      console.log(`  ✓ Created wine: ${wine.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create wine: ${wine.name}`, error);
    }
  }
}

async function seedBottles() {
  console.log('🌱 Seeding bottles...');
  
  // Note: Bottles may depend on Wines, so seed wines first
  for (const bottle of bottleData) {
    try {
      await service.createBottle({
        wineId: bottle.wineId,
        size: bottle.size,
        purchasePrice: bottle.purchasePrice,
        // ... other fields
      });
      console.log(`  ✓ Created bottle: ${bottle.id}`);
    } catch (error) {
      console.error(`  ✗ Failed to create bottle: ${bottle.id}`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting seed process...\n');
  
  try {
    // Seed in dependency order
    await seedWines();
    await seedBottles();
    
    console.log('\n✅ Seed process completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed process failed:', error);
    process.exit(1);
  }
}

main();
```

### 2.3 Seed Data Files

**File:** `scripts/seed-data/wines.ts`

```typescript
import { Wine } from '../../frontend/src/generated/models';

/**
 * Sample wine data for seeding
 * 
 * These are example instances that follow the Wine protocol structure.
 * Modify as needed for your use case.
 */
export const wineData: Omit<Wine, 'id' | 'state'>[] = [
  {
    name: 'Château Margaux',
    producer: 'Château Margaux',
    vintage: 2015,
    region: 'Bordeaux',
    alcoholPercentage: 13.5,
    grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'],
    // ... other fields
  },
  {
    name: 'Domaine de la Romanée-Conti',
    producer: 'DRC',
    vintage: 2018,
    region: 'Burgundy',
    alcoholPercentage: 13.0,
    grapeVarieties: ['Pinot Noir'],
    // ... other fields
  },
  // Add more sample wines...
];
```

**Important considerations:**
- Use realistic, varied data
- Ensure data respects protocol constraints
- Include edge cases if relevant
- Document any assumptions

---

## Step 3: Handle Dependencies

### 3.1 Protocol Dependencies

Some protocols depend on others. Seed them in the correct order:

**Example dependency chain:**
1. Wine (no dependencies)
2. Bottle (depends on Wine)
3. ConsumptionPolicy (may depend on Wine)

**Implementation:**

```typescript
async function seedWithDependencies() {
  // 1. Seed independent protocols first
  const wines = await seedWines();
  
  // 2. Seed dependent protocols
  const bottles = await seedBottles(wines);
  
  // 3. Seed protocols that depend on multiple others
  await seedConsumptionPolicies(wines, bottles);
}
```

### 3.2 Party Dependencies

If protocols require parties (users), ensure those parties exist in Keycloak:

```typescript
async function ensurePartiesExist() {
  // Check if required parties exist in Keycloak
  // If not, create them or use existing test users
  const owner = await getOrCreateParty('owner@example.com');
  return { owner };
}
```

---

## Step 4: Validate Seed Data

### 4.1 Validation Rules

Ensure seed data:
- ✅ Respects all `require()` statements from NPL
- ✅ Uses valid data types
- ✅ Follows business logic constraints
- ✅ Includes realistic relationships

### 4.2 Validation Function

```typescript
function validateWineData(wine: WineSeedData): boolean {
  // Check name is not empty
  if (!wine.name || wine.name.length === 0) {
    console.error('Wine name must not be empty');
    return false;
  }
  
  // Check vintage is valid
  const currentYear = new Date().getFullYear();
  if (wine.vintage < 1900 || wine.vintage > currentYear) {
    console.error(`Vintage ${wine.vintage} is invalid`);
    return false;
  }
  
  return true;
}
```

---

## Step 5: Add to Package.json

Add seed script to `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node scripts/seed.ts",
    "seed:reset": "npm run db:reset && npm run seed"
  }
}
```

---

## Step 6: Documentation

### 6.1 README for Seed Scripts

**File:** `scripts/README.md`

```markdown
# Seed Scripts

This directory contains scripts for populating the database with sample data.

## Usage

```bash
# Run seed scripts
npm run seed

# Reset database and seed
npm run seed:reset
```

## Seed Data

- `seed-data/wines.ts` - Sample wine data
- `seed-data/bottles.ts` - Sample bottle data

## Customization

Modify the seed data files to match your needs. Ensure data respects protocol constraints.
```

---

## Best Practices

### 1. Keep Seed Data Realistic

- Use realistic names, dates, and values
- Include variety in the data
- Avoid obviously fake data (e.g., "Test Wine 1", "Test Wine 2")

### 2. Document Assumptions

- Document any assumptions about the data
- Explain relationships between seed data items
- Note any special cases

### 3. Make Seed Data Idempotent

- Seed scripts should be safe to run multiple times
- Handle existing data gracefully
- Use upsert patterns if needed

### 4. Keep Seed Data Separate

- Don't mix seed data with production code
- Keep seed scripts in a dedicated directory
- Version control seed data separately if needed

### 5. Test Seed Scripts

- Test seed scripts in a clean environment
- Verify all data is created correctly
- Check that dependencies are handled properly

---

## Integration with NOUMENA-ONE

When using NOUMENA-ONE to generate applications:

1. **Select "Include Seed Scripts"** option when building
2. NOUMENA-ONE will automatically:
   - Analyze NPL protocols
   - Generate seed data structure
   - Create seed scripts
   - Add seed commands to package.json

---

## Troubleshooting

### Seed Script Fails with Validation Errors

**Problem:** Seed data doesn't pass protocol validation

**Solution:**
- Review protocol `require()` statements
- Update seed data to match constraints
- Add validation checks to seed script

### Dependencies Not Found

**Problem:** Seed script fails because dependent protocols don't exist

**Solution:**
- Ensure seed order respects dependencies
- Add dependency checks before seeding
- Create dependencies first if missing

### API Errors During Seeding

**Problem:** API calls fail during seeding

**Solution:**
- Verify API is running and accessible
- Check authentication/authorization
- Ensure API client is properly configured
- Add retry logic for transient errors

---

## Summary

Seed scripts are a valuable tool for development and testing, but should only be created when explicitly requested by the client. When creating seed scripts:

1. ✅ Analyze NPL protocols to identify seedable entities
2. ✅ Create seed data that respects protocol constraints
3. ✅ Handle dependencies between protocols
4. ✅ Validate seed data before execution
5. ✅ Document seed scripts and their usage
6. ✅ Test seed scripts thoroughly

Remember: **Only generate seed scripts when the client explicitly requests them.**
