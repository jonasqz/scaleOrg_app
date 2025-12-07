// Admin page for managing benchmarks
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@scleorg/database';
import BenchmarkAdminTabs from './benchmark-admin-tabs';

export default async function AdminBenchmarksPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  // TODO: Add proper admin role check
  // For now, any authenticated user can access admin

  // Fetch initial data for the admin interface
  const sources = await prisma.benchmarkSource.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          organizationalBenchmarks: true,
        },
      },
    },
  });

  const organizationalBenchmarks = await prisma.organizationalBenchmark.findMany({
    orderBy: [
      { effectiveDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
    include: {
      source: true,
    },
  });

  // Get unique values for filters
  const uniqueIndustries = Array.from(
    new Set(organizationalBenchmarks.map((b) => b.industry))
  ).sort();

  const uniqueRegions = Array.from(
    new Set(organizationalBenchmarks.map((b) => b.region))
  ).sort();

  const uniqueCompanySizes = Array.from(
    new Set(organizationalBenchmarks.map((b) => b.companySize))
  ).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Benchmark Administration</h1>
        <p className="mt-2 text-gray-600">
          Manage organizational benchmarks and data sources
        </p>
      </div>

      <BenchmarkAdminTabs
        initialSources={sources}
        initialOrganizationalBenchmarks={organizationalBenchmarks}
        uniqueIndustries={uniqueIndustries}
        uniqueRegions={uniqueRegions}
        uniqueCompanySizes={uniqueCompanySizes}
      />
    </div>
  );
}
