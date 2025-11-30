'use client';

import { Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface InsightsDisplayProps {
  metrics: {
    summary: {
      totalFTE: number;
      totalCost: number;
      costPerFTE: number;
      revenuePerFTE?: number;
      employeeCount: number;
    };
    ratios: {
      rdToGTM: number;
      managerToIC: number;
      avgSpanOfControl: number;
      engineersPerPM?: number;
    };
    departments: {
      [key: string]: {
        fte: number;
        cost: number;
        employeeCount: number;
        percentage: number;
      };
    };
    tenure?: {
      avgTenureYears: number;
      retentionRisk: {
        high: any[];
        medium: any[];
      };
    } | null;
  };
  benchmarkComparisons?: {
    rdToGTM: any;
    revenuePerFTE: any;
    spanOfControl: any;
    costPerFTE: any;
  };
  currency: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

export default function InsightsDisplay({ metrics, benchmarkComparisons, currency }: InsightsDisplayProps) {
  const insights: Insight[] = [];

  // Analyze R&D:GTM ratio
  if (metrics.ratios.rdToGTM > 0) {
    if (metrics.ratios.rdToGTM > 3) {
      insights.push({
        id: 'rdgtm-high',
        type: 'warning',
        title: 'R&D to GTM ratio is very high',
        description: `Your R&D to GTM ratio of ${metrics.ratios.rdToGTM.toFixed(2)} is significantly above typical SaaS benchmarks (1.5-2.5).`,
        recommendation: 'Consider increasing GTM investment to better monetize your product development efforts, or evaluate if R&D headcount is optimal.',
      });
    } else if (metrics.ratios.rdToGTM < 1) {
      insights.push({
        id: 'rdgtm-low',
        type: 'warning',
        title: 'R&D to GTM ratio is low',
        description: `Your R&D to GTM ratio of ${metrics.ratios.rdToGTM.toFixed(2)} suggests heavy GTM investment relative to product development.`,
        recommendation: 'Ensure product innovation keeps pace with sales growth. Consider if R&D capacity can support your GTM ambitions.',
      });
    } else {
      insights.push({
        id: 'rdgtm-healthy',
        type: 'success',
        title: 'R&D to GTM ratio is well-balanced',
        description: `Your R&D to GTM ratio of ${metrics.ratios.rdToGTM.toFixed(2)} falls within healthy SaaS benchmarks.`,
      });
    }
  }

  // Analyze span of control
  if (metrics.ratios.avgSpanOfControl > 0) {
    if (metrics.ratios.avgSpanOfControl < 4) {
      insights.push({
        id: 'span-low',
        type: 'warning',
        title: 'Low span of control detected',
        description: `Average span of control is ${metrics.ratios.avgSpanOfControl.toFixed(1)} reports per manager, which is below the 5-7 benchmark.`,
        recommendation: 'Consider flattening organizational structure to reduce management overhead and increase operational efficiency.',
      });
    } else if (metrics.ratios.avgSpanOfControl > 10) {
      insights.push({
        id: 'span-high',
        type: 'warning',
        title: 'High span of control detected',
        description: `Average span of control is ${metrics.ratios.avgSpanOfControl.toFixed(1)} reports per manager, significantly above the 5-7 benchmark.`,
        recommendation: 'Managers may be overextended. Consider adding management layers or reducing direct reports to improve team effectiveness.',
      });
    } else {
      insights.push({
        id: 'span-healthy',
        type: 'success',
        title: 'Span of control is optimal',
        description: `Average span of control of ${metrics.ratios.avgSpanOfControl.toFixed(1)} is within the healthy 5-7 range.`,
      });
    }
  }

  // Analyze department concentration
  const sortedDepts = Object.entries(metrics.departments).sort((a, b) => b[1].percentage - a[1].percentage);
  if (sortedDepts.length > 0 && sortedDepts[0][1].percentage > 50) {
    insights.push({
      id: 'dept-concentration',
      type: 'info',
      title: 'High department cost concentration',
      description: `${sortedDepts[0][0]} represents ${sortedDepts[0][1].percentage.toFixed(1)}% of total workforce cost.`,
      recommendation: 'Ensure this concentration aligns with strategic priorities. High concentration can create organizational risk.',
    });
  }

  // Analyze cost per FTE
  if (metrics.summary.costPerFTE > 0) {
    if (metrics.summary.costPerFTE > 150000) {
      insights.push({
        id: 'cost-high',
        type: 'info',
        title: 'Higher-than-average cost per FTE',
        description: `Cost per FTE of ${currency} ${(metrics.summary.costPerFTE / 1000).toFixed(0)}k suggests senior talent or high-cost locations.`,
        recommendation: 'This may be appropriate for specialized roles, but consider geographic diversification or leveling mix if cost reduction is needed.',
      });
    } else if (metrics.summary.costPerFTE < 80000) {
      insights.push({
        id: 'cost-low',
        type: 'info',
        title: 'Lower-than-average cost per FTE',
        description: `Cost per FTE of ${currency} ${(metrics.summary.costPerFTE / 1000).toFixed(0)}k indicates junior talent or cost-effective locations.`,
        recommendation: 'Ensure compensation is competitive for retention. Low cost can be strategic but watch for attrition risk.',
      });
    }
  }

  // Analyze revenue per FTE (if available)
  if (metrics.summary.revenuePerFTE && metrics.summary.revenuePerFTE > 0) {
    if (metrics.summary.revenuePerFTE > 300000) {
      insights.push({
        id: 'revenue-fte-high',
        type: 'success',
        title: 'Excellent revenue productivity',
        description: `Revenue per FTE of ${currency} ${(metrics.summary.revenuePerFTE / 1000).toFixed(0)}k exceeds strong SaaS benchmarks.`,
        recommendation: 'Maintain this efficiency while scaling. Consider if there\'s room for strategic hiring to capture more market share.',
      });
    } else if (metrics.summary.revenuePerFTE < 150000) {
      insights.push({
        id: 'revenue-fte-low',
        type: 'warning',
        title: 'Revenue per FTE below benchmark',
        description: `Revenue per FTE of ${currency} ${(metrics.summary.revenuePerFTE / 1000).toFixed(0)}k is below typical SaaS targets (200k+).`,
        recommendation: 'Focus on revenue growth or cost optimization. Consider sales productivity, pricing strategy, or headcount efficiency.',
      });
    }
  }

  // Analyze benchmark comparisons if available
  if (benchmarkComparisons) {
    if (benchmarkComparisons.rdToGTM?.severity === 'high') {
      insights.push({
        id: 'bench-rdgtm',
        type: 'critical',
        title: 'R&D:GTM significantly differs from benchmark',
        description: `Your ratio is ${benchmarkComparisons.rdToGTM.status} industry median by a significant margin.`,
        recommendation: 'Review organizational structure alignment with growth stage and market expectations.',
      });
    }

    if (benchmarkComparisons.costPerFTE?.severity === 'high') {
      insights.push({
        id: 'bench-cost',
        type: 'critical',
        title: 'Cost per FTE significantly differs from peers',
        description: `Your cost structure is ${benchmarkComparisons.costPerFTE.status} peer benchmarks.`,
        recommendation: 'Investigate compensation strategy, benefits structure, or geographic mix relative to industry norms.',
      });
    }
  }

  // Manager to IC ratio
  if (metrics.ratios.managerToIC > 0) {
    if (metrics.ratios.managerToIC > 0.25) {
      insights.push({
        id: 'manager-heavy',
        type: 'warning',
        title: 'Management-heavy organization',
        description: `Manager to IC ratio of ${metrics.ratios.managerToIC.toFixed(2)} indicates ${(metrics.ratios.managerToIC * 100).toFixed(0)}% of workforce is in management.`,
        recommendation: 'Typical SaaS companies target 15-20% managers. Consider organizational flattening to reduce overhead.',
      });
    }
  }

  // Company size insights
  if (metrics.summary.employeeCount < 50) {
    insights.push({
      id: 'size-early',
      type: 'info',
      title: 'Early-stage organization',
      description: `At ${metrics.summary.employeeCount} employees, you're in a critical growth phase.`,
      recommendation: 'Focus on hire quality over quantity. Every hire significantly impacts culture and efficiency.',
    });
  } else if (metrics.summary.employeeCount > 250) {
    insights.push({
      id: 'size-scaling',
      type: 'info',
      title: 'Scaling organization',
      description: `With ${metrics.summary.employeeCount} employees, operational efficiency becomes crucial.`,
      recommendation: 'Implement robust processes, clear organizational structure, and data-driven decision making.',
    });
  }

  // Tenure insights
  if (metrics.tenure) {
    const { avgTenureYears, retentionRisk } = metrics.tenure;

    if (avgTenureYears < 1) {
      insights.push({
        id: 'tenure-very-low',
        type: 'critical',
        title: 'Very low average tenure detected',
        description: `Average tenure of ${avgTenureYears.toFixed(1)} years indicates high turnover or rapid growth phase.`,
        recommendation: 'Investigate retention issues. Implement onboarding improvements, career development programs, and regular check-ins with new hires.',
      });
    } else if (avgTenureYears < 1.5) {
      insights.push({
        id: 'tenure-low',
        type: 'warning',
        title: 'Low average tenure',
        description: `Average tenure of ${avgTenureYears.toFixed(1)} years suggests retention challenges or high growth.`,
        recommendation: 'Focus on employee engagement and retention strategies. Review compensation competitiveness and career growth opportunities.',
      });
    } else if (avgTenureYears > 4) {
      insights.push({
        id: 'tenure-high',
        type: 'success',
        title: 'Strong employee retention',
        description: `Average tenure of ${avgTenureYears.toFixed(1)} years indicates excellent employee stability.`,
        recommendation: 'Maintain retention programs while ensuring fresh perspectives through strategic new hires.',
      });
    }

    if (retentionRisk.high.length > 0) {
      insights.push({
        id: 'retention-risk-high',
        type: 'critical',
        title: 'High retention risk identified',
        description: `${retentionRisk.high.length} employees have less than 6 months tenure - critical retention period.`,
        recommendation: 'Implement intensive onboarding support, assign mentors, and schedule 30/60/90 day check-ins to reduce early attrition.',
      });
    }

    if (retentionRisk.medium.length > 3) {
      insights.push({
        id: 'retention-risk-medium',
        type: 'warning',
        title: 'Monitor retention risk',
        description: `${retentionRisk.medium.length} employees are in their first year - important retention window.`,
        recommendation: 'Conduct stay interviews, ensure clear career paths, and provide growth opportunities to retain these employees.',
      });
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTextStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'warning':
        return 'text-yellow-900';
      case 'critical':
        return 'text-red-900';
      default:
        return 'text-blue-900';
    }
  };

  const getDescStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'critical':
        return 'text-red-700';
      default:
        return 'text-blue-700';
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Lightbulb className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI-Powered Insights ({insights.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically generated recommendations based on your workforce metrics
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg border p-4 ${getStyles(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <h3 className={`font-semibold ${getTextStyles(insight.type)}`}>
                  {insight.title}
                </h3>
                <p className={`text-sm mt-1 ${getDescStyles(insight.type)}`}>
                  {insight.description}
                </p>
                {insight.recommendation && (
                  <div className="mt-3 rounded-md bg-white/50 p-3">
                    <p className="text-sm font-medium text-gray-900">Recommendation:</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Note:</span> These insights are generated using industry benchmarks and statistical analysis.
          They should inform but not replace human judgment and context-specific decision making.
        </p>
      </div>
    </div>
  );
}
