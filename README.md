# 🚀 scleorg - Strategic Workforce Benchmarking Platform

> AI-powered workforce analytics and benchmarking platform for CFOs and CHROs

## 🎯 What is scleorg?

scleorg helps executives make data-driven decisions about their workforce by providing:
- **Instant workforce metrics** in under 60 seconds
- **Industry benchmark comparisons** against SaaS standards
- **AI-powered insights** for organizational optimization
- **Interactive visualizations** for executive presentations
- **Outlier detection** for compensation equity

---

## ✨ Features

### Core Analytics
- ✅ **Real-time Metrics**: Total FTE, Cost, R&D:GTM ratio, Span of Control
- ✅ **Department Breakdown**: Cost distribution and headcount by team
- ✅ **Employee Management**: Manual data entry with instant calculations

### Advanced Analytics
- ✅ **Benchmark Comparisons**: Compare against industry standards (OpenView, SaaS Capital)
- ✅ **Interactive Charts**: 4 chart types using Recharts (bar, pie, multi-axis)
- ✅ **Outlier Detection**: Statistical z-score analysis for compensation anomalies
- ✅ **AI Insights**: Automated recommendations based on workforce metrics

### Coming Soon
- ⏳ **Scenario Modeling**: Hiring freeze, cost reduction, growth plans
- ⏳ **File Upload**: Excel/CSV import for bulk data
- ⏳ **Export**: PDF/Excel reports
- ⏳ **Historical Trends**: Quarter-over-quarter comparisons

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router, Server Components, TypeScript)
- **Tailwind CSS** (Styling)
- **Recharts** (Data visualization)
- **Lucide React** (Icons)

### Backend
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Clerk** (Authentication)

### Architecture
- **Turborepo** (Monorepo)
- **pnpm** (Package manager)
- **TypeScript** (Type safety)

---

## 📦 Project Structure

```
scleorg/
├── apps/
│   └── web/                        # Next.js application
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/           # API routes
│       │   │   ├── dashboard/     # Dashboard pages
│       │   │   └── page.tsx       # Homepage
│       │   └── middleware.ts      # Clerk auth
│       └── package.json
│
├── packages/
│   ├── calculations/              # Calculation engine
│   │   ├── src/
│   │   │   ├── core/             # Cost, structure, productivity
│   │   │   ├── benchmarks/       # Industry benchmarks
│   │   │   ├── scenarios/        # What-if modeling
│   │   │   └── calculator.ts     # Main orchestrator
│   │   └── package.json
│   │
│   ├── database/                  # Prisma schema & client
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Database schema (9 tables)
│   │   └── package.json
│   │
│   ├── types/                     # Shared TypeScript types
│   │   └── src/index.ts
│   │
│   └── ui/                        # Shared UI components
│       └── index.tsx
│
├── plan/                          # Architecture docs
│   ├── 00-overview.md
│   ├── 01-tech-stack.md
│   ├── 02-architecture.md
│   └── ...
│
├── package.json                   # Root workspace
├── turbo.json                     # Turborepo config
├── pnpm-workspace.yaml            # pnpm workspace
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Clerk account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/scleorg.git
   cd scleorg
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `apps/web/.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/scleorg"

   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

   Create `packages/database/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/scleorg"
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb scleorg

   # Push schema
   cd packages/database
   pnpm db:push
   ```

5. **Run development server**
   ```bash
   cd ../..
   pnpm dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

---

## 📊 Usage

### Creating Your First Dataset

1. **Sign up/Login** using Clerk authentication
2. **Create Dataset**: Click "New Dataset" on dashboard
   - Name: "Q4 2024 Workforce"
   - Company: "Acme Corp"
   - Revenue: 50000000 (optional)
   - Currency: EUR/USD/GBP
3. **Add Employees**: Click "Add Employee"
   - Name, Department, Role, Level, Compensation
4. **View Metrics**: Real-time calculations appear instantly

### Understanding the Dashboard

#### Metrics Overview (Top)
- **Total FTE**: Full-time equivalent count
- **Total Cost**: Annual workforce cost
- **R&D:GTM Ratio**: Engineering to Sales/Marketing ratio
- **Span of Control**: Average reports per manager

#### Department Breakdown
- Cost distribution by department
- FTE allocation
- Percentage of total

#### Visualizations (3+ employees)
- Department cost bar chart
- FTE distribution chart
- Department percentage pie chart
- Employee vs cost comparison

#### Benchmark Comparison (3+ employees)
- Industry comparison for R&D:GTM, Revenue/FTE, Span of Control, Cost/FTE
- Status indicators (Above/Within/Below)
- Percentile positioning

#### Outlier Detection (5+ employees)
- Z-score analysis (>2 standard deviations)
- High and low compensation outliers
- Severity indicators

#### AI Insights (3+ employees)
- Automatic recommendations
- Success/Warning/Critical/Info alerts
- Actionable guidance

---

## 🧮 Calculation Engine

### Metrics Calculated

**Cost Metrics**
- Total Cost
- Total FTE
- Cost per FTE
- Cost by Department

**Structure Metrics**
- R&D to GTM Ratio
- Manager to IC Ratio
- Average Span of Control
- Engineers per Product Manager

**Productivity Metrics**
- Revenue per FTE
- Revenue per Department

**Statistical Analysis**
- Outlier detection (z-score)
- Department distribution
- Compensation variance

### Benchmark Data Sources
- OpenView SaaS Benchmarks
- SaaS Capital Index
- Industry research (2023-2024 data)

---

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts (synced with Clerk)
- **datasets**: Workforce datasets
- **employees**: Employee records

### Future Tables
- **scenarios**: What-if modeling
- **insights**: AI-generated insights
- **benchmarks**: Custom benchmarks
- **scenario_results**: Scenario outputs
- **audit_logs**: Change tracking
- **open_roles**: Hiring plans

---

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm lint             # Lint code

# Database
cd packages/database
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma Client

# Specific packages
cd apps/web
pnpm dev              # Run web app only
```

