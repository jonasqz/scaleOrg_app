#!/bin/bash

# Script to add country and city fields to datasets table
# Run from packages/database directory: ./add-location-fields.sh

set -e

echo "🚀 Adding location fields to datasets..."

# Get database URL from .env
if [ -f .env ]; then
  export $(cat .env | grep DATABASE_URL | xargs)
fi

# Apply migration using psql
echo "📝 Adding country and city fields to database..."

psql "$DATABASE_URL" <<EOF
-- Add country and city to datasets table
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='datasets' AND column_name='country'
  ) THEN
    ALTER TABLE "datasets" ADD COLUMN "country" TEXT;
    RAISE NOTICE 'Added country column to datasets';
  ELSE
    RAISE NOTICE 'country column already exists';
  END IF;
END \$\$;

DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='datasets' AND column_name='city'
  ) THEN
    ALTER TABLE "datasets" ADD COLUMN "city" TEXT;
    RAISE NOTICE 'Added city column to datasets';
  ELSE
    RAISE NOTICE 'city column already exists';
  END IF;
END \$\$;

\echo '✅ Migration completed successfully!'
\echo ''
\echo 'Summary:'
\echo '  - Added country and city fields to datasets'
\echo ''
EOF

# Generate Prisma client
echo "🔄 Regenerating Prisma client..."
pnpm prisma generate

echo ""
echo "✨ All done! Location fields added successfully."
echo ""
echo "Next steps:"
echo "  1. Restart your dev server (pnpm dev)"
echo "  2. Test onboarding with country/city fields"
echo ""
