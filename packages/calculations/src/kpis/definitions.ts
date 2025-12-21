/**
 * KPI Definitions for SaaS/Software Engineering Industry
 *
 * Each KPI includes:
 * - id: Unique identifier
 * - name: Display name
 * - description: What the KPI measures
 * - category: Department/area
 * - unit: How to display (percentage, currency, ratio, etc.)
 * - formula: Human-readable formula
 * - benchmarkRange: Typical range for SaaS companies
 */

export type KPIUnit = 'percentage' | 'currency' | 'ratio' | 'years' | 'count';

export type KPICategory =
  | 'overall'
  | 'customer_success'
  | 'engineering'
  | 'finance'
  | 'hr'
  | 'legal'
  | 'marketing'
  | 'operations'
  | 'product'
  | 'professional_services'
  | 'sales';

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: KPICategory;
  unit: KPIUnit;
  formula: string;
  benchmarkRange?: {
    low: number;
    median: number;
    high: number;
  };
  isDefault?: boolean; // Show by default in dashboard
}

/**
 * Registry of all available KPIs for SaaS/Software Engineering companies
 */
export const KPI_REGISTRY: Record<string, KPIDefinition> = {
  // ===== OVERALL KPIs =====
  'revenue_per_employee': {
    id: 'revenue_per_employee',
    name: 'Revenue per Employee',
    description: 'Total revenue divided by total headcount',
    category: 'overall',
    unit: 'currency',
    formula: 'Total Revenue / Total Employees',
    benchmarkRange: { low: 150000, median: 250000, high: 400000 },
    isDefault: true,
  },
  'span_of_control': {
    id: 'span_of_control',
    name: 'Span of Control',
    description: 'Ratio of individual contributors to managers',
    category: 'overall',
    unit: 'ratio',
    formula: 'Total ICs / Total Managers',
    benchmarkRange: { low: 4, median: 6, high: 8 },
    isDefault: true,
  },
  'salary_cost_pct_revenue': {
    id: 'salary_cost_pct_revenue',
    name: 'Salary Cost as % of Revenue',
    description: 'Total salary costs as percentage of revenue',
    category: 'overall',
    unit: 'percentage',
    formula: '(Total Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 30, median: 45, high: 60 },
    isDefault: true,
  },
  'personnel_cost_pct_revenue': {
    id: 'personnel_cost_pct_revenue',
    name: 'Personnel Cost as % of Revenue',
    description: 'Total personnel costs (salaries + benefits + taxes) as percentage of revenue',
    category: 'overall',
    unit: 'percentage',
    formula: '(Total Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 40, median: 55, high: 70 },
    isDefault: true,
  },
  'employees_high_cost_countries': {
    id: 'employees_high_cost_countries',
    name: 'Employees in High Cost Countries (%)',
    description: 'Percentage of employees in high-cost labor markets (US, Western Europe, etc.)',
    category: 'overall',
    unit: 'percentage',
    formula: '(Employees in High Cost Countries / Total Employees) × 100',
    benchmarkRange: { low: 30, median: 50, high: 80 },
  },
  'employees_low_cost_countries': {
    id: 'employees_low_cost_countries',
    name: 'Employees in Low Cost Countries (%)',
    description: 'Percentage of employees in low-cost labor markets (Eastern Europe, Asia, etc.)',
    category: 'overall',
    unit: 'percentage',
    formula: '(Employees in Low Cost Countries / Total Employees) × 100',
    benchmarkRange: { low: 20, median: 50, high: 70 },
  },
  'annual_headcount_change': {
    id: 'annual_headcount_change',
    name: 'Annual Headcount Change (%)',
    description: 'Year-over-year change in total headcount',
    category: 'overall',
    unit: 'percentage',
    formula: '((Current Headcount - Last Year Headcount) / Last Year Headcount) × 100',
    benchmarkRange: { low: -5, median: 20, high: 50 },
  },
  'new_hires_pct': {
    id: 'new_hires_pct',
    name: 'New Hires as % of Employees',
    description: 'New hires in the period as percentage of total employees',
    category: 'overall',
    unit: 'percentage',
    formula: '(New Hires / Total Employees) × 100',
    benchmarkRange: { low: 5, median: 15, high: 30 },
  },
  'turnover_pct': {
    id: 'turnover_pct',
    name: 'Turnover as % of Employees',
    description: 'Employee departures as percentage of total employees',
    category: 'overall',
    unit: 'percentage',
    formula: '(Departures / Total Employees) × 100',
    benchmarkRange: { low: 5, median: 12, high: 20 },
  },
  'employee_tenure': {
    id: 'employee_tenure',
    name: 'Employee Tenure',
    description: 'Average years of service for current employees',
    category: 'overall',
    unit: 'years',
    formula: 'Average(Current Date - Start Date)',
    benchmarkRange: { low: 1.5, median: 2.5, high: 4 },
  },

  // ===== CUSTOMER SUCCESS & SUPPORT =====
  'css_employee_ratio': {
    id: 'css_employee_ratio',
    name: 'CS&S to Employee Ratio',
    description: 'CS&S headcount as ratio to total headcount',
    category: 'customer_success',
    unit: 'ratio',
    formula: 'CS&S Employees / Total Employees',
    benchmarkRange: { low: 0.08, median: 0.12, high: 0.18 },
  },
  'css_pct_employees': {
    id: 'css_pct_employees',
    name: 'CS&S as % of Employees',
    description: 'CS&S headcount as percentage of total employees',
    category: 'customer_success',
    unit: 'percentage',
    formula: '(CS&S Employees / Total Employees) × 100',
    benchmarkRange: { low: 8, median: 12, high: 18 },
    isDefault: true,
  },
  'revenue_per_css': {
    id: 'revenue_per_css',
    name: 'Revenue per CS&S Employee',
    description: 'Revenue divided by CS&S headcount',
    category: 'customer_success',
    unit: 'currency',
    formula: 'Total Revenue / CS&S Employees',
    benchmarkRange: { low: 800000, median: 1200000, high: 2000000 },
  },
  'css_salary_pct_revenue': {
    id: 'css_salary_pct_revenue',
    name: 'CS&S Salary Cost as % of Revenue',
    description: 'CS&S salary costs as percentage of revenue',
    category: 'customer_success',
    unit: 'percentage',
    formula: '(CS&S Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 5, median: 8, high: 12 },
  },
  'css_personnel_pct_revenue': {
    id: 'css_personnel_pct_revenue',
    name: 'CS&S Personnel Cost as % of Revenue',
    description: 'CS&S total personnel costs as percentage of revenue',
    category: 'customer_success',
    unit: 'percentage',
    formula: '(CS&S Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 6, median: 10, high: 15 },
  },

  // ===== ENGINEERING & TECHNOLOGY =====
  'eng_employee_ratio': {
    id: 'eng_employee_ratio',
    name: 'E&T to Employee Ratio',
    description: 'Engineering & Technology headcount as ratio to total headcount',
    category: 'engineering',
    unit: 'ratio',
    formula: 'E&T Employees / Total Employees',
    benchmarkRange: { low: 0.25, median: 0.35, high: 0.50 },
  },
  'eng_pct_employees': {
    id: 'eng_pct_employees',
    name: 'E&T as % of Employees',
    description: 'Engineering & Technology headcount as percentage of total employees',
    category: 'engineering',
    unit: 'percentage',
    formula: '(E&T Employees / Total Employees) × 100',
    benchmarkRange: { low: 25, median: 35, high: 50 },
    isDefault: true,
  },
  'revenue_per_eng': {
    id: 'revenue_per_eng',
    name: 'Revenue per E&T Employee',
    description: 'Revenue divided by Engineering & Technology headcount',
    category: 'engineering',
    unit: 'currency',
    formula: 'Total Revenue / E&T Employees',
    benchmarkRange: { low: 400000, median: 650000, high: 1000000 },
  },
  'eng_salary_pct_revenue': {
    id: 'eng_salary_pct_revenue',
    name: 'E&T Salary Cost as % of Revenue',
    description: 'Engineering & Technology salary costs as percentage of revenue',
    category: 'engineering',
    unit: 'percentage',
    formula: '(E&T Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 15, median: 22, high: 30 },
  },
  'eng_personnel_pct_revenue': {
    id: 'eng_personnel_pct_revenue',
    name: 'E&T Personnel Cost as % of Revenue',
    description: 'Engineering & Technology total personnel costs as percentage of revenue',
    category: 'engineering',
    unit: 'percentage',
    formula: '(E&T Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 18, median: 28, high: 38 },
  },

  // ===== FINANCE =====
  'finance_employee_ratio': {
    id: 'finance_employee_ratio',
    name: 'Finance to Employee Ratio',
    description: 'Finance headcount as ratio to total headcount',
    category: 'finance',
    unit: 'ratio',
    formula: 'Finance Employees / Total Employees',
    benchmarkRange: { low: 0.01, median: 0.03, high: 0.05 },
  },
  'finance_pct_employees': {
    id: 'finance_pct_employees',
    name: 'Finance as % of Employees',
    description: 'Finance headcount as percentage of total employees',
    category: 'finance',
    unit: 'percentage',
    formula: '(Finance Employees / Total Employees) × 100',
    benchmarkRange: { low: 1, median: 3, high: 5 },
  },
  'revenue_per_finance': {
    id: 'revenue_per_finance',
    name: 'Revenue per Finance Employee',
    description: 'Revenue divided by Finance headcount',
    category: 'finance',
    unit: 'currency',
    formula: 'Total Revenue / Finance Employees',
    benchmarkRange: { low: 3000000, median: 6000000, high: 12000000 },
  },
  'finance_salary_pct_revenue': {
    id: 'finance_salary_pct_revenue',
    name: 'Finance Salary Cost as % of Revenue',
    description: 'Finance salary costs as percentage of revenue',
    category: 'finance',
    unit: 'percentage',
    formula: '(Finance Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 0.5, median: 1.5, high: 3 },
  },
  'finance_personnel_pct_revenue': {
    id: 'finance_personnel_pct_revenue',
    name: 'Finance Personnel Cost as % of Revenue',
    description: 'Finance total personnel costs as percentage of revenue',
    category: 'finance',
    unit: 'percentage',
    formula: '(Finance Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 0.6, median: 2, high: 4 },
  },

  // ===== HUMAN RESOURCES =====
  'hr_employee_ratio': {
    id: 'hr_employee_ratio',
    name: 'HR to Employee Ratio',
    description: 'HR headcount as ratio to total headcount',
    category: 'hr',
    unit: 'ratio',
    formula: 'HR Employees / Total Employees',
    benchmarkRange: { low: 0.01, median: 0.02, high: 0.04 },
  },
  'hr_pct_employees': {
    id: 'hr_pct_employees',
    name: 'HR as % of Employees',
    description: 'HR headcount as percentage of total employees',
    category: 'hr',
    unit: 'percentage',
    formula: '(HR Employees / Total Employees) × 100',
    benchmarkRange: { low: 1, median: 2, high: 4 },
  },
  'revenue_per_hr': {
    id: 'revenue_per_hr',
    name: 'Revenue per HR Employee',
    description: 'Revenue divided by HR headcount',
    category: 'hr',
    unit: 'currency',
    formula: 'Total Revenue / HR Employees',
    benchmarkRange: { low: 4000000, median: 8000000, high: 15000000 },
  },
  'hr_salary_pct_revenue': {
    id: 'hr_salary_pct_revenue',
    name: 'HR Salary Cost as % of Revenue',
    description: 'HR salary costs as percentage of revenue',
    category: 'hr',
    unit: 'percentage',
    formula: '(HR Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 0.4, median: 1, high: 2 },
  },
  'hr_personnel_pct_revenue': {
    id: 'hr_personnel_pct_revenue',
    name: 'HR Personnel Cost as % of Revenue',
    description: 'HR total personnel costs as percentage of revenue',
    category: 'hr',
    unit: 'percentage',
    formula: '(HR Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 0.5, median: 1.3, high: 2.5 },
  },

  // ===== LEGAL =====
  'legal_employee_ratio': {
    id: 'legal_employee_ratio',
    name: 'Legal to Employee Ratio',
    description: 'Legal headcount as ratio to total headcount',
    category: 'legal',
    unit: 'ratio',
    formula: 'Legal Employees / Total Employees',
    benchmarkRange: { low: 0.005, median: 0.01, high: 0.02 },
  },
  'legal_pct_employees': {
    id: 'legal_pct_employees',
    name: 'Legal as % of Employees',
    description: 'Legal headcount as percentage of total employees',
    category: 'legal',
    unit: 'percentage',
    formula: '(Legal Employees / Total Employees) × 100',
    benchmarkRange: { low: 0.5, median: 1, high: 2 },
  },
  'revenue_per_legal': {
    id: 'revenue_per_legal',
    name: 'Revenue per Legal Employee',
    description: 'Revenue divided by Legal headcount',
    category: 'legal',
    unit: 'currency',
    formula: 'Total Revenue / Legal Employees',
    benchmarkRange: { low: 8000000, median: 15000000, high: 30000000 },
  },
  'legal_salary_pct_revenue': {
    id: 'legal_salary_pct_revenue',
    name: 'Legal Salary Cost as % of Revenue',
    description: 'Legal salary costs as percentage of revenue',
    category: 'legal',
    unit: 'percentage',
    formula: '(Legal Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 0.2, median: 0.5, high: 1.2 },
  },
  'legal_personnel_pct_revenue': {
    id: 'legal_personnel_pct_revenue',
    name: 'Legal Personnel Cost as % of Revenue',
    description: 'Legal total personnel costs as percentage of revenue',
    category: 'legal',
    unit: 'percentage',
    formula: '(Legal Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 0.3, median: 0.7, high: 1.5 },
  },

  // ===== MARKETING =====
  'marketing_employee_ratio': {
    id: 'marketing_employee_ratio',
    name: 'Marketing to Employee Ratio',
    description: 'Marketing headcount as ratio to total headcount',
    category: 'marketing',
    unit: 'ratio',
    formula: 'Marketing Employees / Total Employees',
    benchmarkRange: { low: 0.05, median: 0.10, high: 0.15 },
  },
  'marketing_pct_employees': {
    id: 'marketing_pct_employees',
    name: 'Marketing as % of Employees',
    description: 'Marketing headcount as percentage of total employees',
    category: 'marketing',
    unit: 'percentage',
    formula: '(Marketing Employees / Total Employees) × 100',
    benchmarkRange: { low: 5, median: 10, high: 15 },
    isDefault: true,
  },
  'revenue_per_marketing': {
    id: 'revenue_per_marketing',
    name: 'Revenue per Marketing Employee',
    description: 'Revenue divided by Marketing headcount',
    category: 'marketing',
    unit: 'currency',
    formula: 'Total Revenue / Marketing Employees',
    benchmarkRange: { low: 1000000, median: 2000000, high: 4000000 },
  },
  'marketing_salary_pct_revenue': {
    id: 'marketing_salary_pct_revenue',
    name: 'Marketing Salary Cost as % of Revenue',
    description: 'Marketing salary costs as percentage of revenue',
    category: 'marketing',
    unit: 'percentage',
    formula: '(Marketing Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 3, median: 6, high: 10 },
  },
  'marketing_personnel_pct_revenue': {
    id: 'marketing_personnel_pct_revenue',
    name: 'Marketing Personnel Cost as % of Revenue',
    description: 'Marketing total personnel costs as percentage of revenue',
    category: 'marketing',
    unit: 'percentage',
    formula: '(Marketing Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 4, median: 8, high: 13 },
  },

  // ===== OPERATIONS =====
  'ops_employee_ratio': {
    id: 'ops_employee_ratio',
    name: 'Operations to Employee Ratio',
    description: 'Operations headcount as ratio to total headcount',
    category: 'operations',
    unit: 'ratio',
    formula: 'Operations Employees / Total Employees',
    benchmarkRange: { low: 0.03, median: 0.06, high: 0.10 },
  },
  'ops_pct_employees': {
    id: 'ops_pct_employees',
    name: 'Operations as % of Employees',
    description: 'Operations headcount as percentage of total employees',
    category: 'operations',
    unit: 'percentage',
    formula: '(Operations Employees / Total Employees) × 100',
    benchmarkRange: { low: 3, median: 6, high: 10 },
  },
  'revenue_per_ops': {
    id: 'revenue_per_ops',
    name: 'Revenue per Operations Employee',
    description: 'Revenue divided by Operations headcount',
    category: 'operations',
    unit: 'currency',
    formula: 'Total Revenue / Operations Employees',
    benchmarkRange: { low: 1500000, median: 3000000, high: 6000000 },
  },
  'ops_salary_pct_revenue': {
    id: 'ops_salary_pct_revenue',
    name: 'Operations Salary Cost as % of Revenue',
    description: 'Operations salary costs as percentage of revenue',
    category: 'operations',
    unit: 'percentage',
    formula: '(Operations Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 1.5, median: 3, high: 6 },
  },
  'ops_personnel_pct_revenue': {
    id: 'ops_personnel_pct_revenue',
    name: 'Operations Personnel Cost as % of Revenue',
    description: 'Operations total personnel costs as percentage of revenue',
    category: 'operations',
    unit: 'percentage',
    formula: '(Operations Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 2, median: 4, high: 8 },
  },

  // ===== PRODUCT =====
  'product_employee_ratio': {
    id: 'product_employee_ratio',
    name: 'Product to Employee Ratio',
    description: 'Product headcount as ratio to total headcount',
    category: 'product',
    unit: 'ratio',
    formula: 'Product Employees / Total Employees',
    benchmarkRange: { low: 0.05, median: 0.08, high: 0.12 },
  },
  'product_pct_employees': {
    id: 'product_pct_employees',
    name: 'Product as % of Employees',
    description: 'Product headcount as percentage of total employees',
    category: 'product',
    unit: 'percentage',
    formula: '(Product Employees / Total Employees) × 100',
    benchmarkRange: { low: 5, median: 8, high: 12 },
    isDefault: true,
  },
  'revenue_per_product': {
    id: 'revenue_per_product',
    name: 'Revenue per Product Employee',
    description: 'Revenue divided by Product headcount',
    category: 'product',
    unit: 'currency',
    formula: 'Total Revenue / Product Employees',
    benchmarkRange: { low: 1200000, median: 2500000, high: 5000000 },
  },
  'product_salary_pct_revenue': {
    id: 'product_salary_pct_revenue',
    name: 'Product Salary Cost as % of Revenue',
    description: 'Product salary costs as percentage of revenue',
    category: 'product',
    unit: 'percentage',
    formula: '(Product Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 2, median: 5, high: 8 },
  },
  'product_personnel_pct_revenue': {
    id: 'product_personnel_pct_revenue',
    name: 'Product Personnel Cost as % of Revenue',
    description: 'Product total personnel costs as percentage of revenue',
    category: 'product',
    unit: 'percentage',
    formula: '(Product Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 3, median: 6, high: 10 },
  },

  // ===== PROFESSIONAL SERVICES =====
  'ps_employee_ratio': {
    id: 'ps_employee_ratio',
    name: 'PS to Employee Ratio',
    description: 'Professional Services headcount as ratio to total headcount',
    category: 'professional_services',
    unit: 'ratio',
    formula: 'PS Employees / Total Employees',
    benchmarkRange: { low: 0.03, median: 0.08, high: 0.15 },
  },
  'ps_pct_employees': {
    id: 'ps_pct_employees',
    name: 'PS as % of Employees',
    description: 'Professional Services headcount as percentage of total employees',
    category: 'professional_services',
    unit: 'percentage',
    formula: '(PS Employees / Total Employees) × 100',
    benchmarkRange: { low: 3, median: 8, high: 15 },
  },
  'revenue_per_ps': {
    id: 'revenue_per_ps',
    name: 'Revenue per PS Employee',
    description: 'Revenue divided by Professional Services headcount',
    category: 'professional_services',
    unit: 'currency',
    formula: 'Total Revenue / PS Employees',
    benchmarkRange: { low: 800000, median: 1500000, high: 3000000 },
  },
  'ps_salary_pct_revenue': {
    id: 'ps_salary_pct_revenue',
    name: 'PS Salary Cost as % of Revenue',
    description: 'Professional Services salary costs as percentage of revenue',
    category: 'professional_services',
    unit: 'percentage',
    formula: '(PS Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 2, median: 5, high: 10 },
  },
  'ps_personnel_pct_revenue': {
    id: 'ps_personnel_pct_revenue',
    name: 'PS Personnel Cost as % of Revenue',
    description: 'Professional Services total personnel costs as percentage of revenue',
    category: 'professional_services',
    unit: 'percentage',
    formula: '(PS Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 3, median: 6, high: 13 },
  },

  // ===== SALES =====
  'sales_employee_ratio': {
    id: 'sales_employee_ratio',
    name: 'Sales to Employee Ratio',
    description: 'Sales headcount as ratio to total headcount',
    category: 'sales',
    unit: 'ratio',
    formula: 'Sales Employees / Total Employees',
    benchmarkRange: { low: 0.10, median: 0.15, high: 0.25 },
  },
  'sales_pct_employees': {
    id: 'sales_pct_employees',
    name: 'Sales as % of Employees',
    description: 'Sales headcount as percentage of total employees',
    category: 'sales',
    unit: 'percentage',
    formula: '(Sales Employees / Total Employees) × 100',
    benchmarkRange: { low: 10, median: 15, high: 25 },
    isDefault: true,
  },
  'revenue_per_sales': {
    id: 'revenue_per_sales',
    name: 'Revenue per Sales Employee',
    description: 'Revenue divided by Sales headcount',
    category: 'sales',
    unit: 'currency',
    formula: 'Total Revenue / Sales Employees',
    benchmarkRange: { low: 800000, median: 1500000, high: 2500000 },
  },
  'sales_salary_pct_revenue': {
    id: 'sales_salary_pct_revenue',
    name: 'Sales Salary Cost as % of Revenue',
    description: 'Sales salary costs as percentage of revenue',
    category: 'sales',
    unit: 'percentage',
    formula: '(Sales Salaries / Total Revenue) × 100',
    benchmarkRange: { low: 8, median: 12, high: 18 },
  },
  'sales_personnel_pct_revenue': {
    id: 'sales_personnel_pct_revenue',
    name: 'Sales Personnel Cost as % of Revenue',
    description: 'Sales total personnel costs as percentage of revenue',
    category: 'sales',
    unit: 'percentage',
    formula: '(Sales Personnel Costs / Total Revenue) × 100',
    benchmarkRange: { low: 10, median: 15, high: 22 },
  },
};

/**
 * Get all KPIs for a specific category
 */
export function getKPIsByCategory(category: KPICategory): KPIDefinition[] {
  return Object.values(KPI_REGISTRY).filter(kpi => kpi.category === category);
}

/**
 * Get all default KPIs (shown by default in dashboard)
 */
export function getDefaultKPIs(): KPIDefinition[] {
  return Object.values(KPI_REGISTRY).filter(kpi => kpi.isDefault);
}

/**
 * Get all available categories
 */
export function getAllCategories(): { id: KPICategory; name: string }[] {
  return [
    { id: 'overall', name: 'Overall' },
    { id: 'customer_success', name: 'Customer Success & Support' },
    { id: 'engineering', name: 'Engineering & Technology' },
    { id: 'finance', name: 'Finance' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'legal', name: 'Legal' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'operations', name: 'Operations' },
    { id: 'product', name: 'Product' },
    { id: 'professional_services', name: 'Professional Services' },
    { id: 'sales', name: 'Sales' },
  ];
}
