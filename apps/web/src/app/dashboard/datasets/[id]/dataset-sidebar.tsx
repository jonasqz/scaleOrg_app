'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  GitCompare,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';

interface DatasetSidebarProps {
  datasetId: string;
  datasetName: string;
}

export default function DatasetSidebar({ datasetId, datasetName }: DatasetSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Overview',
      href: `/dashboard/datasets/${datasetId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Employees',
      href: `/dashboard/datasets/${datasetId}/employees`,
      icon: Users,
    },
    {
      name: 'Analytics',
      href: `/dashboard/datasets/${datasetId}/analytics`,
      icon: TrendingUp,
    },
    {
      name: 'Scenarios',
      href: `/dashboard/datasets/${datasetId}/scenarios`,
      icon: GitCompare,
    },
  ];

  const isActive = (item: typeof navigation[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-5 border-b">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Dataset Name */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {datasetName}
                </h2>
                <p className="text-xs text-gray-500">Workforce Dataset</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t">
            <p className="text-xs text-gray-500">
              Dataset ID: {datasetId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {datasetName}
            </h1>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex overflow-x-auto border-t">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
