# Data Model & Database Schema

## Design Principles

1. **Immutability**: Original uploaded data never modified
2. **Versioning**: Track changes to datasets over time
3. **Flexibility**: Support various org structures and data formats
4. **Performance**: Optimized for read-heavy workloads
5. **Privacy**: Easy to anonymize PII

---

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────────┐
│    datasets     │
└──────┬──────────┘
       │ 1:N
       ├────────────────┬────────────────┬────────────────┐
       │                │                │                │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  employees  │  │ open_roles  │  │  scenarios  │  │  insights   │
└─────────────┘  └─────────────┘  └──────┬──────┘  └─────────────┘
                                         │ 1:N
                                  ┌──────▼──────────┐
                                  │ scenario_results│
                                  └─────────────────┘
```

---

## Core Tables

### 1. users

Managed by Clerk/Supabase Auth, but we track minimal metadata.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,  -- External auth ID
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),  -- '50-100', '100-250', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
```

---

### 2. datasets

Represents one uploaded file and its processed data.

```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
    -- 'processing', 'ready', 'failed', 'archived'

  -- Upload info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,  -- S3/R2 URL
  file_size_bytes INTEGER,
  file_type VARCHAR(50),  -- 'xlsx', 'csv'

  -- Column mapping (JSON)
  column_mapping JSONB,
  -- Example: {"salary": "annual_compensation", "dept": "department"}

  -- Metadata about the organization
  company_name VARCHAR(255),
  total_revenue NUMERIC(15, 2),  -- Optional, for revenue-based metrics
  fiscal_year_start DATE,
  currency VARCHAR(10) DEFAULT 'EUR',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);
```

---

### 3. employees

Normalized employee records from uploaded data.

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,

  -- Identity (optional/anonymizable)
  employee_id VARCHAR(255),  -- From upload, can be anonymized
  employee_name VARCHAR(255),  -- Nullable for privacy
  email VARCHAR(255),  -- Nullable

  -- Organization structure
  department VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  level VARCHAR(100),  -- 'IC', 'Manager', 'Director', 'VP', 'C-Level'
  manager_id UUID REFERENCES employees(id),  -- Self-reference
  cost_center VARCHAR(100),

  -- Employment details
  employment_type VARCHAR(50) NOT NULL DEFAULT 'FTE',
    -- 'FTE', 'Contractor', 'Part-time', 'Intern'
  fte_factor NUMERIC(3, 2) NOT NULL DEFAULT 1.0,  -- 0.5 for part-time
  location VARCHAR(255),

  -- Compensation
  annual_salary NUMERIC(12, 2),
  bonus NUMERIC(12, 2),
  equity_value NUMERIC(12, 2),
  total_compensation NUMERIC(12, 2),  -- Calculated or uploaded

  -- Dates
  start_date DATE,
  end_date DATE,  -- For departures or planned exits

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_dataset_id ON employees(dataset_id);
CREATE INDEX idx_employees_department ON employees(dataset_id, department);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_employment_type ON employees(employment_type);
```

**Normalization:**
- Department names normalized: "Engineering" = "R&D", "Sales" = "GTM"
- Role levels inferred from keywords: "Senior", "Lead", "Manager", "Director"

---

### 4. open_roles

Planned hires or open positions.

```sql
CREATE TABLE open_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,

  -- Role details
  role_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  level VARCHAR(100),

  -- Compensation
  planned_salary_min NUMERIC(12, 2),
  planned_salary_max NUMERIC(12, 2),
  planned_total_comp NUMERIC(12, 2),

  -- Timing
  planned_start_date DATE,
  planned_end_date DATE,  -- For contractors

  -- Status
  status VARCHAR(50) DEFAULT 'open',
    -- 'open', 'offer_extended', 'filled', 'cancelled'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_open_roles_dataset_id ON open_roles(dataset_id);
