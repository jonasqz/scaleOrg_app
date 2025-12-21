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
  Settings,
  DollarSign,
  Wallet,
  Activity,
  Scale,
  UsersRound,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import { useState } from 'react';

interface DatasetSidebarProps {
  datasetId: string;
  datasetName: string;
  onExportClick?: () => void;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
}

export default function DatasetSidebar({ datasetId, datasetName }: DatasetSidebarProps) {
  const pathname = usePathname();
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
  const [planningExpanded, setPlanningExpanded] = useState(true);

  const mainNavigation: NavSection[] = [
    {
      label: 'MAIN',
      items: [
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
      ],
    },
  ];

  const analyticsNavigation: NavItem[] = [
    {
      name: 'Overview',
      href: `/dashboard/datasets/${datasetId}/analytics/overview`,
      icon: BarChart3,
    },
    {
      name: 'Health Score',
      href: `/dashboard/datasets/${datasetId}/analytics/health-score`,
      icon: Activity,
    },
    {
      name: 'Bands',
      href: `/dashboard/datasets/${datasetId}/analytics/bands`,
      icon: Scale,
    },
    {
      name: 'Teams',
      href: `/dashboard/datasets/${datasetId}/analytics/teams`,
      icon: UsersRound,
    },
    {
      name: 'Pay Gap',
      href: `/dashboard/datasets/${datasetId}/analytics/pay-gap`,
      icon: TrendingUp,
    },
    {
      name: 'Insights',
      href: `/dashboard/datasets/${datasetId}/analytics/insights`,
      icon: Lightbulb,
    },
  ];

  const planningNavigation: NavItem[] = [
    {
      name: 'Compensation',
      href: `/dashboard/datasets/${datasetId}/compensation`,
      icon: DollarSign,
    },
    {
      name: 'Cash Flow',
      href: `/dashboard/datasets/${datasetId}/cash-flow`,
      icon: Wallet,
    },
    {
      name: 'Scenarios',
      href: `/dashboard/datasets/${datasetId}/scenarios`,
      icon: GitCompare,
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 ${
          active
            ? 'bg-orange-50 text-orange-600 border border-orange-200'
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
        }`}
      >
        <Icon className={`h-4 w-4 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-stone-200 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-200">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Company Name */}
          <div className="px-4 py-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-semibold text-stone-900 truncate">
                  {datasetName}
                </h2>
                <p className="text-[10px] text-stone-500">Company</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-4">
            {/* Main Section */}
            {mainNavigation.map((section) => (
              <div key={section.label}>
                {section.label && (
                  <div className="px-3 mb-2">
                    <p className="text-[10px] font-semibold text-stone-400 tracking-wider">
                      {section.label}
                    </p>
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => renderNavItem(item))}
                </div>
              </div>
            ))}

            {/* Analytics Section */}
            <div>
              <button
                onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                className="w-full flex items-center justify-between px-3 mb-2 group"
              >
                <p className="text-[10px] font-semibold text-stone-400 tracking-wider group-hover:text-stone-600 transition-colors">
                  ANALYTICS
                </p>
                {analyticsExpanded ? (
                  <ChevronDown className="h-3 w-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                )}
              </button>
              {analyticsExpanded && (
                <div className="space-y-0.5">
                  {analyticsNavigation.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>

            {/* Planning Section */}
            <div>
              <button
                onClick={() => setPlanningExpanded(!planningExpanded)}
                className="w-full flex items-center justify-between px-3 mb-2 group"
              >
                <p className="text-[10px] font-semibold text-stone-400 tracking-wider group-hover:text-stone-600 transition-colors">
                  PLANNING
                </p>
                {planningExpanded ? (
                  <ChevronDown className="h-3 w-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
                )}
              </button>
              {planningExpanded && (
                <div className="space-y-0.5">
                  {planningNavigation.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>

            {/* Settings (standalone) */}
            <div className="pt-2 border-t border-stone-200">
              {renderNavItem({
                name: 'Settings',
                href: `/dashboard/datasets/${datasetId}/settings`,
                icon: Settings,
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-stone-200">
            <p className="text-[10px] text-stone-400">
              ID: {datasetId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden bg-white border-b border-stone-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-stone-500 hover:text-stone-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xs font-semibold text-stone-900 truncate">
              {datasetName}
            </h1>
          </div>
        </div>

        {/* Mobile Navigation - Simplified for mobile, showing main sections */}
        <div className="flex overflow-x-auto border-t border-stone-200">
          {mainNavigation[0].items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                {item.name}
              </Link>
            );
          })}
          {/* Analytics - show as single item */}
          <Link
            href={`/dashboard/datasets/${datasetId}/analytics/overview`}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              pathname?.startsWith(`/dashboard/datasets/${datasetId}/analytics`)
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <BarChart3 className={`h-4 w-4 ${pathname?.startsWith(`/dashboard/datasets/${datasetId}/analytics`) ? 'text-orange-600' : 'text-stone-400'}`} />
            Analytics
          </Link>
          {/* Planning items */}
          {planningNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                {item.name}
              </Link>
            );
          })}
          {/* Settings */}
          <Link
            href={`/dashboard/datasets/${datasetId}/settings`}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              pathname?.startsWith(`/dashboard/datasets/${datasetId}/settings`)
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Settings className={`h-4 w-4 ${pathname?.startsWith(`/dashboard/datasets/${datasetId}/settings`) ? 'text-orange-600' : 'text-stone-400'}`} />
            Settings
          </Link>
        </div>
      </div>
    </>
  );
}
