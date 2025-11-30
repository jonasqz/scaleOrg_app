# System Architecture

## Architecture Principles

1. **Separation of Concerns**: Clear boundaries between data ingestion, processing, and presentation
2. **Stateless Design**: All services can scale horizontally
3. **Data Immutability**: Original uploads never modified, only transformed
4. **Event-Driven**: Async processing where appropriate
5. **API-First**: All features accessible via API (enables future integrations)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js Frontend (React + TypeScript)         │ │
│  │  - Upload Interface  - Dashboards  - Scenarios  - AI  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          API LAYER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  API Gateway / Routes                   │ │
│  │         Next.js API Routes or FastAPI Backend          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Ingestion  │ │ Calculations │ │   Scenario   │        │
│  │   Service    │ │    Engine    │ │    Engine    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Benchmark   │ │  AI Insights │ │     Auth     │        │
│  │   Service    │ │   Service    │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  PostgreSQL  │ │     Redis    │ │ File Storage │        │
│  │   (Primary)  │ │   (Cache)    │ │  (R2/S3)     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│         OpenAI API  │  Clerk Auth  │  Email (Resend)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Definitions

### 1. Ingestion Service

**Responsibility**: Parse, validate, and store uploaded files

**Key Functions:**
- Accept Excel/CSV uploads
- Auto-detect column mappings
- Validate data schema
- Store raw files
- Create normalized database records

**API Endpoints:**
- `POST /api/upload` - Upload file
- `GET /api/upload/{id}/status` - Check processing status
- `POST /api/upload/{id}/mapping` - Confirm column mapping

**Data Flow:**
```
Upload → Detect Format → Parse Rows → Validate Schema
       → Store Raw File → Normalize Data → Save to DB
       → Return Dataset ID
```

**Technologies:**
- File parsing: `xlsx`, `csv-parser` (Node) or `pandas`, `openpyxl` (Python)
- Validation: `zod` (TypeScript) or `pydantic` (Python)
- Storage: Cloudflare R2 or S3

---

### 2. Calculations Engine

**Responsibility**: Compute all metrics, benchmarks, and ratios

**Key Modules:**

**A. Cost Calculations**
- Total personnel cost
- Cost per FTE
- Cost per department
- Cost outliers (Z-score analysis)

**B. Structural Metrics**
- FTE distribution (R&D, GTM, G&A)
- R&D:GTM ratio
- Span of control analysis
- Manager:IC ratio

**C. Productivity Metrics**
- Revenue per FTE
- Gross profit per FTE
- Engineers per PM
- Engineers per $1M ARR

**API Endpoints:**
- `GET /api/datasets/{id}/metrics` - Get all calculated metrics
- `GET /api/datasets/{id}/benchmarks` - Compare to industry benchmarks

**Data Flow:**
```
Dataset ID → Load Employee Records → Apply Calculation Rules
          → Compare to Benchmarks → Cache Results → Return JSON
```

**Performance:**
- Cache results in Redis (TTL: 1 hour)
- Pre-compute on upload completion
- Background job for complex calculations

---

### 3. Scenario Engine

**Responsibility**: Model "what-if" scenarios without modifying source data

**Scenario Types:**
1. **Hiring Freeze**: Remove all open roles
2. **Cost Reduction**: Reduce headcount by X%
3. **Growth**: Add X FTE with distribution
4. **Target Ratio**: Achieve desired R&D:GTM ratio

**API Endpoints:**
- `POST /api/scenarios` - Create new scenario
- `GET /api/scenarios/{id}` - Get scenario details
- `GET /api/scenarios/{id}/compare` - Compare to baseline
- `DELETE /api/scenarios/{id}` - Delete scenario

**Data Model:**
```json
{
  "scenario_id": "uuid",
  "dataset_id": "uuid",
  "name": "Hiring Freeze Q1",
  "type": "freeze_hiring",
  "parameters": {},
  "operations": [
    {"action": "remove", "filter": {"status": "open"}}
  ],
  "results": {
    "total_fte": 120,
    "total_cost": 12000000,
    "rd_gtm_ratio": 1.1
  }
}
```

**Implementation:**
- Scenarios are **pure transformations** (functional, not mutating)
- Original dataset always preserved
- Results cached after first calculation

---

### 4. Benchmark Service

**Responsibility**: Store and retrieve industry benchmarks

**Data Sources (MVP):**
- Static JSON configs (public SaaS data)
- OpenView Partners benchmarks
- SaaS Capital reports
- Aggregated user data (post-launch)

**Benchmark Categories:**
- Industry (SaaS, FinTech, E-commerce)
- Company size (50-100, 100-250, 250-500, 500+)
- Growth stage (Seed, Series A, B, C+)

**API Endpoints:**
- `GET /api/benchmarks?industry={industry}&size={size}` - Get benchmarks
- `POST /api/benchmarks/compare` - Compare dataset to benchmarks

**Data Structure:**
```json
{
  "industry": "saas_b2b",
  "size": "100-250",
  "benchmarks": {
    "rd_gtm_ratio": {"min": 0.8, "median": 1.0, "max": 1.3},
    "revenue_per_fte": {"p25": 150000, "median": 200000, "p75": 300000},
    "span_of_control": {"min": 4, "median": 6, "max": 8}
  }
}
```

---

### 5. AI Insights Service

**Responsibility**: Generate actionable recommendations

**Process:**
1. Run rule-based analysis (JSON templates)
2. Identify anomalies and opportunities
3. Enhance with LLM for natural language
4. Rank by severity/impact

**Insight Rules (Examples):**