CREATE INDEX idx_open_roles_department ON open_roles(dataset_id, department);
CREATE INDEX idx_open_roles_status ON open_roles(status);
```

---

### 5. scenarios

What-if scenarios created by users.

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,

  -- Scenario metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
    -- 'freeze_hiring', 'cost_reduction', 'growth', 'target_ratio', 'custom'

  -- Parameters (JSON)
  parameters JSONB NOT NULL,
  -- Examples:
  -- {"reduction_pct": 10, "target_departments": ["R&D", "GTM"]}
  -- {"growth_fte": 20, "distribution": {"R&D": 0.6, "GTM": 0.4}}
  -- {"target_rd_gtm_ratio": 1.0}

  -- Operations (transformation rules)
  operations JSONB NOT NULL,
  -- Example:
  -- [
  --   {"action": "remove", "filter": {"employment_type": "open"}},
  --   {"action": "add", "count": 5, "department": "Sales", "avg_salary": 80000}
  -- ]

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
    -- 'draft', 'calculated', 'archived'
  calculated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenarios_dataset_id ON scenarios(dataset_id);
CREATE INDEX idx_scenarios_type ON scenarios(type);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);
```

---

### 6. scenario_results

Cached calculation results for scenarios.

```sql
CREATE TABLE scenario_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Aggregate metrics (JSONB for flexibility)
  metrics JSONB NOT NULL,
  -- Example:
  -- {
  --   "total_fte": 120,
  --   "total_cost": 15000000,
  --   "cost_per_fte": 125000,
  --   "rd_gtm_ratio": 1.1,
  --   "departments": {
  --     "R&D": {"fte": 60, "cost": 9000000},
  --     "GTM": {"fte": 40, "cost": 4500000}
  --   }
  -- }

  -- Comparison to baseline
  delta JSONB,
  -- Example:
  -- {
  --   "fte_change": -10,
  --   "cost_savings": 1200000,
  --   "ratio_change": -0.05
  -- }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenario_results_scenario_id ON scenario_results(scenario_id);
```

**Why separate table?**
- Cache heavy calculations
- Historical tracking
- Avoid recalculating every time

---

### 7. insights

AI-generated or rule-based recommendations.

```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,  -- Nullable

  -- Insight details
  rule_id VARCHAR(100),  -- e.g., 'rd_gtm_ratio_high'
  category VARCHAR(50) NOT NULL,
    -- 'cost', 'structure', 'efficiency', 'risk'
  severity VARCHAR(20) NOT NULL,
    -- 'low', 'medium', 'high', 'critical'

  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Supporting data
  metrics JSONB,
  -- Example: {"current_ratio": 1.4, "benchmark_median": 1.0}

  -- Recommendations
  suggested_actions JSONB,
  -- Example: ["Increase GTM headcount by 10 FTE", "Reduce open R&D roles"]

  -- Metadata
  generated_by VARCHAR(50) DEFAULT 'rule',
    -- 'rule', 'llm', 'hybrid'
  confidence_score NUMERIC(3, 2),  -- 0.0 to 1.0

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_dataset_id ON insights(dataset_id);
CREATE INDEX idx_insights_scenario_id ON insights(scenario_id);
CREATE INDEX idx_insights_severity ON insights(severity);
CREATE INDEX idx_insights_category ON insights(category);
```

---

### 8. benchmarks

Industry benchmark data (static for MVP, dynamic post-MVP).

