'use client';

import React from 'react';

interface SlideTemplateProps {
  children: React.ReactNode;
  slideNumber?: number;
  totalSlides?: number;
  title?: string;
  showFooter?: boolean;
}

export function SlideTemplate({
  children,
  slideNumber,
  totalSlides,
  title,
  showFooter = true,
}: SlideTemplateProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative h-[768px] w-[1024px] bg-white p-16 print:break-after-page">
      {/* Slide Content */}
      <div className="h-full flex flex-col">
        {title && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1e3a8a]">{title}</h2>
            <div className="mt-2 h-1 w-20 bg-gradient-to-r from-[#0891b2] to-[#2563eb]"></div>
          </div>
        )}

        <div className="flex-1">{children}</div>
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="absolute bottom-8 left-16 right-16 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500">
          <div>Prepared by ScaleOrg</div>
          <div>{today}</div>
          {slideNumber && totalSlides && (
            <div>
              {slideNumber} / {totalSlides}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CoverSlideProps {
  companyName: string;
  datasetName: string;
}

export function CoverSlide({ companyName, datasetName }: CoverSlideProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative h-[768px] w-[1024px] bg-gradient-to-br from-[#1e3a8a] to-[#0891b2] p-16 print:break-after-page">
      <div className="flex h-full flex-col justify-between">
        {/* Top section */}
        <div>
          <div className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            Confidential
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-6">
          <h1 className="text-6xl font-bold text-white">
            Workforce Analytics
            <br />
            Report
          </h1>
          <div className="h-2 w-32 bg-white/40"></div>
          <div className="space-y-2 text-xl text-white/90">
            <p className="font-semibold">{companyName}</p>
            <p className="text-lg text-white/70">{datasetName}</p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex items-end justify-between">
          <div className="text-white/70">
            <div className="text-sm">Prepared by</div>
            <div className="text-2xl font-bold">ScaleOrg</div>
          </div>
          <div className="text-right text-white/70">
            <div className="text-sm">Report Date</div>
            <div className="text-lg font-semibold">{today}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  trendValue,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="mt-2 text-4xl font-bold text-[#1e3a8a]">{value}</div>
      {subtitle && (
        <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
      )}
      {trend && trendValue && (
        <div
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            trend === 'up'
              ? 'bg-green-100 text-green-700'
              : trend === 'down'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {trendValue}
        </div>
      )}
    </div>
  );
}

interface InsightCalloutProps {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}

export function InsightCallout({
  type,
  title,
  description,
}: InsightCalloutProps) {
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100',
      iconText: 'text-green-600',
      title: 'text-green-900',
      text: 'text-green-700',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-100',
      iconText: 'text-orange-600',
      title: 'text-orange-900',
      text: 'text-orange-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100',
      iconText: 'text-blue-600',
      title: 'text-blue-900',
      text: 'text-blue-700',
    },
  };

  const style = colors[type];

  return (
    <div
      className={`flex gap-4 rounded-lg border ${style.border} ${style.bg} p-4`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.icon}`}
      >
        <div className={`text-lg font-bold ${style.iconText}`}>!</div>
      </div>
      <div>
        <div className={`font-semibold ${style.title}`}>{title}</div>
        <div className={`mt-1 text-sm ${style.text}`}>{description}</div>
      </div>
    </div>
  );
}
