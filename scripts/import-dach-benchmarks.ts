/**
 * Script to import DACH SaaS benchmarks into the database
 *
 * Run with: npx tsx scripts/import-dach-benchmarks.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Transform the detailed department structure to our 5-category model
function transformDepartmentData(detailed: any) {
  return {
    rd: detailed.rd.total,
    gtm: detailed.gtm.total,
    ga: detailed.ga.total,
    operations: detailed.operations.total,
    other: detailed.other,
    total: detailed.total_headcount,
  };
}

async function main() {
  console.log('Starting DACH SaaS benchmark import...\n');

  // Create or get the source
  const source = await prisma.benchmarkSource.upsert({
    where: { name: 'European SaaS Benchmark 2023' },
    update: {},
    create: {
      name: 'European SaaS Benchmark 2023',
      type: 'THIRD_PARTY',
      website: 'https://www.europeansaasbenchmark.com/',
      description: '700+ European SaaS companies, 86% Central Europe including DACH',
      reliability: 'High',
      updateFrequency: 'Annual',
      isActive: true,
    },
  });

  console.log(`✓ Created/found source: ${source.name}\n`);

  const benchmarksToCreate = [
    // 11-50 employees - DETAILED mode
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '11-50',
      growthStage: 'Seed',
      entryMode: 'DETAILED' as const,
      sampleSize: 180,
      effectiveDate: new Date('2023-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      departmentHeadcount: {
        p25: transformDepartmentData({
          rd: { total: 11 },
          gtm: { total: 8 },
          ga: { total: 4 },
          operations: { total: 0 },
          other: 2,
          total_headcount: 25,
        }),
        p50: transformDepartmentData({
          rd: { total: 18 },
          gtm: { total: 13 },
          ga: { total: 5 },
          operations: { total: 0 },
          other: 2,
          total_headcount: 38,
        }),
        p75: transformDepartmentData({
          rd: { total: 27 },
          gtm: { total: 21 },
          ga: { total: 10 },
          operations: { total: 0 },
          other: 4,
          total_headcount: 62,
        }),
      },
      revenueData: {
        p25: 35000 * 25,  // revenue_per_fte * p25 headcount
        p50: 57000 * 38,
        p75: 95000 * 62,
      },
      notes: 'ARR range: €1M-€5M. Early-stage companies, product-focused with median 46% in R&D.',
      methodology: 'Survey median from European SaaS Benchmark 2023',
      sourceId: source.id,
    },

    // 51-200 employees - DETAILED mode
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      growthStage: 'Series A',
      entryMode: 'DETAILED' as const,
      sampleSize: 145,
      effectiveDate: new Date('2023-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      departmentHeadcount: {
        p25: transformDepartmentData({
          rd: { total: 31 },
          gtm: { total: 24 },
          ga: { total: 12 },
          operations: { total: 2 },
          other: 4,
          total_headcount: 73,
        }),
        p50: transformDepartmentData({
          rd: { total: 52 },
          gtm: { total: 41 },
          ga: { total: 20 },
          operations: { total: 3 },
          other: 6,
          total_headcount: 122,
        }),
        p75: transformDepartmentData({
          rd: { total: 82 },
          gtm: { total: 71 },
          ga: { total: 32 },
          operations: { total: 5 },
          other: 10,
          total_headcount: 200,
        }),
      },
      revenueData: {
        p25: 57000 * 73,
        p50: 95000 * 122,
        p75: 143000 * 200,
      },
      notes: 'ARR range: €5M-€20M. Growth stage with 42% median R&D allocation, 33% GTM.',
      methodology: 'Survey median from European SaaS Benchmark 2023',
      sourceId: source.id,
    },

    // 201-500 employees - DETAILED mode
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '201-500',
      growthStage: 'Series B+',
      entryMode: 'DETAILED' as const,
      sampleSize: 85,
      effectiveDate: new Date('2023-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      departmentHeadcount: {
        p25: transformDepartmentData({
          rd: { total: 93 },
          gtm: { total: 101 },
          ga: { total: 50 },
          operations: { total: 8 },
          other: 12,
          total_headcount: 264,
        }),
        p50: transformDepartmentData({
          rd: { total: 137 },
          gtm: { total: 156 },
          ga: { total: 75 },
          operations: { total: 12 },
          other: 18,
          total_headcount: 398,
        }),
        p75: transformDepartmentData({
          rd: { total: 191 },
          gtm: { total: 220 },
          ga: { total: 110 },
          operations: { total: 18 },
          other: 25,
          total_headcount: 564,
        }),
      },
      revenueData: {
        p25: 100000 * 264,
        p50: 143000 * 398,
        p75: 200000 * 564,
      },
      notes: 'ARR range: €20M-€50M. Mature growth stage, GTM overtakes R&D (40% vs 38%).',
      methodology: 'Survey median + public company analysis',
      sourceId: source.id,
    },
  ];

  // Now create FALLBACK mode entries for the key metrics
  const fallbackMetrics = [
    // 1-10 employees
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '1-10',
      growthStage: 'Seed',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'STRUCTURE' as const,
      metricName: 'rd_to_gtm_ratio',
      p25Value: 2.0,
      p50Value: 3.0,
      p75Value: 5.0,
      sampleSize: 220,
      effectiveDate: new Date('2023-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      notes: 'Very early stage, founders often fill multiple roles. High variance.',
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '1-10',
      growthStage: 'Seed',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'EFFICIENCY' as const,
      metricName: 'revenue_per_fte',
      p25Value: 12000,
      p50Value: 26000,
      p75Value: 50000,
      currency: 'EUR',
      sampleSize: 220,
      effectiveDate: new Date('2023-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },

    // 501-1000 employees
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '501-1000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'STRUCTURE' as const,
      metricName: 'rd_to_gtm_ratio',
      p25Value: 0.65,
      p50Value: 0.85,
      p75Value: 1.1,
      sampleSize: 32,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      notes: 'Reference companies: Mambu, Contentful, Bitpanda',
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '501-1000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'EFFICIENCY' as const,
      metricName: 'revenue_per_fte',
      p25Value: 140000,
      p50Value: 185000,
      p75Value: 250000,
      currency: 'EUR',
      sampleSize: 32,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '501-1000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'EFFICIENCY' as const,
      metricName: 'cost_per_fte',
      p25Value: 85000,
      p50Value: 105000,
      p75Value: 130000,
      currency: 'EUR',
      sampleSize: 32,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '501-1000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'STRUCTURE' as const,
      metricName: 'span_of_control',
      p25Value: 5.0,
      p50Value: 5.5,
      p75Value: 6.2,
      sampleSize: 32,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },

    // 1001-5000 employees
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '1001-5000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'STRUCTURE' as const,
      metricName: 'rd_to_gtm_ratio',
      p25Value: 0.55,
      p50Value: 0.75,
      p75Value: 0.95,
      sampleSize: 18,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      notes: 'Reference companies: Personio, Celonis, TeamViewer, DeepL',
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '1001-5000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'EFFICIENCY' as const,
      metricName: 'revenue_per_fte',
      p25Value: 160000,
      p50Value: 210000,
      p75Value: 330000,
      currency: 'EUR',
      sampleSize: 18,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '1001-5000',
      growthStage: 'Growth',
      entryMode: 'FALLBACK' as const,
      benchmarkType: 'EFFICIENCY' as const,
      metricName: 'cost_per_fte',
      p25Value: 90000,
      p50Value: 115000,
      p75Value: 145000,
      currency: 'EUR',
      sampleSize: 18,
      effectiveDate: new Date('2024-01-01'),
      approvalStatus: 'APPROVED' as const, // Trusted third-party data
      sourceId: source.id,
    },
  ];

  console.log('Creating DETAILED mode benchmarks...\n');
  for (const benchmark of benchmarksToCreate) {
    try {
      const created = await prisma.organizationalBenchmark.create({
        data: benchmark as any,
      });
      console.log(`✓ Created ${benchmark.companySize} (${benchmark.entryMode})`);
    } catch (error: any) {
      console.error(`✗ Failed to create ${benchmark.companySize}:`, error.message);
    }
  }

  console.log('\nCreating FALLBACK mode benchmarks...\n');
  for (const metric of fallbackMetrics) {
    try {
      const created = await prisma.organizationalBenchmark.create({
        data: metric as any,
      });
      console.log(`✓ Created ${metric.companySize} - ${metric.metricName}`);
    } catch (error: any) {
      console.error(`✗ Failed to create ${metric.companySize} - ${metric.metricName}:`, error.message);
    }
  }

  console.log('\n✅ Import complete!\n');
  console.log('Summary:');
  const count = await prisma.organizationalBenchmark.count({
    where: { industry: 'SaaS', region: 'DACH' },
  });
  console.log(`Total DACH SaaS benchmarks: ${count}`);

  const detailed = await prisma.organizationalBenchmark.count({
    where: { industry: 'SaaS', region: 'DACH', entryMode: 'DETAILED' },
  });
  console.log(`DETAILED mode: ${detailed}`);

  const fallback = await prisma.organizationalBenchmark.count({
    where: { industry: 'SaaS', region: 'DACH', entryMode: 'FALLBACK' },
  });
  console.log(`FALLBACK mode: ${fallback}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
