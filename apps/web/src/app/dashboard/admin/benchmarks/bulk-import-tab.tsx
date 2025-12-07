'use client';

import { Upload, FileSpreadsheet } from 'lucide-react';

interface Props {
  sources: any[];
}

export default function BulkImportTab({ sources }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">CSV Bulk Import</h3>
        <p className="mt-1 text-sm text-gray-500">Coming soon - Upload CSV files to import benchmark data in bulk</p>

        <div className="mt-6">
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Select CSV File
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expected CSV Format</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Column</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Required</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2">industry</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">SaaS</td>
              </tr>
              <tr>
                <td className="px-4 py-2">region</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">DACH</td>
              </tr>
              <tr>
                <td className="px-4 py-2">companySize</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">51-200</td>
              </tr>
              <tr>
                <td className="px-4 py-2">benchmarkType</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">STRUCTURE</td>
              </tr>
              <tr>
                <td className="px-4 py-2">metricName</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">rd_to_gtm_ratio</td>
              </tr>
              <tr>
                <td className="px-4 py-2">p50Value</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">1.5</td>
              </tr>
              <tr>
                <td className="px-4 py-2">sampleSize</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">127</td>
              </tr>
              <tr>
                <td className="px-4 py-2">effectiveDate</td>
                <td className="px-4 py-2">Yes</td>
                <td className="px-4 py-2 text-gray-600">2025-01-01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
