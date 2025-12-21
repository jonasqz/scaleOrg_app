// Shared constants for benchmarking across onboarding and settings

export const INDUSTRIES = [
  { value: 'SaaS', label: 'SaaS / Software' },
  { value: 'Fintech', label: 'FinTech / Financial Services' },
  { value: 'E-commerce', label: 'E-commerce / Retail' },
  { value: 'Healthcare', label: 'Healthcare / MedTech' },
  { value: 'Climate Tech', label: 'Climate Tech / Clean Energy' },
  { value: 'AI/ML', label: 'AI / Machine Learning' },
  { value: 'Enterprise Software', label: 'Enterprise Software' },
  { value: 'Consumer', label: 'Consumer' },
  { value: 'B2B', label: 'B2B' },
  { value: 'Marketplace', label: 'Marketplace / Platform' },
  { value: 'Other', label: 'Other' },
] as const;

export const REGIONS = [
  { value: '', label: 'Global (default)' },
  { value: 'DACH', label: 'DACH (Germany, Austria, Switzerland)' },
  { value: 'EU', label: 'European Union' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'APAC', label: 'Asia-Pacific' },
  { value: 'LATAM', label: 'Latin America' },
  { value: 'MEA', label: 'Middle East & Africa' },
] as const;

export const GROWTH_STAGES = [
  { value: 'Seed', label: 'Early Stage', description: '1-50 employees, finding product-market fit' },
  { value: 'Series A', label: 'Scale-up', description: '50-150 employees, scaling operations' },
  { value: 'Series B', label: 'Growth', description: '150-500 employees, expanding market' },
  { value: 'Series B+', label: 'Expansion', description: '500-1000 employees, market leader' },
  { value: 'Growth', label: 'Late Stage', description: 'Pre-IPO or profitable' },
  { value: 'Public', label: 'Public Company', description: 'Publicly traded' },
] as const;

export type Industry = typeof INDUSTRIES[number]['value'];
export type Region = typeof REGIONS[number]['value'];
export type GrowthStage = typeof GROWTH_STAGES[number]['value'];
