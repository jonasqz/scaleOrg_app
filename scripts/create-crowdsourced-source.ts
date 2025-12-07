/**
 * Script to create the Customer Crowdsourced benchmark source
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Customer Crowdsourced benchmark source...\n');

  const source = await prisma.benchmarkSource.upsert({
    where: { name: 'Customer Crowdsourced' },
    update: {},
    create: {
      name: 'Customer Crowdsourced',
      type: 'CROWDSOURCED',
      description: 'Anonymized and aggregated data from customer uploads',
      reliability: 'Medium',
      updateFrequency: 'Continuous',
      isActive: true,
    },
  });

  console.log('✓ Created/found source: ' + source.name);
  console.log('  ID: ' + source.id);
  console.log('  Type: ' + source.type);
  console.log('  Status: ' + (source.isActive ? 'Active' : 'Inactive') + '\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