```json
{
  "rule_id": "rd_gtm_high",
  "condition": "dataset.rd_gtm_ratio > benchmark.p75",
  "severity": "medium",
  "template": "Your R&D:GTM ratio is {{ratio}}, {{delta}}% above median. Consider rebalancing toward GTM.",
  "suggested_actions": [
    "Increase sales/marketing headcount",
    "Reduce open engineering roles"
  ]
}
```

**API Endpoints:**
- `GET /api/datasets/{id}/insights` - Get all insights
- `POST /api/insights/regenerate` - Re-run with updated benchmarks

**LLM Integration:**
- Use GPT-4o-mini for tone/phrasing
- Structured outputs (JSON mode)
- Prompt template: "Given this metric analysis, explain the business impact..."

---

### 6. Auth Service

**Responsibility**: User authentication and authorization

**Features:**
- Email/password login
- SSO (Google, Microsoft)
- Session management
- Role-based access (Admin, Viewer)

**Implementation:**
- Use Clerk or Supabase Auth (no custom auth)
- JWT tokens
- Row-level security (users can only see their datasets)

---

## Data Flow Examples

### Complete Upload Flow

```
1. User uploads Excel
   ↓
2. POST /api/upload
   - Store file in R2
   - Return upload_id
   ↓
3. Parse file (async job)
   - Detect columns
   - Validate data
   - If ambiguous → return mapping UI
   ↓
4. User confirms mapping (if needed)
   ↓
5. Create normalized records in PostgreSQL
   - employees table
   - departments table
   - dataset metadata
   ↓
6. Trigger calculations (background job)
   - Calculate all metrics
   - Compare to benchmarks
   - Generate insights
   - Cache in Redis
   ↓
7. Return dataset_id to client
   ↓
8. Client polls GET /api/datasets/{id}/status
   ↓
9. When ready, redirect to dashboard
```

### Scenario Creation Flow

```
1. User selects "Hiring Freeze"
   ↓
2. POST /api/scenarios
   {
     "dataset_id": "...",
     "type": "freeze_hiring"
   }
   ↓
3. Backend:
   - Load base dataset
   - Apply transformation: filter out open roles
   - Re-run calculations
   - Store scenario
   ↓
4. Return scenario_id
   ↓
5. Client: GET /api/scenarios/{id}/compare
   ↓
6. Backend returns:
   {
     "baseline": {...},
     "scenario": {...},
     "delta": {
       "fte_change": -10,
       "cost_savings": 1200000,
       "ratio_impact": {...}
     }
   }
```

---

## Scalability Considerations

### Current MVP Design

- Supports up to **1,000 concurrent users**
- Dataset size: **up to 10,000 employees**
- Response time: **< 2 seconds** for calculations

### Bottlenecks & Solutions

| Bottleneck | Solution |
|------------|----------|
| File parsing | Use background jobs (BullMQ, Celery) |
| Calculation performance | Cache in Redis, pre-compute on upload |
| Database queries | Indexed queries, materialized views |
| LLM API costs | Cache insights, use cheaper models |

### Future Scaling (Post-MVP)

- **10,000+ users**: Separate backend microservices
- **100,000+ employee datasets**: Switch to columnar DB (ClickHouse) for analytics
- **Real-time sync**: Event streaming (Kafka, RabbitMQ)

---

## Security Architecture

### Authentication Flow

```
Client → Clerk → JWT Token → API Gateway → Validate Token → Service Layer
```

### Authorization

- **Row-Level Security**: Users only access their own datasets
- **API Keys**: For future programmatic access
- **Rate Limiting**: 100 requests/minute per user

### Data Security

- **At Rest**: PostgreSQL encryption, R2 encryption
- **In Transit**: HTTPS only, TLS 1.3
- **PII Protection**: Optional anonymization on upload
- **Audit Logs**: Track all data access

---

## Monitoring & Observability

### Metrics to Track

- **Performance**: API response times, database query duration
- **Business**: Uploads per day, calculations run, scenarios created
- **Errors**: Failed uploads, calculation errors, LLM failures

### Tools

- **Sentry**: Error tracking + performance monitoring
- **Vercel Analytics**: Frontend performance
- **PostgreSQL Logs**: Slow query analysis
- **Custom Dashboard**: Key business metrics (Retool or internal)

---

## Deployment Architecture

### MVP (Weeks 1-8)

```
Vercel (Frontend + API Routes)
   ↓
Supabase (PostgreSQL + Redis)
   ↓
Cloudflare R2 (File Storage)
```

### Post-MVP

```
Vercel (Frontend)
   ↓
Railway/Render (FastAPI Backend)
   ↓
Managed PostgreSQL + Redis
   ↓
Cloudflare R2
```

### Enterprise (Future)

```
AWS/GCP
- ECS/Cloud Run (Backend containers)
- RDS/Cloud SQL (PostgreSQL)
- ElastiCache/Memorystore (Redis)
- S3/GCS (Storage)
- CloudFront/Cloud CDN (Global distribution)
```

---

## API Versioning Strategy

- Start with `/api/v1/...`
- Never break existing endpoints
- Deprecation period: 6 months minimum
- Use feature flags for gradual rollout

---

## Disaster Recovery

### Backup Strategy

- **Database**: Automated daily backups (Supabase built-in)
- **Files**: R2 versioning enabled
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 24 hours

### High Availability (Post-MVP)

- Multi-region database replication
- CDN for global distribution
- Auto-scaling backend services

---

**Architecture Version**: 1.0 (MVP)
**Last Updated**: 2025-11-29
**Next Review**: After 100 users
