# Tech Stack Recommendations

## Decision Framework

For the scleorg MVP, we prioritize:
- **Speed to market** (6-8 week timeline)
- **Developer experience** (fast iteration)
- **Scalability** (foundation for Workforce Planning OS)
- **Cost efficiency** (MVP budget constraints)
- **Talent availability** (easy to hire for)

---

## Recommended Stack

### Frontend

**Framework: Next.js 14+ (React)**

**Rationale:**
- Server-side rendering for fast initial load
- Built-in API routes (can prototype without separate backend)
- Excellent TypeScript support
- Strong ecosystem for SaaS applications
- File-based routing (developer productivity)
- Easy deployment (Vercel)

**UI Framework: shadcn/ui + TailwindCSS**

**Rationale:**
- shadcn/ui: High-quality, customizable components (not a dependency, you own the code)
- TailwindCSS: Rapid styling, consistent design system
- Better than Material-UI or Ant Design for modern, branded SaaS
- Smaller bundle size than full component libraries

**Data Visualization: Recharts + D3.js (selectively)**

**Rationale:**
- Recharts: Simple, React-native charts (covers 80% of needs)
- D3.js: Custom visualizations for span of control trees, org charts
- Lightweight compared to Chart.js or Highcharts

**State Management: Zustand or React Query**

**Rationale:**
- Zustand: Simple global state (user session, UI state)
- React Query: Server state management (perfect for dashboard data)
- Avoid Redux complexity for MVP

**TypeScript: Mandatory**

**Rationale:**
- Prevents bugs in calculations
- Better IDE support
- Self-documenting code
- Essential for data modeling

---

### Backend

**Framework: Next.js API Routes (Phase 1) → FastAPI (Phase 2)**

**Phase 1 (Weeks 1-4): Next.js API Routes**
- Rapid prototyping
- No deployment complexity
- Enough for file upload, basic calculations
- TypeScript end-to-end

**Phase 2 (Weeks 5-8): Migrate to FastAPI**
- Better for complex calculations
- Python ecosystem (pandas, openpyxl)
- Async performance
- Easy to separate backend as product grows

**Alternative Consideration: NestJS**
- If team is TypeScript-only
- Stays in Node.js ecosystem
- Good structure for monorepo
- **Trade-off**: Python better for data processing

**Recommended: FastAPI from start if team has Python experience**

---

### Database

**Primary: PostgreSQL (Supabase or Railway)**

**Rationale:**
- Robust relational model for employee data
- JSONB for flexible scenario storage
- Great TypeScript support (via Prisma)
- Supabase: Free tier, built-in auth, realtime features
- Railway: Simple deployment, PostgreSQL + Redis

**ORM: Prisma (if TypeScript backend) or SQLAlchemy (if Python)**

**Caching: Redis**
- Cache calculation results
- Session management
- Rate limiting

---

### File Storage

**Recommended: S3-compatible storage**

**Options:**
1. **AWS S3** - Industry standard, cheap
2. **Cloudflare R2** - Zero egress fees
3. **Supabase Storage** - Integrated with Supabase DB

**MVP Choice: Cloudflare R2**
- No egress costs (important for downloads)
- Simple API
- Global CDN

---

### Authentication

**Recommended: Clerk or Supabase Auth**

**Clerk:**
- Best developer experience
- Built-in user management UI
- SSO ready for enterprise
- Generous free tier

**Supabase Auth:**
- Free
- Integrated with Supabase DB
- Simpler if already using Supabase

**Avoid:** Building custom auth (time sink)

---

### AI / LLM Integration

**Provider: OpenAI API (GPT-4o-mini)**

**Rationale:**
- Fast responses
- Low cost ($0.15 / 1M input tokens)
- Good for insight generation
- Structured output support

**Alternative: Anthropic Claude**
- Better reasoning for complex insights
- Longer context windows
- Consider for Phase 2

**Implementation:**
- Rule-based insights first (JSON templates)
- LLM for tone enhancement and edge cases
- Cache common insights

