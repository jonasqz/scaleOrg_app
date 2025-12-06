import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import { saveToLibrary, verifyMapping, reportMapping } from '@/lib/role-matching';

/**
 * POST /api/datasets/[id]/save-role-mapping
 *
 * Save a confirmed role mapping to the library
 * Called after user confirms a mapping during CSV import
 *
 * Request body:
 * {
 *   originalTitle: string;
 *   standardizedTitle: string;
 *   seniorityLevel: string | null;
 *   roleFamily: string | null;
 *   action?: 'save' | 'verify' | 'report';  // Default: 'save'
 * }
 *
 * Response:
 * {
 *   success: true
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

    const datasetId = params.id;

    // Verify user owns this dataset
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { userId: true, companySize: true, industry: true },
    });

    if (!dataset || dataset.userId !== userId) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      originalTitle,
      standardizedTitle,
      seniorityLevel,
      roleFamily,
      action = 'save',
    } = body;

    if (!originalTitle) {
      return NextResponse.json(
        { error: 'originalTitle is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'verify') {
      await verifyMapping(originalTitle);
      return NextResponse.json({ success: true });
    }

    if (action === 'report') {
      await reportMapping(originalTitle);
      return NextResponse.json({ success: true });
    }

    // Default: save mapping
    if (!standardizedTitle) {
      return NextResponse.json(
        { error: 'standardizedTitle is required for save action' },
        { status: 400 }
      );
    }

    // Extract context from dataset for better matching
    const region = 'EU'; // Could be inferred from company data later
    const industry = dataset.industry || undefined;
    const companySize = dataset.companySize || undefined;

    await saveToLibrary({
      originalTitle,
      standardizedTitle,
      seniorityLevel,
      roleFamily,
      industry,
      region,
      companySize,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving role mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
