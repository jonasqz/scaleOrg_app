import { describe, it, expect } from 'vitest';
import {
  calculateGrossTotal,
  calculateTotalEmployerCost,
  calculateEmployerCostRatio,
  calculateEmployerOverhead,
  calculateAvgCostPerEmployee,
  calculateMoMGrowthRate,
  calculateAvgMonthlyGrowthRate,
  projectAnnualCost,
  aggregateEmployerCosts,
  type EmployerCostRecord,
} from './employer-costs';

describe('Employer Cost Calculations', () => {
  describe('calculateGrossTotal', () => {
    it('should calculate gross total with salary only', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
      };

      expect(calculateGrossTotal(record)).toBe(5000);
    });

    it('should calculate gross total with salary and bonus', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        grossBonus: 1000,
      };

      expect(calculateGrossTotal(record)).toBe(6000);
    });

    it('should calculate gross total with all compensation components', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        grossBonus: 1000,
        grossEquity: 500,
      };

      expect(calculateGrossTotal(record)).toBe(6500);
    });

    it('should treat null values as zero', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        grossBonus: null,
        grossEquity: null,
      };

      expect(calculateGrossTotal(record)).toBe(5000);
    });
  });

  describe('calculateTotalEmployerCost', () => {
    it('should calculate total cost with gross salary only', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
      };

      expect(calculateTotalEmployerCost(record)).toBe(5000);
    });

    it('should include employer-side costs', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        employerTaxes: 1000,
        socialContributions: 800,
      };

      expect(calculateTotalEmployerCost(record)).toBe(6800);
    });

    it('should calculate complete employer cost', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        grossBonus: 1000,
        grossEquity: 500,
        employerTaxes: 1300,
        socialContributions: 1040,
        healthInsurance: 300,
        benefits: 150,
        otherEmployerCosts: 200,
      };

      // Gross: 6500 (5000 + 1000 + 500)
      // Employer costs: 2990 (1300 + 1040 + 300 + 150 + 200)
      // Total: 9490
      expect(calculateTotalEmployerCost(record)).toBe(9490);
    });
  });

  describe('calculateEmployerCostRatio', () => {
    it('should return 1.0 when no employer costs', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
      };

      expect(calculateEmployerCostRatio(record)).toBe(1.0);
    });

    it('should calculate ratio correctly', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        employerTaxes: 1000,
        socialContributions: 750,
      };

      // Gross: 5000, Total: 6750, Ratio: 1.35
      expect(calculateEmployerCostRatio(record)).toBe(1.35);
    });

    it('should return 0 when gross total is zero', () => {
      const record: EmployerCostRecord = {
        grossSalary: 0,
        employerTaxes: 100,
      };

      expect(calculateEmployerCostRatio(record)).toBe(0);
    });

    it('should handle complex German payroll example', () => {
      const record: EmployerCostRecord = {
        grossSalary: 6000,
        grossBonus: 0,
        employerTaxes: 1200,
        socialContributions: 950,
        healthInsurance: 300,
        benefits: 150,
        otherEmployerCosts: 200,
      };

      // Gross: 6000, Total: 8800, Ratio: 1.4666...
      expect(calculateEmployerCostRatio(record)).toBeCloseTo(1.47, 2);
    });
  });

  describe('calculateEmployerOverhead', () => {
    it('should return 0% when no employer costs', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
      };

      expect(calculateEmployerOverhead(record)).toBe(0);
    });

    it('should calculate 35% overhead correctly', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        employerTaxes: 1000,
        socialContributions: 750,
      };

      // Ratio: 1.35, Overhead: 35%
      expect(calculateEmployerOverhead(record)).toBeCloseTo(35, 1);
    });

    it('should handle typical DACH region overhead', () => {
      const record: EmployerCostRecord = {
        grossSalary: 5000,
        employerTaxes: 1000,
        socialContributions: 950,
        healthInsurance: 300,
        benefits: 150,
      };

      // Ratio: 1.48, Overhead: 48%
      expect(calculateEmployerOverhead(record)).toBe(48);
    });
  });

  describe('calculateAvgCostPerEmployee', () => {
    it('should return 0 for empty array', () => {
      expect(calculateAvgCostPerEmployee([])).toBe(0);
    });

    it('should calculate average for single record', () => {
      const records: EmployerCostRecord[] = [
        {
          grossSalary: 5000,
          employerTaxes: 1000,
        },
      ];

      expect(calculateAvgCostPerEmployee(records)).toBe(6000);
    });

    it('should calculate average for multiple records', () => {
      const records: EmployerCostRecord[] = [
        { grossSalary: 5000, employerTaxes: 1000 }, // Total: 6000
        { grossSalary: 6000, employerTaxes: 1200 }, // Total: 7200
        { grossSalary: 4000, employerTaxes: 800 },  // Total: 4800
      ];

      // Average: (6000 + 7200 + 4800) / 3 = 6000
      expect(calculateAvgCostPerEmployee(records)).toBe(6000);
    });
  });

  describe('calculateMoMGrowthRate', () => {
    it('should return 0 when previous cost is zero', () => {
      expect(calculateMoMGrowthRate(5000, 0)).toBe(0);
    });

    it('should calculate positive growth', () => {
      expect(calculateMoMGrowthRate(11000, 10000)).toBe(10);
    });

    it('should calculate negative growth', () => {
      expect(calculateMoMGrowthRate(9000, 10000)).toBe(-10);
    });

    it('should calculate zero growth', () => {
      expect(calculateMoMGrowthRate(10000, 10000)).toBe(0);
    });

    it('should handle decimal growth rates', () => {
      expect(calculateMoMGrowthRate(10250, 10000)).toBe(2.5);
    });
  });

  describe('calculateAvgMonthlyGrowthRate', () => {
    it('should return 0 when first month cost is zero', () => {
      expect(calculateAvgMonthlyGrowthRate(0, 10000, 6)).toBe(0);
    });

    it('should return 0 when months elapsed is zero', () => {
      expect(calculateAvgMonthlyGrowthRate(10000, 12000, 0)).toBe(0);
    });

    it('should calculate average growth rate over 6 months', () => {
      // 20% growth over 6 months = 3.33% per month
      expect(calculateAvgMonthlyGrowthRate(10000, 12000, 6)).toBeCloseTo(3.33, 2);
    });

    it('should calculate average decline rate', () => {
      // -20% decline over 6 months = -3.33% per month
      expect(calculateAvgMonthlyGrowthRate(10000, 8000, 6)).toBeCloseTo(-3.33, 2);
    });

    it('should handle single month growth', () => {
      // 10% growth over 1 month = 10% per month
      expect(calculateAvgMonthlyGrowthRate(10000, 11000, 1)).toBe(10);
    });
  });

  describe('projectAnnualCost', () => {
    it('should project annual cost correctly', () => {
      expect(projectAnnualCost(10000)).toBe(120000);
    });

    it('should handle zero monthly cost', () => {
      expect(projectAnnualCost(0)).toBe(0);
    });

    it('should handle decimal monthly cost', () => {
      expect(projectAnnualCost(10550.50)).toBe(126606);
    });
  });

  describe('aggregateEmployerCosts', () => {
    it('should return zeros for empty array', () => {
      const result = aggregateEmployerCosts([]);

      expect(result.totalGrossSalary).toBe(0);
      expect(result.totalGrossCompensation).toBe(0);
      expect(result.totalEmployerCost).toBe(0);
    });

    it('should aggregate single record', () => {
      const records: EmployerCostRecord[] = [
        {
          grossSalary: 5000,
          grossBonus: 1000,
          employerTaxes: 1200,
          socialContributions: 950,
        },
      ];

      const result = aggregateEmployerCosts(records);

      expect(result.totalGrossSalary).toBe(5000);
      expect(result.totalGrossBonus).toBe(1000);
      expect(result.totalGrossCompensation).toBe(6000);
      expect(result.totalEmployerTaxes).toBe(1200);
      expect(result.totalSocialContributions).toBe(950);
      expect(result.totalEmployerCost).toBe(8150); // 6000 + 1200 + 950
    });

    it('should aggregate multiple records', () => {
      const records: EmployerCostRecord[] = [
        {
          grossSalary: 5000,
          employerTaxes: 1000,
          socialContributions: 800,
        },
        {
          grossSalary: 6000,
          employerTaxes: 1200,
          socialContributions: 960,
        },
        {
          grossSalary: 4500,
          employerTaxes: 900,
          socialContributions: 720,
        },
      ];

      const result = aggregateEmployerCosts(records);

      expect(result.totalGrossSalary).toBe(15500);
      expect(result.totalGrossCompensation).toBe(15500);
      expect(result.totalEmployerTaxes).toBe(3100);
      expect(result.totalSocialContributions).toBe(2480);
      expect(result.totalEmployerCost).toBe(21080); // 15500 + 3100 + 2480
    });

    it('should aggregate all cost categories', () => {
      const records: EmployerCostRecord[] = [
        {
          grossSalary: 5000,
          grossBonus: 1000,
          grossEquity: 500,
          employerTaxes: 1300,
          socialContributions: 1040,
          healthInsurance: 300,
          benefits: 150,
          otherEmployerCosts: 200,
        },
        {
          grossSalary: 6000,
          grossBonus: 1200,
          grossEquity: 600,
          employerTaxes: 1560,
          socialContributions: 1248,
          healthInsurance: 360,
          benefits: 180,
          otherEmployerCosts: 240,
        },
      ];

      const result = aggregateEmployerCosts(records);

      expect(result.totalGrossSalary).toBe(11000);
      expect(result.totalGrossBonus).toBe(2200);
      expect(result.totalGrossEquity).toBe(1100);
      expect(result.totalGrossCompensation).toBe(14300); // 11000 + 2200 + 1100
      expect(result.totalEmployerTaxes).toBe(2860);
      expect(result.totalSocialContributions).toBe(2288);
      expect(result.totalHealthInsurance).toBe(660);
      expect(result.totalBenefits).toBe(330);
      expect(result.totalOtherCosts).toBe(440);
      expect(result.totalEmployerCost).toBe(20878); // 14300 + 2860 + 2288 + 660 + 330 + 440
    });
  });
});