```sql
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segment filters
  industry VARCHAR(100) NOT NULL,  -- 'saas_b2b', 'fintech', 'ecommerce'
  company_size VARCHAR(50) NOT NULL,  -- '50-100', '100-250', '250-500'
  growth_stage VARCHAR(50),  -- 'seed', 'series_a', 'series_b', 'growth'
  region VARCHAR(50),  -- 'north_america', 'europe', 'global'

  -- Benchmark metrics (JSONB for flexibility)
  metrics JSONB NOT NULL,
  -- Example:
  -- {
  --   "rd_gtm_ratio": {"min": 0.8, "p25": 0.9, "median": 1.0, "p75": 1.2, "max": 1.5},
  --   "revenue_per_fte": {"p25": 150000, "median": 200000, "p75": 300000},
  --   "span_of_control": {"min": 4, "median": 6, "max": 10}
  -- }

  -- Data source
  source VARCHAR(255),  -- 'openview_2024', 'saas_capital_2024', 'scleorg_aggregate'
  sample_size INTEGER,  -- How many companies in benchmark

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_segment ON benchmarks(industry, company_size);
CREATE INDEX idx_benchmarks_active ON benchmarks(active);
```

---

## Supporting Tables

### 9. calculation_cache

Cache expensive calculations (optional, can use Redis instead).

```sql
CREATE TABLE calculation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,

  cache_key VARCHAR(255) NOT NULL UNIQUE,
  -- Example: 'metrics:dataset:abc123' or 'comparison:scenario:xyz789'

  result JSONB NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculation_cache_key ON calculation_cache(cache_key);
CREATE INDEX idx_calculation_cache_expires ON calculation_cache(expires_at);
```

**Alternative:** Use Redis with TTL instead (recommended for MVP).

---

### 10. audit_logs

Track all user actions for security and debugging.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action VARCHAR(100) NOT NULL,
    -- 'dataset.upload', 'scenario.create', 'insights.generate', 'export.pdf'
  resource_type VARCHAR(50),  -- 'dataset', 'scenario', 'employee'
  resource_id UUID,

  metadata JSONB,  -- Additional context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Views (Materialized for Performance)

### Department Summary View

```sql
CREATE MATERIALIZED VIEW department_summary AS
SELECT
  dataset_id,
  department,
  COUNT(*) FILTER (WHERE employment_type = 'FTE') AS fte_count,
  SUM(fte_factor) AS total_fte,
  SUM(total_compensation) AS total_cost,
  AVG(total_compensation) AS avg_compensation,
  COUNT(DISTINCT manager_id) AS manager_count
FROM employees
WHERE end_date IS NULL OR end_date > CURRENT_DATE
GROUP BY dataset_id, department;

CREATE UNIQUE INDEX idx_department_summary ON department_summary(dataset_id, department);
```

**Refresh Strategy:** Refresh after each dataset update.

---

### Employee Hierarchy View

```sql
CREATE MATERIALIZED VIEW employee_hierarchy AS
WITH RECURSIVE hierarchy AS (
  -- Base case: employees without managers (C-level)
  SELECT
    id,
    dataset_id,
    employee_id,
    employee_name,
    department,
    role,
    manager_id,
    0 AS depth,
    ARRAY[id] AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive case: employees with managers
  SELECT
    e.id,
    e.dataset_id,
    e.employee_id,
    e.employee_name,
    e.department,
    e.role,
    e.manager_id,
    h.depth + 1,
    h.path || e.id
  FROM employees e
  INNER JOIN hierarchy h ON e.manager_id = h.id
)
SELECT * FROM hierarchy;

CREATE INDEX idx_employee_hierarchy_dataset ON employee_hierarchy(dataset_id);
```

**Use Case:** Span of control analysis, org chart generation.

---

## Data Validation Rules

### At Upload

1. **Required Fields:**
   - `department`
   - `annual_salary` OR `total_compensation`
   - `employment_type`

2. **Validation Rules:**
   - Salary > 0
   - FTE factor between 0.1 and 1.0
   - Start date <= End date (if both provided)
   - No circular manager references

3. **Warnings (not errors):**
   - Unusually high/low salaries (> 3 std dev)
   - Missing manager_id (except for C-level)
   - Department name doesn't match standard list

---

## Data Normalization

### Department Mapping

Standard categories:
- **R&D**: Engineering, Product, Design, Data
- **GTM**: Sales, Marketing, Customer Success, Partnerships
- **G&A**: Finance, HR, Legal, IT, Admin
- **Operations**: Logistics, Manufacturing, Supply Chain

