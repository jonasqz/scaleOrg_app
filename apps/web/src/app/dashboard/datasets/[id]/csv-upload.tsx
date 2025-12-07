'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVUploadProps {
  datasetId: string;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  [csvColumn: string]: string | null;
}

const FIELD_OPTIONS = [
  { value: '', label: 'Skip this column' },
  { value: 'employeeName', label: 'Employee Name *' },
  { value: 'email', label: 'Email' },
  { value: 'department', label: 'Department *' },
  { value: 'role', label: 'Role' },
  { value: 'level', label: 'Level' },
  { value: 'employmentType', label: 'Employment Type' },
  { value: 'totalCompensation', label: 'Total Compensation *' },
  { value: 'baseSalary', label: 'Base Salary' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'equityValue', label: 'Equity Value' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'location', label: 'Location' },
  { value: 'managerId', label: 'Manager ID (for span of control)' },
  { value: 'fteFactor', label: 'FTE Factor' },
];

export default function CSVUpload({ datasetId }: CSVUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [compensationMode, setCompensationMode] = useState<'annual' | 'monthly'>('annual');

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

          // Auto-map columns based on common names
          const autoMapping: ColumnMapping = {};
          csvColumns.forEach(col => {
            const lowerCol = col.toLowerCase().trim();
            if (lowerCol.includes('name') && !lowerCol.includes('company')) {
              autoMapping[col] = 'employeeName';
            } else if (lowerCol.includes('email')) {
              autoMapping[col] = 'email';
            } else if (lowerCol.includes('department') || lowerCol.includes('dept')) {
              autoMapping[col] = 'department';
            } else if (lowerCol.includes('role') || lowerCol.includes('title') || lowerCol.includes('position')) {
              autoMapping[col] = 'role';
            } else if (lowerCol.includes('level')) {
              autoMapping[col] = 'level';
            } else if (lowerCol.includes('type') && lowerCol.includes('employ')) {
              autoMapping[col] = 'employmentType';
            } else if (lowerCol.includes('compensation') || lowerCol.includes('total comp') || lowerCol.includes('tc')) {
              autoMapping[col] = 'totalCompensation';
            } else if (lowerCol.includes('salary') || lowerCol.includes('base')) {
              autoMapping[col] = 'baseSalary';
            } else if (lowerCol.includes('bonus')) {
              autoMapping[col] = 'bonus';
            } else if (lowerCol.includes('equity') || lowerCol.includes('stock')) {
              autoMapping[col] = 'equityValue';
            } else if (lowerCol.includes('start') || lowerCol.includes('hire')) {
              autoMapping[col] = 'startDate';
            } else if (lowerCol.includes('location') || lowerCol.includes('office')) {
              autoMapping[col] = 'location';
            } else if (lowerCol.includes('manager') && (lowerCol.includes('id') || lowerCol.includes('email'))) {
              autoMapping[col] = 'managerId';
            } else if (lowerCol.includes('fte')) {
              autoMapping[col] = 'fteFactor';
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
    const template = `Employee Name,Email,Department,Role,Level,Employment Type,Total Compensation,Base Salary,Bonus,Equity Value,Start Date,Location,Manager ID,FTE Factor
John Doe,john@example.com,Engineering,Senior Engineer,IC,FTE,150000,120000,20000,10000,2023-01-15,San Francisco,,1.0
Jane Smith,jane@example.com,Sales,Account Executive,IC,FTE,130000,100000,25000,5000,2023-03-01,New York,john@example.com,1.0
Bob Johnson,bob@example.com,Engineering,Engineering Manager,MANAGER,FTE,180000,150000,20000,10000,2022-06-01,San Francisco,,1.0`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMapping = () => {
    // Validate required fields are mapped
    const requiredFields = ['employeeName', 'department', 'totalCompensation'];
    const mappedFields = Object.values(columnMapping).filter(v => v !== null && v !== '');

    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      alert(`Please map required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    try {
      // Compensation fields that need conversion
      const compensationFields = ['totalCompensation', 'baseSalary', 'bonus', 'equityValue'];
      const multiplier = compensationMode === 'monthly' ? 12 : 1;

      // Transform data based on column mapping
      const transformedData = parsedData.map(row => {
        const transformed: any = {};

        Object.entries(columnMapping).forEach(([csvCol, fieldName]) => {
          if (fieldName && fieldName !== '') {
            let value = row[csvCol];

            // Convert monthly compensation to annual if needed
            if (compensationFields.includes(fieldName) && value) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                value = (numValue * multiplier).toString();
              }
            }

            transformed[fieldName] = value;
          }
        });

        return transformed;
      });

      // Send to API
      const response = await fetch(`/api/datasets/${datasetId}/employees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: transformedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');

      // Refresh the page to show new employees
      setTimeout(() => {
        router.refresh();
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Failed to import employees');
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
    setCompensationMode('annual');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
      >
        <Upload className="h-5 w-5" />
        Import from CSV
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Import Employees from CSV</h2>
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
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center hover:border-blue-400 hover:bg-blue-50"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              Drop your CSV file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">CSV files only</p>
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
              <strong>{parsedData.length} rows</strong> found. Map your CSV columns to employee fields below.
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
                  {FIELD_OPTIONS.map((option) => (
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
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
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
              <strong>Ready to import {parsedData.length} employees</strong>. Preview the first 5 rows below.
            </p>
          </div>

          {/* Compensation Mode Selector */}
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Compensation Data Format
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Are the compensation values in your CSV monthly or annual?
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setCompensationMode('annual')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    compensationMode === 'annual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annual
                </button>
                <button
                  type="button"
                  onClick={() => setCompensationMode('monthly')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    compensationMode === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            {compensationMode === 'monthly' && (
              <p className="mt-2 text-xs text-blue-700">
                All monthly values will be converted to annual (×12) during import.
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {Object.values(columnMapping)
                    .filter(v => v && v !== '')
                    .map((field) => (
                      <th key={field} className="px-3 py-2 text-left font-semibold text-gray-900">
                        {FIELD_OPTIONS.find(f => f.value === field)?.label || field}
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
              Import {parsedData.length} Employees
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-lg font-semibold text-gray-900">Importing employees...</p>
          <p className="mt-1 text-sm text-gray-500">Please wait</p>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-4 py-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Complete!</h3>
            <p className="mt-2 text-sm text-gray-600">
              <strong className="text-green-600">{importResult.success} employees</strong> imported successfully
            </p>
            {importResult.failed > 0 && (
              <p className="mt-1 text-sm text-orange-600">
                {importResult.failed} rows skipped due to errors
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
