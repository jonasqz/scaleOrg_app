'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PendingBenchmark {
  id: string;
  industry: string;
  region: string;
  companySize: string;
  growthStage?: string;
  entryMode: string;
  benchmarkType?: string;
  metricName?: string;
  sampleSize: number;
  source?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export default function PendingApprovalTab() {
  const [pendingBenchmarks, setPendingBenchmarks] = useState<PendingBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingBenchmarks();
  }, []);

  const fetchPendingBenchmarks = async () => {
    try {
      const res = await fetch('/api/admin/benchmarks/organizational?approvalStatus=PENDING');
      if (res.ok) {
        const data = await res.json();
        setPendingBenchmarks(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending benchmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/benchmarks/organizational/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'APPROVED' }),
      });

      if (res.ok) {
        setPendingBenchmarks((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert('Failed to approve benchmark');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve benchmark');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectionReason[id] || 'No reason provided';
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/benchmarks/organizational/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvalStatus: 'REJECTED',
          rejectionReason: reason,
        }),
      });

      if (res.ok) {
        setPendingBenchmarks((prev) => prev.filter((b) => b.id !== id));
        setRejectionReason((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        alert('Failed to reject benchmark');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject benchmark');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Loading pending benchmarks...</p>
        </div>
      </div>
    );
  }

  if (pendingBenchmarks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
        <p className="mt-2 text-sm text-gray-500">
          No pending benchmarks require approval at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Approval ({pendingBenchmarks.length})
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          Review and approve customer-submitted benchmark data
        </p>
      </div>

      <div className="space-y-4">
        {pendingBenchmarks.map((benchmark) => (
          <div
            key={benchmark.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                    {benchmark.entryMode}
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    {benchmark.industry} - {benchmark.region} - {benchmark.companySize}
                  </h4>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Growth Stage</p>
                    <p className="font-medium text-gray-900">
                      {benchmark.growthStage || 'Not specified'}
                    </p>
                  </div>
                  {benchmark.metricName && (
                    <div>
                      <p className="text-gray-500">Metric</p>
                      <p className="font-medium text-gray-900">
                        {benchmark.metricName} ({benchmark.benchmarkType})
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Sample Size</p>
                    <p className="font-medium text-gray-900">{benchmark.sampleSize}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Source</p>
                    <p className="font-medium text-gray-900">
                      {benchmark.source?.name || 'Unknown'}
                      {benchmark.source?.type && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({benchmark.source.type})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(benchmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {benchmark.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1 text-sm text-gray-900">{benchmark.notes}</p>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    value={rejectionReason[benchmark.id] || ''}
                    onChange={(e) =>
                      setRejectionReason((prev) => ({
                        ...prev,
                        [benchmark.id]: e.target.value,
                      }))
                    }
                    placeholder="Enter a reason if rejecting..."
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => handleApprove(benchmark.id)}
                disabled={actioningId === benchmark.id}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(benchmark.id)}
                disabled={actioningId === benchmark.id}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              {actioningId === benchmark.id && (
                <span className="text-sm text-gray-500">Processing...</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
