'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Calculator } from 'lucide-react';

interface AddEmployerCostFormProps {
  datasetId: string;
  currency: string;
}

export default function AddEmployerCostForm({ datasetId, currency }: AddEmployerCostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    period: '',
    employeeId: '',
    grossSalary: '',
    grossBonus: '',
    grossEquity: '',
    employerTaxes: '',
    socialContributions: '',
    healthInsurance: '',
    benefits: '',
    otherEmployerCosts: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch employees for dropdown
      fetchEmployees();
      // Set default period to current month
      const now = new Date();
      const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, period: defaultPeriod }));
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const calculateTotals = () => {
    const grossSalary = parseFloat(formData.grossSalary) || 0;
    const grossBonus = parseFloat(formData.grossBonus) || 0;
    const grossEquity = parseFloat(formData.grossEquity) || 0;
    const employerTaxes = parseFloat(formData.employerTaxes) || 0;
    const socialContributions = parseFloat(formData.socialContributions) || 0;
    const healthInsurance = parseFloat(formData.healthInsurance) || 0;
    const benefits = parseFloat(formData.benefits) || 0;
    const otherEmployerCosts = parseFloat(formData.otherEmployerCosts) || 0;

    const grossTotal = grossSalary + grossBonus + grossEquity;
    const totalEmployerCost = grossTotal + employerTaxes + socialContributions + healthInsurance + benefits + otherEmployerCosts;
    const employerCostRatio = grossTotal > 0 ? totalEmployerCost / grossTotal : 0;

    return { grossTotal, totalEmployerCost, employerCostRatio };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.period) {
        alert('Period is required');
        setLoading(false);
        return;
      }
      if (!formData.grossSalary || parseFloat(formData.grossSalary) <= 0) {
        alert('Gross salary is required and must be greater than 0');
        setLoading(false);
        return;
      }

      const { grossTotal, totalEmployerCost, employerCostRatio } = calculateTotals();

      // Get employee for department
      const selectedEmployee = formData.employeeId
        ? employees.find(e => e.id === formData.employeeId)
        : null;

      // Prepare period date (first day of month)
      const periodDate = new Date(formData.period + '-01');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const periodLabel = `${monthNames[periodDate.getMonth()]} ${periodDate.getFullYear()}`;

      const payload = {
        period: periodDate.toISOString().split('T')[0],
        periodLabel,
        employeeId: formData.employeeId || null,
        department: selectedEmployee?.department || null,
        grossSalary: parseFloat(formData.grossSalary),
        grossBonus: formData.grossBonus ? parseFloat(formData.grossBonus) : null,
        grossEquity: formData.grossEquity ? parseFloat(formData.grossEquity) : null,
        grossTotal,
        employerTaxes: formData.employerTaxes ? parseFloat(formData.employerTaxes) : null,
        socialContributions: formData.socialContributions ? parseFloat(formData.socialContributions) : null,
        healthInsurance: formData.healthInsurance ? parseFloat(formData.healthInsurance) : null,
        benefits: formData.benefits ? parseFloat(formData.benefits) : null,
        otherEmployerCosts: formData.otherEmployerCosts ? parseFloat(formData.otherEmployerCosts) : null,
        totalEmployerCost,
        employerCostRatio,
        currency,
        source: 'MANUAL',
        notes: formData.notes || null,
      };

      const response = await fetch(`/api/datasets/${datasetId}/employer-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Employer cost record added successfully!');
        setIsOpen(false);
        setFormData({
          period: '',
          employeeId: '',
          grossSalary: '',
          grossBonus: '',
          grossEquity: '',
          employerTaxes: '',
          socialContributions: '',
          healthInsurance: '',
          benefits: '',
          otherEmployerCosts: '',
          notes: '',
        });
        // Reload page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to add employer cost: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding employer cost:', error);
      alert('Failed to add employer cost');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        <Plus className="h-4 w-4" />
        Add Employer Cost
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Employer Cost Record</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Period and Employee Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Period (Month) *
              </label>
              <input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Select the month for this cost record</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee (Optional)
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Aggregate (all employees)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeName || 'Unnamed'} - {emp.department}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Leave blank for aggregate department data</p>
            </div>
          </div>

          {/* Gross Compensation */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Gross Compensation</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gross Salary *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grossSalary}
                    onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gross Bonus
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grossBonus}
                    onChange={(e) => setFormData({ ...formData, grossBonus: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gross Equity
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grossEquity}
                    onChange={(e) => setFormData({ ...formData, grossEquity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employer Costs */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Employer Costs</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employer Taxes
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.employerTaxes}
                    onChange={(e) => setFormData({ ...formData, employerTaxes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Social Contributions
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.socialContributions}
                    onChange={(e) => setFormData({ ...formData, socialContributions: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Health Insurance
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.healthInsurance}
                    onChange={(e) => setFormData({ ...formData, healthInsurance: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Benefits (Gym, Meals, etc.)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Other Employer Costs
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-gray-500">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.otherEmployerCosts}
                    onChange={(e) => setFormData({ ...formData, otherEmployerCosts: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-12 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Totals */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">Calculated Totals</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs text-blue-700">Gross Total</p>
                <p className="text-lg font-bold text-blue-900">
                  {currency} {totals.grossTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Total Employer Cost</p>
                <p className="text-lg font-bold text-blue-900">
                  {currency} {totals.totalEmployerCost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700">Employer Cost Ratio</p>
                <p className="text-lg font-bold text-blue-900">
                  {totals.employerCostRatio.toFixed(2)}x
                </p>
                <p className="text-xs text-blue-600">
                  {((totals.employerCostRatio - 1) * 100).toFixed(0)}% overhead
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Any additional notes about this cost record..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Cost Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
