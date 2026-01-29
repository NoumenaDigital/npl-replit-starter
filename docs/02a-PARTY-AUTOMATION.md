# 02a - Party Automation

## Overview

Party automation defines engine-level rules to automatically construct and assign parties when protocols are instantiated via the API. This removes the need to manually pass parties in every API request and ensures consistent party assignment based on authentication context.

**Reference:** [Noumena Documentation - Party Automation](https://documentation.noumenadigital.com/runtime/tools/party-automation/)

## When Party Automation Applies

Party automation rules are **only applied** when protocols are created via API endpoints:
- `POST /api/engine/protocols`
- `POST /npl/{package}/{protocol}`

Rules are **NOT** observed during:
- Native NPL execution (tests, internal protocol calls)
- Direct protocol instantiation in NPL code

## Rule Types

Party automation supports three rule types:

### 1. `extract` - Build Party from JWT Claims

Extracts party information from the authenticated user's JWT token.

```yaml
winecellar.Wine:
  pOwner:
    extract:
      claims:
        - preferred_username
```

**Use Case:** Assign the logged-in user to a party. The party is built from claims in the user's authentication token.

**Important:** Generally, you should only have **ONE `extract` rule per protocol** - the logged-in user should be assigned to only one party.

### 2. `set` - Assign Fixed Party

Assigns a specific party with predefined claims.

```yaml
winecellar.Wine:
  pCellarManager:
    set:
      claims:
        email:
          - manager@example.com
        role:
          - cellarManager
```

**Use Cases:**
- **Specific known user:** Set exact claims (email, role, etc.) for a single known party
- **Generic access:** Set only role claim (no email) to allow any user with that role

**Example - Generic "All Users" Access:**
```yaml
winecellar.Bottle:
  pUser:
    set:
      claims:
        role:
          - user
        # No email claim = accessible to anyone with 'user' role
```

### 3. `require` - Validate Claims (No Assignment)

Validates that required claims are present in the JWT token, but does not assign the party.

```yaml
winecellar.Wine:
  pOwner:
    require:
      claims:
        role:
          - owner
```

**Use Cases:**
- **Standalone validation:** Ensure the user has required claims before allowing protocol creation
- **Combined with `extract`:** Validate that extracted claims have specific values (see "Combining extract and require" below)

**Important:** `require` can be combined with `extract` for the same party to add validation constraints.

## Rules File Structure

**File:** `npl/src/main/rules.yml`

```yaml
# Party automation rules
# Maps NPL parties to claims from auth token for automatic party assignment
# Reference: https://documentation.noumenadigital.com/runtime/tools/party-automation/

package-name.ProtocolName:
  party-name:
    extract|set|require:
      claims:
        claim-key:
          - claim-value
        other-claim-key:
          - other-claim-value
```

### Schema Breakdown

- **`package-name.ProtocolName`** - Fully qualified protocol name (e.g., `winecellar.Wine`)
- **`party-name`** - Party name from protocol signature (e.g., `pOwner`, `pCellarManager`)
- **`rule-type`** - One of `extract`, `set`, or `require`
- **`claims`** - Authorization claims structure

## Important Restrictions

1. **`set` and `extract` are mutually exclusive** - Cannot use both `set` and `extract` for the same party
2. **`extract` and `require` can be combined** - You can use both `extract` and `require` for the same party to add validation constraints (see Pattern 5 below)
3. **Rules are validated during migration** - Invalid rules cause migration to fail
4. **Only ONE `extract` per protocol** - Generally, the logged-in user should be assigned to only one party

## Common Patterns

### Pattern 1: Logged-in User as Owner + Fixed Manager

```yaml
winecellar.Wine:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # Single known cellar manager - set with specific claims
  pCellarManager:
    set:
      claims:
        email:
          - manager@example.com
        role:
          - cellarManager
```

**Frontend:** Pass empty `@parties: {}` - all parties handled by automation.

### Pattern 2: Logged-in User + Generic Role Access

```yaml
winecellar.Bottle:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # Generic "all users" access - set with role only
  pUser:
    set:
      claims:
        role:
          - user
```

**Frontend:** Pass empty `@parties: {}` - all parties handled by automation.

### Pattern 3: Logged-in User + Variable Parties

```yaml
winecellar.Wine:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # pCellarManager NOT in rules.yml - must be passed via @parties in frontend
```

**Frontend:** Pass only parties NOT in rules.yml:
```typescript
'@parties': {
  pCellarManager: { claims: { email: [selectedManagerEmail] } }
}
```

### Pattern 4: Mixed Approach (Most Common)

```yaml
winecellar.Bottle:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # Fixed cellar manager
  pCellarManager:
    set:
      claims:
        email:
          - manager@example.com
        role:
          - cellarManager
  # pUser NOT in rules.yml - passed via frontend
```

**Frontend:** Pass only parties NOT in rules.yml:
```typescript
'@parties': {
  pUser: { claims: { email: [selectedUserEmail] } }
}
```

### Pattern 5: Combining extract and require (Role-Based Validation)

Extract claims from the logged-in user, but require that certain claims have specific values. This ensures only users with the required role can create the protocol.

```yaml
winecellar.Wine:
  # Extract email and role from logged-in user, but require role is "owner"
  # Only owners can create wines
  pOwner:
    extract:
      claims:
        - email
        - role
    require:
      claims:
        role:
          - owner
```

**How it works:**
1. `extract` takes the `email` and `role` claims from the logged-in user's JWT token
2. `require` validates that the `role` claim must be `"owner"`
3. If the user doesn't have `role: owner`, protocol creation fails
4. The `require` doesn't need to cover all extracted claims - it only validates the ones you specify

**Use Case:** Restrict protocol creation to users with specific roles, while still extracting their identity from the token.

**Example - Multiple Role Options:**
```yaml
winecellar.PremiumWine:
  pOwner:
    extract:
      claims:
        - email
        - role
        - organization
    require:
      claims:
        role:
          - owner
          - premiumMember
        # User must have either "owner" OR "premiumMember" role
```

**Frontend:** Pass empty `@parties: {}` - party is extracted and validated automatically.

## Frontend Integration

### When All Parties Are Automated

If all parties are defined in `rules.yml`, pass an empty `@parties` object:

```typescript
await api.createWine({
  requestBody: {
    ...data,
    '@parties': {}, // Empty - all parties assigned via rule automation
  },
});
```

### When Some Parties Are Not Automated

If some parties are NOT in `rules.yml`, pass only those parties:

```typescript
await api.createBottle({
  requestBody: {
    ...data,
    '@parties': {
      // Only pass parties NOT defined in rules.yml
      pUser: { claims: { email: [selectedUserEmail] } }
    },
  },
});
```

### Critical Rule: Never Duplicate

**❌ WRONG:** Passing parties that are already in `rules.yml` causes duplicate party errors:

```typescript
// If rules.yml has extract for pOwner, this will cause errors:
'@parties': {
  pOwner: { claims: { email: [userEmail] } }, // ❌ Duplicate!
}
```

**✅ CORRECT:** Only pass parties NOT in `rules.yml`:

```typescript
// If rules.yml handles pOwner, don't pass it:
'@parties': {
  // Only parties NOT in rules.yml
}
```

## Decision Tree: When to Use Each Approach

```
Is the party the logged-in user?
├─ YES → Do you need to validate the user's role/claims?
│   ├─ YES → Use `extract` + `require` (extract claims, require specific values)
│   │       Example: extract email+role, require role=owner
│   │
│   └─ NO → Use `extract` with preferred_username (or other claims)
│
└─ NO → Is it a single known user?
    ├─ YES → Use `set` with full claims (email, role, etc.)
    │
    └─ NO → Is it a generic role (all users with that role)?
        ├─ YES → Use `set` with role only (no email)
        │
        └─ NO → Omit from rules.yml, pass via @parties in frontend
```

## Example: Complete Configuration

**File:** `npl/src/main/rules.yml`

```yaml
# Party automation rules
# Reference: https://documentation.noumenadigital.com/runtime/tools/party-automation/

winecellar.Wine:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # Single known cellar manager - set with specific claims
  pCellarManager:
    set:
      claims:
        email:
          - manager@example.com
        role:
          - cellarManager

winecellar.Bottle:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
  # Single known cellar manager - set with specific claims
  pCellarManager:
    set:
      claims:
        email:
          - manager@example.com
        role:
          - cellarManager
  # Generic "all users" access - set with role only (no email = accessible to anyone with 'user' role)
  pUser:
    set:
      claims:
        role:
          - user

winecellar.ConsumptionPolicy:
  # Logged-in user becomes the owner
  pOwner:
    extract:
      claims:
        - preferred_username
```

**Frontend Forms:** All use empty `@parties: {}` since all parties are automated.

## Deployment

Party automation rules are deployed via the migration process:

1. Rules are validated during migration
2. Invalid rules cause migration to fail
3. If no rules file is provided, existing rules remain unchanged
4. To delete all existing rules, provide an empty rules descriptor file

## Troubleshooting

### Error: "Received 4 parties instead of expected 2"

**Cause:** Parties are being passed both via `@parties` in the request AND via rule automation.

**Solution:** Remove parties from `@parties` that are already defined in `rules.yml`.

### Error: "Multiple extract rules for same protocol"

**Cause:** More than one `extract` rule is defined for a protocol.

**Solution:** Use only ONE `extract` per protocol (typically for `pOwner`).

### Error: "set and extract are mutually exclusive"

**Cause:** Both `set` and `extract` are defined for the same party.

**Solution:** Choose one - either `extract` (from token) or `set` (fixed).

## Best Practices

1. **One extract per protocol** - Assign logged-in user to only one party
2. **Use set for known users** - Fixed parties should use `set` with full claims
3. **Use set with role only for generic access** - No email claim = accessible to anyone with that role
4. **Omit variable parties from rules.yml** - Pass them via `@parties` in frontend
5. **Document your approach** - Add comments in `rules.yml` explaining the strategy
6. **Test thoroughly** - Verify party assignment works as expected after migration

## Key Takeaways

- **Rule automation + explicit `@parties` = combination approach** - Not "either/or" but "both/and"
- **`extract` + `require` can be combined** - Extract claims from logged-in user, but require specific values (e.g., role must be "owner")
- **`require` doesn't need to cover all extracted claims** - Only validate the claims you want to restrict
- **What matters is bound claims** - Access control is based on claims bound to the protocol, not just what's in rules.yml
- **Most common pattern:** One `extract` (logged-in user) + some `set` (fixed parties) + some passed via frontend (variable parties)
- **Never duplicate** - If a party is in `rules.yml`, don't pass it in `@parties`
