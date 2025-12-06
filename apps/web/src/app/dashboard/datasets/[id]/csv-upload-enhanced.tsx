'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Check } from 'lucide-react';
import Papa from 'papaparse';
import { autoMapColumns, parseNumber, mergeNames, standardizeDepartment, extractSeniorityLevel, normalizeRoleTitle, classifyRoleFamily } from '@/lib/csv-utils';

interface CSVUploadProps {
  datasetId: string;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  [csvColumn: string]: string | null;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface RowValidation {
  index: number;
  errors: ValidationError[];
  data: ParsedRow;
}

const FIELD_OPTIONS = [
  { value: '', label: 'Select column...' },
  { value: 'employeeName', label: 'Employee Name', required: true },
  { value: 'firstName', label: 'First Name', required: false },
  { value: 'lastName', label: 'Last Name', required: false },
  { value: 'email', label: 'Email', required: false },
  { value: 'department', label: 'Department', required: true },
  { value: 'role', label: 'Role', required: false },
  { value: 'level', label: 'Level', required: false },
  { value: 'employmentType', label: 'Employment Type', required: false },
  { value: 'totalCompensation', label: 'Total Compensation', required: true },
  { value: 'baseSalary', label: 'Base Salary', required: false },
  { value: 'bonus', label: 'Bonus', required: false },
  { value: 'equityValue', label: 'Equity Value', required: false },
  { value: 'startDate', label: 'Start Date', required: false },
  { value: 'location', label: 'Location', required: false },
  { value: 'fteFactor', label: 'FTE Factor', required: false },
];

type Step = 'upload' | 'match' | 'validate' | 'importing';

export default function CSVUploadEnhanced({ datasetId }: CSVUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validatedRows, setValidatedRows] = useState<RowValidation[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        setParsedData(data);

        if (data.length > 0) {
          const csvColumns = Object.keys(data[0]);
          setColumns(csvColumns);

          // Use fuzzy matching for auto-mapping
          const autoMapping = autoMapColumns(csvColumns);

          setColumnMapping(autoMapping);
          setStep('match');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file');
      },
    });
  };

  const validateData = () => {
    const validated: RowValidation[] = parsedData.map((row, index) => {
      const errors: ValidationError[] = [];
      const transformedRow: any = {};

      // Check for name columns - merge if separate
      const hasFirstName = Object.values(columnMapping).includes('firstName' as any);
      const hasLastName = Object.values(columnMapping).includes('lastName' as any);

      if (hasFirstName || hasLastName) {
        const firstName = hasFirstName ? row[Object.keys(columnMapping).find(k => columnMapping[k] === 'firstName')!] : undefined;
        const lastName = hasLastName ? row[Object.keys(columnMapping).find(k => columnMapping[k] === 'lastName')!] : undefined;
        transformedRow.employeeName = mergeNames(firstName, lastName);
      }

      // Transform and validate
      Object.entries(columnMapping).forEach(([csvCol, fieldName]) => {
        if (fieldName && fieldName !== '') {
          const value = row[csvCol];

          // Skip firstName/lastName as we merged them above
          if (fieldName === 'firstName' || fieldName === 'lastName') {
            return;
          }

          // Parse numeric fields with European format support
          if (fieldName.includes('Compensation') || fieldName.includes('Salary') || fieldName.includes('bonus') || fieldName.includes('equity')) {
            const parsed = parseNumber(value);
            if (value && parsed === null) {
              errors.push({
                row: index,
                field: fieldName,
                message: `Must be a valid number`,
              });
            }
            transformedRow[fieldName] = parsed;
          }
          // Standardize department names
          else if (fieldName === 'department') {
            transformedRow[fieldName] = standardizeDepartment(value || '');
          }
          // Enhance role with metadata
          else if (fieldName === 'role') {
            transformedRow[fieldName] = value;
            // Could extract seniority and role family here for future use
            // transformedRow.seniorityLevel = extractSeniorityLevel(value || '');
            // transformedRow.roleFamily = classifyRoleFamily(value || '');
          }
          else {
            transformedRow[fieldName] = value;
          }

          // Check required fields
          const fieldDef = FIELD_OPTIONS.find(f => f.value === fieldName);
          if (fieldDef?.required && (!value || value.trim() === '')) {
            errors.push({
              row: index,
              field: fieldName,
              message: `${fieldDef.label} is required`,
            });
          }

          // Validate email
          if (fieldName === 'email' && value) {
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(value)) {
              errors.push({
                row: index,
                field: fieldName,
                message: `Invalid email format`,
              });
            }
          }
        }
      });

      return { index, errors, data: transformedRow };
    });

    setValidatedRows(validated);
    setStep('validate');
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    try {
      // Filter out rows with errors or unselected rows
      const rowsToImport = validatedRows
        .filter(v => v.errors.length === 0)
        .map(v => v.data);

      const response = await fetch(`/api/datasets/${datasetId}/employees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: rowsToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      router.refresh();
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Failed to import employees');
      setStep('validate');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('upload');
    setParsedData([]);
    setColumns([]);
    setColumnMapping({});
    setValidatedRows([]);
    setSelectedRows(new Set());
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const discardSelectedRows = () => {
    const newValidatedRows = validatedRows.filter((_, i) => !selectedRows.has(i));
    setValidatedRows(newValidatedRows);
    setSelectedRows(new Set());
  };

  const filteredRows = showOnlyErrors
    ? validatedRows.filter(v => v.errors.length > 0)
    : validatedRows;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-6xl rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              step === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'upload' ? '1' : <Check className="h-6 w-6" />}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Upload file</span>
          </div>

          <div className={`h-1 w-32 ${step !== 'upload' ? 'bg-green-600' : 'bg-gray-200'}`}></div>

          {/* Step 2 - Skip header row (we'll auto-detect) */}
          {/* <div className="flex items-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              step === 'upload' ? 'bg-gray-200 text-gray-500' : step === 'match' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'upload' || step === 'match' ? '2' : <Check className="h-6 w-6" />}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Select header row</span>
          </div>

          <div className={`h-1 w-32 ${step === 'validate' || step === 'importing' ? 'bg-green-600' : 'bg-gray-200'}`}></div> */}

          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              step === 'upload' ? 'bg-gray-200 text-gray-500' : step === 'match' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'upload' || step === 'match' ? '2' : <Check className="h-6 w-6" />}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Match Columns</span>
          </div>

          <div className={`h-1 w-32 ${step === 'validate' || step === 'importing' ? 'bg-green-600' : 'bg-gray-200'}`}></div>

          {/* Step 4 */}
          <div className="flex items-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              step === 'validate' || step === 'importing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Validate data</span>
          </div>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Upload file</h2>

            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-gray-900">Data that we expect:</h3>
              <p className="text-sm text-gray-500">(You will have a chance to rename or remove columns in next steps)</p>

              <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                {FIELD_OPTIONS.filter(f => f.value).slice(0, 5).map(field => (
                  <div key={field.value} className="font-medium text-gray-700">
                    {field.label.toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-4 text-sm text-gray-500">
                <div>John Doe</div>
                <div>john@example.com</div>
                <div>Engineering</div>
                <div>Senior Engineer</div>
                <div>IC</div>
              </div>
            </div>

            <div
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/30 p-24 text-center transition hover:bg-blue-50"
            >
              <p className="text-gray-600">Upload .xlsx, .xls or .csv file</p>
              <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
                Select file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>
        )}

        {/* Step: Match Columns */}
        {step === 'match' && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Match Columns</h2>
            <p className="mb-6 text-sm text-gray-600">
              Map your CSV columns to our system fields. Columns marked with <span className="text-red-600">*</span> are required.
            </p>

            <div className="mb-6 max-h-96 overflow-y-auto rounded-lg border bg-gray-50 p-4">
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col} className="flex items-center gap-4">
                    {/* CSV Column Name */}
                    <div className="w-1/2 flex items-center rounded-lg border bg-white px-4 py-2">
                      <span className="text-sm font-medium text-gray-900">{col}</span>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400">→</div>

                    {/* Field Mapping Dropdown */}
                    <div className="w-1/2">
                      <select
                        value={columnMapping[col] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [col]: e.target.value || null })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {FIELD_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}{option.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>Found {columns.length} columns</strong> in your CSV.
                {Object.values(columnMapping).filter(v => v && v !== '').length > 0 && (
                  <> Auto-mapped {Object.values(columnMapping).filter(v => v && v !== '').length} columns.</>
                )}
              </p>
            </div>

            <button
              onClick={validateData}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}

        {/* Step: Validate */}
        {step === 'validate' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Validate data</h2>
              <div className="flex items-center gap-4">
                {selectedRows.size > 0 && (
                  <button
                    onClick={discardSelectedRows}
                    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Discard selected rows
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyErrors}
                    onChange={(e) => setShowOnlyErrors(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Show only rows with errors</span>
                </label>
              </div>
            </div>

            <div className="mb-6 max-h-96 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </th>
                    {Object.values(columnMapping).filter(v => v).map(fieldName => {
                      const field = FIELD_OPTIONS.find(f => f.value === fieldName);
                      return (
                        <th key={fieldName} className="px-4 py-3 text-left font-semibold text-gray-900">
                          {field?.label || fieldName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRows.map((validation, idx) => {
                    const hasError = validation.errors.length > 0;
                    return (
                      <tr key={validation.index} className={hasError ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(validation.index)}
                            onChange={() => toggleRowSelection(validation.index)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>
                        {Object.entries(columnMapping).filter(([, v]) => v).map(([csvCol, fieldName]) => {
                          const error = validation.errors.find(e => e.field === fieldName);
                          return (
                            <td key={csvCol} className="px-4 py-3">
                              <div>
                                <div className={error ? 'text-red-600' : 'text-gray-900'}>
                                  {validation.data[fieldName!] || '-'}
                                </div>
                                {error && (
                                  <div className="mt-1 text-xs text-red-600">{error.message}</div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleImport}
              disabled={validatedRows.filter(v => v.errors.length === 0).length === 0}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              Confirm
            </button>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-lg font-semibold text-gray-900">Importing employees...</p>
          </div>
        )}
      </div>
    </div>
  );
}
