import { describe, it, expect } from 'vitest';
import {
  calculateTotalCost,
  calculateTotalFTE,
  calculateCostPerFTE,
  calculateDepartmentCost,
  calculateDepartmentFTE,
} from './cost';
import type { Employee } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

// Helper to create mock employees
function createMockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'test-id',
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

describe('Cost Calculations', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost for all employees', () => {
      const employees: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(100000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(120000) }),
        createMockEmployee({ totalCompensation: new Prisma.Decimal(80000) }),
      ];

      expect(calculateTotalCost(employees)).toBe(300000);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalCost([])).toBe(0);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(100000),
          endDate: null // Active
        }),
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(120000),
          endDate: new Date('2020-01-01') // Terminated
        }),
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(80000),
          endDate: null // Active
        }),
      ];

      expect(calculateTotalCost(employees)).toBe(180000);
    });

    it('should include employees with future end dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const employees: Employee[] = [
        createMockEmployee({
          totalCompensation: new Prisma.Decimal(100000),
          endDate: futureDate
        }),
      ];

      expect(calculateTotalCost(employees)).toBe(100000);
    });

    it('should handle single employee', () => {
      const employees: Employee[] = [
        createMockEmployee({ totalCompensation: new Prisma.Decimal(150000) }),
      ];

      expect(calculateTotalCost(employees)).toBe(150000);
    });
  });

  describe('calculateTotalFTE', () => {
    it('should calculate total FTE for all employees', () => {
      const employees: Employee[] = [
        createMockEmployee({ fteFactor: new Prisma.Decimal(1.0) }),
        createMockEmployee({ fteFactor: new Prisma.Decimal(0.5) }),
        createMockEmployee({ fteFactor: new Prisma.Decimal(0.8) }),
      ];

      expect(calculateTotalFTE(employees)).toBe(2.3);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalFTE([])).toBe(0);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          fteFactor: new Prisma.Decimal(1.0),
          endDate: null
        }),
        createMockEmployee({
          fteFactor: new Prisma.Decimal(0.5),
          endDate: new Date('2020-01-01')
        }),
        createMockEmployee({
          fteFactor: new Prisma.Decimal(0.8),
          endDate: null
        }),
      ];

      expect(calculateTotalFTE(employees)).toBe(1.8);
    });

    it('should handle all full-time employees', () => {
      const employees: Employee[] = [
        createMockEmployee({ fteFactor: new Prisma.Decimal(1.0) }),
        createMockEmployee({ fteFactor: new Prisma.Decimal(1.0) }),
        createMockEmployee({ fteFactor: new Prisma.Decimal(1.0) }),
      ];

      expect(calculateTotalFTE(employees)).toBe(3.0);
    });

    it('should handle contractors and part-time workers', () => {
      const employees: Employee[] = [
        createMockEmployee({ fteFactor: new Prisma.Decimal(0.25) }), // 10hrs/week
        createMockEmployee({ fteFactor: new Prisma.Decimal(0.5) }),  // 20hrs/week
        createMockEmployee({ fteFactor: new Prisma.Decimal(0.75) }), // 30hrs/week
      ];

      expect(calculateTotalFTE(employees)).toBe(1.5);
    });
  });

  describe('calculateCostPerFTE', () => {
    it('should calculate cost per FTE', () => {
      expect(calculateCostPerFTE(300000, 3)).toBe(100000);
      expect(calculateCostPerFTE(250000, 2.5)).toBe(100000);
      expect(calculateCostPerFTE(150000, 1.5)).toBe(100000);
    });

    it('should return 0 when FTE is 0', () => {
      expect(calculateCostPerFTE(100000, 0)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateCostPerFTE(100000, 3)).toBeCloseTo(33333.33, 2);
    });

    it('should handle large numbers', () => {
      expect(calculateCostPerFTE(10000000, 100)).toBe(100000);
    });
  });

  describe('calculateDepartmentCost', () => {
    it('should calculate cost for specific department', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000)
        }),
        createMockEmployee({
          department: 'Sales',
          totalCompensation: new Prisma.Decimal(120000)
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(110000)
        }),
      ];

      expect(calculateDepartmentCost(employees, 'Engineering')).toBe(210000);
      expect(calculateDepartmentCost(employees, 'Sales')).toBe(120000);
    });

    it('should return 0 for non-existent department', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      expect(calculateDepartmentCost(employees, 'Marketing')).toBe(0);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000),
          endDate: null
        }),
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(120000),
          endDate: new Date('2020-01-01')
        }),
      ];

      expect(calculateDepartmentCost(employees, 'Engineering')).toBe(100000);
    });

    it('should handle empty array', () => {
      expect(calculateDepartmentCost([], 'Engineering')).toBe(0);
    });

    it('should be case-sensitive for department names', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          totalCompensation: new Prisma.Decimal(100000)
        }),
      ];

      expect(calculateDepartmentCost(employees, 'Engineering')).toBe(100000);
      expect(calculateDepartmentCost(employees, 'engineering')).toBe(0);
    });
  });

  describe('calculateDepartmentFTE', () => {
    it('should calculate FTE for specific department', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(1.0)
        }),
        createMockEmployee({
          department: 'Sales',
          fteFactor: new Prisma.Decimal(1.0)
        }),
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(0.5)
        }),
      ];

      expect(calculateDepartmentFTE(employees, 'Engineering')).toBe(1.5);
      expect(calculateDepartmentFTE(employees, 'Sales')).toBe(1.0);
    });

    it('should return 0 for non-existent department', () => {
      const employees: Employee[] = [
        createMockEmployee({ department: 'Engineering' }),
      ];

      expect(calculateDepartmentFTE(employees, 'Marketing')).toBe(0);
    });

    it('should exclude terminated employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(1.0),
          endDate: null
        }),
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(0.5),
          endDate: new Date('2020-01-01')
        }),
      ];

      expect(calculateDepartmentFTE(employees, 'Engineering')).toBe(1.0);
    });

    it('should handle empty array', () => {
      expect(calculateDepartmentFTE([], 'Engineering')).toBe(0);
    });

    it('should handle part-time and contractor employees', () => {
      const employees: Employee[] = [
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(1.0)
        }),
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(0.5)
        }),
        createMockEmployee({
          department: 'Engineering',
          fteFactor: new Prisma.Decimal(0.25)
        }),
      ];

      expect(calculateDepartmentFTE(employees, 'Engineering')).toBe(1.75);
    });
  });
});
