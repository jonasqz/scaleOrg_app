import Fuse from 'fuse.js';

// Multilingual column synonyms for fuzzy matching
export const COLUMN_SYNONYMS: Record<string, string[]> = {
  firstName: [
    'first name', 'firstname', 'given name', 'vorname',
    'prénom', 'nombre', 'nome'
  ],
  lastName: [
    'last name', 'lastname', 'family name', 'surname', 'nachname',
    'nom de famille', 'apellido', 'cognome'
  ],
  employeeName: [
    'name', 'employee', 'employee name', 'full name', 'fullname',
    'mitarbeiter', 'name des mitarbeiters',
    'nom', 'nombre completo', 'nome completo'
  ],
  email: [
    'email', 'e-mail', 'mail', 'email address',
    'e-mail-adresse', 'email-adresse',
    'correo electrónico', 'correio eletrônico'
  ],
  department: [
    'department', 'dept', 'team', 'division', 'unit',
    'abteilung', 'bereich', 'team',
    'département', 'departamento', 'dipartimento'
  ],
  role: [
    'role', 'position', 'title', 'job title', 'job',
    'stelle', 'position', 'beruf', 'rolle',
    'poste', 'puesto', 'função', 'ruolo'
  ],
  level: [
    'level', 'grade', 'seniority', 'career level',
    'stufe', 'ebene', 'niveau', 'nivel', 'livello'
  ],
  employmentType: [
    'employment type', 'type', 'contract type', 'status',
    'anstellungsart', 'beschäftigungsart', 'typ',
    'type de contrat', 'tipo de empleo'
  ],
  totalCompensation: [
    'total compensation', 'total comp', 'tc', 'compensation', 'total pay',
    'gesamtkosten', 'gesamtvergütung', 'kosten', 'gesamt',
    'rémunération totale', 'compensación total'
  ],
  baseSalary: [
    'base salary', 'salary', 'base', 'annual salary', 'base pay',
    'fixgehalt', 'grundgehalt', 'gehalt', 'basis',
    'salaire de base', 'salario base'
  ],
  bonus: [
    'bonus', 'variable pay', 'incentive', 'commission',
    'bonus', 'prämie', 'variable vergütung',
    'prime', 'bonificación'
  ],
  equityValue: [
    'equity', 'stock', 'equity value', 'stock value', 'options',
    'aktien', 'beteiligung', 'eigenkapital',
    'actions', 'acciones'
  ],
  startDate: [
    'start date', 'hire date', 'joining date', 'employment start',
    'startdatum', 'einstellungsdatum', 'beginn',
    'date de début', 'fecha de inicio'
  ],
  location: [
    'location', 'office', 'city', 'site', 'workplace',
    'standort', 'ort', 'büro',
    'lieu', 'ubicación', 'località'
  ],
  fteFactor: [
    'fte', 'fte factor', 'full time equivalent', 'hours',
    'arbeitszeitfaktor', 'wöchentliche arbeitszeit', 'arbeitszeit',
    'équivalent temps plein'
  ],
};

// Currency symbols and their codes
export const CURRENCY_SYMBOLS: Record<string, string> = {
  '€': 'EUR',
  '$': 'USD',
  '£': 'GBP',
  '¥': 'JPY',
  'CHF': 'CHF',
};

/**
 * Parse European or US number format
 * Examples:
 * - "€5.328,69" -> 5328.69
 * - "$5,328.69" -> 5328.69
 * - "5.328,69" -> 5328.69
 * - "5,328.69" -> 5328.69
 */
export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;

  // Remove currency symbols and trim
  let cleaned = value.toString().trim();
  Object.keys(CURRENCY_SYMBOLS).forEach(symbol => {
    cleaned = cleaned.replace(new RegExp(`\\${symbol}`, 'g'), '');
  });
  cleaned = cleaned.trim();

  if (cleaned === '') return null;

  // Detect format based on last occurrence of comma and dot
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');

  if (lastCommaIndex > lastDotIndex) {
    // European format: 5.328,69
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 5,328.69
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Detect currency from a string value
 */
export function detectCurrency(value: string | null | undefined): string | null {
  if (!value) return null;

  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (value.includes(symbol)) {
      return code;
    }
  }

  return null;
}

/**
 * Use fuzzy matching to auto-map CSV columns to our field names
 */
export function autoMapColumns(csvColumns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  csvColumns.forEach(csvCol => {
    let bestMatch: { field: string; score: number } | null = null;

    // Try each field and its synonyms
    Object.entries(COLUMN_SYNONYMS).forEach(([fieldName, synonyms]) => {
      // Skip if field already mapped
      if (usedFields.has(fieldName)) return;

      // Create a Fuse instance for this field's synonyms
      const fuse = new Fuse(synonyms, {
        includeScore: true,
        threshold: 0.4, // 0 = perfect match, 1 = no match
        distance: 100,
        minMatchCharLength: 2,
      });

      const result = fuse.search(csvCol.toLowerCase().trim());

      if (result.length > 0 && result[0].score !== undefined) {
        const score = 1 - result[0].score; // Convert to similarity score (higher is better)

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { field: fieldName, score };
        }
      }
    });

    // Only map if we have a decent match (> 0.5 similarity)
    if (bestMatch && bestMatch.score > 0.5) {
      mapping[csvCol] = bestMatch.field;
      usedFields.add(bestMatch.field);
    }
  });

  return mapping;
}

/**
 * Extract seniority level from a role title
 */
