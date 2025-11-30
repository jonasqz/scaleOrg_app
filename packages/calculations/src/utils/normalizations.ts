// Data normalization functions

import type { DepartmentCategory } from '@scleorg/types';

export function normalizeDepartment(dept: string): DepartmentCategory {
  const lower = dept.toLowerCase().trim();

  // R&D: Engineering, Product, Design, Data, QA, R&D
  if (
    /(eng|product|design|data|qa|r&d|tech|develop)/i.test(lower)
  ) {
    return 'R&D';
  }

  // GTM: Sales, Marketing, Customer Success, Partnerships, SDR, Revenue
  if (
    /(sales|market|customer|cs|gtm|sdr|partner|revenue|account|commercial)/i.test(
      lower
    )
  ) {
    return 'GTM';
  }

  // G&A: Finance, HR, Legal, IT, Admin, Recruiting
  if (
    /(finance|hr|legal|it|admin|recruit|people|talent|executive|c-level)/i.test(
      lower
    )
  ) {
    return 'G&A';
  }

  // Operations: Logistics, Manufacturing, Supply Chain, Facilities
  if (/(ops|logistic|supply|manufactur|facility|production)/i.test(lower)) {
    return 'Operations';
  }

  return 'Other';
}

export function inferEmployeeLevel(
  role?: string,
  managerId?: string
): 'IC' | 'MANAGER' | 'DIRECTOR' | 'VP' | 'C_LEVEL' {
  if (!role) return managerId ? 'IC' : 'MANAGER';

  const lower = role.toLowerCase();

  if (/\b(ceo|cfo|cto|coo|cpo|chief)\b/i.test(lower)) return 'C_LEVEL';
  if (/\bvp\b|\bvice president\b/i.test(lower)) return 'VP';
  if (/\bdirector\b/i.test(lower)) return 'DIRECTOR';
  if (/\bmanager\b|\blead\b|\bhead of\b/i.test(lower)) return 'MANAGER';

  return 'IC';
}

export function normalizeEmploymentType(
  type: string
): 'FTE' | 'CONTRACTOR' | 'PART_TIME' | 'INTERN' {
  const lower = type.toLowerCase().trim();

  if (/(contract|consultant|freelance)/i.test(lower)) return 'CONTRACTOR';
  if (/(part|0\.5|half)/i.test(lower)) return 'PART_TIME';
  if (/(intern|trainee)/i.test(lower)) return 'INTERN';

  return 'FTE';
}