### Adding New Calculations

1. Create function in `packages/calculations/src/core/`
2. Export from `calculator.ts`
3. Use in API routes or pages

Example:
```typescript
// packages/calculations/src/core/custom.ts
export function calculateCustomMetric(employees: Employee[]) {
  // Your calculation
  return result;
}

// packages/calculations/src/calculator.ts
import { calculateCustomMetric } from './core/custom';

export function calculateAllMetrics(employees, dataset) {
  return {
    // ... existing metrics
    custom: calculateCustomMetric(employees),
  };
}
```

---

## 📚 Documentation

- **Architecture**: `plan/02-architecture.md`
- **Data Model**: `plan/03-data-model.md`
- **API Design**: `plan/04-api-design.md`
- **Calculations**: `plan/06-calculation-engine.md`
- **Development Phases**: `plan/05-development-phases.md`

### Completion Guides
- **Manual Entry**: `MANUAL_ENTRY_COMPLETE.md`
- **Analytics**: `ANALYTICS_FEATURES_COMPLETE.md`
- **Database**: `DATABASE_SETUP_COMPLETE.md`
- **Clerk**: `CLERK_SETUP.md`

---

## 🎨 UI Components

### Custom Components
- `AddEmployeeForm`: Employee creation modal
- `BenchmarkComparison`: Industry comparison display
- `MetricsCharts`: Recharts visualizations (4 charts)
- `OutliersDisplay`: Z-score outlier detection
- `InsightsDisplay`: AI-powered recommendations

---

## 🔐 Authentication

Uses **Clerk** for authentication:
- Social login (Google, GitHub, etc.)
- Email/password
- User management
- Session handling

Protected routes via `middleware.ts`:
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
```

---

## 🌐 API Endpoints

### Datasets
- `GET /api/datasets` - List all datasets
- `POST /api/datasets` - Create dataset
- `GET /api/datasets/:id` - Get dataset with employees
- `DELETE /api/datasets/:id` - Delete dataset

### Employees
- `POST /api/datasets/:id/employees` - Add employee

### Benchmarks
- `GET /api/datasets/:id/benchmarks` - Get benchmark comparison

---

## 🧪 Testing Your Setup

### Quick Test

1. **Create test dataset**:
   - Name: "Test Company"
   - Revenue: 10000000
   - Currency: USD

2. **Add sample employees**:
   ```
   Sarah Chen - Engineering - Senior Engineer - $140k
   Mike Ross - Engineering - Staff Engineer - $180k
   Rachel Green - Sales - Account Executive - $110k
   Monica Geller - Marketing - Marketing Manager - $95k
   Joey Tribbiani - Sales - Sales Manager - $105k
   ```

3. **Verify features appear**:
   - ✅ Metrics cards at top
   - ✅ Department breakdown table
   - ✅ Interactive charts (4 types)
   - ✅ Benchmark comparison
   - ✅ Outlier detection (add 1-2 more for z-score)
   - ✅ AI insights

---

## 🚦 Deployment

### Database
- Set up production PostgreSQL (Supabase, Railway, etc.)
- Run migrations: `pnpm db:push`

### Web App
- Deploy to Vercel (recommended for Next.js)
- Set environment variables in Vercel dashboard
- Connect to production database

### Environment Variables
```env
# Production
DATABASE_URL=<production-postgres-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-prod-key>
CLERK_SECRET_KEY=<clerk-prod-secret>
```

---

## 📈 Roadmap

### Phase 1: MVP (✅ Complete)
- [x] Manual data entry
- [x] Real-time calculations
- [x] Benchmark comparisons
- [x] Visualizations
- [x] Outlier detection
- [x] AI insights

### Phase 2: Advanced Features (Next)
- [ ] Scenario modeling
- [ ] File upload (Excel/CSV)
- [ ] PDF/Excel export
- [ ] Historical trends
- [ ] Custom benchmarks

### Phase 3: Collaboration (Future)
- [ ] Team workspaces
- [ ] Commenting
- [ ] Sharing & permissions
- [ ] API access

### Phase 4: Enterprise (Future)
- [ ] SSO integration
- [ ] Advanced security
- [ ] Custom integrations
- [ ] Dedicated support

---

## 🙏 Acknowledgments

- **Benchmark Data**: OpenView, SaaS Capital, KeyBanc
- **Icons**: Lucide React
- **Charts**: Recharts
- **Authentication**: Clerk
- **Database**: Prisma + PostgreSQL

---

## 📊 Current Status

```
✅ Authentication        (Clerk)
✅ Database              (PostgreSQL + Prisma)
✅ Manual Data Entry     (Fully functional)
✅ Calculation Engine    (15+ metrics)
✅ Benchmarking          (Industry comparisons)
✅ Visualizations        (4 chart types)
✅ Outlier Detection     (Statistical analysis)
✅ AI Insights           (Automatic recommendations)
⏳ File Upload           (Coming next)
⏳ Scenario Modeling     (Coming next)
⏳ Export Features       (Coming next)
```

**Last Updated**: November 2024
**Version**: 0.1.0 MVP
**Status**: Production-ready for manual entry workflow

---

**Built with ❤️ for CFOs and CHROs who want data-driven workforce decisions**
