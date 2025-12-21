export const INDUSTRIES = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'fintech', label: 'FinTech / Financial Services' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'healthcare', label: 'Healthcare / MedTech' },
  { value: 'climate', label: 'Climate Tech / Clean Energy' },
  { value: 'ai_ml', label: 'AI / Machine Learning' },
  { value: 'marketplace', label: 'Marketplace / Platform' },
  { value: 'hardware', label: 'Hardware / IoT' },
  { value: 'biotech', label: 'BioTech / Life Sciences' },
  { value: 'edtech', label: 'EdTech / Education' },
  { value: 'logistics', label: 'Logistics / Supply Chain' },
  { value: 'real_estate', label: 'Real Estate / PropTech' },
  { value: 'gaming', label: 'Gaming / Entertainment' },
  { value: 'crypto', label: 'Crypto / Blockchain' },
  { value: 'other', label: 'Other' },
] as const;

export const FUNDING_STAGES = [
  { value: 'PRE_SEED', label: 'Early Stage', description: '1-10 employees, building MVP' },
  { value: 'SEED', label: 'Startup', description: '10-50 employees, finding product-market fit' },
  { value: 'SERIES_A', label: 'Scale-up', description: '50-150 employees, scaling operations' },
  { value: 'SERIES_B', label: 'Growth', description: '150-500 employees, expanding market' },
  { value: 'SERIES_C', label: 'Expansion', description: '500-1000 employees, market leader' },
  { value: 'SERIES_D_PLUS', label: 'Mature', description: '1000+ employees, established player' },
  { value: 'GROWTH', label: 'Late Stage', description: 'Pre-IPO or profitable' },
  { value: 'PUBLIC', label: 'Public Company', description: 'Publicly traded' },
] as const;

export type Industry = typeof INDUSTRIES[number]['value'];
export type FundingStage = typeof FUNDING_STAGES[number]['value'];

// Demo data templates by industry and stage
export interface DemoTemplate {
  industry: Industry;
  stage: FundingStage;
  employeeCount: number;
  departmentDistribution: {
    Engineering: number;
    Product: number;
    Sales: number;
    Marketing: number;
    'Customer Success': number;
    Finance: number;
    Operations: number;
    HR: number;
  };
  avgSalaryByDepartment: {
    Engineering: number;
    Product: number;
    Sales: number;
    Marketing: number;
    'Customer Success': number;
    Finance: number;
    Operations: number;
    HR: number;
  };
  roles: {
    department: string;
    title: string;
    level: 'IC' | 'MANAGER' | 'DIRECTOR' | 'VP' | 'C_LEVEL';
    count: number;
    avgSalary: number;
  }[];
}

