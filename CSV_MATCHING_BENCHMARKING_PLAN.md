# CSV Matching & Industry Benchmarking Plan

## Overview
This document outlines the roadmap for improving CSV import matching and enabling industry benchmarking capabilities for ScaleOrg.

## Problem Statement
Current challenges with CSV import:
- Mixed language support (German/English column headers)
- Inconsistent role title variations ("Full Stack Developer" vs "Fullstack Developer")
- Non-standard department names ("Trees", "CEO" as departments)
- Varying seniority indicators ("Senior", "Head of", "Chief", "Junior")
- European number formatting (€, comma decimals)
- No standardization for benchmarking against industry standards

## CSV Analysis (Example: Upload People Cost Planning.xlsx)
**Current Structure:**
- German column headers: "Team", "Position", "Startdatum", "Gesamtkosten AG", "Fixgehalt"
- Teams: Sales, Marketing, Product, Tech, CS, Sustainability, Operations, Finance, People, Trees, CEO
- Positions: Mix of English/German titles with varying seniority levels
- Currency: European format with € and comma decimals

---

## Phase 1: Immediate Improvements (1-2 weeks)

### 1.1 Enhanced Auto-Mapping with Fuzzy Matching
**Goal:** Support multilingual CSV imports with intelligent column detection

**Implementation:**
- Add `fuse.js` library for fuzzy string matching
- Create multilingual field mappings for common synonyms
- Handle currency and number format variations (€, commas)

**Column Synonyms:**
```typescript
const COLUMN_SYNONYMS = {
  employeeName: ['name', 'employee', 'mitarbeiter', 'vorname', 'nachname', 'full name'],
  department: ['team', 'department', 'abteilung', 'bereich'],
  role: ['position', 'role', 'title', 'stelle', 'job title'],
  totalCompensation: ['gesamtkosten', 'total comp', 'compensation', 'gehalt'],
  baseSalary: ['fixgehalt', 'base salary', 'grundgehalt', 'basis'],
  bonus: ['bonus', 'prämie', 'variable'],
  startDate: ['startdatum', 'start date', 'hire date', 'einstellungsdatum'],
}
```

### 1.2 Department Standardization Lookup
**Goal:** Map various department names to standardized categories

**Database Schema Addition:**
```prisma
model DepartmentMapping {
  id                String   @id @default(cuid())
  organizationId    String?  // For future multi-tenant support
  originalName      String   // e.g., "Tech", "Engineering", "Dev"
  standardizedName  String   // e.g., "Engineering"
  category          String?  // e.g., "Technology", "Business"
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, originalName])
  @@index([standardizedName])
}
```

**Default Mappings:**
- Tech, Engineering, Dev → Engineering
- CS, Customer Success, Support → Customer Success
- People, HR, Talent → People & Culture
- CEO, Leadership, Executive → Leadership

### 1.3 Role Title Normalization
**Goal:** Extract seniority levels and normalize role titles

**Database Schema Addition:**
```prisma
model RoleMapping {
  id                String   @id @default(cuid())
  organizationId    String?
  originalTitle     String   // e.g., "Senior Full Stack Developer"
  standardizedTitle String   // e.g., "Software Engineer"
  seniorityLevel    String?  // "Junior", "Mid", "Senior", "Lead", "Director", "C-Level"
  roleFamily        String?  // "Engineering", "Sales", "Marketing"
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, originalTitle])
  @@index([standardizedTitle, seniorityLevel])
}
```

**Seniority Extraction Logic:**
- Extract prefixes: "Junior", "Mid", "Senior", "Staff", "Principal", "Lead"
- Extract management levels: "Manager", "Director", "VP", "Chief", "Head of"
- Normalize base title: "Full Stack Developer" → "Software Engineer"

### 1.4 Number Format Parsing
**Goal:** Support European and US number formats

**Implementation:**
- Auto-detect number format from sample data
- Parse "€5.328,69" as 5328.69
- Parse "$5,328.69" as 5328.69
- Store currency type with dataset

---

## Phase 2: Medium-Term Goals (1-2 months)

### 2.1 Role Taxonomy & Data Library System

#### 2.1.1 Dynamic Role Library (Customer-Driven Growth)
**Goal:** Build a self-growing library of job titles from real customer data

**Approach:**
Instead of manually maintaining a static list of job titles, we build a **living library** that learns from every customer interaction:

