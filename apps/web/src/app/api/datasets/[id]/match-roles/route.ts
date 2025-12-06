import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { matchRoleTitle, matchRoleTitlesBatch } from '@/lib/role-matching';

/**
 * POST /api/datasets/[id]/match-roles
 *
 * Match role titles using the intelligent matching engine
 *
 * Request body:
 * {
 *   roleTitles: string[]  // Array of role titles to match
 * }
 *
 * Response:
 * {
 *   matches: {
 *     [originalTitle: string]: {
 *       standardizedTitle: string;
 *       seniorityLevel: string | null;
 *       roleFamily: string | null;
 *       confidence: number;
 *       matchType: 'exact' | 'fuzzy' | 'taxonomy' | 'none';
 *     }
 *   }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roleTitles } = body;

    if (!Array.isArray(roleTitles)) {
      return NextResponse.json(
        { error: 'roleTitles must be an array' },
        { status: 400 }
      );
    }

    // Remove duplicates and empty strings
    const uniqueTitles = [...new Set(roleTitles.filter((t) => t && t.trim()))];

    if (uniqueTitles.length === 0) {
      return NextResponse.json({ matches: {} });
    }

    // Batch match all role titles
    const matchResults = await matchRoleTitlesBatch(uniqueTitles);

    // Convert Map to object for JSON serialization
    const matches = Object.fromEntries(matchResults);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error matching role titles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
