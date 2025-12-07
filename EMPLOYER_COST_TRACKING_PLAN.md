# Employer Cost Tracking - Implementation Plan

## Overview
Track actual employer costs over time to understand true workforce expenses, cost trends, and enable accurate forecasting for both growth and downsizing scenarios.

## Phase 1: Foundation ✅ COMPLETE
**Database Schema Created** (Commit: 47069b4)

### MonthlyEmployerCost Model
- **Period Tracking**: Monthly snapshots with human-readable labels
- **Flexible Scope**: Employee-specific OR dataset-wide aggregates
- **Comprehensive Cost Breakdown**:
  - Gross compensation (salary, bonus, equity)
  - Employer taxes
  - Social security contributions
  - Health insurance
  - Benefits (gym, meals, training, etc.)
  - Other employer costs
  - **Total employer cost** (sum of all above)
- **Calculated Metrics**: Employer cost ratio (overhead %)
- **Data Provenance**: Tracks source (manual, CSV, API, calculated)
- **Multi-currency Support**: Handles EUR, USD, etc.

### Key Features
```sql
-- One record per dataset/period/employee
UNIQUE(datasetId, period, employeeId)

-- Fast queries by period and department
INDEX(datasetId, period)
INDEX(datasetId, period, department)
```

---

## Phase 2: CSV Import Interface 🚧 NEXT

### User Story
> "As a finance/HR user, I want to upload my monthly payroll report (gross-net statement)
> so that the system can track employer costs over time without manual data entry."

### Implementation Tasks

#### 1. **Create Payroll CSV Upload Component**
File: `apps/web/src/app/dashboard/datasets/[id]/payroll-upload.tsx`

Features:
- Drag-and-drop CSV upload
- Column mapping for payroll fields:
  - Employee ID/Email (for matching)
  - Period/Month
  - Gross Salary
  - Employer Taxes
  - Social Contributions
  - Health Insurance
  - Benefits
  - Other Costs
- Preview table showing first 5 rows
- Validation:
  - Period format detection (MM/YYYY, YYYY-MM, etc.)
  - Employee matching (by ID or email)
  - Currency detection
  - Numeric field validation

#### 2. **CSV Template for Payroll Reports**
```csv
Period,Employee ID,Employee Email,Gross Salary,Employer Taxes,Social Contributions,Health Insurance,Benefits,Other Costs
2025-01,EMP001,john@company.com,5000,1200,950,300,150,200
2025-01,EMP002,jane@company.com,6000,1440,1140,300,150,200
```

**Auto-calculation**:
- `grossTotal` = grossSalary + grossBonus + grossEquity
- `totalEmployerCost` = grossTotal + employerTaxes + socialContributions + healthInsurance + benefits + otherEmployerCosts
- `employerCostRatio` = totalEmployerCost / grossTotal

#### 3. **API Endpoint**
File: `apps/web/src/app/api/datasets/[id]/employer-costs/bulk/route.ts`

```typescript
POST /api/datasets/{datasetId}/employer-costs/bulk
{
  period: "2025-01-01",
  periodLabel: "January 2025",
  costs: [
    {
      employeeId: "uuid", // or email for matching
      grossSalary: 5000,
      employerTaxes: 1200,
      socialContributions: 950,
      // ...
    }
  ],
  source: "CSV_IMPORT",
  importedFrom: "payroll_jan_2025.csv"
}
```

**Processing Logic**:
1. Parse and validate CSV
2. Match employees by ID or email
3. Validate period format
4. Calculate totals and ratios
5. Bulk insert with transaction
6. Handle duplicates (upsert based on unique constraint)

---

## Phase 3: Trend Visualization 📊 NEXT

### Dashboard Tab: "Employer Costs"
File: `apps/web/src/app/dashboard/datasets/[id]/analytics-costs-tab.tsx`

#### Visualizations

**1. Monthly Cost Trend (12 months)**
```
Line chart showing:
- Total employer costs (primary axis)
- Headcount (secondary axis)
- Average cost per employee

Insights:
- "Your employer costs increased 15% over last 12 months"
- "Cost per employee: €7,850/month (up from €7,200)"
```

**2. Cost Breakdown by Category**
```
Stacked area chart:
- Gross compensation (base layer)
- Employer taxes
- Social contributions
- Benefits
- Other costs

Shows how cost structure evolved over time
```

**3. Department Cost Comparison**
```
Grouped bar chart by department:
- Engineering: €850K/month
- Sales: €420K/month
- G&A: €180K/month

Filter by: This month | Last 3 months | Last 12 months
```

**4. Cost Ratio Trends**
```
Line chart showing employer cost ratio over time:
- January: 1.35 (35% overhead)
- ...
- December: 1.38 (38% overhead)

Benchmark line: Industry average 1.32
```

#### Key Metrics Cards
```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ Total Monthly Cost      │  │ Cost per Employee       │  │ Employer Cost Ratio     │
│ €1.2M                   │  │ €7,850                  │  │ 1.38x                   │
│ +8.5% vs last month     │  │ +2.1% vs last month     │  │ +0.03 vs last month     │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 12-Month Trend          │  │ Cost Growth Rate        │  │ Projected Annual Cost   │
│ ↗ Growing               │  │ +1.2% per month        │  │ €15.6M                  │
│ €850K → €1.2M          │  │ +14.4% annually        │  │ Based on current trend  │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## Phase 4: Advanced Features 🔮 FUTURE

### API Interface (Automated Import)
```typescript
// Payroll system webhook
POST /api/webhooks/payroll
Authorization: Bearer {api_key}

{
  organizationId: "...",
  period: "2025-01",
  payrollData: [...]
}

