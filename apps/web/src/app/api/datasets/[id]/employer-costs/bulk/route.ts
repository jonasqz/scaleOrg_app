import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

interface BulkEmployerCostData {
  period?: string;
  periodLabel?: string;
  employeeId?: string;
  employeeEmail?: string;
  employeeName?: string;
  department?: string;
  grossSalary?: string | number;
  grossBonus?: string | number;
  grossEquity?: string | number;
  employerTaxes?: string | number;
  socialContributions?: string | number;
  healthInsurance?: string | number;
  benefits?: string | number;
  otherEmployerCosts?: string | number;
}

interface EmployeeCostRecord {
  period: Date;
  periodLabel: string;
  employeeId: string | null;
  department: string | null;
  grossSalary: number;
  grossBonus: number | null;
  grossEquity: number | null;
  grossTotal: number;
  employerTaxes: number | null;
  socialContributions: number | null;
  healthInsurance: number | null;
  benefits: number | null;
  otherEmployerCosts: number | null;
  totalEmployerCost: number;
  employerCostRatio: number;
  currency: string;
  source: 'CSV_IMPORT';
  importedFrom: string;
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
    const { costs, currency = 'EUR', importedFrom } = body as {
      costs: BulkEmployerCostData[];
      currency?: string;
      importedFrom?: string;
    };

    if (!costs || !Array.isArray(costs)) {
      return NextResponse.json(
        { error: 'Invalid request: costs array required' },
        { status: 400 }
      );
    }

    // Fetch all employees for matching
    const allEmployees = await prisma.employee.findMany({
      where: { datasetId: params.id },
      select: {
        id: true,
        employeeName: true,
        email: true,
        department: true,
      },
    });