**How it works:**
1. **Capture on every employee add** (CSV import or manual entry):
   - Original job title (exactly as entered: "Senior Fullstack Engineer")
   - Standardized title (what it maps to: "Software Engineer")
   - Seniority level extracted ("Senior")
   - Role family classified ("Engineering")
   - Context metadata (industry, company size, region)

2. **Library grows organically:**
   - Customer A: "Senior Fullstack Engineer" → saved to library
   - Customer B: "Sr. Full Stack Developer" → saved as variation
   - Customer C: "Senior Fullstack Engineer" → frequency counter +1
   - System learns: All 3 variations = "Software Engineer - Senior"

3. **Matching improves automatically:**
   - New customer uploads "Senior Fullstack Engineer"
   - System finds exact match in library (frequency: 47)
   - Auto-maps with 100% confidence
   - No AI needed for common titles

**Database Schema:**
```prisma
model RoleTitleLibrary {
  id                String   @id @default(uuid())

  // Raw data from customers
  originalTitle     String   @unique // "Senior Fullstack Engineer"

  // Normalized/standardized data
  standardizedTitle String   // "Software Engineer"
  seniorityLevel    String?  // "Senior"
  roleFamily        String?  // "Engineering"

  // Usage tracking
  frequency         Int      @default(1)  // How many times we've seen this exact title
  firstSeenDate     DateTime @default(now())
  lastSeenDate      DateTime @updatedAt

  // Context for better matching
  industries        String[] // ["SaaS", "Fintech", "Climate Tech"]
  regions           String[] // ["EU", "US", "DACH"]
  companySizes      String[] // ["51-200", "201-500"]

  // Quality indicators
  verifiedByUsers   Int      @default(0)  // How many users confirmed this mapping
  reportedIssues    Int      @default(0)  // How many users reported wrong mapping

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([standardizedTitle, seniorityLevel])
  @@index([roleFamily])
  @@index([frequency(sort: Desc)])
}
```

**Benefits:**
- Library starts with 40 seed mappings (from Phase 1)
- Grows to 500+ titles after first 50 customers
- Grows to 5,000+ titles after 500 customers
- Rare/unusual titles still captured (e.g., "Klimaförster")
- Industry-specific variations preserved
- More accurate than any manual list

**Growth Timeline:**
- Month 1: 40 job titles (seed data)
- Month 6: 350 job titles
- Month 12: 1,200 job titles
- Month 24: 5,000+ job titles (near-perfect auto-mapping)

---

#### 2.1.2 Compensation Benchmarking Library (Salary Data Aggregation)
**Goal:** Build an anonymized compensation database from customer data for industry benchmarking

**Approach:**
Instead of buying expensive 3rd-party benchmark data, we **crowdsource compensation data** from our customer base to create more accurate, relevant benchmarks.

**How it works:**
1. **Capture on every employee add** (with customer opt-in):
   - Role title (standardized)
   - Seniority level
   - Total compensation (anonymized)
   - Base salary, bonus, equity (anonymized)
   - Context: industry, company size, region, date

2. **Aggregate to percentiles:**
   - When we have >10 data points for a specific role/context combination
   - Calculate p10, p25, p50 (median), p75, p90
   - Update monthly as new data comes in
   - Never expose individual data points

3. **Customers can use benchmarks:**
   - "How does my Senior Software Engineer salary compare to market?"
   - "Is €85k at p50, p75, or p90 for my region/industry?"
   - "What's the typical range for this role in DACH SaaS companies?"

**Database Schema:**
```prisma
model CompensationBenchmark {
  id                String   @id @default(uuid())

  // Role identification
  roleFamily        String   // "Engineering"
  standardizedTitle String   // "Software Engineer"
  seniorityLevel    String   // "Senior"

  // Market segmentation
  industry          String   // "SaaS", "Fintech", "Climate Tech"
  region            String   // "DACH", "EU", "US"
  companySize       String   // "51-200", "201-500"

  // Percentile data (anonymized)
  p10TotalComp      Float    // €65,000
  p25TotalComp      Float    // €75,000
  p50TotalComp      Float    // €85,000 (median)
  p75TotalComp      Float    // €95,000
  p90TotalComp      Float    // €110,000

  p10BaseSalary     Float
  p25BaseSalary     Float
  p50BaseSalary     Float
  p75BaseSalary     Float
  p90BaseSalary     Float

  // Quality indicators
  sampleSize        Int      // 127 data points
  currency          String   // "EUR"
  lastUpdated       DateTime @updatedAt

  // Data lineage
  dataSource        String   @default("customer_crowdsourced")

  createdAt         DateTime @default(now())

  @@unique([roleFamily, standardizedTitle, seniorityLevel, industry, region, companySize])
  @@index([roleFamily, seniorityLevel])
  @@index([industry, region])
}
```

