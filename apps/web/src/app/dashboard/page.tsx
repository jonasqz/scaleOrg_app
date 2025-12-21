import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, FileText, TrendingUp, Settings } from 'lucide-react';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { prisma } from '@scleorg/database';

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

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

  // Fetch datasets based on active organization context
  // If orgId is set: show organization datasets
  // If no orgId: show personal datasets
  const datasets = await prisma.dataset.findMany({
    where: orgId
      ? { organizationId: orgId } // Organization context
      : { userId: dbUser.id, organizationId: null }, // Personal context
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          companyName: true,
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  // Check if onboarding is needed - only redirect if:
  // 1. User has NOT completed onboarding AND
  // 2. User has NO existing datasets (brand new user)
  if (!dbUser.onboardingCompleted && datasets.length === 0) {
    redirect('/onboarding/welcome');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-orange-600">
            scleorg
          </Link>
          <div className="flex items-center gap-4">
            <OrganizationSwitcher
              hidePersonal={false}
              appearance={{
                elements: {
                  rootBox: 'flex items-center',
                  organizationSwitcherTrigger: 'text-xs',
                },
              }}
            />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header with action */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              Your Companies
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Create and manage your companies
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Company
          </Link>
        </div>

        {/* Companies Grid */}
        {datasets.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-stone-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-stone-400" />
            <h2 className="mb-1 text-sm font-semibold text-stone-900">
              No companies yet
            </h2>
            <p className="mb-4 text-xs text-stone-600">
              Create your first company to start analyzing workforce metrics
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Company
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((dataset: any) => (
              <Link
                key={dataset.id}
                href={`/dashboard/datasets/${dataset.id}`}
                className="group rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-medium text-orange-700">
                      {dataset._count.employees} employees
                    </span>
                    {dataset.isDemo && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-medium text-purple-700">
                        Demo Data
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-stone-900 group-hover:text-orange-600">
                  {dataset.name}
                </h3>
                {dataset.description && (
                  <p className="mb-3 text-xs text-stone-600 line-clamp-2">
                    {dataset.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    {new Date(dataset.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-orange-600 group-hover:underline">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Feature Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <BarChart3 className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="mb-1 text-xs font-semibold text-stone-900">
              Instant Analytics
            </h3>
            <p className="text-[11px] text-stone-600">
              Get comprehensive workforce metrics in under 60 seconds after
              upload
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <TrendingUp className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="mb-1 text-xs font-semibold text-stone-900">
              Benchmark Comparison
            </h3>
            <p className="text-[11px] text-stone-600">
              Compare your organization against industry standards and best
              practices
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <FileText className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="mb-1 text-xs font-semibold text-stone-900">
              Scenario Planning
            </h3>
            <p className="text-[11px] text-stone-600">
              Model what-if scenarios for hiring freezes, cost reductions, and
              growth
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-1 text-xs font-semibold text-blue-900">
            🚀 Development in Progress
          </h3>
          <p className="text-[11px] text-blue-700">
            The file upload and analysis features are currently being built.
            This is the MVP foundation with:
          </p>
          <ul className="mt-3 space-y-1.5 text-[11px] text-blue-700">
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
