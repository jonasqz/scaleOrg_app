'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Download, FileText, CheckCircle, Calendar } from 'lucide-react';
import Papa from 'papaparse';

interface PayrollUploadProps {
  datasetId: string;
  currency: string;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  [csvColumn: string]: string | null;
}

const PAYROLL_FIELD_OPTIONS = [
  { value: '', label: 'Skip this column' },
  { value: 'period', label: 'Period / Month *' },
  { value: 'employeeId', label: 'Employee ID' },
  { value: 'employeeEmail', label: 'Employee Email' },
  { value: 'employeeName', label: 'Employee Name' },
  { value: 'department', label: 'Department' },
  { value: 'grossSalary', label: 'Gross Salary *' },
  { value: 'grossBonus', label: 'Gross Bonus' },
  { value: 'grossEquity', label: 'Gross Equity' },
  { value: 'employerTaxes', label: 'Employer Taxes' },
  { value: 'socialContributions', label: 'Social Contributions' },
  { value: 'healthInsurance', label: 'Health Insurance' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'otherEmployerCosts', label: 'Other Employer Costs' },
];

export default function PayrollUpload({ datasetId, currency }: PayrollUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[]; period?: string } | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        setParsedData(data);

        if (data.length > 0) {
          const csvColumns = Object.keys(data[0]);
          setColumns(csvColumns);

          // Auto-map columns based on common payroll report names
          const autoMapping: ColumnMapping = {};
          csvColumns.forEach(col => {
            const lowerCol = col.toLowerCase().trim();
            if (lowerCol.includes('period') || lowerCol.includes('monat') || lowerCol.includes('month')) {
              autoMapping[col] = 'period';
            } else if (lowerCol.includes('employee') && (lowerCol.includes('id') || lowerCol.includes('nr'))) {
              autoMapping[col] = 'employeeId';
            } else if (lowerCol.includes('email') || lowerCol.includes('e-mail')) {
              autoMapping[col] = 'employeeEmail';
            } else if (lowerCol.includes('name') && !lowerCol.includes('company')) {
              autoMapping[col] = 'employeeName';
            } else if (lowerCol.includes('department') || lowerCol.includes('abteilung')) {
              autoMapping[col] = 'department';
            } else if (lowerCol.includes('brutto') || (lowerCol.includes('gross') && lowerCol.includes('salary'))) {
              autoMapping[col] = 'grossSalary';
            } else if (lowerCol.includes('bonus')) {
              autoMapping[col] = 'grossBonus';
            } else if (lowerCol.includes('equity') || lowerCol.includes('stock')) {
              autoMapping[col] = 'grossEquity';
            } else if (lowerCol.includes('arbeitgeber') && lowerCol.includes('steuer') || lowerCol.includes('employer') && lowerCol.includes('tax')) {
              autoMapping[col] = 'employerTaxes';
            } else if (lowerCol.includes('sozial') || lowerCol.includes('social')) {
              autoMapping[col] = 'socialContributions';
            } else if (lowerCol.includes('kranken') || lowerCol.includes('health')) {
              autoMapping[col] = 'healthInsurance';
            } else if (lowerCol.includes('benefits') || lowerCol.includes('zusatz')) {
              autoMapping[col] = 'benefits';
            } else if (lowerCol.includes('sonstige') || lowerCol.includes('other')) {
              autoMapping[col] = 'otherEmployerCosts';
            }
          });

          setColumnMapping(autoMapping);
          setStep('mapping');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file');
      },
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const downloadTemplate = () => {
    const template = `Period,Employee Email,Employee Name,Department,Gross Salary,Employer Taxes,Social Contributions,Health Insurance,Benefits,Other Employer Costs
2025-01,john@company.com,John Doe,Engineering,5000,1200,950,300,150,200
2025-01,jane@company.com,Jane Smith,Sales,6000,1440,1140,300,150,200
2025-01,bob@company.com,Bob Johnson,Engineering,5500,1320,1045,300,150,200`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMapping = () => {
    // Validate required fields are mapped
    const requiredFields = ['period', 'grossSalary'];
    const mappedFields = Object.values(columnMapping).filter(v => v !== null && v !== '');

    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      alert(`Please map required fields: ${missingRequired.join(', ')}`);
      return;
    }

    // Check if we have at least one employee identifier
    const hasEmployeeIdentifier = mappedFields.includes('employeeId') ||
                                   mappedFields.includes('employeeEmail') ||
                                   mappedFields.includes('employeeName');

    if (!hasEmployeeIdentifier) {
      alert('Please map at least one employee identifier (Employee ID, Email, or Name)');
      return;
    }

    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    try {
      // Transform data based on column mapping
      const transformedData = parsedData.map(row => {
        const transformed: any = {};

        Object.entries(columnMapping).forEach(([csvCol, fieldName]) => {
          if (fieldName && fieldName !== '') {
            transformed[fieldName] = row[csvCol];
          }
        });

        return transformed;
      });

      // Send to API
      const response = await fetch(`/api/datasets/${datasetId}/employer-costs/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costs: transformedData, currency }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');

      // Refresh the page to show new data
      setTimeout(() => {
        router.refresh();
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Failed to import payroll data');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setColumnMapping({});
    setStep('upload');
    setImportResult(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-green-600 bg-white px-6 py-3 font-semibold text-green-600 hover:bg-green-50"
      >
        <Upload className="h-5 w-5" />
        Import Payroll Data
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Import Payroll Data</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload monthly gross-net statements to track employer costs over time
          </p>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center hover:border-green-400 hover:bg-green-50"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              Drop your payroll CSV file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">CSV files from payroll accounting systems</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">What to include:</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• Period/Month (e.g., "2025-01" or "January 2025")</li>
              <li>• Employee identifier (ID, email, or name)</li>
              <li>• Gross salary</li>
              <li>• Employer taxes and social contributions (if available)</li>
              <li>• Health insurance, benefits, other costs (optional)</li>
            </ul>
          </div>

          <button
            onClick={downloadTemplate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>
      )}

      {/* Step: Column Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              <strong>{parsedData.length} rows</strong> found. Map your CSV columns to payroll fields below.
              <span className="text-red-600"> *</span> = required
            </p>
          </div>

          <div className="space-y-3">
            {columns.map((col) => (
              <div key={col} className="grid grid-cols-2 gap-4">
                <div className="flex items-center rounded-lg border bg-gray-50 px-4 py-2">
                  <FileText className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{col}</span>
                </div>
                <select
                  value={columnMapping[col] || ''}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, [col]: e.target.value || null })
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PAYROLL_FIELD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => setStep('upload')}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleMapping}
              className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
            >
              Next: Preview
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              <strong>Ready to import {parsedData.length} payroll records</strong>. Preview the first 5 rows below.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {Object.values(columnMapping)
                    .filter(v => v && v !== '')
                    .map((field) => (
                      <th key={field} className="px-3 py-2 text-left font-semibold text-gray-900">
                        {PAYROLL_FIELD_OPTIONS.find(f => f.value === field)?.label || field}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.entries(columnMapping)
                      .filter(([, field]) => field && field !== '')
                      .map(([csvCol]) => (
                        <td key={csvCol} className="px-3 py-2 text-gray-700">
                          {row[csvCol] || '-'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => setStep('mapping')}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
            >
              Import {parsedData.length} Records
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="text-lg font-semibold text-gray-900">Importing payroll data...</p>
          <p className="mt-1 text-sm text-gray-500">Matching employees and calculating costs</p>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-4 py-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Complete!</h3>
            {importResult.period && (
              <p className="mt-1 text-sm text-gray-600">
                Period: <strong>{importResult.period}</strong>
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              <strong className="text-green-600">{importResult.success} records</strong> imported successfully
            </p>
            {importResult.failed > 0 && (
              <p className="mt-1 text-sm text-orange-600">
                {importResult.failed} records skipped due to errors
              </p>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div className="mx-auto max-w-md rounded-lg bg-orange-50 p-4 text-left">
              <p className="mb-2 text-sm font-semibold text-orange-900">Errors:</p>
              <ul className="space-y-1 text-xs text-orange-700">
                {importResult.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>• ... and {importResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500">Closing in 3 seconds...</p>
        </div>
      )}
    </div>
  );
}
