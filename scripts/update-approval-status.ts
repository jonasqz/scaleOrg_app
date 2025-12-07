/**
 * Script to update existing benchmarks with approval status
 * All existing benchmarks should be set to APPROVED since they were manually created
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating existing benchmarks with approval status...\n');

  // Update all existing benchmarks to APPROVED
  const result = await prisma.organizationalBenchmark.updateMany({
    where: {
      approvalStatus: 'PENDING', // Only update those that are still pending
    },
    data: {
      approvalStatus: 'APPROVED',
    },
  });

  console.log(`✓ Updated ${result.count} benchmarks to APPROVED status\n`);

  // Show summary
  const total = await prisma.organizationalBenchmark.count();
  const approved = await prisma.organizationalBenchmark.count({
    where: { approvalStatus: 'APPROVED' },
  });
  const pending = await prisma.organizationalBenchmark.count({
    where: { approvalStatus: 'PENDING' },
  });
  const rejected = await prisma.organizationalBenchmark.count({
    where: { approvalStatus: 'REJECTED' },
  });

  console.log('Summary:');
  console.log(`Total benchmarks: ${total}`);
  console.log(`APPROVED: ${approved}`);
  console.log(`PENDING: ${pending}`);
  console.log(`REJECTED: ${rejected}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
