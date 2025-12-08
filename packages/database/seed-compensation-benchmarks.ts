// Seed script for compensation benchmarks
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding compensation benchmarks...\n');

  // Sample compensation benchmarks for common roles in SaaS companies
  const compensationBenchmarks = [
    // Engineering roles - Junior (IC) - DACH
    {
      roleFamily: 'Engineering',
      standardizedTitle: 'Software Engineer',
      seniorityLevel: 'Junior',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 42000,
      p25TotalComp: 48000,
      p50TotalComp: 55000,
      p75TotalComp: 62000,
      p90TotalComp: 70000,
      p10BaseSalary: 40000,
      p25BaseSalary: 45000,
      p50BaseSalary: 52000,
      p75BaseSalary: 58000,
      p90BaseSalary: 65000,
      sampleSize: 145,
      currency: 'EUR',
    },

    // Engineering roles - Mid (IC) - DACH
    {
      roleFamily: 'Engineering',
      standardizedTitle: 'Software Engineer',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 55000,
      p25TotalComp: 63000,
      p50TotalComp: 72000,
      p75TotalComp: 82000,
      p90TotalComp: 95000,
      p10BaseSalary: 52000,
      p25BaseSalary: 60000,
      p50BaseSalary: 68000,
      p75BaseSalary: 78000,
      p90BaseSalary: 90000,
      sampleSize: 238,
      currency: 'EUR',
    },

    // Engineering roles - Senior (IC) - DACH
    {
      roleFamily: 'Engineering',
      standardizedTitle: 'Software Engineer',
      seniorityLevel: 'Senior',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 72000,
      p25TotalComp: 82000,
      p50TotalComp: 95000,
      p75TotalComp: 110000,
      p90TotalComp: 130000,
      p10BaseSalary: 68000,
      p25BaseSalary: 78000,
      p50BaseSalary: 90000,
      p75BaseSalary: 105000,
      p90BaseSalary: 120000,
      sampleSize: 198,
      currency: 'EUR',
    },

    // Engineering roles - Manager - DACH
    {
      roleFamily: 'Engineering',
      standardizedTitle: 'Engineering Manager',
      seniorityLevel: 'Manager',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 85000,
      p25TotalComp: 95000,
      p50TotalComp: 110000,
      p75TotalComp: 130000,
      p90TotalComp: 150000,
      p10BaseSalary: 80000,
      p25BaseSalary: 90000,
      p50BaseSalary: 105000,
      p75BaseSalary: 125000,
      p90BaseSalary: 145000,
      sampleSize: 87,
      currency: 'EUR',
    },

    // Engineering roles - Director - DACH
    {
      roleFamily: 'Engineering',
      standardizedTitle: 'Engineering Director',
      seniorityLevel: 'Director',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 110000,
      p25TotalComp: 130000,
      p50TotalComp: 150000,
      p75TotalComp: 180000,
      p90TotalComp: 220000,
      p10BaseSalary: 105000,
      p25BaseSalary: 125000,
      p50BaseSalary: 145000,
      p75BaseSalary: 170000,
      p90BaseSalary: 200000,
      sampleSize: 42,
      currency: 'EUR',
    },

    // Sales roles - Junior - DACH
    {
      roleFamily: 'Sales',
      standardizedTitle: 'Account Executive',
      seniorityLevel: 'Junior',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 45000,
      p25TotalComp: 52000,
      p50TotalComp: 60000,
      p75TotalComp: 70000,
      p90TotalComp: 85000,
      p10BaseSalary: 40000,
      p25BaseSalary: 45000,
      p50BaseSalary: 52000,
      p75BaseSalary: 60000,
      p90BaseSalary: 70000,
      sampleSize: 112,
      currency: 'EUR',
    },

    // Sales roles - Mid - DACH
    {
      roleFamily: 'Sales',
      standardizedTitle: 'Account Executive',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 60000,
      p25TotalComp: 70000,
      p50TotalComp: 85000,
      p75TotalComp: 105000,
      p90TotalComp: 130000,
      p10BaseSalary: 52000,
      p25BaseSalary: 60000,
      p50BaseSalary: 70000,
      p75BaseSalary: 82000,
      p90BaseSalary: 95000,
      sampleSize: 156,
      currency: 'EUR',
    },

    // Sales roles - Senior - DACH
    {
      roleFamily: 'Sales',
      standardizedTitle: 'Account Executive',
      seniorityLevel: 'Senior',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 85000,
      p25TotalComp: 100000,
      p50TotalComp: 125000,
      p75TotalComp: 155000,
      p90TotalComp: 190000,
      p10BaseSalary: 68000,
      p25BaseSalary: 78000,
      p50BaseSalary: 92000,
      p75BaseSalary: 110000,
      p90BaseSalary: 130000,
      sampleSize: 93,
      currency: 'EUR',
    },

    // Product roles - Mid - DACH
    {
      roleFamily: 'Product',
      standardizedTitle: 'Product Manager',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 62000,
      p25TotalComp: 72000,
      p50TotalComp: 85000,
      p75TotalComp: 100000,
      p90TotalComp: 120000,
      p10BaseSalary: 58000,
      p25BaseSalary: 68000,
      p50BaseSalary: 80000,
      p75BaseSalary: 95000,
      p90BaseSalary: 110000,
      sampleSize: 78,
      currency: 'EUR',
    },

    // Product roles - Senior - DACH
    {
      roleFamily: 'Product',
      standardizedTitle: 'Product Manager',
      seniorityLevel: 'Senior',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 82000,
      p25TotalComp: 95000,
      p50TotalComp: 112000,
      p75TotalComp: 135000,
      p90TotalComp: 160000,
      p10BaseSalary: 78000,
      p25BaseSalary: 90000,
      p50BaseSalary: 105000,
      p75BaseSalary: 125000,
      p90BaseSalary: 145000,
      sampleSize: 64,
      currency: 'EUR',
    },

    // Marketing roles - Mid - DACH
    {
      roleFamily: 'Marketing',
      standardizedTitle: 'Marketing Manager',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 52000,
      p25TotalComp: 60000,
      p50TotalComp: 70000,
      p75TotalComp: 82000,
      p90TotalComp: 95000,
      p10BaseSalary: 50000,
      p25BaseSalary: 57000,
      p50BaseSalary: 66000,
      p75BaseSalary: 78000,
      p90BaseSalary: 90000,
      sampleSize: 89,
      currency: 'EUR',
    },

    // Design roles - Mid - DACH
    {
      roleFamily: 'Design',
      standardizedTitle: 'Product Designer',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 52000,
      p25TotalComp: 60000,
      p50TotalComp: 70000,
      p75TotalComp: 82000,
      p90TotalComp: 95000,
      p10BaseSalary: 50000,
      p25BaseSalary: 58000,
      p50BaseSalary: 68000,
      p75BaseSalary: 78000,
      p90BaseSalary: 88000,
      sampleSize: 71,
      currency: 'EUR',
    },

    // Operations roles - Mid - DACH
    {
      roleFamily: 'Operations',
      standardizedTitle: 'Operations Manager',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 52000,
      p25TotalComp: 62000,
      p50TotalComp: 72000,
      p75TotalComp: 85000,
      p90TotalComp: 100000,
      p10BaseSalary: 50000,
      p25BaseSalary: 60000,
      p50BaseSalary: 70000,
      p75BaseSalary: 82000,
      p90BaseSalary: 95000,
      sampleSize: 56,
      currency: 'EUR',
    },

    // People & Talent roles - Mid - DACH
    {
      roleFamily: 'People & Talent',
      standardizedTitle: 'Recruiter',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 48000,
      p25TotalComp: 55000,
      p50TotalComp: 65000,
      p75TotalComp: 75000,
      p90TotalComp: 88000,
      p10BaseSalary: 45000,
      p25BaseSalary: 52000,
      p50BaseSalary: 62000,
      p75BaseSalary: 72000,
      p90BaseSalary: 82000,
      sampleSize: 67,
      currency: 'EUR',
    },

    // Finance roles - Mid - DACH
    {
      roleFamily: 'Finance',
      standardizedTitle: 'Financial Analyst',
      seniorityLevel: 'Mid',
      industry: 'SaaS',
      region: 'DACH',
      companySize: '51-200',
      p10TotalComp: 52000,
      p25TotalComp: 60000,
      p50TotalComp: 70000,
      p75TotalComp: 82000,
      p90TotalComp: 95000,
      p10BaseSalary: 50000,
      p25BaseSalary: 58000,
      p50BaseSalary: 68000,
      p75BaseSalary: 78000,
      p90BaseSalary: 90000,
      sampleSize: 54,
      currency: 'EUR',
    },
  ];

  console.log(`Creating ${compensationBenchmarks.length} compensation benchmarks...\n`);

  let created = 0;
  let skipped = 0;

  for (const benchmark of compensationBenchmarks) {
    try {
      await prisma.compensationBenchmark.create({
        data: benchmark,
      });
      console.log(`  ✓ ${benchmark.roleFamily} - ${benchmark.seniorityLevel} (${benchmark.region})`);
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`  ⊘ ${benchmark.roleFamily} - ${benchmark.seniorityLevel} (already exists)`);
        skipped++;
      } else {
        console.error(`  ✗ Error creating benchmark:`, error.message);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   • Created: ${created} benchmarks`);
  console.log(`   • Skipped: ${skipped} (already existed)`);
  console.log(`   • Total: ${await prisma.compensationBenchmark.count()} compensation benchmarks in database\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
