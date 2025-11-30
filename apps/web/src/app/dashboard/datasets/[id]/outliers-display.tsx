'use client';

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OutlierEmployee {
  id: string;
  employeeName: string;
  department: string;
  role?: string;
  totalCompensation: number;
  zScore: number;
  type: 'high' | 'low';
}

interface OutliersDisplayProps {
  employees: Array<{
    id: string;
    employeeName: string | null;
    department: string;
    role: string | null;
    totalCompensation: any;
  }>;
  currency: string;
}

export default function OutliersDisplay({ employees, currency }: OutliersDisplayProps) {
  const [outliers, setOutliers] = useState<OutlierEmployee[]>([]);

  useEffect(() => {
    // Calculate outliers using z-score method
    const compensations = employees.map(emp => Number(emp.totalCompensation));
    const mean = compensations.reduce((sum, val) => sum + val, 0) / compensations.length;
    const variance = compensations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / compensations.length;
    const stdDev = Math.sqrt(variance);

    // Identify outliers (z-score > 2 or < -2)
    const detectedOutliers: OutlierEmployee[] = [];

    employees.forEach(emp => {
      const comp = Number(emp.totalCompensation);
      const zScore = (comp - mean) / stdDev;

      if (Math.abs(zScore) > 2) {
        detectedOutliers.push({
          id: emp.id,
          employeeName: emp.employeeName || 'Unnamed',
          department: emp.department,
          role: emp.role || undefined,
          totalCompensation: comp,
          zScore,
          type: zScore > 0 ? 'high' : 'low',
        });
      }
    });

    // Sort by absolute z-score (most extreme first)
    detectedOutliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
    setOutliers(detectedOutliers);
  }, [employees]);

  if (outliers.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">No Compensation Outliers Detected</h3>
            <p className="text-sm text-green-700 mt-1">
              All employee compensations fall within 2 standard deviations of the mean. This indicates consistent compensation practices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Compensation Outliers ({outliers.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Employees with compensation significantly above or below average (z-score &gt; 2)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {outliers.map((outlier) => (
          <div
            key={outlier.id}
            className={`rounded-lg border p-4 ${
              outlier.type === 'high'
                ? 'border-orange-200 bg-orange-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {outlier.type === 'high' ? (
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{outlier.employeeName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {outlier.department}
                    {outlier.role && ` · ${outlier.role}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Z-score: {outlier.zScore.toFixed(2)} (
                    {outlier.type === 'high' ? 'Above' : 'Below'} average)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {currency} {outlier.totalCompensation.toLocaleString()}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    outlier.type === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {outlier.type === 'high' ? 'High outlier' : 'Low outlier'}
                </span>
              </div>
            </div>

            {/* Severity indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Deviation from mean</span>
                <span>{Math.abs(outlier.zScore).toFixed(1)} std deviations</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute h-full rounded-full transition-all ${
                    outlier.type === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(outlier.zScore) / 4 * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">What does this mean?</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            <span className="font-semibold">High outliers:</span> May indicate senior roles, specialized skills, or potential over-compensation
          </li>
          <li>
            <span className="font-semibold">Low outliers:</span> Could represent junior roles, part-time workers, or potential under-compensation
          </li>
          <li className="mt-2 text-xs">
            Z-score measures how many standard deviations away from the mean. A z-score &gt; 2 or &lt; -2 is considered statistically significant (occurs in ~5% of normally distributed data).
          </li>
        </ul>
      </div>
    </div>
  );
}
