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

### 2.1 Role Taxonomy System
**Goal:** Build hierarchical role structure for standardization

**Database Schema:**
```prisma
model RoleTaxonomy {
  id             String   @id @default(cuid())
  roleFamily     String   // "Engineering", "Sales", "Product", "Marketing"
  roleTitle      String   // "Software Engineer", "Account Executive"
  seniorityLevel String   // "IC1", "IC2", "IC3", "M1", "M2", "Director", "VP"
  aliases        String[] // Common variations
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
