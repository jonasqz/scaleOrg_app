# Benchmark System Architecture

## Overview
This document outlines the complete architecture for ScaleOrg's benchmark system, including compensation data, organizational metrics, and admin tools for managing third-party benchmark data.

**Last Updated:** 2025-12-07
**Status:** Planning & Design Phase

---

## Table of Contents
1. [System Goals](#system-goals)
2. [Benchmark Types](#benchmark-types)
3. [Database Schema](#database-schema)
4. [Data Sources](#data-sources)
5. [Admin Interface](#admin-interface)
6. [User-Facing Features](#user-facing-features)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Privacy & Compliance](#privacy--compliance)

---

## System Goals

### Primary Objectives
1. **Comprehensive Benchmarking:** Support salary AND organizational metrics benchmarks
2. **Multi-Source Data:** Combine crowdsourced, third-party, and manual benchmark data
3. **Date Awareness:** Track when benchmark data was collected and when it expires
4. **Admin Control:** Enable easy entry and management of benchmark data
5. **User Trust:** Show data sources, recency, and quality indicators

### Success Metrics
- **Coverage:** 80%+ of roles have benchmark data
- **Recency:** 90%+ of benchmarks updated within last 12 months
- **Accuracy:** User feedback rating >4.5/5 on benchmark relevance
- **Usage:** 70%+ of users actively compare against benchmarks

---

## Benchmark Types

### 1. Compensation Benchmarks
**What:** Salary, bonus, equity, total compensation data

**Dimensions:**
- Role Family (Engineering, Sales, Product, Marketing, etc.)
- Standardized Title (Software Engineer, Account Executive, etc.)
- Seniority Level (Junior, Mid, Senior, Lead, Director, VP, C-Level)
- Industry (SaaS, Fintech, Climate Tech, E-commerce, etc.)
- Region (DACH, EU, US, UK, APAC, etc.)
- Company Size (1-50, 51-200, 201-500, 501-1000, 1000+)

**Metrics:**
- Base Salary (p10, p25, p50, p75, p90)
- Total Compensation (p10, p25, p50, p75, p90)
- Bonus/Variable (p10, p25, p50, p75, p90)
- Equity Value (p10, p25, p50, p75, p90)

**Data Sources:**
- Crowdsourced (customer opt-in)
- Third-party APIs (Pave, Levels.fyi, Radford)
- Manual entry (industry reports, surveys)

---

### 2. Organizational Structure Benchmarks
**What:** Team composition, ratios, and organizational design metrics

**Metrics:**

#### Team Ratios
- **R&D to GTM Ratio**
  - Industry: SaaS, Fintech, etc.
  - Growth Stage: Seed, Series A-D, Growth, Mature
  - Example: SaaS Series B median = 2.3 (2.3 R&D per 1 GTM)

- **Manager to IC Ratio**
  - By Department: Engineering, Sales, Product
  - By Company Size: 51-200, 201-500, etc.
  - Example: Engineering median = 0.15 (1 manager per 6-7 ICs)

- **Leadership Ratio**
  - % of total headcount that is Director+
  - % of total headcount that is C-Level
  - Example: Tech companies median = 8% leadership

#### Span of Control
- **Average Span of Control**
  - By Level: Manager, Senior Manager, Director, VP
  - By Department: Engineering, Sales, Operations
  - Example: Engineering Manager median = 6.5 direct reports

- **Recommended Ranges**
  - Min/Max span by role type
  - Red flags for span <3 or >12

#### Department Distribution
- **FTE per Department**
  - % in Engineering, Sales, Marketing, CS, G&A, Operations
  - By Industry: SaaS vs Fintech vs E-commerce
  - By Company Size: How teams scale
  - Example: SaaS 51-200 median = 40% Engineering, 25% GTM, 15% G&A, 20% Other

- **Cost per Department**
  - % of total cost per department
  - How cost distribution differs from FTE distribution
  - Example: Engineering may be 40% FTE but 50% cost (higher salaries)

---

### 3. Efficiency & Productivity Benchmarks
**What:** Revenue, output, and efficiency metrics

**Metrics:**

#### Revenue Metrics
- **Revenue per FTE (Total)**
  - By Industry: SaaS, Fintech, E-commerce
  - By Growth Stage: Early vs Growth vs Mature
  - Example: SaaS Growth Stage median = €180k revenue per FTE

- **Revenue per Engineering FTE**
  - Measures engineering productivity/efficiency
  - By Product Type: B2B SaaS, Consumer, etc.
  - Example: B2B SaaS median = €450k per eng FTE

- **Revenue per Sales FTE**
  - Sales productivity metric
  - By Market Segment: SMB, Mid-Market, Enterprise
  - Example: Enterprise SaaS median = €1.2M per sales FTE

- **Revenue per Marketing FTE**
  - Marketing efficiency metric
  - By GTM Motion: Product-Led Growth vs Sales-Led
  - Example: PLG median = €800k per marketing FTE

#### Cost Metrics
- **Cost per FTE**
  - Total annual cost per employee
  - By Department (Engineering typically higher)
  - Example: Engineering median = €95k, Sales = €85k, G&A = €70k

- **Engineering Cost as % of Revenue**
  - How much of revenue goes to R&D
  - By Growth Stage: Early stage higher %
  - Example: Series B SaaS median = 25-30%

#### Customer Metrics
- **Customer Success FTE per $1M ARR**
  - CS team sizing benchmark
  - By Product Complexity: Simple vs Complex products
  - Example: Enterprise SaaS median = 1 CS per $2M ARR

- **Support FTE per 1000 Customers**
  - Support team sizing
  - By Support Model: Self-service vs High-touch
  - Example: B2B SaaS median = 1 support per 500 customers

---

### 4. Tenure & Retention Benchmarks
**What:** Employee lifecycle and retention metrics

**Metrics:**

#### Tenure
- **Average Tenure by Level**
  - IC: 2.5 years median
  - Manager: 3.2 years median
  - Director+: 4.1 years median
  - By Department: Engineering vs Sales differences

- **Average Tenure by Department**
  - Engineering: 3.1 years median
  - Sales: 2.3 years median
  - G&A: 3.8 years median

#### Retention & Attrition
- **Annual Attrition Rate**
  - Voluntary vs Involuntary
  - By Department: Sales typically higher
  - Example: SaaS median = 15% voluntary, 5% involuntary

- **1-Year Retention Rate**
  - % of new hires still at company after 1 year
  - By Department and Level
  - Example: Engineering median = 85%

#### Career Progression
- **Time to Promotion**
  - IC → Senior: 2-3 years median
  - Senior → Lead: 3-4 years median
  - Manager → Senior Manager: 2.5-3.5 years median

---

## Database Schema

### 1. CompensationBenchmark (Already Exists)
**Purpose:** Store salary and total comp percentile data

```prisma
model CompensationBenchmark {
  id                String   @id @default(uuid())

  // Role identification
  roleFamily        String   @map("role_family")              // "Engineering"
  standardizedTitle String   @map("standardized_title")       // "Software Engineer"
  seniorityLevel    String   @map("seniority_level")          // "Senior"

  // Market segmentation
  industry          String                                    // "SaaS", "Fintech", "Climate Tech"
  region            String                                    // "DACH", "EU", "US"
  companySize       String   @map("company_size")             // "51-200", "201-500"

  // Percentile data for total compensation (anonymized)
  p10TotalComp      Decimal? @map("p10_total_comp") @db.Decimal(12, 2)
  p25TotalComp      Decimal? @map("p25_total_comp") @db.Decimal(12, 2)
  p50TotalComp      Decimal? @map("p50_total_comp") @db.Decimal(12, 2)  // Median
  p75TotalComp      Decimal? @map("p75_total_comp") @db.Decimal(12, 2)
  p90TotalComp      Decimal? @map("p90_total_comp") @db.Decimal(12, 2)

  // Percentile data for base salary (anonymized)
  p10BaseSalary     Decimal? @map("p10_base_salary") @db.Decimal(12, 2)
  p25BaseSalary     Decimal? @map("p25_base_salary") @db.Decimal(12, 2)
  p50BaseSalary     Decimal? @map("p50_base_salary") @db.Decimal(12, 2)
  p75BaseSalary     Decimal? @map("p75_base_salary") @db.Decimal(12, 2)
  p90BaseSalary     Decimal? @map("p90_base_salary") @db.Decimal(12, 2)

  // Quality & recency indicators
  sampleSize        Int      @map("sample_size")              // 127 data points
  currency          String                                    // "EUR", "USD"
  effectiveDate     DateTime @map("effective_date")           // When data was collected
  expirationDate    DateTime? @map("expiration_date")         // When data expires/needs refresh
  lastVerified      DateTime? @map("last_verified")           // Last quality check date

  // Data source tracking
  dataSource        String   @default("customer_crowdsourced") @map("data_source")
  sourceId          String?  @map("source_id")                // FK to BenchmarkSource
  confidenceLevel   String?  @map("confidence_level")         // "High", "Medium", "Low"

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@unique([roleFamily, standardizedTitle, seniorityLevel, industry, region, companySize, effectiveDate])
  @@index([roleFamily, seniorityLevel])
  @@index([industry, region])
  @@index([effectiveDate])
  @@map("compensation_benchmarks")
}
```

---

### 2. OrganizationalBenchmark (NEW)
**Purpose:** Store organizational metrics, ratios, and efficiency data

```prisma
model OrganizationalBenchmark {
  id              String   @id @default(uuid())

  // Segmentation dimensions
  industry        String                    // "SaaS", "Fintech", "E-commerce", "Climate Tech"
  region          String                    // "DACH", "EU", "US", "UK", "Global"
  companySize     String   @map("company_size")  // "1-50", "51-200", "201-500", "501-1000", "1000+"
  growthStage     String?  @map("growth_stage")  // "Seed", "Series A", "Series B-D", "Growth", "Mature", "Public"

  // Benchmark metric identification
  metricType      String   @map("metric_type")   // "rdToGTMRatio", "spanOfControl", "revenuePerFTE", etc.
  metricCategory  String   @map("metric_category") // "Structure", "Efficiency", "Distribution", "Retention"
  metricName      String   @map("metric_name")   // Human-readable: "R&D to GTM Ratio"
  metricDescription String? @map("metric_description")

  // Percentile values (some metrics may not have full distribution)
  p10Value        Decimal? @map("p10_value") @db.Decimal(12, 2)
  p25Value        Decimal? @map("p25_value") @db.Decimal(12, 2)
  p50Value        Decimal  @map("p50_value") @db.Decimal(12, 2)   // Median (required)
  p75Value        Decimal? @map("p75_value") @db.Decimal(12, 2)
  p90Value        Decimal? @map("p90_value") @db.Decimal(12, 2)

  // Metric metadata
  unit            String?                   // "ratio", "€", "people", "%", "years", "count"
  targetRange     Json?    @map("target_range")   // { "min": 1.8, "max": 3.2, "ideal": 2.5 }

  // Quality & recency indicators
  sampleSize      Int      @map("sample_size")
  effectiveDate   DateTime @map("effective_date")     // When data was collected/surveyed
  expirationDate  DateTime? @map("expiration_date")   // When benchmark becomes stale
  lastVerified    DateTime? @map("last_verified")     // Last quality verification

  // Data source tracking
  dataSource      String   @map("data_source")        // "Pave", "Manual", "Crowdsourced", "Industry Report"
  sourceId        String?  @map("source_id")          // FK to BenchmarkSource
  sourceName      String?  @map("source_name")        // e.g., "2024 SaaS Metrics Report"
  confidenceLevel String?  @map("confidence_level")   // "High", "Medium", "Low"

  // Additional context
  notes           String?                             // Any additional context or caveats
  tags            String[] @default([])               // For filtering: ["popular", "critical", "new"]

  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([metricType, industry, region, companySize, growthStage, effectiveDate])
  @@index([metricType, industry, region])
  @@index([metricCategory])
  @@index([effectiveDate])
  @@index([isActive])
  @@map("organizational_benchmarks")
}
```

**Metric Types (metricType field):**
- Structure: `rdToGTMRatio`, `managerToICRatio`, `leadershipRatio`, `avgSpanOfControl`
- Distribution: `ftePercentEngineering`, `ftePercentSales`, `ftePercentGA`, `costPercentEngineering`
- Efficiency: `revenuePerFTE`, `revenuePerEngFTE`, `revenuePerSalesFTE`, `revenuePerMarketingFTE`, `costPerFTE`
- Customer: `cssFTEPerARR`, `supportFTEPerCustomer`
- Retention: `avgTenure`, `avgTenureByLevel`, `annualAttrition`, `oneYearRetention`, `timeToPromotion`

---

### 3. BenchmarkSource (NEW)
**Purpose:** Track and manage third-party data sources

```prisma
model BenchmarkSource {
  id              String   @id @default(uuid())

  // Source identification
  sourceName      String   @map("source_name")       // "Pave", "Levels.fyi", "2024 SaaS Metrics Report"
  sourceType      String   @map("source_type")       // "API", "Manual", "Report", "Crowdsourced", "Survey"
  category        String?                            // "Compensation", "Organizational", "Both"

  // Reliability & quality
  reliability     String                             // "High", "Medium", "Low"
  trustScore      Int?     @map("trust_score")       // 0-100 internal quality score

  // API integration details (if applicable)
  apiEndpoint     String?  @map("api_endpoint")
  apiKey          String?  @map("api_key")           // Encrypted
  apiDocUrl       String?  @map("api_doc_url")
  lastSyncedAt    DateTime? @map("last_synced_at")
  syncFrequency   String?  @map("sync_frequency")    // "Daily", "Weekly", "Monthly", "Quarterly", "Manual"
  autoSync        Boolean  @default(false) @map("auto_sync")

  // Coverage information
  industries      String[] @default([])              // Which industries covered
  regions         String[] @default([])              // Which regions covered
  metricTypes     String[] @default([]) @map("metric_types")  // Which metrics provided
  companySizes    String[] @default([]) @map("company_sizes") // Which company sizes covered

  // Metadata & contact
  website         String?
  contactEmail    String?  @map("contact_email")
  contactName     String?  @map("contact_name")
  licenseType     String?  @map("license_type")      // "Free", "Paid", "Partnership"
  costPerYear     Decimal? @map("cost_per_year") @db.Decimal(10, 2)

  // Admin notes
  notes           String?                            // Internal notes about this source
  integrationNotes String? @map("integration_notes") // Technical details about integration

  // Status
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  createdBy       String?  @map("created_by")        // Admin user who added this

  @@index([sourceType, isActive])
  @@index([reliability])
  @@map("benchmark_sources")
}
```

---

### 4. BenchmarkAuditLog (NEW)
**Purpose:** Track all changes to benchmark data

```prisma
model BenchmarkAuditLog {
  id              String   @id @default(uuid())

  // What changed
  benchmarkType   String   @map("benchmark_type")    // "compensation", "organizational"
  benchmarkId     String   @map("benchmark_id")      // ID of the benchmark record
  action          String                             // "created", "updated", "deleted", "verified", "deprecated"

  // Who changed it
  userId          String?  @map("user_id")           // Admin user ID
  userName        String?  @map("user_name")         // For display

  // Change details
  changesSummary  String?  @map("changes_summary")   // Brief description
  oldValues       Json?    @map("old_values")        // Previous state (for updates)
  newValues       Json?    @map("new_values")        // New state

  // Context
  reason          String?                            // Why this change was made
  sourceId        String?  @map("source_id")         // Which data source (if applicable)

  createdAt       DateTime @default(now()) @map("created_at")

  @@index([benchmarkType, benchmarkId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("benchmark_audit_logs")
}
```

---

## Data Sources

### Current Sources (Implemented)
1. **Customer Crowdsourcing** (Primary)
   - Opt-in during employee add/CSV import
   - Anonymized and aggregated
   - Real-time updates

### Third-Party Sources (Planned)

#### Compensation Data
1. **Pave** (https://www.pave.com)
   - API: Yes (enterprise)
   - Coverage: US, UK, EU tech companies
   - Metrics: Compensation, equity
   - Cost: $$$ (Estimated €10k-50k/year)

2. **Levels.fyi** (https://www.levels.fyi)
   - API: Limited
   - Coverage: Global tech companies
   - Metrics: Total comp by level
   - Cost: Public data (free) + paid access

3. **Radford** (https://radford.aon.com)
   - API: No (report-based)
   - Coverage: Global, all industries
   - Metrics: Comprehensive comp data
   - Cost: $$$$ (Survey participation model)

4. **Figures** (https://figur.es - European focus)
   - API: Unknown
   - Coverage: DACH, EU
   - Metrics: Compensation
   - Cost: TBD

#### Organizational Metrics
1. **OpenView SaaS Benchmarks** (Free reports)
   - API: No (manual entry from reports)
   - Coverage: SaaS companies
   - Metrics: R&D ratio, GTM efficiency
   - Cost: Free

2. **Battery Ventures Metrics**
   - API: No (manual)
   - Coverage: B2B SaaS
   - Metrics: Go-to-market efficiency
   - Cost: Free (public reports)

3. **KeyBanc SaaS Survey** (Annual)
   - API: No (manual)
   - Coverage: Public & private SaaS
   - Metrics: Organizational structure, efficiency
   - Cost: Free (public)

4. **SaaStr Annual Reports**
   - API: No (manual)
   - Coverage: SaaS
   - Metrics: Team composition, ratios
   - Cost: Free

### Data Collection Strategy

**Phase 1: Manual Entry**
- Admin manually enters data from free reports
- Focus on high-value metrics (R&D:GTM, Revenue/FTE)
- Update quarterly

**Phase 2: API Integration**
- Integrate Pave or similar (if budget allows)
- Automated sync for compensation data
- Monthly updates

**Phase 3: Crowdsourcing**
- Build customer base to 100+ companies
- Anonymized data aggregation
- Real-time benchmarks

---

## Admin Interface

### Dashboard Overview
**Purpose:** Central hub for benchmark management

**Key Sections:**
1. **Benchmark Coverage Overview**
   - Total benchmarks by type
   - Coverage gaps visualization
   - Data recency status (% updated in last 6 months)
   - Quality score distribution

2. **Recent Activity Feed**
   - Latest benchmark updates
   - Data expiration warnings
   - Quality issues flagged

3. **Quick Actions**
   - Add new benchmark
   - Bulk import
   - Sync from API sources
   - View audit log

---

### Benchmark List View
**Purpose:** Browse and manage all benchmarks

**Features:**
- **Filters:**
  - Benchmark type (Compensation, Organizational)
  - Industry, Region, Company Size
  - Data source
  - Effective date range
  - Quality/confidence level
  - Active/Expired status

- **Columns:**
  - Metric name
  - Industry/Region/Size
  - Median value (p50)
  - Sample size
  - Effective date
  - Data source
  - Status (Active, Expiring Soon, Expired)
  - Actions (Edit, Deprecate, View History)

- **Bulk Actions:**
  - Bulk deprecate (expire old data)
  - Bulk update source
  - Export to CSV

---

### Add/Edit Benchmark Form

#### Compensation Benchmark Form
**Sections:**

1. **Role Information**
   - Role Family (dropdown)
   - Standardized Title (autocomplete)
   - Seniority Level (dropdown)

2. **Market Segmentation**
   - Industry (dropdown)
   - Region (dropdown)
   - Company Size (dropdown)

3. **Compensation Data**
   - Currency (dropdown)
   - Base Salary Percentiles (p10, p25, p50, p75, p90)
   - Total Comp Percentiles (p10, p25, p50, p75, p90)
   - Bonus/Variable Percentiles (optional)

4. **Metadata**
   - Effective Date (date picker) **REQUIRED**
   - Expiration Date (date picker) - suggested: +12 months
   - Sample Size (number)
   - Data Source (dropdown + add new)
   - Confidence Level (High/Medium/Low)
   - Notes (textarea)

5. **Preview & Submit**
   - Show formatted preview
   - Validation warnings
   - Submit button

#### Organizational Benchmark Form
**Sections:**

1. **Market Segmentation**
   - Industry (dropdown)
   - Region (dropdown)
   - Company Size (dropdown)
   - Growth Stage (dropdown)

2. **Metric Selection**
   - Metric Category (dropdown: Structure, Efficiency, Distribution, Retention)
   - Metric Type (dropdown: populated based on category)
   - Metric Name (auto-filled from type)
   - Unit (auto-filled or custom)

3. **Benchmark Values**
   - P50/Median Value (required)
   - P10, P25, P75, P90 Values (optional)
   - Target Range (min/max/ideal) - optional

4. **Metadata**
   - Effective Date (date picker) **REQUIRED**
   - Expiration Date (date picker)
   - Sample Size (number)
   - Data Source (dropdown + add new)
   - Source Name (text - e.g., "2024 SaaS Metrics Report")
   - Confidence Level (High/Medium/Low)
   - Notes (textarea)

5. **Preview & Submit**

---

### Bulk Import Tool
**Purpose:** Import multiple benchmarks from CSV/Excel

**Features:**
1. **Template Download**
   - Separate templates for Compensation vs Organizational
   - Pre-filled with example data
   - Column descriptions

2. **File Upload**
   - Support CSV, XLSX
   - Drag-and-drop interface
   - File validation

3. **Mapping Review**
   - Auto-detect columns
   - Manual column mapping if needed
   - Preview first 10 rows

4. **Validation**
   - Check for required fields
   - Validate data types
   - Flag duplicates
   - Show warnings/errors

5. **Import Options**
   - Skip duplicates vs Update duplicates
   - Set default source for all rows
   - Set default effective date
   - Dry run mode (preview only)

6. **Results Summary**
   - X records imported successfully
   - Y records skipped (duplicates)
   - Z records failed (with error details)
   - Download error log

**CSV Template Example (Organizational):**
```csv
Industry,Region,CompanySize,GrowthStage,MetricType,P50Value,Unit,EffectiveDate,SampleSize,DataSource
SaaS,EU,51-200,Series B,rdToGTMRatio,2.3,ratio,2024-10-01,127,OpenView Report 2024
SaaS,EU,51-200,Series B,revenuePerFTE,180000,€,2024-10-01,127,OpenView Report 2024
Fintech,US,201-500,Growth,spanOfControl,6.5,people,2024-09-01,85,Manual Entry
```

---

### Data Source Management
**Purpose:** Manage third-party data sources

**Features:**
1. **Source List**
   - Name, Type, Reliability
   - Last synced, Sync frequency
   - Coverage (industries/regions)
   - Status (Active/Inactive)

2. **Add/Edit Source**
   - Basic info (name, type, reliability)
   - API details (endpoint, key, sync frequency)
   - Coverage areas
   - Cost/license info
   - Contact information

3. **API Sync Controls**
   - Manual sync trigger
   - Auto-sync toggle
   - Sync logs/history
   - Error notifications

---

### Audit Log Viewer
**Purpose:** Track all changes to benchmark data

**Features:**
- Filter by date range, user, action type
- View old vs new values for updates
- Export audit trail
- Search by benchmark ID or metric name

---

## User-Facing Features

### Current State (Before Implementation)
❌ All benchmarks show "Benchmark: TBD"
❌ No context about what benchmarks mean
❌ No visibility into data sources or recency

### After Implementation

#### 1. Inline Benchmark Display
**Location:** Analytics tabs, employee detail pages

**Format:**
```
Your Company: €85,000
Industry Median: €90,000 (p50) ✅ Within market range
[View Details] [Compare to Peers]

Data: SaaS companies, 51-200 employees, DACH region (Q4 2024)
Source: Pave + 127 anonymized ScaleOrg customers
```

**Visual Indicators:**
- ✅ Green: Above p50 (competitive)
- ⚠️ Yellow: p25-p50 (acceptable)
- 🔴 Red: Below p25 (below market)
- ℹ️ Blue: Insufficient data

#### 2. Benchmark Detail Modal
**Triggered by:** "View Details" link

**Content:**
- **Distribution Chart:** Show p10, p25, p50, p75, p90 with user's position
- **Your Position:** "You're at the 65th percentile"
- **Context:** Industry, region, company size, effective date
- **Sample Size:** "Based on 127 data points"
- **Data Age:** "Updated Q4 2024" or "⚠️ Data from Q2 2023 - may be outdated"
- **Multiple Sources:** If >1 source, show comparison
- **Recommendations:** "Consider increasing to €95k to reach p75"

#### 3. Benchmark Comparison Table
**Location:** Analytics → Benchmarking Tab

**Format:**
```
Metric                  | Your Company | Industry Median | Your Percentile | Status
------------------------|--------------|-----------------|-----------------|--------
R&D to GTM Ratio       | 3.2          | 2.3 (p50)      | p75             | ✅ Efficient
Revenue per FTE        | €165k        | €180k (p50)    | p40             | ⚠️ Below avg
Avg Span of Control    | 5.2          | 6.5 (p50)      | p30             | ⚠️ Low
Annual Attrition       | 12%          | 15% (p50)      | p40             | ✅ Better
```

#### 4. Data Recency Warnings
**Show when benchmark is >12 months old:**
```
⚠️ Benchmark data from Q2 2023 - may be outdated
Market conditions have likely changed since this data was collected.
Last verified: Never
```

#### 5. Multi-Source Comparison
**When multiple sources exist:**
```
Software Engineer - Senior | SaaS | EU | 51-200 employees

Your Company: €95,000

Benchmarks from multiple sources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pave (Q4 2024):           €92,000 median  [High confidence, n=847]
ScaleOrg Crowdsourced:    €88,000 median  [Medium confidence, n=34]
Levels.fyi (Q3 2024):     €90,000 median  [High confidence, n=1,245]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consensus Median: €90,000

Your compensation is 5.6% above market median ✅
```

#### 6. Benchmark Gaps Notification
**Show when no benchmark available:**
```
ℹ️ No benchmark data available for:
   - Climate Scientist, Senior level
   - Climate Tech industry, EU region

Help us build better benchmarks:
☑ Opt-in to share anonymized compensation data
   Your data will help other companies like yours make better decisions.

[Contribute My Data] [Learn More] [Skip]
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Database schema and basic admin UI

- [ ] Add `OrganizationalBenchmark` model to schema
- [ ] Add `BenchmarkSource` model to schema
- [ ] Add `BenchmarkAuditLog` model to schema
- [ ] Update `CompensationBenchmark` with new fields (effectiveDate, expirationDate, etc.)
- [ ] Run Prisma migration
- [ ] Seed initial benchmark sources (OpenView, Battery, etc.)
- [ ] Create admin route `/admin/benchmarks`
- [ ] Build benchmark list view (read-only)

### Phase 2: Manual Data Entry (Week 3-4)
**Goal:** Enable admins to add benchmark data

- [ ] Build "Add Compensation Benchmark" form
- [ ] Build "Add Organizational Benchmark" form
- [ ] Implement form validation
- [ ] Create audit log entries on add/edit/delete
- [ ] Build benchmark edit capability
- [ ] Add delete/deprecate functionality
- [ ] Test with real benchmark data from reports

### Phase 3: Bulk Import (Week 5-6)
**Goal:** Import benchmark data from CSV/Excel

- [ ] Create CSV templates (Compensation + Organizational)
- [ ] Build file upload UI
- [ ] Implement CSV parsing and validation
- [ ] Add duplicate detection
- [ ] Build import preview/review
- [ ] Add import error handling and logging
- [ ] Test with large datasets (1000+ rows)

### Phase 4: User-Facing Display (Week 7-8)
**Goal:** Show benchmarks to users

- [ ] Update analytics tabs to fetch and display benchmarks
- [ ] Build benchmark detail modal
- [ ] Add benchmark comparison table
- [ ] Implement visual indicators (✅ ⚠️ 🔴)
- [ ] Show data recency warnings
- [ ] Add "no data available" messaging
- [ ] Update all "Benchmark: TBD" placeholders

### Phase 5: Data Quality & Maintenance (Week 9-10)
**Goal:** Tools for keeping data fresh

- [ ] Build data expiration monitoring (alert when >12 months)
- [ ] Create "Review & Verify" workflow for old benchmarks
- [ ] Add benchmark quality scoring
- [ ] Build data coverage dashboard
- [ ] Implement benchmark versioning (update vs replace)
- [ ] Add benchmark deletion protection (soft delete)

### Phase 6: API Integration (Month 3-4)
**Goal:** Automate data from third-party sources

- [ ] Research and select primary API partner (Pave vs others)
- [ ] Build API connector for chosen source
- [ ] Implement automated sync (daily/weekly)
- [ ] Add sync monitoring and alerting
- [ ] Handle API rate limits and errors
- [ ] Build fallback to manual if API fails

### Phase 7: Advanced Features (Month 5-6)
**Goal:** Multi-source aggregation and insights

- [ ] Implement multi-source consensus calculation
- [ ] Build benchmark recommendation engine
- [ ] Add benchmark-based alerts ("You're below market!")
- [ ] Create benchmark trend analysis (how market changed over time)
- [ ] Add predictive benchmarks (project future market rates)
- [ ] Build benchmark API for customers (read-only)

---

## Privacy & Compliance

### Data Collection
**Customer Crowdsourcing:**
- ✅ Explicit opt-in required
- ✅ Clear disclosure of what's shared
- ✅ Ability to opt-out anytime
- ✅ No personally identifiable information (PII) collected

**Third-Party Data:**
- ✅ Ensure proper licensing for redistribution
- ✅ Respect data source terms of service
- ✅ Attribute data sources clearly

### Data Storage
**Anonymization:**
- Store only aggregated percentiles (never individual salaries)
- Minimum 10 data points before publishing benchmark
- No company names, employee names, or identifying info

**GDPR Compliance:**
- Data processing agreement with customers
- Right to deletion (remove contributed data)
- Data portability (export contributed data)
- Privacy policy disclosures

### Data Display
**Transparency:**
- Always show data source
- Always show sample size
- Always show effective date
- Clear confidence indicators

**User Control:**
- Customers can see what data they contributed
- Customers can withdraw contributions
- Customers can report inaccurate benchmarks

---

## Success Criteria

### Data Coverage (6 months post-launch)
- [ ] 100+ compensation benchmarks (role/industry/region combinations)
- [ ] 50+ organizational benchmarks (key metrics like R&D:GTM)
- [ ] 90% of users have at least 3 relevant benchmarks for their context
- [ ] 100% of "critical" metrics have benchmarks (defined list)

### Data Quality (ongoing)
- [ ] 90% of benchmarks updated within last 12 months
- [ ] Average confidence level: "High" or "Medium"
- [ ] Average sample size >30 for compensation, >10 for organizational
- [ ] <5% user-reported inaccuracy rate

### User Engagement (6 months post-launch)
- [ ] 70% of users view at least one benchmark detail
- [ ] 40% of users compare multiple benchmarks
- [ ] 30% of users opt-in to contribute data
- [ ] User satisfaction >4.2/5 on benchmark usefulness

### Admin Efficiency
- [ ] Average time to add benchmark <5 minutes
- [ ] Bulk import success rate >95%
- [ ] Zero critical data quality incidents
- [ ] Monthly admin effort <4 hours (after automation)

---

## Next Steps

### Immediate (This Week)
1. Review and finalize schema design
2. Get stakeholder approval on scope
3. Plan Phase 1 sprint (database + basic admin)
4. Research data sources and licensing

### Short-term (Next 2 Weeks)
1. Implement Phase 1 (database + read-only admin)
2. Manually enter first 10 benchmarks for testing
3. Build basic user-facing display
4. Get early user feedback

### Medium-term (Month 2-3)
1. Complete bulk import tool
2. Enter comprehensive benchmark dataset (100+ benchmarks)
3. Launch to production
4. Monitor usage and quality

---

**Document Version:** 1.0
**Last Updated:** 2025-12-07
**Author:** Claude Code
**Status:** Ready for Implementation