export const DEMO_TEMPLATES: Record<string, DemoTemplate> = {
  'saas_SEED': {
    industry: 'saas',
    stage: 'SEED',
    employeeCount: 65,
    departmentDistribution: {
      Engineering: 28,
      Product: 6,
      Sales: 15,
      Marketing: 5,
      'Customer Success': 5,
      Finance: 2,
      Operations: 2,
      HR: 2,
    },
    avgSalaryByDepartment: {
      Engineering: 75000,
      Product: 80000,
      Sales: 65000,
      Marketing: 60000,
      'Customer Success': 55000,
      Finance: 70000,
      Operations: 60000,
      HR: 65000,
    },
    roles: [
      { department: 'Engineering', title: 'CTO / Co-founder', level: 'C_LEVEL', count: 1, avgSalary: 95000 },
      { department: 'Engineering', title: 'Engineering Manager', level: 'MANAGER', count: 2, avgSalary: 90000 },
      { department: 'Engineering', title: 'Tech Lead', level: 'IC', count: 3, avgSalary: 85000 },
      { department: 'Engineering', title: 'Senior Software Engineer', level: 'IC', count: 10, avgSalary: 80000 },
      { department: 'Engineering', title: 'Software Engineer', level: 'IC', count: 10, avgSalary: 65000 },
      { department: 'Engineering', title: 'Junior Software Engineer', level: 'IC', count: 2, avgSalary: 50000 },
      { department: 'Product', title: 'Head of Product', level: 'VP', count: 1, avgSalary: 95000 },
      { department: 'Product', title: 'Senior Product Manager', level: 'IC', count: 2, avgSalary: 75000 },
      { department: 'Product', title: 'Product Manager', level: 'IC', count: 2, avgSalary: 65000 },
      { department: 'Product', title: 'Product Designer', level: 'IC', count: 1, avgSalary: 70000 },
      { department: 'Sales', title: 'VP Sales', level: 'VP', count: 1, avgSalary: 90000 },
      { department: 'Sales', title: 'Sales Manager', level: 'MANAGER', count: 2, avgSalary: 75000 },
      { department: 'Sales', title: 'Senior Account Executive', level: 'IC', count: 5, avgSalary: 70000 },
      { department: 'Sales', title: 'Account Executive', level: 'IC', count: 5, avgSalary: 55000 },
      { department: 'Sales', title: 'Sales Development Rep', level: 'IC', count: 2, avgSalary: 45000 },
      { department: 'Marketing', title: 'Head of Marketing', level: 'VP', count: 1, avgSalary: 90000 },
      { department: 'Marketing', title: 'Marketing Manager', level: 'MANAGER', count: 2, avgSalary: 65000 },
      { department: 'Marketing', title: 'Content Marketing', level: 'IC', count: 1, avgSalary: 55000 },
      { department: 'Marketing', title: 'Growth Marketing', level: 'IC', count: 1, avgSalary: 60000 },
      { department: 'Customer Success', title: 'Head of Customer Success', level: 'MANAGER', count: 1, avgSalary: 75000 },
      { department: 'Customer Success', title: 'Customer Success Manager', level: 'IC', count: 3, avgSalary: 60000 },
      { department: 'Customer Success', title: 'Support Engineer', level: 'IC', count: 1, avgSalary: 55000 },
      { department: 'Finance', title: 'CFO', level: 'C_LEVEL', count: 1, avgSalary: 100000 },
      { department: 'Finance', title: 'Finance Manager', level: 'MANAGER', count: 1, avgSalary: 75000 },
      { department: 'Operations', title: 'Operations Manager', level: 'MANAGER', count: 1, avgSalary: 65000 },
      { department: 'Operations', title: 'IT Administrator', level: 'IC', count: 1, avgSalary: 60000 },
      { department: 'HR', title: 'Head of People', level: 'MANAGER', count: 1, avgSalary: 80000 },
      { department: 'HR', title: 'Recruiter', level: 'IC', count: 1, avgSalary: 55000 },
    ],
  },
  'saas_SERIES_A': {
    industry: 'saas',
    stage: 'SERIES_A',
    employeeCount: 35,
    departmentDistribution: {
      Engineering: 15,
      Product: 4,
      Sales: 8,
      Marketing: 3,
      'Customer Success': 2,
      Finance: 1,
      Operations: 1,
      HR: 1,
    },
    avgSalaryByDepartment: {
      Engineering: 85000,
      Product: 90000,
      Sales: 70000,
      Marketing: 65000,
      'Customer Success': 60000,
      Finance: 80000,
      Operations: 65000,
      HR: 70000,
    },
    roles: [
      { department: 'Engineering', title: 'CTO', level: 'C_LEVEL', count: 1, avgSalary: 120000 },
      { department: 'Engineering', title: 'Engineering Manager', level: 'MANAGER', count: 2, avgSalary: 100000 },
      { department: 'Engineering', title: 'Senior Software Engineer', level: 'IC', count: 6, avgSalary: 90000 },
      { department: 'Engineering', title: 'Software Engineer', level: 'IC', count: 6, avgSalary: 70000 },
      { department: 'Product', title: 'VP Product', level: 'VP', count: 1, avgSalary: 110000 },
      { department: 'Product', title: 'Senior Product Manager', level: 'IC', count: 2, avgSalary: 85000 },
      { department: 'Product', title: 'Product Manager', level: 'IC', count: 1, avgSalary: 70000 },
      { department: 'Sales', title: 'VP Sales', level: 'VP', count: 1, avgSalary: 110000 },
      { department: 'Sales', title: 'Sales Manager', level: 'MANAGER', count: 1, avgSalary: 80000 },
      { department: 'Sales', title: 'Senior Account Executive', level: 'IC', count: 3, avgSalary: 75000 },
      { department: 'Sales', title: 'Account Executive', level: 'IC', count: 3, avgSalary: 60000 },
      { department: 'Marketing', title: 'Head of Marketing', level: 'VP', count: 1, avgSalary: 95000 },
      { department: 'Marketing', title: 'Marketing Manager', level: 'MANAGER', count: 2, avgSalary: 55000 },
      { department: 'Customer Success', title: 'Customer Success Manager', level: 'IC', count: 2, avgSalary: 60000 },
      { department: 'Finance', title: 'Finance Manager', level: 'MANAGER', count: 1, avgSalary: 80000 },
      { department: 'Operations', title: 'Operations Manager', level: 'MANAGER', count: 1, avgSalary: 65000 },
      { department: 'HR', title: 'People Operations Manager', level: 'MANAGER', count: 1, avgSalary: 70000 },
    ],
  },
  // Add more templates for other industry/stage combinations as needed
};

export function getDemoTemplate(industry: string, growthStage: string): DemoTemplate | null {
  // Map growth stage values to old funding stage enum values for template lookup
  const stageMap: Record<string, string> = {
    'Seed': 'SEED',
    'Series A': 'SERIES_A',
    'Series B': 'SERIES_B',
    'Series B+': 'SERIES_B',
    'Growth': 'GROWTH',
    'Public': 'PUBLIC',
  };

  // Map industry values (capitalize first letter for SaaS case)
  const industryKey = industry.toLowerCase();
  const stageKey = stageMap[growthStage] || 'SEED';

  const key = `${industryKey}_${stageKey}`;
  return DEMO_TEMPLATES[key] || DEMO_TEMPLATES['saas_SEED']; // Fallback to saas_SEED
}
