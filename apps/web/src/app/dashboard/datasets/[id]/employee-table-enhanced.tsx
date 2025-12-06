'use client';

import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
  GroupingState,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  ExpandedState,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Settings,
  Search,
  X,
} from 'lucide-react';
import EmployeeDetailModal from './employee-detail-modal';

interface Employee {
  id: string;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  employmentType: string;
  totalCompensation: number;
  baseSalary: number | null;
  bonus: number | null;
  equityValue: number | null;
  fteFactor: number;
  startDate: Date | null;
  location: string | null;
  managerId: string | null;
  costCenter: string | null;
}

interface EmployeeTableEnhancedProps {
  employees: Employee[];
  datasetId: string;
  currency: string;
}

export default function EmployeeTableEnhanced({
  employees,
  datasetId,
  currency,
}: EmployeeTableEnhancedProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Default: only show key columns
    employeeName: true,
    department: true,
    role: true,
    level: true,
    totalCompensation: true,
    // Hide these by default
    email: false,
    location: false,
    employmentType: false,
    fteFactor: false,
    startDate: false,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: 'Name',
        cell: ({ row, getValue }) => (
          <button
            onClick={() => setSelectedEmployee(row.original)}
            className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {getValue() as string || 'N/A'}
          </button>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ getValue }) => (
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            {getValue() as string}
          </span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ getValue }) => {
          const level = getValue() as string;
          return level ? (
            <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
              {level}
            </span>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          );
        },
        enableGrouping: true,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'employmentType',
        header: 'Type',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900">{getValue() as string}</span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'totalCompensation',
        header: 'Total Comp',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {currency} {(getValue() as number).toLocaleString()}
          </span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'fteFactor',
        header: 'FTE',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900">{getValue() as number}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ getValue }) => {
          const date = getValue() as Date | null;
          return date ? (
            <span className="text-sm text-gray-600">
              {new Date(date).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          );
        },
        enableGrouping: false,
      },
    ],
    [currency]
  );

  const table = useReactTable({
    data: employees,
    columns,
    state: {
      grouping,
      expanded,
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableGrouping: true,
    autoResetExpanded: false,
  });

  const groupByOptions = [
    { value: '', label: 'No Grouping' },
    { value: 'department', label: 'Department' },
    { value: 'level', label: 'Level' },
    { value: 'location', label: 'Location' },
    { value: 'employmentType', label: 'Employment Type' },
  ];

  return (
    <>
      {/* Controls */}
      <div className="mb-4 space-y-4">
        {/* Search and Group By Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Global Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search employees..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Group By Select */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Group by:</label>
            <select
              value={grouping[0] || ''}
              onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Column Visibility Toggle */}
          <button
            onClick={() => setShowColumnConfig(!showColumnConfig)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Columns
          </button>
        </div>

        {/* Column Visibility Panel */}
        {showColumnConfig && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Show/Hide Columns</h3>
              <button
                onClick={() => setShowColumnConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {table.getAllLeafColumns().map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {column.columnDef.header as string}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                // Group header row
                const groupingValue = row.getGroupingValue(grouping[0]);
                const groupCount = row.subRows.length;

                return (
                  <tr key={row.id} className="bg-gray-100 font-medium">
                    <td
                      colSpan={table.getAllLeafColumns().filter((col) => col.getIsVisible()).length}
                      className="px-4 py-3"
                    >
                      <button
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-2 text-gray-900 hover:text-blue-600"
                      >
                        {row.getIsExpanded() ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <span className="font-semibold">
                          {groupingValue || 'Ungrouped'}
                        </span>
                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {groupCount} {groupCount === 1 ? 'employee' : 'employees'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              }

              // Regular data row
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {employees.length} employees
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          datasetId={datasetId}
          currency={currency}
          isOpen={true}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}
