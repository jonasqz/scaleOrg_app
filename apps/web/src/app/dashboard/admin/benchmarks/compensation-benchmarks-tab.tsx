'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, X, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import CompensationBenchmarkModal from './compensation-benchmark-modal';

interface CompensationBenchmark {
  id: string;
  roleFamily: string;
  standardizedTitle: string;
  seniorityLevel: string;
  industry: string;
  region: string;
  companySize: string;
  p10TotalComp: number | null;
  p25TotalComp: number | null;
  p50TotalComp: number | null;
  p75TotalComp: number | null;
  p90TotalComp: number | null;
  p10BaseSalary: number | null;
  p25BaseSalary: number | null;
  p50BaseSalary: number | null;
  p75BaseSalary: number | null;
  p90BaseSalary: number | null;
  sampleSize: number;
  currency: string;
  dataSource: string;
  lastUpdated: string;
}

interface Filters {
  roleFamilies: string[];
  industries: string[];
  regions: string[];
  companySizes: string[];
  seniorityLevels: string[];
}

export default function CompensationBenchmarksTab() {
  const [benchmarks, setBenchmarks] = useState<CompensationBenchmark[]>([]);
  const [filteredBenchmarks, setFilteredBenchmarks] = useState<CompensationBenchmark[]>([]);
  const [filters, setFilters] = useState<Filters>({
    roleFamilies: [],
    industries: [],
    regions: [],
    companySizes: [],
    seniorityLevels: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    roleFamily: '',
    industry: '',
    region: '',
    companySize: '',
    seniorityLevel: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<CompensationBenchmark | null>(null);

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = benchmarks;

    if (activeFilters.roleFamily) {
      filtered = filtered.filter((b) => b.roleFamily === activeFilters.roleFamily);
    }
    if (activeFilters.industry) {
      filtered = filtered.filter((b) => b.industry === activeFilters.industry);
    }
    if (activeFilters.region) {
      filtered = filtered.filter((b) => b.region === activeFilters.region);
    }
    if (activeFilters.companySize) {
      filtered = filtered.filter((b) => b.companySize === activeFilters.companySize);
    }
    if (activeFilters.seniorityLevel) {
      filtered = filtered.filter((b) => b.seniorityLevel === activeFilters.seniorityLevel);
    }

    setFilteredBenchmarks(filtered);
  }, [benchmarks, activeFilters]);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/benchmarks/compensation');
      if (!response.ok) throw new Error('Failed to fetch benchmarks');

      const data = await response.json();
      setBenchmarks(data.benchmarks);
      setFilters(data.filters);
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      toast.error('Failed to load compensation benchmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compensation benchmark?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/benchmarks/compensation/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete benchmark');

      toast.success('Benchmark deleted successfully');
      fetchBenchmarks();
    } catch (error) {
      console.error('Error deleting benchmark:', error);
      toast.error('Failed to delete benchmark');
    }
  };

  const handleEdit = (benchmark: CompensationBenchmark) => {
    setEditingBenchmark(benchmark);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingBenchmark(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingBenchmark(null);
    fetchBenchmarks();
  };

  const clearFilters = () => {
    setActiveFilters({
      roleFamily: '',
      industry: '',
      region: '',
      companySize: '',
      seniorityLevel: '',
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compensation Benchmarks</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage salary benchmark data used for employee compensation comparisons
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Benchmark
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm font-medium">Total Benchmarks</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{benchmarks.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Role Families Covered</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{filters.roleFamilies.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Filtered Results</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{filteredBenchmarks.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-gray-700">Role Family</label>
              <select
                value={activeFilters.roleFamily}
                onChange={(e) => setActiveFilters({ ...activeFilters, roleFamily: e.target.value })}
                className="mt-1 w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All</option>
                {filters.roleFamilies.map((rf) => (
                  <option key={rf} value={rf}>
                    {rf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Seniority</label>
              <select
                value={activeFilters.seniorityLevel}
                onChange={(e) =>
                  setActiveFilters({ ...activeFilters, seniorityLevel: e.target.value })
                }
                className="mt-1 w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All</option>
                {filters.seniorityLevels.map((sl) => (
                  <option key={sl} value={sl}>
                    {sl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Industry</label>
              <select
                value={activeFilters.industry}
                onChange={(e) => setActiveFilters({ ...activeFilters, industry: e.target.value })}
                className="mt-1 w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All</option>
                {filters.industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Region</label>
              <select
                value={activeFilters.region}
                onChange={(e) => setActiveFilters({ ...activeFilters, region: e.target.value })}
                className="mt-1 w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All</option>
                {filters.regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Company Size</label>
              <select
                value={activeFilters.companySize}
                onChange={(e) =>
                  setActiveFilters({ ...activeFilters, companySize: e.target.value })
                }
                className="mt-1 w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All</option>
                {filters.companySizes.map((cs) => (
                  <option key={cs} value={cs}>
                    {cs}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Seniority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Market
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Median (p50)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Range (p25-p75)
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Sample
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBenchmarks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No compensation benchmarks found. Add your first benchmark to get started.
                </td>
              </tr>
            ) : (
              filteredBenchmarks.map((benchmark) => (
                <tr key={benchmark.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{benchmark.roleFamily}</div>
                      <div className="text-xs text-gray-500">{benchmark.standardizedTitle}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {benchmark.seniorityLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{benchmark.industry}</div>
                    <div className="text-xs text-gray-500">
                      {benchmark.region} • {benchmark.companySize}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-gray-900">
                      {benchmark.currency}{' '}
                      {benchmark.p50TotalComp?.toLocaleString() || 'N/A'}
                    </div>
                    {benchmark.p50BaseSalary && (
                      <div className="text-xs text-gray-500">
                        Base: {benchmark.currency} {benchmark.p50BaseSalary.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {benchmark.p25TotalComp && benchmark.p75TotalComp ? (
                      <>
                        {benchmark.currency} {benchmark.p25TotalComp.toLocaleString()} -{' '}
                        {benchmark.p75TotalComp.toLocaleString()}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {benchmark.sampleSize}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(benchmark)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(benchmark.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <CompensationBenchmarkModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          benchmark={editingBenchmark}
          filters={filters}
        />
      )}
    </div>
  );
}
