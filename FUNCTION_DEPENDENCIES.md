# Function Dependencies & Usage Documentation

This document tracks critical functions across the codebase and where they are used. Use this when making changes to ensure consistency across the entire application.

## Critical Calculation Functions

### `calculateAllMetrics(employees, dataset, departmentCategories?)`

**Location:** `/packages/calculations/src/calculator.ts`

**Purpose:** Main orchestrator for all workforce metrics calculations

**Parameters:**
- `employees: Employee[]` - Array of employee records
- `dataset: Dataset` - Dataset configuration and metadata
- `departmentCategories?: Record<string, string>` - Optional mapping of department names to categories (R&D, GTM, G&A, Operations, Other)

**Returns:** `CalculationResult` containing summary, departments, ratios, outliers, and tenure metrics

**Usage Locations:**
1. `/apps/web/src/app/dashboard/datasets/[id]/page.tsx:49` - Dataset overview page
2. `/apps/web/src/app/dashboard/datasets/[id]/analytics/page.tsx:48` - Analytics page
3. `/apps/web/src/app/dashboard/datasets/[id]/scenarios/page.tsx:51` - Scenarios page
4. `/apps/web/src/app/api/datasets/[id]/benchmarks/route.ts:53` - Benchmarks API

**IMPORTANT:** All usages MUST:
1. Include `settings: true` in the Prisma query
2. Extract `departmentCategories` from `dataset.settings?.departmentCategories`
3. Pass `departmentCategories` as the third parameter

**Example:**
```typescript
const dataset = await prisma.dataset.findFirst({
  where: { id: datasetId, userId: user.id },
  include: {
    employees: { orderBy: { createdAt: 'desc' } },
    settings: true, // REQUIRED
  },
});

const departmentCategories = dataset.settings?.departmentCategories as Record<string, string> | undefined;
const metrics = calculateAllMetrics(dataset.employees, dataset, departmentCategories);
```

---

### `calculateDepartmentBreakdown(employees, departmentCategories?)`

**Location:** `/packages/calculations/src/core/structure.ts`

**Purpose:** Groups employees by department category and calculates FTE, cost, and percentages

**Parameters:**
- `employees: Employee[]` - Array of employee records
- `departmentCategories?: Record<string, string>` - Optional mapping of department names to categories

**Returns:** `DepartmentBreakdown` - Object with category as key and metrics as values

**Behavior:**
- If `departmentCategories` is provided, uses that mapping
- Otherwise, falls back to `normalizeDepartment()` for basic categorization

**Called by:** `calculateAllMetrics()`

**NOTE:** Do NOT call directly in frontend/API code. Always use `calculateAllMetrics()` instead.

---

## Department Categorization

### Settings-Based Categorization (Current Approach)

**How it works:**
1. User configures department categories in Settings page (`/dashboard/datasets/[id]/settings`)
2. Settings stored in `DatasetSettings.departmentCategories` as JSON
3. All calculations use this mapping via `calculateAllMetrics()`

**Category Options:**
- `R&D` - Engineering, Product, Design, Data, QA
- `GTM` - Sales, Marketing, Customer Success, Partnerships
- `G&A` - Finance, HR, Legal, IT, Admin, Recruiting
- `Operations` - Logistics, Manufacturing, Supply Chain, Facilities
- `Other` - Everything else

**Default Auto-Categorization:**
On first load, departments are automatically categorized using regex patterns in:
`/apps/web/src/app/api/datasets/[id]/settings/route.ts:68-80`

---

## Frontend Components Using Department Data

### Analytics Tabs

**Main Component:** `/apps/web/src/app/dashboard/datasets/[id]/analytics-tabs.tsx`

**Sub-Components:**
1. `analytics-general-tab.tsx` - Uses `departmentCategories` for Sales/Marketing FTE calculations
2. `analytics-benchmarking-tab.tsx` - Uses `metrics.departments` from calculations
3. `analytics-tenure-tab.tsx` - Uses employee data directly
4. `analytics-recommendations-tab.tsx` - Uses `metrics.departments` from calculations

**Props Flow:**
```
analytics/page.tsx (fetches settings)
  → analytics-tabs.tsx (passes departmentCategories)
    → analytics-general-tab.tsx (uses departmentCategories)
```

