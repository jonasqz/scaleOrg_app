#!/bin/bash

# Simple script to apply onboarding migration
# Run from packages/database directory: ./apply-onboarding-migration.sh

set -e

echo "🚀 Applying onboarding migration..."

# Get database URL from .env
if [ -f .env ]; then
  export $(cat .env | grep DATABASE_URL | xargs)
fi

# Apply migration using psql
echo "📝 Adding onboarding fields to database..."

psql "$DATABASE_URL" <<EOF
-- Add onboarding_completed to users table
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='onboarding_completed'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added onboarding_completed column to users';
  ELSE
    RAISE NOTICE 'onboarding_completed column already exists';
  END IF;
END \$\$;

-- Add industry, stage, is_demo to datasets table
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='datasets' AND column_name='industry'
  ) THEN
    ALTER TABLE "datasets" ADD COLUMN "industry" TEXT;
    RAISE NOTICE 'Added industry column to datasets';
  ELSE
    RAISE NOTICE 'industry column already exists';
  END IF;
END \$\$;

DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='datasets' AND column_name='is_demo'
  ) THEN
    ALTER TABLE "datasets" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added is_demo column to datasets';
  ELSE
    RAISE NOTICE 'is_demo column already exists';
  END IF;
END \$\$;

-- Create FundingStage enum if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FundingStage') THEN
    CREATE TYPE "FundingStage" AS ENUM (
      'PRE_SEED',
      'SEED',
      'SERIES_A',
      'SERIES_B',
      'SERIES_C',
      'SERIES_D_PLUS',
      'GROWTH',
      'PUBLIC'
    );
    RAISE NOTICE 'Created FundingStage enum';
  ELSE
    RAISE NOTICE 'FundingStage enum already exists';
  END IF;
END \$\$;

-- Add stage column if it doesn't exist, then alter to use enum
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='datasets' AND column_name='stage'
  ) THEN
    ALTER TABLE "datasets" ADD COLUMN "stage" "FundingStage";
    RAISE NOTICE 'Added stage column to datasets';
  ELSE
    -- If column exists but is TEXT, convert to enum
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='datasets' AND column_name='stage' AND data_type='text'
    ) THEN
      ALTER TABLE "datasets" ALTER COLUMN "stage" TYPE "FundingStage" USING ("stage"::"FundingStage");
      RAISE NOTICE 'Converted stage column to FundingStage enum';
    ELSE
      RAISE NOTICE 'stage column already has correct type';
    END IF;
  END IF;
END \$\$;

-- Mark all existing users as having completed onboarding (so they don't see it)
UPDATE "users" SET "onboarding_completed" = true WHERE "onboarding_completed" = false;

\echo '✅ Migration completed successfully!'
\echo ''
\echo 'Summary:'
\echo '  - Added onboarding_completed to users (all existing users marked as completed)'
\echo '  - Added industry, stage, is_demo to datasets'
\echo '  - Created FundingStage enum'
\echo ''
EOF

# Generate Prisma client
echo "🔄 Regenerating Prisma client..."
pnpm prisma generate

echo ""
echo "✨ All done! Onboarding migration applied successfully."
echo ""
echo "Next steps:"
echo "  1. Restart your dev server (pnpm dev)"
echo "  2. Test onboarding with a new user account"
echo ""
