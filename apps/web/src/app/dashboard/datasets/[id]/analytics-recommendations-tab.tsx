'use client';

import { Lightbulb, TrendingUp, Users, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalyticsRecommendationsTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
}

type RecommendationType = 'critical' | 'high' | 'medium' | 'low' | 'positive';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: RecommendationType;
  category: 'cost' | 'structure' | 'efficiency' | 'growth' | 'retention';
  action: string;
}

export default function AnalyticsRecommendationsTab({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
}: AnalyticsRecommendationsTabProps) {
  if (!metrics) {
    return <div>No metrics available</div>;
  }

  const recommendations: Recommendation[] = [];
  const totalRevenue = dataset.totalRevenue ? Number(dataset.totalRevenue) : 0;
  const totalFTE = metrics.summary.totalFTE;

  // Calculate span of control metrics
  const managers = employees.filter(emp =>
    employees.some(e => e.managerId === emp.id)
  );

  const spanOfControlData = managers.map(mgr => {
    const directReports = employees.filter(e => e.managerId === mgr.id);
    return {
      managerId: mgr.id,
      directReportsCount: directReports.length,
    };
  }).filter(mgr => mgr.directReportsCount > 0);

  const avgSpanOfControl = spanOfControlData.length > 0
    ? spanOfControlData.reduce((sum, mgr) => sum + mgr.directReportsCount, 0) / spanOfControlData.length
    : 0;

  const lowSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount < 5);
  const highSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount > 10);

  // R&D to GTM ratio
  const rdToGTM = metrics.ratios.rdToGTM;

  // Management percentage
  const managementCount = employees.filter(emp =>
    emp.level && ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(emp.level)
  ).length;
  const managementPercentage = (managementCount / employees.length) * 100;

  // Employees without levels
  const notSetCount = employees.filter(emp => !emp.level).length;

  // Department cost analysis
  const deptCostAnalysis = Object.entries(metrics.departments).map(([dept, data]: [string, any]) => ({
    dept,
    costPercentage: data.percentage,
    headcountPercentage: (data.employeeCount / employees.length) * 100,
  }));

  // Revenue efficiency
  const avgRevenuePerFTE = totalRevenue > 0 ? totalRevenue / totalFTE : 0;

  // RECOMMENDATION 1: Span of Control - Low
  if (lowSpanManagers.length > 0) {
    recommendations.push({
      id: 'span-low',
      title: `${lowSpanManagers.length} Manager${lowSpanManagers.length > 1 ? 's' : ''} with Low Span of Control`,
      description: `${lowSpanManagers.length} manager${lowSpanManagers.length > 1 ? 's have' : ' has'} fewer than 5 direct reports. This may indicate over-management or an opportunity to consolidate teams.`,
      impact: `Consolidating could save ${currency} ${(lowSpanManagers.length * 100000).toLocaleString()} - ${(lowSpanManagers.length * 150000).toLocaleString()} annually`,
      priority: 'high',
      category: 'structure',
      action: 'Review team structures and consider consolidating management layers or redistributing direct reports.',
    });
  }

  // RECOMMENDATION 2: Span of Control - High
  if (highSpanManagers.length > 0) {
    recommendations.push({
      id: 'span-high',
      title: `${highSpanManagers.length} Manager${highSpanManagers.length > 1 ? 's' : ''} with High Span of Control`,
      description: `${highSpanManagers.length} manager${highSpanManagers.length > 1 ? 's have' : ' has'} more than 10 direct reports. This may lead to management burnout and reduced team effectiveness.`,
      impact: 'Risk of reduced team productivity, lower employee satisfaction, and manager burnout',
      priority: 'critical',
      category: 'structure',
      action: 'Consider adding middle management or splitting large teams to reduce management burden.',
    });
  }

  // RECOMMENDATION 3: Average Span of Control
  if (avgSpanOfControl < 5 && avgSpanOfControl > 0) {
    recommendations.push({
      id: 'avg-span-low',
      title: 'Overall Span of Control Below Industry Standard',
      description: `Your average span of control is ${avgSpanOfControl.toFixed(1)}, below the industry benchmark of 5-8. This suggests your organization may have too many management layers.`,
      impact: 'Opportunity to reduce management overhead and flatten organizational structure',
      priority: 'medium',
      category: 'structure',
      action: 'Consider consolidating management layers to improve efficiency and reduce costs.',
    });
  } else if (avgSpanOfControl > 8) {
    recommendations.push({
      id: 'avg-span-high',
      title: 'Overall Span of Control Above Industry Standard',
      description: `Your average span of control is ${avgSpanOfControl.toFixed(1)}, above the industry benchmark of 5-8. Managers may be stretched too thin.`,
      impact: 'Risk of reduced management effectiveness and team support',
      priority: 'medium',
      category: 'structure',
      action: 'Consider adding managers to provide better support and oversight for teams.',
    });
  } else if (avgSpanOfControl >= 5 && avgSpanOfControl <= 8) {
    recommendations.push({
      id: 'span-optimal',
      title: 'Optimal Span of Control',
      description: `Your average span of control (${avgSpanOfControl.toFixed(1)}) is within the industry benchmark of 5-8 direct reports per manager.`,
      impact: 'Well-balanced management structure supporting effective team oversight',
      priority: 'positive',
      category: 'structure',
      action: 'Maintain current management structure and monitor as organization grows.',
    });
  }

  // RECOMMENDATION 4: R&D to GTM Ratio
  if (rdToGTM > 3) {
    recommendations.push({
      id: 'rd-gtm-high',
      title: 'Very R&D Heavy Organization',
      description: `Your R&D to GTM ratio is ${rdToGTM.toFixed(2)}, significantly above typical SaaS benchmarks (1.5-2.5). You have ${rdToGTM.toFixed(2)}x more R&D staff than GTM.`,
      impact: 'May limit go-to-market effectiveness and revenue growth potential',
      priority: 'high',
      category: 'growth',
      action: 'Consider increasing GTM headcount (Sales, Marketing, Customer Success) to better monetize your R&D investments.',
    });
  } else if (rdToGTM < 1) {
    recommendations.push({
      id: 'rd-gtm-low',
      title: 'GTM Heavy Organization',
      description: `Your R&D to GTM ratio is ${rdToGTM.toFixed(2)}, below typical SaaS benchmarks (1.5-2.5). You have more GTM staff than R&D.`,
      impact: 'May limit product innovation and long-term competitive advantage',
      priority: 'medium',
      category: 'growth',
      action: 'Consider investing more in R&D to ensure product innovation keeps pace with market demands.',
    });
  } else if (rdToGTM >= 1.5 && rdToGTM <= 2.5) {
    recommendations.push({
      id: 'rd-gtm-balanced',
      title: 'Balanced R&D to GTM Ratio',
      description: `Your R&D to GTM ratio (${rdToGTM.toFixed(2)}) is within the typical SaaS benchmark range of 1.5-2.5.`,
      impact: 'Well-balanced investment between product development and go-to-market',
      priority: 'positive',
      category: 'growth',
      action: 'Maintain this balance as you scale, adjusting based on growth stage and market dynamics.',
    });
  }

  // RECOMMENDATION 5: Management Percentage
  if (managementPercentage > 30) {
    recommendations.push({
      id: 'mgmt-heavy',
      title: 'High Management Percentage',
      description: `Management (Manager+ levels) makes up ${managementPercentage.toFixed(1)}% of your workforce, which is above typical benchmarks (15-25%).`,
      impact: `Opportunity to reduce overhead costs by ${currency} ${((managementPercentage - 25) * totalFTE * 120000).toLocaleString()}`,
      priority: 'high',
      category: 'cost',
      action: 'Review organizational structure to identify opportunities to flatten hierarchy and reduce management layers.',
    });
  } else if (managementPercentage < 15) {
    recommendations.push({
      id: 'mgmt-light',
      title: 'Low Management Percentage',
      description: `Management makes up only ${managementPercentage.toFixed(1)}% of your workforce, which is below typical benchmarks (15-25%).`,
      impact: 'Individual contributors may lack adequate support and career growth paths',
      priority: 'medium',
      category: 'structure',
      action: 'Consider adding management positions to provide better career paths and team support.',
    });
  }

  // RECOMMENDATION 6: Missing Level Data
  if (notSetCount > 0) {
    const percentage = (notSetCount / employees.length) * 100;
    recommendations.push({
      id: 'missing-levels',
      title: 'Incomplete Seniority Level Data',
      description: `${notSetCount} employees (${percentage.toFixed(1)}%) don't have seniority levels set.`,
      impact: 'Limits ability to analyze career progression, compensation equity, and organizational structure',
      priority: percentage > 20 ? 'high' : 'medium',
      category: 'structure',
      action: 'Complete seniority level data for all employees to enable better workforce analytics.',
    });
  }

  // RECOMMENDATION 7: Revenue Efficiency
  if (totalRevenue > 0 && avgRevenuePerFTE > 0) {
    if (avgRevenuePerFTE < 100000) {
      recommendations.push({
        id: 'revenue-efficiency-low',
        title: 'Below-Average Revenue per FTE',
        description: `Your revenue per FTE is ${currency} ${(avgRevenuePerFTE / 1000).toFixed(0)}k, which is below typical SaaS benchmarks (${currency}150k-250k).`,
        impact: 'Indicates potential inefficiencies in revenue generation or overstaffing',
        priority: 'critical',
        category: 'efficiency',
        action: 'Focus on revenue growth initiatives, improve sales efficiency, or optimize headcount.',
      });
    } else if (avgRevenuePerFTE >= 150000 && avgRevenuePerFTE <= 250000) {
      recommendations.push({
        id: 'revenue-efficiency-good',
        title: 'Strong Revenue per FTE',
        description: `Your revenue per FTE (${currency} ${(avgRevenuePerFTE / 1000).toFixed(0)}k) is within typical SaaS benchmarks (${currency}150k-250k).`,
        impact: 'Indicates efficient revenue generation and good workforce productivity',
        priority: 'positive',
        category: 'efficiency',
        action: 'Maintain this efficiency as you scale and monitor for any decline.',
      });
    } else if (avgRevenuePerFTE > 250000) {
      recommendations.push({
        id: 'revenue-efficiency-excellent',
        title: 'Excellent Revenue per FTE',
        description: `Your revenue per FTE (${currency} ${(avgRevenuePerFTE / 1000).toFixed(0)}k) is above typical SaaS benchmarks (${currency}150k-250k).`,
        impact: 'Outstanding efficiency - potential opportunity to reinvest in growth',
        priority: 'positive',
        category: 'efficiency',
        action: 'Consider strategic hiring to accelerate growth while maintaining strong unit economics.',
      });
    }
  }

  // RECOMMENDATION 8: Department Cost vs Headcount Imbalance
  deptCostAnalysis.forEach(({ dept, costPercentage, headcountPercentage }) => {
    const diff = costPercentage - headcountPercentage;
    if (Math.abs(diff) > 15) {
      if (diff > 0) {
        recommendations.push({
          id: `dept-cost-high-${dept}`,
          title: `${dept}: High Cost per Employee`,
          description: `${dept} represents ${costPercentage.toFixed(1)}% of total cost but only ${headcountPercentage.toFixed(1)}% of headcount (${diff.toFixed(1)}% difference).`,
          impact: 'May indicate high-cost roles or compensation that should be reviewed',
          priority: diff > 25 ? 'medium' : 'low',
          category: 'cost',
          action: `Review ${dept} compensation and role distribution to ensure alignment with business value.`,
        });
      }
    }
  });

  // Sort recommendations by priority
  const priorityOrder: Record<RecommendationType, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    positive: 5,
  };

  const sortedRecommendations = recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
  const highCount = recommendations.filter(r => r.priority === 'high').length;
  const positiveCount = recommendations.filter(r => r.priority === 'positive').length;

  const getPriorityBadge = (priority: RecommendationType) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityIcon = (priority: RecommendationType) => {
    switch (priority) {
      case 'critical':
      case 'high':
      case 'medium':
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      case 'positive':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cost':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'structure':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'efficiency':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'retention':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-xl font-bold text-stone-900">
            {criticalCount + highCount}
          </p>
          <p className="text-xs text-stone-600">Critical & High Priority</p>
          <p className="mt-1 text-[10px] text-stone-500">
            Require immediate attention
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <Lightbulb className="h-5 w-5 text-orange-600" />
          </div>
          <p className="mt-3 text-xl font-bold text-stone-900">
            {recommendations.length}
          </p>
          <p className="text-xs text-stone-600">Total Recommendations</p>
          <p className="mt-1 text-[10px] text-stone-500">
            AI-powered insights
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-xl font-bold text-stone-900">
            {positiveCount}
          </p>
          <p className="text-xs text-stone-600">Positive Indicators</p>
          <p className="mt-1 text-[10px] text-stone-500">
            Areas performing well
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-900">
          Detailed Recommendations
        </h3>

        {sortedRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={`rounded-lg border-2 p-4 ${
              rec.priority === 'positive'
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getCategoryIcon(rec.category)}
                  <h4 className="text-sm font-semibold text-stone-900">
                    {rec.title}
                  </h4>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${getPriorityBadge(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                </div>

                <p className="text-xs text-stone-700 mb-2">{rec.description}</p>

                <div className="rounded-lg bg-orange-50 p-3 mb-2">
                  <p className="text-xs font-medium text-orange-900">
                    Impact
                  </p>
                  <p className="text-xs text-orange-800 mt-1">{rec.impact}</p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-xs font-medium text-orange-900">
                    Recommended Action
                  </p>
                  <p className="text-xs text-orange-800 mt-1">{rec.action}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {getPriorityIcon(rec.priority)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-semibold text-stone-900 mb-1.5">
          About These Recommendations
        </h3>
        <ul className="space-y-2 text-xs text-stone-700">
          <li>• Recommendations are generated based on your workforce data and industry benchmarks</li>
          <li>• Priority levels indicate urgency: Critical (immediate action), High (within 1 month), Medium (within 3 months), Low (monitor)</li>
          <li>• Positive indicators show areas where your organization is performing well</li>
          <li>• These are suggestions - consider your specific context and business goals when implementing</li>
          <li>• Recommendations will evolve as more benchmark data becomes available</li>
        </ul>
      </div>
    </div>
  );
}
