import Fuse from 'fuse.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RoleMatchResult {
  standardizedTitle: string;
  seniorityLevel: string | null;
  roleFamily: string | null;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'taxonomy' | 'none';
  originalTitle: string;
}

export interface RoleLibraryEntry {
  id: string;
  originalTitle: string;
  standardizedTitle: string;
  seniorityLevel: string | null;
  roleFamily: string | null;
  frequency: number;
  verifiedByUsers: number;
  reportedIssues: number;
}

export interface RoleTaxonomyEntry {
  id: string;
  roleFamily: string;
  roleTitle: string;
  seniorityLevel: string;
  aliases: string[];
  description: string | null;
}

/**
 * Stage 1: Exact match in RoleTitleLibrary
 * Returns 100% confidence if exact match found
 */
async function findExactLibraryMatch(
  originalTitle: string
): Promise<RoleMatchResult | null> {
  const normalized = originalTitle.trim().toLowerCase();

  const match = await prisma.roleTitleLibrary.findFirst({
    where: {
      originalTitle: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
    orderBy: {
      frequency: 'desc', // Prefer most common mapping if duplicates
    },
  });

  if (!match) return null;

  // Calculate confidence based on quality indicators
  const qualityScore = match.verifiedByUsers - match.reportedIssues;
  const baseConfidence = 100;
  const confidencePenalty = Math.max(0, match.reportedIssues * 5); // -5% per reported issue
  const confidence = Math.max(85, baseConfidence - confidencePenalty); // Min 85%

  return {
    standardizedTitle: match.standardizedTitle,
    seniorityLevel: match.seniorityLevel,
    roleFamily: match.roleFamily,
    confidence,
    matchType: 'exact',
    originalTitle: match.originalTitle,
  };
}

/**
 * Stage 2: Fuzzy match in RoleTitleLibrary
 * Returns 85-99% confidence based on similarity score
 */
async function findFuzzyLibraryMatch(
  originalTitle: string
): Promise<RoleMatchResult | null> {
  const allLibraryEntries = await prisma.roleTitleLibrary.findMany({
    orderBy: {
      frequency: 'desc', // Prioritize popular titles
    },
  });

  if (allLibraryEntries.length === 0) return null;

  const fuse = new Fuse(allLibraryEntries, {
    keys: ['originalTitle'],
    threshold: 0.3, // Lower = stricter matching
    includeScore: true,
  });

  const results = fuse.search(originalTitle);

  if (results.length === 0) return null;

  const topMatch = results[0];
  const matchEntry = topMatch.item;

  // Convert fuse score (0-1, lower is better) to confidence (0-100, higher is better)
  const fuseScore = topMatch.score || 0;
  const baseConfidence = Math.round((1 - fuseScore) * 100);

  // Quality adjustment
  const qualityScore = matchEntry.verifiedByUsers - matchEntry.reportedIssues;
  const qualityBonus = Math.min(5, qualityScore); // Max +5%
  const confidence = Math.min(99, Math.max(85, baseConfidence + qualityBonus)); // 85-99%

  return {
    standardizedTitle: matchEntry.standardizedTitle,
    seniorityLevel: matchEntry.seniorityLevel,
    roleFamily: matchEntry.roleFamily,
    confidence,
    matchType: 'fuzzy',
    originalTitle: matchEntry.originalTitle,
  };
}

/**
 * Stage 3: Taxonomy alias match
 * Returns 75-85% confidence based on alias match
 */
async function findTaxonomyAliasMatch(
  originalTitle: string
): Promise<RoleMatchResult | null> {
  const normalized = originalTitle.trim().toLowerCase();

  // Get all taxonomy entries with aliases
  const taxonomyEntries = await prisma.roleTaxonomy.findMany();

  for (const entry of taxonomyEntries) {
    // Check if normalized title matches any alias (case-insensitive)
    const matchedAlias = entry.aliases.find(
      (alias) => alias.toLowerCase() === normalized
    );

    if (matchedAlias) {
      return {
        standardizedTitle: entry.roleTitle,
        seniorityLevel: entry.seniorityLevel,
        roleFamily: entry.roleFamily,
        confidence: 80, // Medium-high confidence for taxonomy matches
        matchType: 'taxonomy',
        originalTitle: matchedAlias,
      };
    }
  }

  // Try fuzzy matching against aliases
  const allAliases = taxonomyEntries.flatMap((entry) =>
    entry.aliases.map((alias) => ({
      alias,
      entry,
    }))
  );

  const fuse = new Fuse(allAliases, {
    keys: ['alias'],
    threshold: 0.25, // Stricter for taxonomy
    includeScore: true,
  });

  const results = fuse.search(originalTitle);

  if (results.length === 0) return null;

  const topMatch = results[0];
  const matchEntry = topMatch.item.entry;
  const fuseScore = topMatch.score || 0;
  const confidence = Math.round((1 - fuseScore) * 100);

  return {
    standardizedTitle: matchEntry.roleTitle,
    seniorityLevel: matchEntry.seniorityLevel,
    roleFamily: matchEntry.roleFamily,
    confidence: Math.min(85, Math.max(75, confidence)), // 75-85%
    matchType: 'taxonomy',
    originalTitle: topMatch.item.alias,
  };
}

/**
 * Main matching function - orchestrates all stages
 * Returns best match with confidence score
 */
export async function matchRoleTitle(
  originalTitle: string
): Promise<RoleMatchResult> {
  if (!originalTitle || originalTitle.trim() === '') {
    return {
      standardizedTitle: '',
      seniorityLevel: null,
      roleFamily: null,
      confidence: 0,
      matchType: 'none',
      originalTitle: '',
    };
  }

  // Stage 1: Exact library match (100% confidence)
  const exactMatch = await findExactLibraryMatch(originalTitle);
  if (exactMatch && exactMatch.confidence >= 90) {
    return exactMatch;
  }

  // Stage 2: Fuzzy library match (85-99% confidence)
  const fuzzyMatch = await findFuzzyLibraryMatch(originalTitle);
  if (fuzzyMatch && fuzzyMatch.confidence >= 85) {
    return fuzzyMatch;
  }

  // Stage 3: Taxonomy alias match (75-85% confidence)
  const taxonomyMatch = await findTaxonomyAliasMatch(originalTitle);
  if (taxonomyMatch && taxonomyMatch.confidence >= 75) {
    return taxonomyMatch;
  }

  // No match found - return original with 0% confidence
  return {
    standardizedTitle: originalTitle, // Keep original as fallback
    seniorityLevel: null,
    roleFamily: null,
    confidence: 0,
    matchType: 'none',
    originalTitle,
  };
}

/**
 * Batch matching for multiple role titles
 * Useful for CSV import processing
 */
export async function matchRoleTitlesBatch(
  roleTitles: string[]
): Promise<Map<string, RoleMatchResult>> {
  const results = new Map<string, RoleMatchResult>();

  for (const title of roleTitles) {
    const match = await matchRoleTitle(title);
    results.set(title, match);
  }

  return results;
}

/**
 * Save a new role title to the library
 * Called after user confirms a mapping during CSV import
 */
export async function saveToLibrary(params: {
  originalTitle: string;
  standardizedTitle: string;
  seniorityLevel: string | null;
  roleFamily: string | null;
  industry?: string;
  region?: string;
  companySize?: string;
}): Promise<void> {
  const {
    originalTitle,
    standardizedTitle,
    seniorityLevel,
    roleFamily,
    industry,
    region,
    companySize,
  } = params;

  // Check if this exact original title already exists
  const existing = await prisma.roleTitleLibrary.findUnique({
    where: {
      originalTitle: originalTitle.trim().toLowerCase(),
    },
  });

  if (existing) {
    // Update frequency and context arrays
    const updatedIndustries = industry && !existing.industries.includes(industry)
      ? [...existing.industries, industry]
      : existing.industries;

    const updatedRegions = region && !existing.regions.includes(region)
      ? [...existing.regions, region]
      : existing.regions;

    const updatedCompanySizes = companySize && !existing.companySizes.includes(companySize)
      ? [...existing.companySizes, companySize]
      : existing.companySizes;

    await prisma.roleTitleLibrary.update({
      where: { id: existing.id },
      data: {
        frequency: existing.frequency + 1,
        industries: updatedIndustries,
        regions: updatedRegions,
        companySizes: updatedCompanySizes,
        lastSeenDate: new Date(),
      },
    });
  } else {
    // Create new entry
    await prisma.roleTitleLibrary.create({
      data: {
        originalTitle: originalTitle.trim().toLowerCase(),
        standardizedTitle,
        seniorityLevel,
        roleFamily,
        frequency: 1,
        industries: industry ? [industry] : [],
        regions: region ? [region] : [],
        companySizes: companySize ? [companySize] : [],
      },
    });
  }
}

/**
 * User feedback: verify a mapping as correct
 */
export async function verifyMapping(originalTitle: string): Promise<void> {
  await prisma.roleTitleLibrary.updateMany({
    where: {
      originalTitle: originalTitle.trim().toLowerCase(),
    },
    data: {
      verifiedByUsers: {
        increment: 1,
      },
    },
  });
}

/**
 * User feedback: report a mapping as incorrect
 */
export async function reportMapping(originalTitle: string): Promise<void> {
  await prisma.roleTitleLibrary.updateMany({
    where: {
      originalTitle: originalTitle.trim().toLowerCase(),
    },
    data: {
      reportedIssues: {
        increment: 1,
      },
    },
  });
}
