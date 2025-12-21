/**
 * Export Configuration Types and Constants
 * Defines the structure for customizable PDF/Excel exports
 */

export type ExportFormat = 'pdf' | 'excel';

export type ExportSection =
  | 'executive_summary'
  | 'org_structure'
  | 'compensation_analysis'
  | 'pay_gap_analysis'
  | 'tenure_retention'
  | 'cash_flow_runway'
  | 'compensation_planning'
  | 'market_benchmarking'
  | 'team_dynamics'
  | 'recommendations'
  | 'employee_details'
  | 'scenarios_comparison'
  | 'kpis_dashboard';

export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'highly_confidential';

export interface ExportSectionConfig {
  id: ExportSection;
  label: string;
  description: string;
  enabled: boolean;
  isNew?: boolean;
  category: 'overview' | 'analytics' | 'planning' | 'details';
}

export interface BrandingConfig {
  logo?: string; // Base64 encoded logo
  primaryColor: string;
  secondaryColor: string;
  companyName?: string;
}

export interface ReportSettings {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  confidentialityLevel: ConfidentialityLevel;
  includeFooter: boolean;
  includePageNumbers: boolean;
  includeTableOfContents: boolean;
}

export interface ExportConfiguration {
  format: ExportFormat;
  sections: ExportSectionConfig[];
  branding: BrandingConfig;
  settings: ReportSettings;
}

// Default section configurations
export const DEFAULT_SECTIONS: ExportSectionConfig[] = [
  // Overview sections
  {
    id: 'executive_summary',
    label: 'Executive Summary',
    description: 'High-level overview of key metrics and insights',
    enabled: true,
    category: 'overview',
  },
  {
    id: 'org_structure',
    label: 'Organizational Structure',
    description: 'Headcount, department breakdown, and org chart',
    enabled: true,
    category: 'overview',
  },

  // Analytics sections
  {
    id: 'compensation_analysis',
    label: 'Compensation Analysis',
    description: 'Salary distribution, compensation by department and level',
    enabled: true,
    category: 'analytics',
  },
  {
    id: 'pay_gap_analysis',
    label: 'Pay Gap Analysis',
    description: 'Gender pay gap analysis and diversity metrics',
    enabled: false,
    isNew: true,
    category: 'analytics',
  },
  {
    id: 'tenure_retention',
    label: 'Tenure & Retention',
    description: 'Employee tenure distribution and retention patterns',
    enabled: false,
    isNew: true,
    category: 'analytics',
  },
  {
    id: 'cash_flow_runway',
    label: 'Cash Flow & Runway',
    description: 'Burn rate, runway projections, and cash flow trends',
    enabled: false,
    isNew: true,
    category: 'analytics',
  },
  {
    id: 'market_benchmarking',
    label: 'Market Benchmarking',
    description: 'Comparison against industry benchmarks',
    enabled: true,
    category: 'analytics',
  },
  {
    id: 'team_dynamics',
    label: 'Team Dynamics',
    description: 'Diversity metrics and team composition',
    enabled: true,
    category: 'analytics',
  },

  // Planning sections
  {
    id: 'compensation_planning',
    label: 'Compensation Planning',
    description: 'Planned compensation changes and budget impact',
    enabled: false,
    isNew: true,
    category: 'planning',
  },
  {
    id: 'scenarios_comparison',
    label: 'Scenarios Comparison',
    description: 'Compare different planning scenarios side-by-side',
    enabled: false,
    isNew: true,
    category: 'planning',
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    description: 'AI-powered insights and action items',
    enabled: true,
    category: 'planning',
  },

  // Details sections
  {
    id: 'employee_details',
    label: 'Detailed Employee Data',
    description: 'Complete employee roster with compensation details',
    enabled: false,
    isNew: true,
    category: 'details',
  },
  {
    id: 'kpis_dashboard',
    label: 'KPIs Dashboard',
    description: 'Key performance indicators and metrics overview',
    enabled: false,
    isNew: true,
    category: 'details',
  },
];

// Confidentiality level options
export const CONFIDENTIALITY_LEVELS: { value: ConfidentialityLevel; label: string; description: string }[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Can be shared externally',
  },
  {
    value: 'internal',
    label: 'Internal',
    description: 'For internal company use only',
  },
  {
    value: 'confidential',
    label: 'Confidential',
    description: 'Restricted to authorized personnel',
  },
  {
    value: 'highly_confidential',
    label: 'Highly Confidential',
    description: 'Strictly limited distribution',
  },
];

// Default branding
export const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#ea580c', // Orange-600
  secondaryColor: '#292524', // Stone-800
};

// Helper function to get default export configuration
export function getDefaultExportConfig(
  format: ExportFormat,
  datasetName: string
): ExportConfiguration {
  return {
    format,
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })), // Deep copy
    branding: { ...DEFAULT_BRANDING },
    settings: {
      title: `${datasetName} - Analytics Report`,
      confidentialityLevel: 'internal',
      includeFooter: true,
      includePageNumbers: true,
      includeTableOfContents: true,
    },
  };
}

// Helper to get enabled sections
export function getEnabledSections(config: ExportConfiguration): ExportSectionConfig[] {
  return config.sections.filter(s => s.enabled);
}

// Helper to group sections by category
export function groupSectionsByCategory(sections: ExportSectionConfig[]): Record<string, ExportSectionConfig[]> {
  return sections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, ExportSectionConfig[]>);
}