**Privacy & Compliance:**
- ✅ **Fully anonymized** - no employee names, company names, or identifiable data
- ✅ **Aggregated only** - minimum 10 data points required (prevents reverse-engineering)
- ✅ **GDPR compliant** - customers explicitly opt-in to contribute
- ✅ **Transparent** - customers see exactly what data is shared
- ✅ **Customer control:**
  - Opt-in to contribute their data (help build benchmarks)
  - Use benchmarks even if they don't contribute
  - Opt-out completely (data stays private)

**Opt-in Flow:**
```
During CSV import or employee add:

┌─────────────────────────────────────────────────┐
│ Help improve ScaleOrg benchmarks?               │
│                                                  │
│ ☑ Contribute anonymized compensation data       │
│   to help build industry benchmarks             │
│                                                  │
│ Your data will be:                               │
│ • Fully anonymized (no names/companies)         │
│ • Aggregated with 10+ other companies           │
│ • Used to show market percentiles               │
│                                                  │
│ You'll get access to:                            │
│ • Real-time market compensation data            │
│ • Industry benchmarks for your roles            │
│ • Competitive intelligence                      │
│                                                  │
│ [Learn More] [Skip] [Contribute & Continue]     │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- **More accurate** than 3rd-party data (real-time, specific to your market)
- **More relevant** (your actual customer base, not generic surveys)
- **Cost-effective** (no expensive data licenses)
- **Network effects** (more customers = better benchmarks = more value)
- **Competitive advantage** (unique data set competitors don't have)

**Example Growth:**
- Month 1: 0 benchmarks (need min. 10 data points)
- Month 3: 15 benchmarks (common roles like "Software Engineer - Senior" in SaaS/EU)
- Month 6: 120 benchmarks (most common roles across industries)
- Month 12: 500+ benchmarks (80% role coverage)
- Month 24: 2,000+ benchmarks (near-complete coverage)

---

#### 2.1.3 Intelligent Matching Engine
**Goal:** Use both libraries together to maximize auto-mapping accuracy

**Matching Flow:**
```
1. Customer uploads CSV with role: "Tech Lead - Platform"

2. System searches RoleTitleLibrary:
   ├─ Exact match? "Tech Lead - Platform" (frequency: 5)
   │  └─> Auto-map with 100% confidence ✅
   │
   ├─ Fuzzy match? "Tech Lead" (frequency: 47)
   │  └─> Auto-map with 90% confidence ✅
   │
   ├─ Partial match? "Platform Lead" (frequency: 12)
   │  └─> Suggest with 75% confidence ⚠️
   │
   └─ No match?
      └─> Use AI classification (Phase 2.2) 🤖

3. Customer confirms/corrects mapping

4. System learns:
   - Add "Tech Lead - Platform" → "Engineering Lead" to library
   - Increment frequency counter
   - Next customer gets instant match

5. If compensation data provided + customer opted-in:
   - Add to CompensationBenchmark (anonymized)
   - Update percentiles for "Engineering Lead - Senior" in their segment
```

**Confidence Scoring:**
- **100% (Green):** Exact match in library with frequency >5
- **85-99% (Green):** Fuzzy match with high frequency (>10)
- **70-84% (Yellow):** Partial match or low frequency (3-10)
- **<70% (Red):** AI suggestion only, needs manual review

**Feedback Loop:**
```
Customer Data
  → Library Growth
    → Better Matching
      → Less Manual Work
        → More Customers
          → More Data
            → Better Benchmarks
              → Higher Customer Value 🔄
