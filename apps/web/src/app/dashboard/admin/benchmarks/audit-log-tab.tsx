'use client';

import { FileText } from 'lucide-react';

export default function AuditLogTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Audit Log</h3>
        <p className="mt-1 text-sm text-gray-500">Coming soon - Track all changes to benchmark data</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Planned Features</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Track all CREATE, UPDATE, DELETE operations on benchmarks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Record who made each change and when</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Store before/after snapshots for data integrity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Filter by date range, action type, and user</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Export audit logs for compliance and reporting</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