---

### Deployment & Infrastructure

**Hosting:**

**Phase 1: Vercel (Frontend + API Routes)**
- One-click deployment
- Automatic previews
- Edge functions
- Free tier generous

**Phase 2: Railway or Render (Backend)**
- Railway: Simple, good for monorepos
- Render: More mature, better for microservices

**Phase 3 (Post-MVP): AWS/GCP**
- When you need custom infrastructure
- Better for enterprise sales

**CI/CD: GitHub Actions**
- Free for public repos
- Great Next.js support
- Easy to set up

**Monitoring:**
- **Sentry**: Error tracking
- **Vercel Analytics**: Frontend performance
- **LogTail** or **BetterStack**: Backend logs

---

### Development Tools

**Version Control: Git + GitHub**

**Package Manager: pnpm**
- Faster than npm/yarn
- Better monorepo support
- Saves disk space

**Code Quality:**
- **ESLint + Prettier**: Code formatting
- **Husky**: Git hooks
- **TypeScript strict mode**: Catch errors early

**Testing:**
- **Vitest**: Fast unit tests (replaces Jest)
- **Playwright**: E2E tests (focus on critical paths)
- **pytest**: Backend tests (if Python)

---

## Technology Matrix

| Layer | Technology | Alternative | Rationale |
|-------|-----------|-------------|-----------|
| **Frontend Framework** | Next.js 14 | Remix | Best DX, ecosystem |
| **UI Components** | shadcn/ui | Radix UI | Own the code |
| **Styling** | TailwindCSS | CSS Modules | Speed |
| **Charts** | Recharts | Chart.js | React-native |
| **Backend** | FastAPI | NestJS | Python for data |
| **Database** | PostgreSQL | MySQL | JSONB support |
| **Hosting (DB)** | Supabase | Railway | Integrated features |
| **ORM** | Prisma | SQLAlchemy | Type safety |
| **Cache** | Redis | In-memory | Persistence |
| **File Storage** | Cloudflare R2 | S3 | No egress fees |
| **Auth** | Clerk | Supabase | DX + enterprise |
| **LLM** | OpenAI | Anthropic | Cost/speed |
| **Deployment** | Vercel | Netlify | Next.js optimized |
| **Monitoring** | Sentry | LogRocket | Error tracking |

---

## Monorepo Structure (Recommended)

```
scleorg/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend (optional separation)
├── packages/
│   ├── database/            # Prisma schema, migrations
│   ├── calculations/        # Core calculation engine (shared)
│   ├── types/               # Shared TypeScript types
│   └── ui/                  # Shared UI components
├── plan/                    # This documentation
└── package.json
```

**Monorepo Tool: Turborepo**
- Optimized for Next.js
- Fast builds
- Remote caching

---

## Cost Estimate (Monthly, MVP Phase)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby/Pro | $0-20 |
| Supabase | Free/Pro | $0-25 |
| Cloudflare R2 | Pay-as-go | $0-5 |
| Clerk | Free | $0 |
| OpenAI API | Usage | $10-50 |
| Sentry | Developer | $0 |
| **Total** | | **$10-100** |

**Post-MVP (100+ users):** $200-500/month

---

## Migration Path to Enterprise

The chosen stack supports:
- SOC2 compliance (Clerk, Supabase certified)
- SSO (Clerk built-in)
- Self-hosted options (FastAPI, PostgreSQL)
- API-first architecture (easy to white-label)
- Horizontal scaling (stateless design)

---

## Final Recommendation

**Week 1-4 (Rapid Prototype):**
```
Next.js + API Routes + Supabase + Vercel
```

**Week 5-8 (Performance Optimization):**
```
Next.js + FastAPI + Supabase + Vercel + Railway
```

**Post-MVP (Scale):**
```
Next.js + FastAPI + PostgreSQL + Redis + AWS/GCP
```

---

**Decision Date**: 2025-11-29
**Review Cycle**: Every 2 sprints
**Owner**: Technical Lead