```

---

### 2.1.4 Role Taxonomy (Static Foundation)
**Goal:** Provide the base structure for categorization

While the library grows dynamically, we still need a **static taxonomy** for the core role families and seniority levels:

**Database Schema:**
```prisma
model RoleTaxonomy {
  id             String   @id @default(cuid())
  roleFamily     String   // "Engineering", "Sales", "Product", "Marketing"
  roleTitle      String   // "Software Engineer", "Account Executive"
  seniorityLevel String   // "IC1", "IC2", "IC3", "M1", "M2", "Director", "VP"
  aliases        String[] // Common variations (for initial seeding)
  description    String?

  @@unique([roleFamily, roleTitle, seniorityLevel])
  @@index([roleFamily])
}
```

**Role Families:**
- Engineering (Software Engineer, Data Engineer, DevOps, QA)
- Product (Product Manager, Designer, UX Researcher)
- Sales (SDR, AE, Account Manager, Sales Engineer)
- Marketing (Content, Growth, Product Marketing, Brand)
- Customer Success (CSM, Support, Implementation)
- Operations (Finance, People, Legal, Admin)
- Leadership (C-Suite, VP, Director)

This provides the **framework** that the dynamic library fills in with real customer data.

### 2.2 ML-Based Role Classification
**Goal:** Automatically suggest role family and seniority

**Implementation:**
- Use OpenAI GPT-4 API for text classification
- Prompt: "Given this job title: '{title}', classify it into role family and seniority level"
- Store confidence scores
- Allow manual override with feedback learning

**API Endpoint:**
```typescript
POST /api/roles/classify
{
  "title": "Senior Full Stack Developer",
  "context": "Tech team, €6,500/month"
}