    // Validate and transform costs
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      matched: 0,
      unmatched: 0,
    };

    const recordsToCreate: EmployeeCostRecord[] = [];

    for (let i = 0; i < costs.length; i++) {
      const cost = costs[i];
      const rowNum = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        // Validate required fields
        if (!cost.period || cost.period.trim() === '') {
          throw new Error(`Row ${rowNum}: Period is required`);
        }
        if (!cost.grossSalary) {
          throw new Error(`Row ${rowNum}: Gross salary is required`);
        }

        // Parse period date (supports various formats: YYYY-MM, YYYY-MM-DD, MM/YYYY, etc.)
        let periodDate: Date;
        let periodLabel: string;

        const periodStr = cost.period.trim();

        // Try to parse different date formats
        if (/^\d{4}-\d{2}$/.test(periodStr)) {
          // Format: YYYY-MM
          periodDate = new Date(periodStr + '-01');
          const [year, month] = periodStr.split('-');
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          periodLabel = cost.periodLabel || `${monthNames[parseInt(month) - 1]} ${year}`;
        } else if (/^\d{2}\/\d{4}$/.test(periodStr)) {
          // Format: MM/YYYY
          const [month, year] = periodStr.split('/');
          periodDate = new Date(`${year}-${month}-01`);
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          periodLabel = cost.periodLabel || `${monthNames[parseInt(month) - 1]} ${year}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
          // Format: YYYY-MM-DD
          periodDate = new Date(periodStr);
          const year = periodDate.getFullYear();
          const month = periodDate.getMonth();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          periodLabel = cost.periodLabel || `${monthNames[month]} ${year}`;
        } else {
          throw new Error(`Row ${rowNum}: Invalid period format. Use YYYY-MM, MM/YYYY, or YYYY-MM-DD`);
        }

        if (isNaN(periodDate.getTime())) {
          throw new Error(`Row ${rowNum}: Invalid period date`);
        }

        // Parse numeric fields
        const grossSalary = parseFloat(String(cost.grossSalary));
        if (isNaN(grossSalary) || grossSalary < 0) {
          throw new Error(`Row ${rowNum}: Invalid gross salary`);
        }

        const grossBonus = cost.grossBonus ? parseFloat(String(cost.grossBonus)) : null;
        const grossEquity = cost.grossEquity ? parseFloat(String(cost.grossEquity)) : null;
        const employerTaxes = cost.employerTaxes ? parseFloat(String(cost.employerTaxes)) : null;
        const socialContributions = cost.socialContributions ? parseFloat(String(cost.socialContributions)) : null;
        const healthInsurance = cost.healthInsurance ? parseFloat(String(cost.healthInsurance)) : null;
        const benefits = cost.benefits ? parseFloat(String(cost.benefits)) : null;
        const otherEmployerCosts = cost.otherEmployerCosts ? parseFloat(String(cost.otherEmployerCosts)) : null;

        // Validate parsed optional numeric fields
        if (grossBonus !== null && (isNaN(grossBonus) || grossBonus < 0)) {
          throw new Error(`Row ${rowNum}: Invalid gross bonus`);
        }
        if (grossEquity !== null && (isNaN(grossEquity) || grossEquity < 0)) {
          throw new Error(`Row ${rowNum}: Invalid gross equity`);
        }
        if (employerTaxes !== null && (isNaN(employerTaxes) || employerTaxes < 0)) {
          throw new Error(`Row ${rowNum}: Invalid employer taxes`);
        }
        if (socialContributions !== null && (isNaN(socialContributions) || socialContributions < 0)) {
          throw new Error(`Row ${rowNum}: Invalid social contributions`);
        }
        if (healthInsurance !== null && (isNaN(healthInsurance) || healthInsurance < 0)) {
          throw new Error(`Row ${rowNum}: Invalid health insurance`);
        }
        if (benefits !== null && (isNaN(benefits) || benefits < 0)) {
          throw new Error(`Row ${rowNum}: Invalid benefits`);
        }
        if (otherEmployerCosts !== null && (isNaN(otherEmployerCosts) || otherEmployerCosts < 0)) {
          throw new Error(`Row ${rowNum}: Invalid other employer costs`);
        }

        // Calculate totals
        const grossTotal = grossSalary + (grossBonus || 0) + (grossEquity || 0);
        const totalEmployerCost = grossTotal +
          (employerTaxes || 0) +
          (socialContributions || 0) +
          (healthInsurance || 0) +
          (benefits || 0) +
          (otherEmployerCosts || 0);

        const employerCostRatio = grossTotal > 0 ? totalEmployerCost / grossTotal : 0;

        // Match employee (by ID, email, or name - in that order of preference)
        let matchedEmployeeId: string | null = null;
        let department: string | null = cost.department?.trim() || null;

        if (cost.employeeId && cost.employeeId.trim() !== '') {
          // Try matching by employee ID
          const employee = allEmployees.find(e => e.id === cost.employeeId!.trim());
          if (employee) {
            matchedEmployeeId = employee.id;
            if (!department) department = employee.department;
            results.matched++;
          }
        }

        if (!matchedEmployeeId && cost.employeeEmail && cost.employeeEmail.trim() !== '') {
          // Try matching by email
          const employee = allEmployees.find(
            e => e.email && e.email.toLowerCase() === cost.employeeEmail!.trim().toLowerCase()
          );
          if (employee) {
            matchedEmployeeId = employee.id;
            if (!department) department = employee.department;
            results.matched++;
          }
        }

        if (!matchedEmployeeId && cost.employeeName && cost.employeeName.trim() !== '') {
          // Try matching by name (fuzzy match)
          const employee = allEmployees.find(
            e => e.employeeName &&
                 e.employeeName.toLowerCase() === cost.employeeName!.trim().toLowerCase()
          );
          if (employee) {
            matchedEmployeeId = employee.id;
            if (!department) department = employee.department;
            results.matched++;
          }
        }

        if (!matchedEmployeeId) {
          results.unmatched++;
          // Still allow import for aggregate/department-level data without employee match
          // Only require employee identifier if all three are missing
          if (!cost.employeeId && !cost.employeeEmail && !cost.employeeName) {
            // This is OK - it's aggregate data
          } else {
            console.warn(`Row ${rowNum}: Could not match employee, storing as aggregate data`);
          }
        }

        // Create record
        recordsToCreate.push({
          period: periodDate,
          periodLabel,
          employeeId: matchedEmployeeId,
          department,
          grossSalary,
          grossBonus,
          grossEquity,
          grossTotal,
          employerTaxes,
          socialContributions,
          healthInsurance,
          benefits,
          otherEmployerCosts,
          totalEmployerCost,
          employerCostRatio,
          currency,
          source: 'CSV_IMPORT',
          importedFrom: importedFrom || 'payroll_import.csv',
        });

        results.success++;
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : `Row ${rowNum}: Unknown error`;
        results.errors.push(errorMsg);
        console.error(`Import error on row ${rowNum}:`, error);
      }
    }

    // Bulk insert with transaction (use upsert to handle duplicates)
    if (recordsToCreate.length > 0) {
      await prisma.$transaction(
        recordsToCreate.map(record => {
          // For records with employeeId, use upsert
          if (record.employeeId) {
            return prisma.monthlyEmployerCost.upsert({
              where: {
                datasetId_period_employeeId: {
                  datasetId: params.id,
                  period: record.period,
                  employeeId: record.employeeId,
                },
              },
              update: {
                periodLabel: record.periodLabel,
                department: record.department,
                grossSalary: record.grossSalary,
                grossBonus: record.grossBonus,
                grossEquity: record.grossEquity,
                grossTotal: record.grossTotal,
                employerTaxes: record.employerTaxes,
                socialContributions: record.socialContributions,
                healthInsurance: record.healthInsurance,
                benefits: record.benefits,
                otherEmployerCosts: record.otherEmployerCosts,
                totalEmployerCost: record.totalEmployerCost,
                employerCostRatio: record.employerCostRatio,
                currency: record.currency,
                source: record.source,
                importedFrom: record.importedFrom,
              },
              create: {
                datasetId: params.id,
                period: record.period,
                periodLabel: record.periodLabel,
                employeeId: record.employeeId,
                department: record.department,
                grossSalary: record.grossSalary,
                grossBonus: record.grossBonus,
                grossEquity: record.grossEquity,
                grossTotal: record.grossTotal,
                employerTaxes: record.employerTaxes,
                socialContributions: record.socialContributions,
                healthInsurance: record.healthInsurance,
                benefits: record.benefits,
                otherEmployerCosts: record.otherEmployerCosts,
                totalEmployerCost: record.totalEmployerCost,
                employerCostRatio: record.employerCostRatio,
                currency: record.currency,
                source: record.source,
                importedFrom: record.importedFrom,
              },
            });
          } else {
            // For aggregate records (no employeeId), just create
            return prisma.monthlyEmployerCost.create({
              data: {
                datasetId: params.id,
                period: record.period,
                periodLabel: record.periodLabel,
                employeeId: null,
                department: record.department,
                grossSalary: record.grossSalary,
                grossBonus: record.grossBonus,
                grossEquity: record.grossEquity,
                grossTotal: record.grossTotal,
                employerTaxes: record.employerTaxes,
                socialContributions: record.socialContributions,
                healthInsurance: record.healthInsurance,
                benefits: record.benefits,
                otherEmployerCosts: record.otherEmployerCosts,
                totalEmployerCost: record.totalEmployerCost,
                employerCostRatio: record.employerCostRatio,
                currency: record.currency,
                source: record.source,
                importedFrom: record.importedFrom,
              },
            });
          }
        })
      );
    }

    return NextResponse.json({
      ...results,
      imported: recordsToCreate.length,
    });
  } catch (error) {
    console.error('Bulk employer cost import error:', error);
    return NextResponse.json(
      { error: 'Failed to import employer costs' },
      { status: 500 }
    );
  }
}
