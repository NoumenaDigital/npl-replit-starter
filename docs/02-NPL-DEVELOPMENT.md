# 02 - NPL Development Guide

## Overview

This guide covers **developing NPL protocols** that will be used to generate the complete application. It includes:
- Protocol structure and best practices
- Party declarations (for Keycloak role generation)
- `@api` annotations (for API generation)
- Frontend commenting conventions (for UI generation)
- State management patterns
- Permission and obligation patterns

## Protocol Structure

### Basic Protocol Template

```npl
package yourpackage

/**
 * Protocol Description
 * @param paramName Description of parameter
 */
@api
protocol[pParty1, pParty2] ProtocolName(
    var param1: Text,
    var param2: Number
) {
    initial state created;
    state active;
    final state completed;

    // Protocol body with permissions, obligations, etc.
}
```

### Key Elements

1. **Package Declaration** - Organizes protocols (used for sidebar grouping)
2. **@api Annotation** - Marks protocol for API generation
3. **Party Declarations** - Defines roles (used for Keycloak role generation)
4. **Parameters** - Used for creation forms
5. **States** - Protocol lifecycle
6. **Variables** - Displayed on detail pages
7. **Permissions/Obligations** - Become action buttons

## Party Declarations

Parties in protocol signatures define **roles** in the system:

```npl
protocol[pAdmin, pTrainer, pGuest] DogTraining(...)
```

**Naming Convention:**
- Prefix with `p` (e.g., `pAdmin`, `pTrainer`)
- Use descriptive names based on business context
- These become Keycloak roles (prefix removed: `pAdmin` → `admin`)

**Example from Context:**
```
"Create a dog training app with 3 roles (admin, trainer, guest)"
```

**NPL Protocol:**
```npl
protocol[pAdmin, pTrainer, pGuest] DogTraining(...)
```

**Generated Keycloak Roles:**
- `admin`
- `trainer`
- `guest`

## @api Annotation

Mark protocols with `@api` to generate API endpoints:

```npl
@api
protocol[pBank, pClient] Account(...)
```

**What gets generated:**
- REST API endpoints
- OpenAPI specification
- TypeScript types
- Frontend API client

## Frontend Commenting Conventions

NPL protocols should include **inline comments** that provide context for frontend generation. These comments help the AI understand:
- How to display protocol variables
- What UI components to use
- How to organize information on detail pages
- What labels and descriptions to use

## Comment Format

Use **inline comments** directly after variable declarations:

```npl
protocol[pBank, pClient] DogTraining(
    // @frontend: Display as main title in detail page header
    var dogName: Text,

    // @frontend: Display in "Basic Information" section as read-only text
    // @frontend: Label: "Owner Name"
    var ownerName: Text,

    // @frontend: Display in "Training Progress" section as table
    // @frontend: Table columns: Command, Status, Date Learned, Proficiency
    // @frontend: Format: Status as chip (green=learned, yellow=in-progress, red=not-started)
    var learnedCommands: List<Command>,

    // @frontend: Display in "Training Progress" section as KPI card
    // @frontend: Format: Large number with percentage, color based on value (green if >80%)
    // @frontend: Label: "Overall Progress"
    var overallProgress: Number,

    // @frontend: Display in "Schedule" section as calendar/date picker
    // @frontend: Format: Date picker for scheduling next training session
    var nextTrainingDate: LocalDate,

    // @frontend: Display in "Basic Information" section as dropdown
    // @frontend: Options: "Puppy", "Adult", "Senior"
    // @frontend: Label: "Age Category"
    var ageCategory: Text
) {
    // Protocol body...
}
```

## Comment Tags

### @frontend: Display location
Specifies where to display the variable on the detail page:

- `@frontend: Display in "Section Name" section` - Creates a named section
- `@frontend: Display as main title` - Used in page header
- `@frontend: Display in sidebar` - Additional info in sidebar
- `@frontend: Display in summary card` - KPI/summary card

### @frontend: Component type
Specifies what UI component to use:

- `@frontend: Format: text` - Plain text
- `@frontend: Format: table` - Data table
- `@frontend: Format: chip` - Status chip
- `@frontend: Format: date picker` - Date input
- `@frontend: Format: dropdown` - Select dropdown
- `@frontend: Format: number input` - Number input
- `@frontend: Format: currency` - Currency amount with formatting
- `@frontend: Format: percentage` - Percentage with formatting
- `@frontend: Format: chart` - Data visualization

### @frontend: Label
Custom label for the field:

```npl
// @frontend: Label: "Custom Field Name"
var fieldName: Text
```

### @frontend: Options
For dropdowns/enums, specify options:

```npl
// @frontend: Format: dropdown
// @frontend: Options: "Option1", "Option2", "Option3"
var status: Text
```

### @frontend: Table columns
For List/Set types displayed as tables:

```npl
// @frontend: Format: table
// @frontend: Table columns: Column1, Column2, Column3
var items: List<Item>
```

### @frontend: Color/Status mapping
For status fields with color coding:

```npl
// @frontend: Format: chip
// @frontend: Color mapping: "active"=green, "pending"=yellow, "inactive"=red
var status: Text
```

### @frontend: Read-only
Mark fields as read-only:

```npl
// @frontend: Display in "Information" section as read-only text
var id: Text
```

## Section Organization

Variables with the same section name are grouped together:

```npl
protocol[pBank] Example(
    // @frontend: Display in "Basic Information" section
    var name: Text,

    // @frontend: Display in "Basic Information" section
    var description: Text,

    // @frontend: Display in "Financial Details" section
    var amount: Number,

    // @frontend: Display in "Financial Details" section
    var currency: Currency
) {
    // All "Basic Information" fields appear together
    // All "Financial Details" fields appear together
}
```

## Default Behavior

If no `@frontend` comments are provided:
- Variables are displayed in a default "Details" section
- Text fields use plain text display
- Numbers use number formatting
- Dates use date formatting
- Lists/Sets use table display
- Booleans use checkbox/switch display

## Example: Complete Protocol with Comments

```npl
package dogtraining

/**
 * Dog Training Protocol
 * @param dogName The name of the dog being trained
 * @param ownerName The name of the dog's owner
 */
@api
protocol[admin, trainer, guest] DogTraining(
    // @frontend: Display as main title in detail page header
    var dogName: Text,

    // @frontend: Display in "Owner Information" section
    // @frontend: Label: "Owner Name"
    var ownerName: Text,

    // @frontend: Display in "Owner Information" section
    // @frontend: Label: "Owner Email"
    var ownerEmail: Text,

    // @frontend: Display in "Training Progress" section as table
    // @frontend: Table columns: Command, Status, Date Learned, Proficiency Score
    // @frontend: Format: Status as chip (green=learned, yellow=in-progress, red=not-started)
    var learnedCommands: List<Command>,

    // @frontend: Display in "Training Progress" section as KPI card
    // @frontend: Format: Large number with percentage, color green if >80%, yellow if 50-80%, red if <50%
    // @frontend: Label: "Overall Progress"
    var overallProgress: Number,

    // @frontend: Display in "Schedule" section as date picker
    // @frontend: Label: "Next Training Session"
    var nextTrainingDate: LocalDate,

    // @frontend: Display in "Basic Information" section as dropdown
    // @frontend: Options: "Puppy", "Adult", "Senior"
    // @frontend: Label: "Age Category"
    var ageCategory: Text,

    // @frontend: Display in "Basic Information" section as chip
    // @frontend: Color mapping: "active"=green, "on-hold"=yellow, "completed"=blue
    // @frontend: Label: "Training Status"
    var trainingStatus: Text
) {
    initial state created;
    state inProgress;
    final state completed;

    // @frontend: Display in "Training History" section as table
    // @frontend: Table columns: Date, Trainer, Command, Result, Notes
    private var trainingHistory: List<TrainingSession> = listOf<TrainingSession>();

    // @frontend: Display in "Statistics" section as KPI cards
    // @frontend: Format: Number with label "Total Sessions"
    private var totalSessions: Number = 0;

    // Protocol permissions...
}
```

## Best Practices

1. **Be specific** - Use clear section names and component types
2. **Group related fields** - Use the same section name for related variables
3. **Use meaningful labels** - Override default labels when needed
4. **Specify formats** - Indicate currency, percentage, date formats
5. **Document status mappings** - For status fields, specify color mappings
6. **Table column names** - For List/Set types, specify column headers

## Protocol Development Best Practices

### 1. State Management
- Use clear state names: `created`, `active`, `completed`
- Mark `initial state` and `final state` appropriately
- State transitions should be meaningful

### 2. Permission Patterns
- Use `@api` for permissions that need frontend buttons
- Include `require()` statements for business logic validation
- State constraints in permission signature (e.g., `| created, active`)

### 3. Party Organization
- Group related parties together
- Use consistent naming across protocols
- Document party responsibilities in comments

### 4. Variable Organization
- Group related variables logically
- Use `@frontend` comments to organize into sections
- Mark private variables that shouldn't be displayed

### 5. File Structure
- One protocol per file
- the file name should have the same name as the protocol

### 6. Joins
- do not use "id" references in protocols
- instead use protocols as variables
- to model 1:n relationships use List<ProtocolName>


---

## NPL Syntax Rules & Common Pitfalls

This section documents critical NPL syntax rules that differ from common programming conventions. **Follow these rules strictly** to avoid compilation errors.

### 1. No Nullable Types with `?` Suffix

NPL does **NOT** support the `Type?` syntax for nullable/optional types.

```npl
// ❌ WRONG - Will cause syntax errors
var notes: Text?
var endDate: LocalDate?

// ✅ CORRECT - Use default initialization
private var notes: Text = "";
private var endDate: LocalDate = startDate;
```

**Rule:** All variables must be initialized with a default value. There is no `null` in NPL.

### 2. Multi-Party Permissions with Parameters

When a permission has **parameters**, you **cannot** use comma-separated parties. You must create separate permissions for each party.