Response:
{
  "roleFamily": "Engineering",
  "standardizedTitle": "Software Engineer",
  "seniorityLevel": "Senior",
  "confidence": 0.95,
  "suggestions": [...]
}
```

### 2.3 Interactive Mapping UI
**Goal:** Better UX for reviewing and approving mappings

**Features:**
- Show suggested mappings with confidence scores
- Bulk accept/reject similar mappings
- Save mappings for future imports
- Visual preview of normalized data
- "Learn from this mapping" feature
- Conflict resolution for ambiguous roles

**UI Components:**
- Mapping review table with accept/reject buttons
- Confidence score indicators (high/medium/low)
- Bulk operations sidebar
- Mapping history and audit log

---

## Phase 3: Long-Term Architecture (3-6 months)

### 3.1 Industry Benchmark Integration
**Goal:** Enable compensation benchmarking against market data

**Database Schema:**
```prisma
model IndustryBenchmark {
  id                String   @id @default(cuid())
  roleFamily        String
  roleTitle         String
  seniorityLevel    String
  industry          String   // "SaaS", "Fintech", "Climate Tech", "E-commerce"
  region            String   // "EU", "US", "DACH", "UK"
  companySize       String   // "1-50", "51-200", "201-500", "501-1000"

  // Percentile compensation data
  p10Compensation   Float
  p25Compensation   Float
  p50Compensation   Float    // Median
  p75Compensation   Float
  p90Compensation   Float

  currency          String
  effectiveDate     DateTime
  sampleSize        Int
  dataSource        String   // "Pave", "Levels.fyi", "Radford"

  createdAt         DateTime @default(now())

  @@unique([roleFamily, roleTitle, seniorityLevel, industry, region, companySize, effectiveDate])
  @@index([roleFamily, seniorityLevel])
  @@index([industry, region])
}
```

**Data Sources (to research):**
- Pave (compensation benchmarking platform)
- Levels.fyi (tech compensation data)
- Radford (global compensation surveys)
- Custom industry surveys
- Public company compensation disclosures

### 3.2 Automated Normalization Pipeline
**Goal:** Background processing for role/department standardization

**Features:**
- Background job to process new employees
- Auto-suggest mappings based on historical data
- Flag outliers and anomalies for review
- Batch processing API
- Webhook notifications for review needed
- Full audit trail

**Implementation:**
```typescript
// Background job (cron or queue-based)
async function normalizeEmployeeData() {
  const unnormalizedEmployees = await findEmployeesNeedingNormalization();

  for (const employee of unnormalizedEmployees) {
    const departmentMapping = await findOrSuggestDepartmentMapping(employee.department);
    const roleMapping = await findOrSuggestRoleMapping(employee.role);

    if (departmentMapping.confidence > 0.8 && roleMapping.confidence > 0.8) {
      await applyNormalization(employee, { departmentMapping, roleMapping });
    } else {
      await flagForManualReview(employee);
    }
  }
}
```

### 3.3 Analytics & Insights Dashboard
**Goal:** Provide actionable compensation and org insights

**Features:**
- **Compensation Benchmarking:**
  - Compare company comp to industry percentiles
  - Identify under/over-paid roles
  - Pay equity analysis by department/level

- **Role Distribution:**
  - Org chart visualization
  - Seniority distribution (IC vs Manager ratio)
  - Department headcount trends

- **Market Competitiveness:**
  - Competitiveness score per role
  - At-risk employees (below market rate)
  - Budget recommendations

- **Scenario Planning:**
  - "What-if" analysis with benchmark targets
  - Cost impact of bringing roles to market rate
  - Promotion/level change cost modeling

---

## Technical Implementation Roadmap

### Week 1-2: Foundation
- [ ] Add Prisma schema migrations for DepartmentMapping and RoleMapping
- [ ] Install `fuse.js` for fuzzy matching
- [ ] Implement multilingual column detection in CSV parser
- [ ] Add European number format parsing (€, comma decimals)
- [ ] Create utility functions for role/department normalization

### Week 3-4: Mapping Management
- [ ] Build API endpoints for DepartmentMapping CRUD
- [ ] Build API endpoints for RoleMapping CRUD
- [ ] Create admin UI for managing mappings
- [ ] Implement "save mapping" in CSV import flow
- [ ] Add mapping confidence scores and suggestions

### Month 2: Intelligence Layer
- [ ] Integrate OpenAI API for role classification
- [ ] Build role taxonomy seeding system (common roles)
- [ ] Create mapping suggestion engine
- [ ] Add bulk mapping operations
- [ ] Implement learning from user feedback

### Month 3: Benchmarking Foundation
- [ ] Research industry benchmark data sources
- [ ] Design IndustryBenchmark schema
- [ ] Build benchmark data ingestion API
- [ ] Create first set of benchmark data (manual or partner)
- [ ] Add benchmark comparison in employee view

### Month 4-6: Advanced Analytics
- [ ] Build compensation benchmarking dashboard
- [ ] Add role distribution visualizations
- [ ] Implement pay equity analysis
- [ ] Create market competitiveness scoring
- [ ] Integrate benchmarking into scenario planning

---

## Success Metrics

### Phase 1 Metrics:
- CSV import success rate > 95%
- Auto-mapping accuracy > 80%
- Support for 3+ languages (EN, DE, FR)
- User satisfaction with import UX

### Phase 2 Metrics:
- Role classification accuracy > 90%
- Mapping reuse rate > 70%
- Time to import reduced by 50%

### Phase 3 Metrics:
- Benchmark coverage > 80% of roles
- User engagement with benchmarking features
- Decision-making impact (scenarios run, actions taken)

---

## Risks & Mitigation

**Risk 1: Data Quality**
- Mitigation: Implement validation, confidence scores, manual review workflows

**Risk 2: Industry Benchmark Data Availability**
- Mitigation: Start with public data, partner with providers, build own dataset over time

**Risk 3: Privacy & Compliance**
- Mitigation: Anonymize benchmark data, ensure GDPR compliance, clear data usage policies

**Risk 4: Complexity Creep**
- Mitigation: Phased approach, MVP for each phase, user feedback loops

---

## Next Steps

### Immediate Actions (This Week):
1. Update Prisma schema with DepartmentMapping and RoleMapping models
2. Install fuse.js and implement fuzzy column matching
3. Add multilingual support to csv-upload-enhanced.tsx
4. Parse European number formats in CSV import
5. Create default department/role mapping seeds

### Follow-up (Next 2 Weeks):
1. Build mapping management UI
2. Add "save this mapping" feature to CSV import
3. Create API endpoints for mapping CRUD
4. Test with real German CSV data
5. User testing and feedback

---

## Resources

### Libraries to Use:
- `fuse.js` - Fuzzy string matching
- `papaparse` - CSV parsing (already in use)
- `openai` - AI-powered role classification
- `zod` - Schema validation

### Research Links:
- Pave: https://www.pave.com
- Levels.fyi: https://www.levels.fyi
- Radford: https://radford.aon.com
- Compensation best practices: https://www.compensationstandards.com

### Internal Documentation:
- Current CSV upload: `/apps/web/src/app/dashboard/datasets/[id]/csv-upload-enhanced.tsx`
- Employee schema: `/packages/database/schema.prisma`
- Types: `/packages/types/index.ts`

---

**Last Updated:** 2025-12-06
**Author:** Claude Code
**Status:** Planning Phase