```sql
-- Example normalization function
CREATE OR REPLACE FUNCTION normalize_department(dept TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN dept ILIKE '%eng%' OR dept ILIKE '%product%' OR dept ILIKE '%design%' THEN 'R&D'
    WHEN dept ILIKE '%sales%' OR dept ILIKE '%market%' OR dept ILIKE '%customer%' THEN 'GTM'
    WHEN dept ILIKE '%finance%' OR dept ILIKE '%hr%' OR dept ILIKE '%legal%' THEN 'G&A'
    WHEN dept ILIKE '%ops%' OR dept ILIKE '%logistics%' THEN 'Operations'
    ELSE 'Other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Privacy & Anonymization

### PII Fields

Identifiable:
- `employee_name`
- `email`
- `employee_id` (sometimes)

### Anonymization Strategy

```sql
-- Function to anonymize employee data
CREATE OR REPLACE FUNCTION anonymize_employee(emp_id UUID)
RETURNS VOID AS $$
UPDATE employees
SET
  employee_name = 'Employee ' || SUBSTRING(id::TEXT, 1, 8),
  email = NULL,
  employee_id = 'EMP_' || SUBSTRING(id::TEXT, 1, 8)
WHERE id = emp_id;
$$ LANGUAGE sql;
```

**MVP Implementation:**
- Offer "Anonymize on Upload" checkbox
- Hash sensitive fields with dataset-specific salt
- Store original data encrypted (if user opts in)

---

## Migrations Strategy

### Tool: Prisma Migrate (TypeScript) or Alembic (Python)

**Initial Migration:**
```bash
# Create all tables
prisma migrate dev --name init

# Seed benchmark data
prisma db seed
```

**Ongoing:**
- Version all migrations
- Never modify existing migrations
- Test migrations on copy of production data

---

## Sample Data Structure

### Dataset Upload Example

```json
{
  "dataset": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Q1 2025 Headcount",
    "company_name": "Acme Corp",
    "total_revenue": 50000000,
    "currency": "EUR"
  },
  "employees": [
    {
      "employee_id": "E001",
      "name": "Jane Doe",
      "department": "Engineering",
      "role": "Senior Software Engineer",
      "manager_id": "E100",
      "employment_type": "FTE",
      "fte_factor": 1.0,
      "annual_salary": 120000,
      "total_compensation": 150000,
      "start_date": "2023-03-15"
    }
  ],
  "open_roles": [
    {
      "role_name": "Sales Manager",
      "department": "Sales",
      "planned_salary_min": 100000,
      "planned_salary_max": 130000,
      "planned_start_date": "2025-04-01"
    }
  ]
}
```

---

## Performance Optimization

### Indexes

All foreign keys indexed by default.

Additional indexes:
- Composite: `(dataset_id, department)` on employees
- Partial: `WHERE status = 'ready'` on datasets
- GIN: `column_mapping` JSONB field

### Query Patterns

**Most common queries:**
1. Get all employees for dataset
2. Calculate department totals
3. Compare to benchmarks
4. Scenario transformations

**Optimization:**
- Materialized views for aggregations
- Redis cache for calculation results
- Batch inserts for uploads

---

## Database Sizing Estimates

### MVP (100 users, avg 200 employees each)

- employees: ~20,000 rows
- datasets: ~100 rows
- scenarios: ~500 rows
- insights: ~2,000 rows

**Storage:** < 100 MB

### Post-MVP (1,000 users)

- employees: ~200,000 rows
- datasets: ~1,000 rows
- scenarios: ~5,000 rows

**Storage:** ~500 MB - 1 GB

**Query Performance:** < 100ms for most queries with proper indexing.

---

**Data Model Version**: 1.0
**Last Updated**: 2025-11-29
**Schema Review**: After 50 datasets uploaded
