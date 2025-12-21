'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface HealthScore {
  overallScore: number;
  grade: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  trendChange?: number;
  dimensions: DimensionScore[];
  dataCompleteness: number;
  calculatedAt: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  summary: {
    excellentDimensions: number;
    goodDimensions: number;
    warningDimensions: number;
    criticalDimensions: number;
  };
}

interface DimensionScore {
  dimension: string;
  name: string;
  description: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  metrics: MetricScore[];
  metricsAvailable: number;
  metricsTotal: number;
  dataCompleteness: number;
}

interface MetricScore {
  metricId: string;
  name: string;
  value: number | null;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  formattedValue: string;
  unit: string;
  benchmark?: {
    low: number;
    median: number;
    high: number;
    userPosition: 'below' | 'within' | 'above';
  };
}

interface HealthScoreDashboardProps {
  datasetId: string;
}

export default function HealthScoreDashboard({ datasetId }: HealthScoreDashboardProps) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  useEffect(() => {
    loadHealthScore();
  }, [datasetId]);

  const loadHealthScore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets/${datasetId}/health-score`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load health score');
      }

      setHealthScore(data.healthScore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-stone-600" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xs text-stone-600">Calculating health score...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm text-stone-600">No health score data available</p>
      </div>
    );
  }

  const selectedDim = healthScore.dimensions.find((d) => d.dimension === selectedDimension);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-orange-600" />
              <h2 className="text-lg font-semibold text-stone-900">
                Organizational Health Score
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-600">
              Comprehensive workforce and benchmark analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(healthScore.trend)}
            {healthScore.trendChange !== undefined && (
              <span className="text-xs text-stone-600">
                {healthScore.trendChange > 0 ? '+' : ''}
                {healthScore.trendChange.toFixed(1)} pts
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Score Display */}
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-6 border border-stone-200">
            <div className={`text-6xl font-bold ${getScoreColor(healthScore.overallScore)}`}>
              {healthScore.overallScore.toFixed(0)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-stone-700">
              {healthScore.grade}
            </div>
            <div className={`mt-3 rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(healthScore.status)}`}>
              {healthScore.status.charAt(0).toUpperCase() + healthScore.status.slice(1)}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="rounded-lg bg-white p-6 border border-stone-200">
            <h3 className="text-xs font-medium text-stone-600 mb-3">Dimension Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Excellent
                </span>
                <span className="font-medium text-stone-900">{healthScore.summary.excellentDimensions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Good
                </span>
                <span className="font-medium text-stone-900">{healthScore.summary.goodDimensions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Warning
                </span>
                <span className="font-medium text-stone-900">{healthScore.summary.warningDimensions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Critical
                </span>
                <span className="font-medium text-stone-900">{healthScore.summary.criticalDimensions}</span>
              </div>
            </div>
          </div>

          {/* Data Completeness */}
          <div className="rounded-lg bg-white p-6 border border-stone-200">
            <h3 className="text-xs font-medium text-stone-600 mb-3">Data Quality</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-600">Completeness</span>
                  <span className="font-medium text-stone-900">
                    {healthScore.dataCompleteness.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 transition-all"
                    style={{ width: `${healthScore.dataCompleteness}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-stone-500">
                Based on {healthScore.dimensions.reduce((sum, d) => sum + d.metricsAvailable, 0)} of{' '}
                {healthScore.dimensions.reduce((sum, d) => sum + d.metricsTotal, 0)} metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Health Dimensions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {healthScore.dimensions.map((dimension) => (
            <button
              key={dimension.dimension}
              onClick={() => setSelectedDimension(
                selectedDimension === dimension.dimension ? null : dimension.dimension
              )}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${getStatusColor(dimension.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1">{dimension.name}</h4>
                  <p className="text-[10px] opacity-80 line-clamp-2">{dimension.description}</p>
                </div>
                {getStatusIcon(dimension.status)}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                    {dimension.score.toFixed(0)}
                  </div>
                  <p className="text-[10px] opacity-70">
                    {dimension.metricsAvailable}/{dimension.metricsTotal} metrics
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-white/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    dimension.status === 'excellent' ? 'bg-green-600' :
                    dimension.status === 'good' ? 'bg-blue-600' :
                    dimension.status === 'warning' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${dimension.score}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Dimension Details */}
      {selectedDim && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-stone-900">{selectedDim.name}</h3>
              <p className="text-xs text-stone-600 mt-1">{selectedDim.description}</p>
            </div>
            <button
              onClick={() => setSelectedDimension(null)}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            {selectedDim.metrics.map((metric) => (
              <div
                key={metric.metricId}
                className={`rounded-lg border p-3 ${
                  metric.value === null ? 'bg-stone-50 opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xs font-medium text-stone-900">{metric.name}</h4>
                    {metric.value !== null && metric.benchmark && (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Benchmark: {metric.benchmark.low.toFixed(0)} - {metric.benchmark.high.toFixed(0)}
                        {' • '}
                        <span className={
                          metric.benchmark.userPosition === 'within' ? 'text-green-600' :
                          metric.benchmark.userPosition === 'above' ? 'text-blue-600' :
                          'text-yellow-600'
                        }>
                          {metric.benchmark.userPosition}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                      {metric.formattedValue}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Score: {metric.score.toFixed(0)}/100
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {healthScore.strengths.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-1 text-xs text-green-800">
            {healthScore.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {healthScore.improvements.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Areas for Improvement
          </h3>
          <ul className="space-y-1 text-xs text-yellow-800">
            {healthScore.improvements.map((improvement, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Recommendations
        </h3>
        <ul className="space-y-1 text-xs text-orange-800">
          {healthScore.recommendations.map((recommendation, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