**IMPORTANT:** When adding new analytics components:
1. Accept `departmentCategories` as optional prop if needed
2. Use `metrics.departments` for aggregated department data (already uses settings)
3. Filter employees using `departmentCategories` mapping for granular breakdowns

---

## Checking Function Usage Across the App

### When modifying core calculation functions:

1. **Search for direct function calls:**
   ```bash
   grep -r "calculateAllMetrics" apps/web/src/
   grep -r "calculateDepartmentBreakdown" apps/web/src/
   ```

2. **Check for department filtering patterns:**
   ```bash
   grep -r "normalizeDepartment" apps/web/src/
   grep -r "department.*filter" apps/web/src/
   grep -r "\.toLowerCase().*includes.*department" apps/web/src/
   ```

3. **Verify Settings integration:**
   ```bash
   grep -r "settings.*department" apps/web/src/
   grep -r "departmentCategories" apps/web/src/
   ```

4. **Test all usage locations:**
   - Dataset Overview page - Check R&D to GTM ratio
   - Analytics → General tab - Check all department-based KPIs
   - Analytics → Benchmarking tab - Check department breakdowns
   - Scenarios page - Check scenario calculations
   - Settings page - Change a categorization and verify it reflects everywhere

---

## Common Mistakes to Avoid

### ❌ DON'T: Call calculation functions without settings
```typescript
// WRONG - Missing settings
const metrics = calculateAllMetrics(employees, dataset);
```

### ✅ DO: Always include settings
```typescript
// CORRECT - Includes settings
const departmentCategories = dataset.settings?.departmentCategories as Record<string, string> | undefined;
const metrics = calculateAllMetrics(employees, dataset, departmentCategories);
```

---

### ❌ DON'T: Hardcode department names in filters
```typescript
// WRONG - Hardcoded department matching
const rdEmployees = employees.filter(emp =>
  emp.department.toLowerCase().includes('engineering')
);
```

### ✅ DO: Use departmentCategories from settings
```typescript
// CORRECT - Uses settings-based categorization
const rdEmployees = employees.filter(emp =>
  departmentCategories?.[emp.department] === 'R&D'
);
```

---

### ❌ DON'T: Recalculate metrics that already exist
```typescript
// WRONG - Recalculating R&D FTE
const rdFTE = employees
  .filter(emp => emp.department.includes('Engineering'))
  .reduce((sum, emp) => sum + emp.fteFactor, 0);
```

### ✅ DO: Use metrics from calculateAllMetrics
```typescript
// CORRECT - Use centralized metrics (DRY principle)
const rdFTE = metrics.departments['R&D']?.fte || 0;
```

---

## Future Enhancements

When adding new features that use department data:

1. **Check if data already exists in `CalculationResult`**
   - Avoid duplicating calculations
   - Follow DRY (Don't Repeat Yourself) principle

2. **If adding new calculations:**
   - Add to `/packages/calculations/src/`
   - Update `calculateAllMetrics()` to include new metrics
   - Document in this file

3. **If adding new department-based filters:**
   - Always accept `departmentCategories` prop
   - Use settings-based categorization, not hardcoded patterns
   - Test with different department configurations

4. **Update this documentation:**
   - Add new function locations
   - Update usage examples
   - Document any breaking changes

---

## Maintenance Checklist

When making changes to department categorization or calculations:

- [ ] Updated `/packages/calculations/src/calculator.ts` (if needed)
- [ ] Updated `/packages/calculations/src/core/structure.ts` (if needed)
- [ ] Verified all pages pass `departmentCategories` to `calculateAllMetrics()`
- [ ] Checked all analytics tab components use settings correctly
- [ ] Tested Settings page changes reflect across entire app
- [ ] Updated this documentation
- [ ] Ran `pnpm build` to check for TypeScript errors
- [ ] Tested with real data in multiple department configurations

---

**Last Updated:** 2025-12-07

**Updated By:** Claude Code

**Change Summary:**
- Documented critical calculation functions and their usage
- Added department categorization flow
- Created function usage checking guide
- Added common mistakes section
- Established maintenance checklist
