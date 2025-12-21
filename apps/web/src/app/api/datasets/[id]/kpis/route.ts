import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { verifyDatasetAccess } from '@/lib/access-control';
import {
  calculateKPIs,
  KPI_REGISTRY,
  getDefaultKPIs,
  getAllCategories,
  type EmployeeData,
  type DatasetMetadata,
} from '@scleorg/calculations';

// GET /api/datasets/:id/kpis - Calculate KPIs for dataset
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify access and load settings
    const dataset = await verifyDatasetAccess(id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Load dataset settings to get selected KPIs
    const settings = await prisma.datasetSettings.findUnique({
      where: { datasetId: id },
      select: { selectedKPIs: true },
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const kpiIdsParam = searchParams.get('kpis');

    // Determine which KPIs to calculate:
    // 1. If query param provided, use those
    // 2. If user has selected KPIs in settings, use those
    // 3. If no settings, use defaults
    let kpiIds: string[] | undefined;
    if (kpiIdsParam) {
      kpiIds = kpiIdsParam.split(',');
    } else if (settings?.selectedKPIs && settings.selectedKPIs.length > 0) {
      kpiIds = settings.selectedKPIs;
    } else {
      // Use default KPIs
      kpiIds = getDefaultKPIs().map(kpi => kpi.id);
    }

    // Fetch employees
    const employees = await prisma.employee.findMany({
      where: {
        datasetId: id,
        endDate: null, // Only active employees
      },
      select: {
        id: true,
        department: true,
        annualSalary: true,
        totalCompensation: true,
        employmentType: true,
        fteFactor: true,
        level: true,
        location: true,
        startDate: true,
        endDate: true,
      },
    });

    // Map to EmployeeData format
    const employeeData: EmployeeData[] = employees.map(emp => ({
      id: emp.id,
      department: emp.department,
      annualSalary: Number(emp.annualSalary || 0),
      totalCompensation: Number(emp.totalCompensation),
      employmentType: emp.employmentType as 'FTE' | 'CONTRACTOR' | 'PART_TIME' | 'INTERN',
      fteFactor: Number(emp.fteFactor),
      level: emp.level as 'IC' | 'MANAGER' | 'DIRECTOR' | 'VP' | 'C_LEVEL' | undefined,
      location: emp.location || undefined,
      startDate: emp.startDate || undefined,
      endDate: emp.endDate,
    }));

    // Dataset metadata
    const metadata: DatasetMetadata = {
      totalRevenue: dataset.totalRevenue ? Number(dataset.totalRevenue) : undefined,
      currency: dataset.currency,
    };

    // Calculate KPIs
    const kpiValues = calculateKPIs(employeeData, metadata, kpiIds);

    // Add definitions to response
    const kpisWithDefinitions = kpiValues.map(kpi => ({
      ...kpi,
      definition: KPI_REGISTRY[kpi.kpiId],
    }));

    return NextResponse.json({
      kpis: kpisWithDefinitions,
      metadata: {
        totalEmployees: employeeData.length,
        totalRevenue: metadata.totalRevenue,
        currency: metadata.currency,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}

// GET /api/datasets/:id/kpis/definitions - Get available KPI definitions
export async function OPTIONS(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify access
    const dataset = await verifyDatasetAccess(id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    return NextResponse.json({
      allKPIs: Object.values(KPI_REGISTRY),
      defaultKPIs: getDefaultKPIs(),
      categories: getAllCategories(),
    });
  } catch (error) {
    console.error('Error fetching KPI definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI definitions' },
      { status: 500 }
    );
  }
}