export function extractSeniorityLevel(title: string): string | null {
  const lower = title.toLowerCase();

  if (lower.includes('chief') || lower.includes('ceo') || lower.includes('cto') ||
      lower.includes('cfo') || lower.includes('coo') || lower.includes('cpo') ||
      lower.includes('geschäftsführer')) {
    return 'C-Level';
  }

  if (lower.includes('vp') || lower.includes('vice president')) {
    return 'VP';
  }

  if (lower.includes('director') || lower.includes('direktor')) {
    return 'Director';
  }

  if (lower.includes('head of') || lower.includes('lead') || lower.includes('leiter')) {
    return 'Lead';
  }

  if (lower.includes('principal') || lower.includes('staff')) {
    return 'Staff';
  }

  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('sr ')) {
    return 'Senior';
  }

  if (lower.includes('mid') || lower.includes('intermediate')) {
    return 'Mid';
  }

  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('jr ') ||
      lower.includes('werkstudent') || lower.includes('praktikum') || lower.includes('intern')) {
    return 'Junior';
  }

  // Default to Mid if no seniority indicator found
  return 'Mid';
}

/**
 * Normalize a role title by removing seniority indicators
 */
export function normalizeRoleTitle(title: string): string {
  let normalized = title.trim();

  // Remove seniority prefixes
  const prefixes = [
    'chief', 'c-level', 'vp', 'vice president',
    'director', 'head of', 'lead', 'principal', 'staff',
    'senior', 'sr.', 'sr ', 'mid', 'mid-level', 'intermediate',
    'junior', 'jr.', 'jr ',
    // German
    'geschäftsführer', 'leiter', 'leiterin'
  ];

  prefixes.forEach(prefix => {
    const regex = new RegExp(`\\b${prefix}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Clean up extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized || title; // Return original if normalization resulted in empty string
}

/**
 * Classify role into a role family
 */
export function classifyRoleFamily(title: string): string | null {
  const lower = title.toLowerCase();

  // Engineering/Tech
  if (lower.includes('engineer') || lower.includes('developer') || lower.includes('dev ') ||
      lower.includes('software') || lower.includes('frontend') || lower.includes('backend') ||
      lower.includes('fullstack') || lower.includes('full stack') || lower.includes('tech') ||
      lower.includes('data scientist') || lower.includes('devops') || lower.includes('qa') ||
      lower.includes('entwickler')) {
    return 'Engineering';
  }

  // Product
  if (lower.includes('product') || lower.includes('pm ') || lower.includes('product manager') ||
      lower.includes('designer') || lower.includes('ux') || lower.includes('ui')) {
    return 'Product';
  }

  // Sales
  if (lower.includes('sales') || lower.includes('account executive') || lower.includes('ae ') ||
      lower.includes('sdr') || lower.includes('bdr') || lower.includes('business development') ||
      lower.includes('partnership') || lower.includes('revenue') || lower.includes('vertrieb')) {
    return 'Sales';
  }

  // Marketing
  if (lower.includes('marketing') || lower.includes('growth') || lower.includes('content') ||
      lower.includes('brand') || lower.includes('communications')) {
    return 'Marketing';
  }

  // Customer Success
  if (lower.includes('customer success') || lower.includes('csm') || lower.includes('support') ||
      lower.includes('customer')) {
    return 'Customer Success';
  }

  // People/HR
  if (lower.includes('people') || lower.includes('hr') || lower.includes('human resources') ||
      lower.includes('talent') || lower.includes('recruiting') || lower.includes('recruiter')) {
    return 'People & Culture';
  }

  // Finance
  if (lower.includes('finance') || lower.includes('accounting') || lower.includes('financial') ||
      lower.includes('cfo') || lower.includes('controller') || lower.includes('finanzen')) {
    return 'Finance';
  }

  // Operations
  if (lower.includes('operations') || lower.includes('ops') || lower.includes('coo') ||
      lower.includes('operational')) {
    return 'Operations';
  }

  // Legal
  if (lower.includes('legal') || lower.includes('counsel') || lower.includes('attorney') ||
      lower.includes('rechts')) {
    return 'Legal';
  }

  // Sustainability (specific to this org)
  if (lower.includes('sustainability') || lower.includes('climate') || lower.includes('wald') ||
      lower.includes('trees') || lower.includes('klimaförster')) {
    return 'Sustainability';
  }

  // Leadership
  if (lower.includes('ceo') || lower.includes('chief') || lower.includes('c-level') ||
      lower.includes('geschäftsführer')) {
    return 'Leadership';
  }

  return null;
}

/**
 * Standardize department name
 */
export function standardizeDepartment(department: string): string {
  const lower = department.toLowerCase().trim();

  // Common mappings
  const mappings: Record<string, string> = {
    'tech': 'Engineering',
    'dev': 'Engineering',
    'engineering': 'Engineering',
    'entwicklung': 'Engineering',

    'cs': 'Customer Success',
    'customer success': 'Customer Success',
    'support': 'Customer Success',

    'sales': 'Sales',
    'vertrieb': 'Sales',
    'revenue': 'Sales',

    'marketing': 'Marketing',

    'product': 'Product',

    'people': 'People & Culture',
    'hr': 'People & Culture',
    'talent': 'People & Culture',

    'finance': 'Finance',
    'finanzen': 'Finance',

    'operations': 'Operations',
    'ops': 'Operations',

    'sustainability': 'Sustainability',
    'trees': 'Sustainability',
    'wald': 'Sustainability',

    'ceo': 'Leadership',
    'leadership': 'Leadership',
    'executive': 'Leadership',
  };

  return mappings[lower] || department; // Return original if no mapping found
}

/**
 * Merge first and last name from separate columns
 */
export function mergeNames(firstName?: string, lastName?: string): string | null {
  if (!firstName && !lastName) return null;
  return `${firstName || ''} ${lastName || ''}`.trim();
}