// Supported integrations:
- Personio
- BambooHR
- Gusto
- ADP
- Custom API
```

### Forecasting Engine
```typescript
// Predict future costs based on:
- Historical trends
- Planned hiring
- Salary adjustments
- Regional cost differences

Output:
- 3-month forecast
- 12-month projection
- Scenario modeling (best/worst/likely)
```

### Cost Optimization Insights
```
AI-powered recommendations:
- "Your employer cost ratio (1.45) is 10% above industry average"
- "Consider reviewing benefits package - 15% higher than peers"
- "Projected annual savings: €180K by optimizing tax structure"
```

### Benchmarking
```
Compare your costs against:
- Industry peers
- Company size cohort
- Regional averages

Metrics:
- Cost per employee
- Employer cost ratio
- Benefits as % of gross
- Tax efficiency
```

---

## Data Model Example

### Monthly Snapshot (January 2025)
```json
{
  "id": "uuid",
  "datasetId": "uuid",
  "period": "2025-01-01",
  "periodLabel": "January 2025",
  "employeeId": "emp_uuid",  // or null for aggregate
  "department": "Engineering",

  // Gross compensation
  "grossSalary": 5000.00,
  "grossBonus": 500.00,
  "grossEquity": 300.00,
  "grossTotal": 5800.00,

  // Employer costs
  "employerTaxes": 1200.00,
  "socialContributions": 950.00,
  "healthInsurance": 300.00,
  "benefits": 150.00,
  "otherEmployerCosts": 200.00,

  // Totals
  "totalEmployerCost": 8600.00,
  "employerCostRatio": 1.48,  // 48% overhead

  // Metadata
  "source": "CSV_IMPORT",
  "importedFrom": "payroll_jan_2025.csv",
  "currency": "EUR"
}
```

---

## Benefits for Users

### Finance Teams
- **Accurate Budgeting**: True cost visibility beyond salaries
- **Trend Analysis**: Understand cost evolution over time
- **Forecasting**: Project future costs based on historical data
- **Cost Control**: Identify cost increases early

### HR Teams
- **Total Rewards**: Understand full cost of employment
- **Hiring Planning**: Factor in employer costs for new hires
- **Regional Comparison**: Compare costs across locations
- **Benchmarking**: See how costs compare to market

### Executives
- **Strategic Planning**: Understand full workforce investment
- **Growth Modeling**: Cost implications of scaling
- **Downsizing Analysis**: Cost savings from reductions
- **Board Reporting**: Comprehensive cost metrics

---

## Technical Architecture

### Data Flow
```
Payroll System → CSV Export → Upload Interface → Validation →
Employee Matching → Calculation → Database → Visualization
```

### Database Queries (Optimized)
```sql
-- Last 12 months trend
SELECT
  period,
  period_label,
  department,
  COUNT(employee_id) as employee_count,
  SUM(total_employer_cost) as total_cost,
  AVG(total_employer_cost) as avg_cost_per_employee,
  AVG(employer_cost_ratio) as avg_cost_ratio
FROM monthly_employer_costs
WHERE dataset_id = $1
  AND period >= NOW() - INTERVAL '12 months'
GROUP BY period, period_label, department
ORDER BY period ASC;

-- Month-over-month comparison
WITH monthly_totals AS (
  SELECT
    period,
    SUM(total_employer_cost) as total_cost,
    COUNT(employee_id) as headcount
  FROM monthly_employer_costs
  WHERE dataset_id = $1
  GROUP BY period
)
SELECT
  period,
  total_cost,
  headcount,
  LAG(total_cost) OVER (ORDER BY period) as prev_cost,
  (total_cost - LAG(total_cost) OVER (ORDER BY period)) /
    LAG(total_cost) OVER (ORDER BY period) * 100 as growth_rate
FROM monthly_totals
ORDER BY period DESC
LIMIT 12;
```

---

## Implementation Priority

### Immediate (Phase 2) 🔥
1. CSV upload component
2. Bulk import API
3. Employee matching logic
4. Basic validation

### Short-term (Phase 3) 📅
1. Trend visualization dashboard
2. Cost metrics cards
3. Department breakdown
4. Month-over-month comparison

### Medium-term (Phase 4) 🎯
1. Forecasting engine
2. Cost optimization insights
3. Benchmarking integration
4. Export/reporting

### Long-term (Future) 🚀
1. API integrations (Personio, BambooHR, etc.)
2. Webhooks for automated import
3. Advanced analytics (ML-based forecasting)
4. Multi-entity/multi-currency consolidation

---

## Success Metrics

- **Adoption**: % of customers importing monthly payroll data
- **Data Quality**: % of successful employee matches
- **Usage**: Frequency of cost dashboard views
- **Value**: Time saved vs manual tracking (target: 80% reduction)
- **Insights**: Number of cost optimization opportunities identified

---

## Next Steps for Development

1. **Create payroll upload component** (2-3 hours)
   - Similar to existing CSV upload
   - Custom field mapping for payroll data
   - Period selection/detection

2. **Build bulk import API** (2 hours)
   - Employee matching algorithm
   - Calculation logic
   - Error handling

3. **Create cost analytics tab** (4-5 hours)
   - Monthly trend chart
   - Cost breakdown visualization
   - Metrics cards
   - Department comparison

4. **Add navigation** (30 min)
   - Add "Employer Costs" tab to dataset analytics
   - Add upload button to dataset actions

5. **Testing & refinement** (2-3 hours)
   - Test with sample payroll data
   - Edge case handling
   - Performance optimization

**Total estimated time**: 10-14 hours for Phase 2 & 3
