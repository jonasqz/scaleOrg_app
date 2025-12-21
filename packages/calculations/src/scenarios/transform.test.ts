import { describe, it, expect } from 'vitest';
import {
  applyHiringFreeze,
  applyCostReduction,
  applyGrowth,
  applyTargetRatio,
  calculateScenarioMetrics,
} from './transform';
import type { Employee, OpenRole } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

// Helper to create mock employees
function createMockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: `test-${Math.random()}`,
    datasetId: 'dataset-1',
    employeeName: 'John Doe',
    role: 'Engineer',
    level: 'Senior',
    department: 'Engineering',
    location: 'Remote',
    totalCompensation: new Prisma.Decimal(100000),
    annualSalary: new Prisma.Decimal(80000),
    bonus: new Prisma.Decimal(15000),
    equityValue: new Prisma.Decimal(5000),
    fteFactor: new Prisma.Decimal(1.0),
    startDate: new Date('2020-01-01'),
    endDate: null,
    managerId: null,
    employmentType: 'FULL_TIME',
    costCenter: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

function createMockOpenRole(overrides: Partial<OpenRole> = {}): OpenRole {
  return {
    id: `role-${Math.random()}`,
    datasetId: 'dataset-1',
    title: 'Software Engineer',
    department: 'Engineering',
    level: 'Senior',
    targetSalary: new Prisma.Decimal(120000),
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as OpenRole;
}

describe('Scenario Transformations', () => {
  describe('applyHiringFreeze', () => {
    it('should remove all open roles', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
        createMockEmployee({ department: 'Sales' }),
      ];

      const openRoles: OpenRole[] = [
        createMockOpenRole({ department: 'Engineering' }),
        createMockOpenRole({ department: 'Sales' }),
        createMockOpenRole({ department: 'Marketing' }),
      ];

      const result = applyHiringFreeze(employees, openRoles);

      expect(result.employees).toEqual(employees);
      expect(result.openRoles).toEqual([]);
    });

    it('should keep all existing employees', () => {
      const employees: Employee[] = [
        createMockEmployee(),
        createMockEmployee(),
        createMockEmployee(),
      ];

      const result = applyHiringFreeze(employees, []);

      expect(result.employees).toHaveLength(3);
      expect(result.employees).toEqual(employees);
    });
  });

  describe('applyCostReduction', () => {
    it('should reduce cost by specified percentage', () => {
      const employees: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(120000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(80000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(90000) }),
      ];

      // Total cost = 390,000
      // 20% reduction = 78,000
      // Should remove highest paid employee (120k)
      const result = applyCostReduction(employees, 20);

      expect(result).toHaveLength(3);
      // Should have removed the 120k employee
      expect(result.some(e => Number(e.totalCompensation) === 120000)).toBe(false);
    });

    it('should target specific departments if provided', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(150000)
        }),
        createMockEmployee({
          department: 'Sales',
          totalCompensation: new Prisma.Decimal(130000)
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000)
        }),
      ];

      const result = applyCostReduction(employees, 30, ['R&D']);

      // Should only remove from Engineering (R&D)
      expect(result).toHaveLength(2);
      // Sales employee should still be there
      expect(result.some(e => e.department === 'Sales')).toBe(true);
    });

    it('should remove highest paid employees first', () => {
      const employees: Employee[] = [
        createMockEmployee({
          id: 'emp1',
          totalCompensation: new Prisma.Decimal(100000)
        }),
        createMockEmployee({
          id: 'emp2',
          totalCompensation: new Prisma.Decimal(150000)
        }),
        createMockEmployee({
          id: 'emp3',
          totalCompensation: new Prisma.Decimal(120000)
        }),
      ];

      const result = applyCostReduction(employees, 35);

      // Should remove emp2 (150k) first
      expect(result.some(e => e.id === 'emp2')).toBe(false);
      expect(result.some(e => e.id === 'emp1')).toBe(true);
      expect(result.some(e => e.id === 'emp3')).toBe(true);
    });

    it('should not remove more than necessary', () => {
      const employees: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000) }),
      ];

      // 10% reduction = 30k, should only remove 1 employee (100k)
      const result = applyCostReduction(employees, 10);

      expect(result).toHaveLength(2);
    });

    it('should exclude terminated employees from consideration', () => {
      const employees: Employee[] = [
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(100000),
          endDate: null
        }),
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(150000),
          endDate: new Date('2020-01-01')
        }),
      ];

      const result = applyCostReduction(employees, 50);

      // Should only consider active employee
      expect(result).toHaveLength(0);
    });
  });

  describe('applyGrowth', () => {
    it('should add employees according to distribution', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      const result = applyGrowth(employees, 10, {
        'R&D': 0.6,
        'GTM': 0.4,
      });

      expect(result.length).toBeGreaterThan(employees.length);
      // Should add approximately 6 R&D and 4 GTM
      const newEmployees = result.filter(e => e.id.startsWith('new_'));
      expect(newEmployees).toHaveLength(10);
    });

    it('should use average salary from existing department', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(120000)
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(80000)
        }),
      ];

      const result = applyGrowth(employees, 1, { 'R&D': 1.0 });

      const newEmployee = result.find(e => e.id.startsWith('new_'));
      expect(newEmployee).toBeDefined();
      // Average is 100k
      expect(Number(newEmployee!.totalCompensation)).toBe(100000);
    });

    it('should use default salary when department does not exist', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      const result = applyGrowth(employees, 1, { 'Marketing': 1.0 });

      const newEmployee = result.find(e => e.id.startsWith('new_'));
      expect(newEmployee).toBeDefined();
      // Should use default 100k
      expect(Number(newEmployee!.totalCompensation)).toBe(100000);
    });

    it('should maintain existing employees', () => {
      const employees: Employee[] = [
        createMockEmployee({ id: 'existing-1' }),
        createMockEmployee({ id: 'existing-2' }),
      ];

      const result = applyGrowth(employees, 2, { 'R&D': 1.0 });

      // Should have 2 existing + 2 new
      expect(result).toHaveLength(4);
      expect(result.some(e => e.id === 'existing-1')).toBe(true);
      expect(result.some(e => e.id === 'existing-2')).toBe(true);
    });

    it('should handle multiple departments', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      const result = applyGrowth(employees, 6, {
        'R&D': 0.5,
        'GTM': 0.3,
        'G&A': 0.2,
      });

      const newRD = result.filter(e => e.id.startsWith('new_R&D'));
      const newGTM = result.filter(e => e.id.startsWith('new_GTM'));
      const newGA = result.filter(e => e.id.startsWith('new_G&A'));

      expect(newRD.length).toBe(3); // 50% of 6
      expect(newGTM.length).toBe(2); // 30% of 6
      expect(newGA.length).toBe(1); // 20% of 6
    });
  });

  describe('applyTargetRatio', () => {
    it('should add GTM when R&D ratio is too high', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Engineering', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Engineering', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Sales', fteFactor: new Prisma.Decimal(1) }),
      ];

      // Current ratio: 3 R&D / 1 GTM = 3.0
      // Target ratio: 2.0
      // Need: 3 / 2 = 1.5 GTM total, so add 1 GTM (rounded up)
      const result = applyTargetRatio(employees, 2.0);

      expect(result.length).toBeGreaterThan(employees.length);
      const newEmployees = result.filter(e => e.id.startsWith('new_'));
      expect(newEmployees.length).toBeGreaterThan(0);
    });

    it('should add R&D when GTM ratio is too high', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Sales', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Sales', fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ department: 'Sales', fteFactor: new Prisma.Decimal(1) }),
      ];

      // Current ratio: 1 R&D / 3 GTM = 0.33
      // Target ratio: 2.0
      // Need: 3 * 2 = 6 R&D total, so add 5 R&D
      const result = applyTargetRatio(employees, 2.0);

      expect(result.length).toBeGreaterThan(employees.length);
      const newEmployees = result.filter(e => e.id.startsWith('new_'));
      expect(newEmployees.length).toBeGreaterThan(0);
    });

    it('should return unchanged when ratio is invalid', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      // No GTM, ratio is 0
      const result = applyTargetRatio(employees, 2.0);

      expect(result).toEqual(employees);
    });

    it('should handle fractional FTE factors', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(0.5)
        }),
        createMockEmployee({
          department: 'Sales',
          fteFactor: new Prisma.Decimal(1)
        }),
      ];

      // Current ratio: 0.5 R&D / 1 GTM = 0.5
      // Target ratio: 1.0
      // Should add R&D
      const result = applyTargetRatio(employees, 1.0);

      expect(result.length).toBeGreaterThan(employees.length);
    });
  });

  describe('calculateScenarioMetrics', () => {
    it('should calculate baseline and scenario metrics', () => {
      const baseline: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000), fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(120000), fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(80000), fteFactor: new Prisma.Decimal(1) }),
      ];

      const scenario: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000), fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(120000), fteFactor: new Prisma.Decimal(1) }),
      ];

      const result = calculateScenarioMetrics(baseline, scenario, 1000000);

      expect(result.baseline.totalCost).toBe(300000);
      expect(result.baseline.totalFTE).toBe(3);
      expect(result.baseline.employeeCount).toBe(3);

      expect(result.scenario.totalCost).toBe(220000);
      expect(result.scenario.totalFTE).toBe(2);
      expect(result.scenario.employeeCount).toBe(2);

      expect(result.delta.fteChange).toBe(-1);
      expect(result.delta.costSavings).toBe(80000);
      expect(result.delta.costSavingsPct).toBeCloseTo(26.67, 2);
    });

    it('should calculate revenue per FTE when revenue provided', () => {
      const employees: Employee[] = [
        createMockEmployee({ fteFactor: new Prisma.Decimal(1) }),
        createMockEmployee({ fteFactor: new Prisma.Decimal(1) }),
      ];

      const result = calculateScenarioMetrics(employees, employees, 500000);

      expect(result.baseline.revenuePerFTE).toBe(250000); // 500k / 2 FTE
      expect(result.scenario.revenuePerFTE).toBe(250000);
    });

    it('should handle null revenue', () => {
      const employees: Employee[] = [
        createMockEmployee(),
      ];

      const result = calculateScenarioMetrics(employees, employees, null);

      expect(result.baseline.revenuePerFTE).toBeNull();
      expect(result.scenario.revenuePerFTE).toBeNull();
    });

    it('should calculate cost per FTE correctly', () => {
      const employees: Employee[] = [
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(100000),
          fteFactor: new Prisma.Decimal(1)
        }),
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(50000),
          fteFactor: new Prisma.Decimal(0.5)
        }),
      ];

      const result = calculateScenarioMetrics(employees, employees, null);

      // Total cost: 150k, Total FTE: 1.5, Cost per FTE: 100k
      expect(result.baseline.costPerFTE).toBe(100000);
    });

    it('should handle empty scenario', () => {
      const baseline: Employee[] = [
        createMockEmployee(),
      ];

      const scenario: Employee[] = [];

      const result = calculateScenarioMetrics(baseline, scenario, null);

      expect(result.scenario.totalFTE).toBe(0);
      expect(result.scenario.totalCost).toBe(0);
      expect(result.delta.costSavingsPct).toBe(100);
    });
  });
});
