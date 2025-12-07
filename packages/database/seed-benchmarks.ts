// Seed script for benchmark sources and sample organizational benchmarks
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding benchmark sources and organizational benchmarks...\n');

  // 1. Create benchmark sources
  console.log('Creating benchmark sources...');

  const sources = await Promise.all([
    prisma.benchmarkSource.upsert({
      where: { name: 'Manual Entry' },
      update: {},
      create: {
        name: 'Manual Entry',
        type: 'MANUAL',
        description: 'Benchmarks entered manually by administrators',
        reliability: 'High',
        updateFrequency: 'Ad-hoc',
        isActive: true,
      },
    }),

    prisma.benchmarkSource.upsert({
      where: { name: 'Customer Crowdsourced' },
      update: {},
      create: {
        name: 'Customer Crowdsourced',
        type: 'CROWDSOURCED',
        description: 'Aggregated anonymized data from ScaleOrg customers',
        reliability: 'High',
        updateFrequency: 'Continuous',
        isActive: true,
      },
    }),

    prisma.benchmarkSource.upsert({
      where: { name: 'Pave' },
      update: {},
      create: {
        name: 'Pave',
        type: 'THIRD_PARTY',
        website: 'https://www.pave.com',
        description: 'Real-time compensation data platform',
        licenseType: 'Paid',
        reliability: 'High',
        updateFrequency: 'Quarterly',
        isActive: false, // Not yet integrated
      },
    }),

    prisma.benchmarkSource.upsert({
      where: { name: 'Radford' },
      update: {},
      create: {
        name: 'Radford',
        type: 'THIRD_PARTY',
        website: 'https://www.radford.com',
        description: 'Global compensation surveys and data',
        licenseType: 'Paid',
        reliability: 'High',
        updateFrequency: 'Annual',
        isActive: false, // Not yet integrated
      },
    }),

    prisma.benchmarkSource.upsert({
      where: { name: 'OpenComp' },
      update: {},
      create: {
        name: 'OpenComp',
        type: 'THIRD_PARTY',
        website: 'https://www.opencomp.com',
        description: 'Compensation benchmarking for tech companies',
        licenseType: 'Paid',
        reliability: 'High',
        updateFrequency: 'Quarterly',
        isActive: false, // Not yet integrated
      },
    }),
  ]);

  console.log(`✅ Created ${sources.length} benchmark sources\n`);

  // Get the Manual Entry source for sample data
  const manualSource = sources.find((s) => s.name === 'Manual Entry')!;

  // 2. Create sample organizational benchmarks
  console.log('Creating sample organizational benchmarks...');

  const sampleBenchmarks = [
    // SaaS DACH benchmarks
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      growthStage: 'Series B',
      benchmarkType: 'STRUCTURE',
      metricName: 'rd_to_gtm_ratio',
      p10Value: 0.8,
      p25Value: 1.2,
      p50Value: 1.5,
      p75Value: 2.0,
      p90Value: 2.8,
      sampleSize: 127,
      unit: 'ratio',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      growthStage: 'Series B',
      benchmarkType: 'STRUCTURE',
      metricName: 'span_of_control',
      p10Value: 3.0,
      p25Value: 4.5,
      p50Value: 6.0,
      p75Value: 8.0,
      p90Value: 10.0,
      sampleSize: 127,
      unit: 'reports',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      growthStage: 'Series B',
      benchmarkType: 'EFFICIENCY',
      metricName: 'revenue_per_fte',
      p10Value: 120000,
      p25Value: 150000,
      p50Value: 200000,
      p75Value: 280000,
      p90Value: 350000,
      sampleSize: 95,
      unit: 'EUR',
      currency: 'EUR',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },
    {
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      growthStage: 'Series B',
      benchmarkType: 'TENURE',
      metricName: 'avg_tenure_months',
      p10Value: 12,
      p25Value: 18,
      p50Value: 24,
      p75Value: 36,
      p90Value: 48,
      sampleSize: 110,
      unit: 'months',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },

    // Fintech EU benchmarks
    {
      industry: 'Fintech',
      region: 'EU',
      companySize: '201-500',
      growthStage: 'Series C+',
      benchmarkType: 'STRUCTURE',
      metricName: 'rd_to_gtm_ratio',
      p10Value: 1.0,
      p25Value: 1.5,
      p50Value: 2.0,
      p75Value: 2.8,
      p90Value: 3.5,
      sampleSize: 84,
      unit: 'ratio',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },
    {
      industry: 'Fintech',
      region: 'EU',
      companySize: '201-500',
      growthStage: 'Series C+',
      benchmarkType: 'EFFICIENCY',
      metricName: 'revenue_per_fte',
      p10Value: 180000,
      p25Value: 220000,
      p50Value: 280000,
      p75Value: 350000,
      p90Value: 450000,
      sampleSize: 72,
      unit: 'EUR',
      currency: 'EUR',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
    },

    // Climate Tech benchmarks
    {
      industry: 'Climate Tech',
      region: 'EU',
      companySize: '11-50',
      growthStage: 'Seed',
      benchmarkType: 'STRUCTURE',
      metricName: 'rd_to_gtm_ratio',
      p10Value: 2.0,
      p25Value: 3.0,
      p50Value: 4.0,
      p75Value: 6.0,
      p90Value: 8.0,
      sampleSize: 45,
      unit: 'ratio',
      sourceId: manualSource.id,
      effectiveDate: new Date('2025-01-01'),
      notes: 'Climate tech companies tend to have higher R&D ratios due to deep tech focus',
    },
  ];

  for (const benchmark of sampleBenchmarks) {
    try {
      await prisma.organizationalBenchmark.create({
        data: benchmark,
      });
      console.log(`  ✓ ${benchmark.industry} ${benchmark.region} - ${benchmark.metricName}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`  ⊘ ${benchmark.industry} ${benchmark.region} - ${benchmark.metricName} (already exists)`);
      } else {
        console.error(`  ✗ Error creating benchmark:`, error.message);
      }
    }
  }

  console.log(`\n✅ Created ${sampleBenchmarks.length} organizational benchmarks\n`);

  // 3. Summary
  const totalSources = await prisma.benchmarkSource.count();
  const totalOrgBenchmarks = await prisma.organizationalBenchmark.count();

  console.log('📊 Seeding Summary:');
  console.log(`   • Benchmark Sources: ${totalSources}`);
  console.log(`   • Organizational Benchmarks: ${totalOrgBenchmarks}`);
  console.log('\n✨ Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
