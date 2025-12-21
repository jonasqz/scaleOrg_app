import { describe, it, expect } from 'vitest';
import {
  calculateDepartmentBreakdown,
  calculateRDtoGTMRatio,
  calculateManagerToICRatio,
  calculateAvgSpanOfControl,
  calculateRatios,
} from './structure';
import type { Employee } from '@scleorg/database';
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

describe('Structure Calculations', () => {
  describe('calculateDepartmentBreakdown', () => {
    it('should calculate breakdown for multiple departments', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000),
          fteFactor: new Prisma.Decimal(1.0)
        }),
        createMockEmployee({
          department: 'Sales',
          totalCompensation: new Prisma.Decimal(120000),
          fteFactor: new Prisma.Decimal(1.0)
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(110000),
          fteFactor: new Prisma.Decimal(1.0)
        }),
      ];

      const breakdown = calculateDepartmentBreakdown(employees);

      expect(breakdown['R&D']).toBeDefined();
      expect(breakdown['R&D'].fte).toBe(2.0);
      expect(breakdown['R&D'].cost).toBe(210000);
      expect(breakdown['R&D'].employeeCount).toBe(2);
      expect(breakdown['R&D'].avgCompensation).toBe(105000);

      expect(breakdown['GTM']).toBeDefined();
      expect(breakdown['GTM'].fte).toBe(1.0);
      expect(breakdown['GTM'].cost).toBe(120000);
      expect(breakdown['GTM'].employeeCount).toBe(1);
    });

    it('should calculate percentages correctly', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(200000),
        }),
        createMockEmployee({
          department: 'Sales',
          totalCompensation: new Prisma.Decimal(800000),
        }),
      ];

      const breakdown = calculateDepartmentBreakdown(employees);

      expect(breakdown['R&D'].percentage).toBe(20);
      expect(breakdown['GTM'].percentage).toBe(80);
    });

    it('should handle custom department categories', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Product Team' }),
        createMockEmployee({ department: 'Sales Team' }),
      ];

      const categories = {
        'Product Team': 'R&D',
        'Sales Team': 'GTM',
      };

      const breakdown = calculateDepartmentBreakdown(employees, categories);

      expect(breakdown['R&D']).toBeDefined();
      expect(breakdown['GTM']).toBeDefined();
    });

    it('should handle part-time employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000),
          fteFactor: new Prisma.Decimal(0.5)
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000),
          fteFactor: new Prisma.Decimal(1.0)
        }),
      ];

      const breakdown = calculateDepartmentBreakdown(employees);

      expect(breakdown['R&D'].fte).toBe(1.5);
      expect(breakdown['R&D'].employeeCount).toBe(2);
      expect(breakdown['R&D'].avgCompensation).toBeCloseTo(133333.33, 2);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          endDate: null
        }),
        createMockEmployee({
          department: 'Engineering',
          endDate: new Date('2020-01-01')
        }),
      ];

      const breakdown = calculateDepartmentBreakdown(employees);

      expect(breakdown['R&D'].employeeCount).toBe(1);
    });
  });

  describe('calculateRDtoGTMRatio', () => {
    it('should calculate R&D to GTM ratio', () => {
      const breakdown = {
        'R&D': { fte: 10, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
        'GTM': { fte: 5, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      expect(calculateRDtoGTMRatio(breakdown)).toBe(2);
    });

    it('should return 0 when GTM FTE is 0', () => {
      const breakdown = {
        'R&D': { fte: 10, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
        'GTM': { fte: 0, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      expect(calculateRDtoGTMRatio(breakdown)).toBe(0);
    });

    it('should handle missing departments', () => {
      const breakdown = {
        'G&A': { fte: 5, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      expect(calculateRDtoGTMRatio(breakdown)).toBe(0);
    });

    it('should handle decimal ratios', () => {
      const breakdown = {
        'R&D': { fte: 7.5, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
        'GTM': { fte: 3.5, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      expect(calculateRDtoGTMRatio(breakdown)).toBeCloseTo(2.14, 2);
    });
  });

  describe('calculateManagerToICRatio', () => {
    it('should calculate manager to IC ratio', () => {
      const employees: Employee[] = [
        createMockEmployee({ level: 'MANAGER' }),
        createMockEmployee({ level: 'MANAGER' }),
        createMockEmployee({ level: 'IC' }),
        createMockEmployee({ level: 'IC' }),
        createMockEmployee({ level: 'IC' }),
        createMockEmployee({ level: 'IC' }),
      ];

      expect(calculateManagerToICRatio(employees)).toBe(0.5); // 2 managers / 4 ICs
    });

    it('should count all management levels', () => {
      const employees: Employee[] = [
        createMockEmployee({ level: 'MANAGER' }),
        createMockEmployee({ level: 'DIRECTOR' }),
        createMockEmployee({ level: 'VP' }),
        createMockEmployee({ level: 'C_LEVEL' }),
        createMockEmployee({ level: 'IC' }),
        createMockEmployee({ level: 'IC' }),
      ];

      expect(calculateManagerToICRatio(employees)).toBe(2); // 4 managers / 2 ICs
    });

    it('should return 0 when no ICs', () => {
      const employees: Employee[] = [
        createMockEmployee({ level: 'MANAGER' }),
        createMockEmployee({ level: 'DIRECTOR' }),
      ];

      expect(calculateManagerToICRatio(employees)).toBe(0);
    });

    it('should treat null level as IC', () => {
      const employees: Employee[] = [
        createMockEmployee({ level: 'MANAGER' }),
        createMockEmployee({ level: null }),
        createMockEmployee({ level: null }),
      ];

      expect(calculateManagerToICRatio(employees)).toBe(0.5);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({ level: 'MANAGER', endDate: null }),
        createMockEmployee({ level: 'MANAGER', endDate: new Date('2020-01-01') }),
        createMockEmployee({ level: 'IC', endDate: null }),
        createMockEmployee({ level: 'IC', endDate: null }),
      ];

      expect(calculateManagerToICRatio(employees)).toBe(0.5); // 1 active manager / 2 active ICs
    });
  });

  describe('calculateAvgSpanOfControl', () => {
    it('should calculate average span of control', () => {
      const manager1 = 'mgr-1';
      const manager2 = 'mgr-2';

      const employees: Employee[] = [
        createMockEmployee({ id: manager1, managerId: null }),
        createMockEmployee({ id: manager2, managerId: null }),
        createMockEmployee({ managerId: manager1 }),
        createMockEmployee({ managerId: manager1 }),
        createMockEmployee({ managerId: manager1 }),
        createMockEmployee({ managerId: manager2 }),
        createMockEmployee({ managerId: manager2 }),
      ];

      // Manager1 has 3 reports, Manager2 has 2 reports
      // Average = (3 + 2) / 2 = 2.5
      expect(calculateAvgSpanOfControl(employees)).toBe(2.5);
    });

    it('should return 0 when no manager relationships', () => {
      const employees: Employee[] = [
        createMockEmployee({ managerId: null }),
        createMockEmployee({ managerId: null }),
      ];

      expect(calculateAvgSpanOfControl(employees)).toBe(0);
    });

    it('should handle single manager with multiple reports', () => {
      const manager = 'mgr-1';

      const employees: Employee[] = [
        createMockEmployee({ id: manager, managerId: null }),
        createMockEmployee({ managerId: manager }),
        createMockEmployee({ managerId: manager }),
        createMockEmployee({ managerId: manager }),
        createMockEmployee({ managerId: manager }),
      ];

      expect(calculateAvgSpanOfControl(employees)).toBe(4);
    });

    it('should exclude terminated employees', () => {
      const manager = 'mgr-1';

      const employees: Employee[] = [
        createMockEmployee({ id: manager, managerId: null, endDate: null }),
        createMockEmployee({ managerId: manager, endDate: null }),
        createMockEmployee({ managerId: manager, endDate: null }),
        createMockEmployee({ managerId: manager, endDate: new Date('2020-01-01') }),
      ];

      expect(calculateAvgSpanOfControl(employees)).toBe(2); // 2 active reports
    });
  });

  describe('calculateRatios', () => {
    it('should calculate all ratios', () => {
      const manager = 'mgr-1';

      const employees: Employee[] = [
        createMockEmployee({ id: manager, department: 'Engineering', level: 'MANAGER' }),
        createMockEmployee({ department: 'Engineering', level: 'IC', managerId: manager }),
        createMockEmployee({ department: 'Engineering', level: 'IC', managerId: manager }),
        createMockEmployee({ department: 'Sales', level: 'IC' }),
      ];

      const breakdown = {
        'R&D': { fte: 3, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
        'GTM': { fte: 1, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      const ratios = calculateRatios(employees, breakdown);

      expect(ratios.rdToGTM).toBe(3);
      expect(ratios.managerToIC).toBeCloseTo(0.33, 2);
      expect(ratios.avgSpanOfControl).toBe(2);
    });

    it('should handle edge cases', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering', level: 'IC' }),
      ];

      const breakdown = {
        'R&D': { fte: 1, cost: 0, avgCompensation: 0, percentage: 0, employeeCount: 0 },
      };

      const ratios = calculateRatios(employees, breakdown);

      expect(ratios.rdToGTM).toBe(0); // No GTM
      expect(ratios.managerToIC).toBe(0); // No managers
      expect(ratios.avgSpanOfControl).toBe(0); // No manager relationships
    });
  });
});
