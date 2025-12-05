import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

interface BulkEmployeeData {
  employeeName?: string;
  email?: string;
  department?: string;
  role?: string;
  level?: string;
  employmentType?: string;
  totalCompensation?: string | number;
  baseSalary?: string | number;
  bonus?: string | number;
  equityValue?: string | number;
  startDate?: string;
  location?: string;
  fteFactor?: string | number;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await request.json();
    const { employees } = body as { employees: BulkEmployeeData[] };

    if (!employees || !Array.isArray(employees)) {
      return NextResponse.json(
        { error: 'Invalid request: employees array required' },
        { status: 400 }
      );
    }

    // Validate and transform employees
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const rowNum = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        // Validate required fields
        if (!emp.employeeName || emp.employeeName.trim() === '') {
          throw new Error(`Row ${rowNum}: Employee name is required`);
        }
        if (!emp.department || emp.department.trim() === '') {
          throw new Error(`Row ${rowNum}: Department is required`);
        }
        if (!emp.totalCompensation) {
          throw new Error(`Row ${rowNum}: Total compensation is required`);
        }

        // Parse numeric fields
        const totalComp = parseFloat(String(emp.totalCompensation));
        if (isNaN(totalComp) || totalComp <= 0) {
          throw new Error(`Row ${rowNum}: Invalid total compensation`);
        }

        // Parse optional numeric fields
        const baseSalary = emp.baseSalary ? parseFloat(String(emp.baseSalary)) : null;
        const bonus = emp.bonus ? parseFloat(String(emp.bonus)) : null;
        const equityValue = emp.equityValue ? parseFloat(String(emp.equityValue)) : null;
        const fteFactor = emp.fteFactor ? parseFloat(String(emp.fteFactor)) : 1.0;

        // Validate FTE factor
        if (isNaN(fteFactor) || fteFactor <= 0 || fteFactor > 1) {
          throw new Error(`Row ${rowNum}: FTE factor must be between 0 and 1`);
        }

        // Parse date
        let startDate: Date | null = null;
        if (emp.startDate && emp.startDate.trim() !== '') {
          startDate = new Date(emp.startDate);
          if (isNaN(startDate.getTime())) {
            throw new Error(`Row ${rowNum}: Invalid start date format`);
          }
        }

        // Validate employment type
        const validEmploymentTypes = ['FTE', 'CONTRACTOR', 'PART_TIME', 'INTERN'];
        const employmentType = emp.employmentType?.toUpperCase() || 'FTE';
        if (!validEmploymentTypes.includes(employmentType)) {
          throw new Error(
            `Row ${rowNum}: Invalid employment type. Must be one of: ${validEmploymentTypes.join(', ')}`
          );
        }

        // Validate level
        const validLevels = ['IC', 'MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL', ''];
        const level = emp.level?.toUpperCase() || '';
        if (level && !validLevels.includes(level)) {
          throw new Error(
            `Row ${rowNum}: Invalid level. Must be one of: ${validLevels.filter((l: string) => l).join(', ')}`
          );
        }

        // Create employee
        await prisma.employee.create({
          data: {
            datasetId: params.id,
            employeeName: emp.employeeName.trim(),
            email: emp.email?.trim() || null,
            department: emp.department.trim(),
            role: emp.role?.trim() || null,
            level: (level || null) as any,
            employmentType,
            totalCompensation: totalComp,
            annualSalary: baseSalary,
            bonus: bonus,
            equityValue: equityValue,
            fteFactor,
            startDate,
            location: emp.location?.trim() || null,
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : `Row ${rowNum}: Unknown error`;
        results.errors.push(errorMsg);
        console.error(`Import error on row ${rowNum}:`, error);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import employees' },
      { status: 500 }
    );
  }
}