```npl
// ❌ WRONG - Syntax error with parameters and multiple parties
permission[pOwner, pTrainer] updateProgress(score: Number) | active {
    // ...
};

// ✅ CORRECT - Separate permissions for each party
permission[pOwner] updateProgressAsOwner(score: Number) | active {
    this.score = score;
};

permission[pTrainer] updateProgressAsTrainer(score: Number) | active {
    this.score = score;
};
```

**Exception:** Permissions **without** parameters can use multiple parties in the protocol signature:

```npl
// ✅ CORRECT - No parameters, multiple parties allowed
permission[pOwner] archive() | active {
    become archived;
};
```

### 3. Permission Signature Order

The permission signature must follow this exact order:

```npl
// ✅ CORRECT ORDER
permission[party] actionName(params) returns ReturnType | stateConstraint {
    // body
};

// ❌ WRONG - State constraint before return type
permission[party] actionName(params) | stateConstraint returns ReturnType {
    // body
};
```

### 4. State Transitions in `if` Statements

State transitions (`become`) inside `if` blocks require careful syntax:

```npl
// ✅ CORRECT - Separate if statements for state transitions
if (newStatus == "in_training") become inTraining;
if (newStatus == "reliable") become reliable;
if (newStatus == "proofed") become proofed;

// ❌ AVOID - Complex conditionals with become inside blocks
if (newStatus == "in_training") { become inTraining; }
else if (newStatus == "reliable") { become reliable; };
```

### 5. Variable Initialization Required

All variables **must** be initialized when declared:

```npl
// ❌ WRONG - Uninitialized variable
private var bookingTime: DateTime;

// ✅ CORRECT - Variable with initialization
private var bookingTime: DateTime = now();
private var notes: Text = "";
private var count: Number = 0;
```

### 6. Text Type, Not String

NPL uses `Text`, not `String`:

```npl
// ❌ WRONG
var name: String

// ✅ CORRECT
var name: Text
```

### 7. Semicolons Are Mandatory

Every statement must end with a semicolon, including:
- `if` blocks
- State transitions
- Return statements inside blocks

```npl
// ✅ CORRECT - Semicolons everywhere
if (amount > 0) {
    return true;
};

become completed;

this.updatedAt = now();
```

### 8. Protocol-Level Type Definitions

Structs, enums, and unions must be defined **outside** protocols at the package level:

```npl
// ✅ CORRECT - Type definition outside protocol
package mypackage

struct Item {
    name: Text,
    price: Number
};

protocol[pOwner] Order(var items: List<Item>) {
    // ...
};

// ❌ WRONG - Type definition inside protocol
protocol[pOwner] Order() {
    struct Item { ... };  // Syntax error
};
```

### 9. Struct Field Syntax

Struct fields use **commas**, not semicolons, and **no** `var` keyword:

```npl
// ❌ WRONG
struct Item {
    var id: Text;
    var price: Number;
};

// ✅ CORRECT
struct Item {
    id: Text,
    price: Number
};
```

### 10. Reserved Keywords

Never use these as variable names: `after`, `and`, `become`, `before`, `between`, `const`, `copy`, `else`, `enum`, `final`, `for`, `function`, `guard`, `identifier`, `if`, `in`, `init`, `initial`, `is`, `match`, `native`, `not`, `notification`, `notify`, `obligation`, `optional`, `or`, `otherwise`, `package`, `permission`, `private`, `protocol`, `require`, `resume`, `return`, `returns`, `state`, `struct`, `symbol`, `this`, `union`, `use`, `var`, `vararg`, `with`, `true`, `false`.

**Common Mistakes:**
- `resume` → Use `medicationResumeDate` or `resumeSchedule`
- `state` → Use `currentState` or `protocolState`
- `symbol` → Use `symbolValue` or specific name like `currencySymbol`

### 11. Boolean Operators

Use `&&` and `||`, not `and` and `or`:

```npl
// ❌ WRONG
if (a > 0 and b > 0) { ... };

// ✅ CORRECT
if (a > 0 && b > 0) { ... };
```

### 12. No Ternary Operators

NPL does not support `?:` syntax. Use `if-else` instead:

```npl
// ❌ WRONG
var result = condition ? "yes" : "no";

// ✅ CORRECT
var result = if (condition) { "yes"; } else { "no"; };
```

---

## Quick Reference: Permission Patterns

| Scenario | Syntax |
|----------|--------|
| Single party, no params | `permission[pOwner] action() \| state { ... };` |
| Single party, with params | `permission[pOwner] action(param: Type) \| state { ... };` |
| Multi-party, no params | Create separate permissions OR use pipe in protocol signature |
| Multi-party, with params | **Must** create separate permissions for each party |

---

## Next Steps

Once NPL protocols are developed with proper annotations, proceed to:
- [02a-PARTY-AUTOMATION.md](./02a-PARTY-AUTOMATION.md) - Configure party automation rules
- [04-FRONTEND-SETUP.md](./04-FRONTEND-SETUP.md) - Frontend development patterns

