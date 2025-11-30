# scleorg Setup Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (or Supabase account)
- Clerk account (for authentication)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and add:

```bash
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/scleorg"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: OpenAI for AI insights
OPENAI_API_KEY=sk-...

# Optional: File storage (Cloudflare R2 or S3)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=scleorg-uploads
```

### 3. Set Up Database

#### Option A: Using Supabase (Recommended for MVP)

1. Create a new project at https://supabase.com
2. Copy the connection string to `DATABASE_URL`
3. Run migrations:

```bash
cd packages/database
pnpm db:push
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database:

```bash
createdb scleorg
```

3. Update `DATABASE_URL` in `.env.local`
4. Run migrations:

```bash
cd packages/database
pnpm db:push
```

### 4. Set Up Clerk Authentication

1. Create account at https://clerk.com
2. Create a new application
3. Copy API keys to `.env.local`
4. Configure redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

### 5. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## Project Structure

```
scleorg/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # React components
│       │   └── lib/            # Utilities
│       └── package.json
├── packages/
│   ├── database/               # Prisma schema & client
│   │   ├── schema.prisma
│   │   └── index.ts
│   ├── calculations/           # Core calculation engine
│   │   └── src/
│   │       ├── core/           # Cost, structure, productivity
│   │       ├── benchmarks/     # Benchmark comparison
│   │       ├── scenarios/      # Scenario modeling
│   │       └── utils/          # Statistics, normalization
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components
└── plan/                       # Technical documentation
```

## Development Workflow

### Running Tests

```bash
pnpm test
```

### Database Management

```bash
# Push schema changes
pnpm db:push

# Open Prisma Studio (GUI)
pnpm db:studio

# Generate Prisma client
cd packages/database && pnpm db:generate
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Next Steps

### Phase 1: File Upload & Parsing (Week 1-2)

1. Implement file upload component in `apps/web/src/components/upload`
2. Build Excel/CSV parsing service in `apps/web/src/lib/parsers`
3. Create API routes in `apps/web/src/app/api`

### Phase 2: Dashboard & Metrics (Week 3-4)

1. Build dashboard layout in `apps/web/src/app/dashboard`
2. Create metric visualization components
3. Integrate calculation engine

### Phase 3: Scenarios & Insights (Week 5-6)

1. Implement scenario UI
2. Build insights generation
3. Add AI enhancement (optional)

## Troubleshooting

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 pnpm dev
```

### Prisma Client errors

```bash
# Regenerate Prisma client
cd packages/database
pnpm db:generate
```

### TypeScript errors in monorepo

```bash
# Clean and rebuild all packages
pnpm clean
pnpm install
pnpm build
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `OPENAI_API_KEY` | No | OpenAI API key for insights |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | No | R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | R2 secret key |
| `R2_BUCKET_NAME` | No | R2 bucket name |

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Technical Plan](./plan/00-overview.md)
