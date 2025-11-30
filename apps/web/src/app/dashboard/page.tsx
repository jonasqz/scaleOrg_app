import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, FileText, TrendingUp } from 'lucide-react';
import { prisma } from '@scleorg/database';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  // Get or create user in database
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: user?.emailAddresses[0]?.emailAddress || '',
      },
    });
  }

  // Fetch user's datasets
  const datasets = await prisma.dataset.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            scleorg
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.firstName || user?.emailAddresses[0].emailAddress}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header with action */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Your Datasets
            </h1>
            <p className="text-gray-600">
              Create and manage your workforce datasets
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Dataset
          </Link>
        </div>

        {/* Datasets Grid */}
        {datasets.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              No datasets yet
            </h2>
            <p className="mb-6 text-gray-600">
              Create your first dataset to start analyzing workforce metrics
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Dataset
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((dataset) => (
              <Link
                key={dataset.id}
                href={`/dashboard/datasets/${dataset.id}`}
                className="group rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {dataset._count.employees} employees
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {dataset.name}
                </h3>
                {dataset.description && (
                  <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                    {dataset.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {new Date(dataset.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-blue-600 group-hover:underline">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Feature Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <BarChart3 className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 font-semibold text-gray-900">
              Instant Analytics
            </h3>
            <p className="text-sm text-gray-600">
              Get comprehensive workforce metrics in under 60 seconds after
              upload
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <TrendingUp className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 font-semibold text-gray-900">
              Benchmark Comparison
            </h3>
            <p className="text-sm text-gray-600">
              Compare your organization against industry standards and best
              practices
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <FileText className="mb-4 h-10 w-10 text-blue-600" />
            <h3 className="mb-2 font-semibold text-gray-900">
              Scenario Planning
            </h3>
            <p className="text-sm text-gray-600">
              Model what-if scenarios for hiring freezes, cost reductions, and
              growth
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 font-semibold text-blue-900">
            🚀 Development in Progress
          </h3>
          <p className="text-sm text-blue-700">
            The file upload and analysis features are currently being built.
            This is the MVP foundation with:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-blue-700">
            <li>✅ Authentication (Clerk)</li>
            <li>✅ Database (PostgreSQL with 9 tables)</li>
            <li>✅ Calculation Engine (complete)</li>
            <li>⏳ File Upload UI (Week 1-2)</li>
            <li>⏳ Dashboard Metrics (Week 3-4)</li>
            <li>⏳ Scenarios & Insights (Week 5-6)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
