'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface HealthScoreCardProps {
  datasetId: string;
}

export default function HealthScoreCard({ datasetId }: HealthScoreCardProps) {
  const [score, setScore] = useState<number | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [trend, setTrend] = useState<string>('unknown');
  const [trendChange, setTrendChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadHealthScore();
  }, [datasetId]);

  const loadHealthScore = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/datasets/${datasetId}/health-score`);
      const data = await response.json();

      if (response.ok && data.healthScore) {
        setScore(data.healthScore.overallScore);
        setGrade(data.healthScore.grade);
        setStatus(data.healthScore.status);
        setTrend(data.healthScore.trend);
        setTrendChange(data.healthScore.trendChange);
      } else {
        console.error('Health score API error:', data);
        setError(data.error || data.details || 'Failed to load health score');
      }
    } catch (err) {
      console.error('Failed to load health score:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-stone-50 border-stone-200 text-stone-700';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
      case 'stable':
        return <Minus className="h-3.5 w-3.5 text-stone-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          <h3 className="text-sm font-semibold text-stone-900">Health Score</h3>
        </div>
        <div className="mt-3 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-yellow-600" />
          <h3 className="text-sm font-semibold text-yellow-900">Health Score</h3>
        </div>
        <p className="text-xs text-yellow-700">{error}</p>
        <button
          onClick={loadHealthScore}
          className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (score === null) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-stone-600" />
          <h3 className="text-sm font-semibold text-stone-900">Health Score</h3>
        </div>
        <p className="text-xs text-stone-600">No data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusBgColor(status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Health Score</h3>
        </div>
        <Link
          href={`/dashboard/datasets/${datasetId}/analytics/health-score`}
          className="text-xs hover:underline flex items-center gap-1"
        >
          Details
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(0)}
          </div>
          <div className="text-xl font-semibold mt-1">
            {grade}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs">
            {getTrendIcon()}
            {trendChange !== null && trendChange !== undefined && (
              <span>
                {trendChange > 0 ? '+' : ''}
                {trendChange.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-[10px] opacity-70 mt-1">
            {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] opacity-70">
        Based on 6 health dimensions
      </div>
    </div>
  );
}
