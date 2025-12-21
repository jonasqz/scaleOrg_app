'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  RowSelectionState,
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
  Filter,
  Download,
  Trash2,
} from 'lucide-react';

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
  endDate: Date | null;
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
    status: true,
    // Hide these by default
    email: false,
    location: false,
    employmentType: false,
    fteFactor: false,
    startDate: false,
    endDate: false,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedRows.length} employee(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = selectedRows.map(row =>
        fetch(`/api/datasets/${datasetId}/employees/${row.original.id}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting employees:', error);
      alert('Failed to delete some employees. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export selected to CSV
  const handleExportSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      alert('Please select employees to export');
      return;
    }

    const headers = [
      'Employee Name',
      'Email',
      'Department',
      'Role',
      'Level',
      'Location',
      'Employment Type',
      'Total Compensation',
      'FTE Factor',
      'Start Date',
      'End Date',
      'Status',
    ];

    const rows = selectedRows.map(row => {
      const emp = row.original;
      return [
        emp.employeeName || '',
        emp.email || '',
        emp.department,
        emp.role || '',
        emp.level || '',
        emp.location || '',
        emp.employmentType,
        emp.totalCompensation.toString(),
        emp.fteFactor.toString(),
        emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : '',
        emp.endDate ? new Date(emp.endDate).toISOString().split('T')[0] : '',
        !emp.endDate ? 'Active' : new Date(emp.endDate) > new Date() ? 'Scheduled Termination' : 'Terminated',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_selected_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
          />
        ),
        enableSorting: false,
        enableGrouping: false,
      },
      {
        accessorKey: 'employeeName',
        header: 'Name',
        cell: ({ row, getValue }) => (
          <Link
            href={`/dashboard/datasets/${datasetId}/employees/${row.original.id}`}
            className="text-left font-medium text-xs text-orange-600 hover:text-orange-800 hover:underline"
          >
            {getValue() as string || 'N/A'}
          </Link>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-600">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ getValue }) => (
          <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700">
            {getValue() as string}
          </span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-900">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ getValue }) => {
          const level = getValue() as string;
          return level ? (
            <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600">
              {level}
            </span>
          ) : (
            <span className="text-xs text-stone-400">N/A</span>
          );
        },
        enableGrouping: true,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-600">{getValue() as string || 'N/A'}</span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'employmentType',
        header: 'Type',
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-900">{getValue() as string}</span>
        ),
        enableGrouping: true,
      },
      {
        accessorKey: 'totalCompensation',
        header: 'Total Comp',
        cell: ({ getValue }) => (
          <span className="font-medium text-stone-900">
            {currency} {(getValue() as number).toLocaleString()}
          </span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'fteFactor',
        header: 'FTE',
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-900">{getValue() as number}</span>
        ),
        enableGrouping: false,
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ getValue }) => {
          const date = getValue() as Date | null;
          return date ? (
            <span className="text-xs text-stone-600">
              {new Date(date).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-stone-400">N/A</span>
          );
        },
        enableGrouping: false,
      },
      {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ getValue }) => {
          const date = getValue() as Date | null;
          return date ? (
            <span className="text-xs text-red-600">
              {new Date(date).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-stone-400">-</span>
          );
        },
        enableGrouping: false,
      },
      {
        id: 'status',
        accessorFn: (row) => {
          if (!row.endDate) return 'Active';
          const endDate = new Date(row.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          return endDate > today ? 'Scheduled Termination' : 'Terminated';
        },
        header: 'Status',
        cell: ({ row }) => {
          if (!row.original.endDate) {
            return (
              <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                Active
              </span>
            );
          }
          const endDate = new Date(row.original.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (endDate > today) {
            return (
              <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                Scheduled Termination
              </span>
            );
          }
          return (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
              Terminated
            </span>
          );
        },
        enableGrouping: true,
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;

          if (!row.original.endDate) {
            return filterValue === 'active';
          }

          const endDate = new Date(row.original.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (filterValue === 'active') return false;
          if (filterValue === 'scheduled') return endDate > today;
          if (filterValue === 'terminated') return endDate <= today;
          return true;
        },
      },
    ],
    [currency, datasetId]
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
      rowSelection,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableGrouping: true,
    enableRowSelection: true,
    autoResetExpanded: false,
    autoResetPageIndex: false,
    getRowId: (row) => row.id,
  });

  const groupByOptions = [
    { value: '', label: 'No Grouping' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' },
    { value: 'level', label: 'Level' },
    { value: 'location', label: 'Location' },
    { value: 'employmentType', label: 'Employment Type' },
  ];

  // Get unique values for filter dropdowns
  const uniqueDepartments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );
  const uniqueLevels = useMemo(
    () => Array.from(new Set(employees.map((e) => e.level).filter(Boolean))).sort(),
    [employees]
  );
  const uniqueLocations = useMemo(
    () => Array.from(new Set(employees.map((e) => e.location).filter(Boolean))).sort(),
    [employees]
  );
  const uniqueEmploymentTypes = useMemo(
    () => Array.from(new Set(employees.map((e) => e.employmentType))).sort(),
    [employees]
  );

  return (
    <>
      {/* Controls */}
      <div className="mb-4 space-y-4">
        {/* Search and Group By Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Global Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search employees..."
              className="w-full rounded-lg border border-stone-300 py-2 pl-10 pr-10 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Group By Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-stone-700">Group by:</label>
            <select
              value={grouping[0] || ''}
              onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-stone-50 ${
              columnFilters.length > 0
                ? 'border-orange-600 bg-orange-50 text-orange-700'
                : 'border-stone-300 text-stone-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {columnFilters.length > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {columnFilters.length}
              </span>
            )}
          </button>

          {/* Column Visibility Toggle */}
          <button
            onClick={() => setShowColumnConfig(!showColumnConfig)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <Settings className="h-4 w-4" />
            Columns
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {Object.keys(rowSelection).length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-orange-900">
                {Object.keys(rowSelection).length} employee(s) selected
              </span>
              <button
                onClick={() => setRowSelection({})}
                className="text-xs text-orange-600 hover:text-orange-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">Filter Employees</h3>
              <div className="flex items-center gap-2">
                {columnFilters.length > 0 && (
                  <button
                    onClick={() => setColumnFilters([])}
                    className="text-xs text-orange-600 hover:text-orange-800"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Status
                </label>
                <select
                  value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
                  onChange={(e) =>
                    table.getColumn('status')?.setFilterValue(e.target.value || undefined)
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Employees</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled Termination</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Department
                </label>
                <select
                  value={(table.getColumn('department')?.getFilterValue() as string) ?? ''}
                  onChange={(e) =>
                    table.getColumn('department')?.setFilterValue(e.target.value || undefined)
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Level
                </label>
                <select
                  value={(table.getColumn('level')?.getFilterValue() as string) ?? ''}
                  onChange={(e) =>
                    table.getColumn('level')?.setFilterValue(e.target.value || undefined)
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Levels</option>
                  {uniqueLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Location
                </label>
                <select
                  value={(table.getColumn('location')?.getFilterValue() as string) ?? ''}
                  onChange={(e) =>
                    table.getColumn('location')?.setFilterValue(e.target.value || undefined)
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employment Type Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Employment Type
                </label>
                <select
                  value={(table.getColumn('employmentType')?.getFilterValue() as string) ?? ''}
                  onChange={(e) =>
                    table.getColumn('employmentType')?.setFilterValue(e.target.value || undefined)
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Types</option>
                  {uniqueEmploymentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Column Visibility Panel */}
        {showColumnConfig && (
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">Show/Hide Columns</h3>
              <button
                onClick={() => setShowColumnConfig(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {table.getAllLeafColumns().map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer hover:text-stone-900"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-4 w-4 rounded border-stone-300"
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
          <thead className="bg-stone-50 border-b border-stone-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-[10px] font-semibold text-stone-900 uppercase tracking-wider"
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
                          <span className="text-stone-400">
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
          <tbody className="divide-y divide-stone-100">
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                // Group header row
                const groupingValue = row.getGroupingValue(grouping[0]);
                const groupCount = row.subRows.length;

                return (
                  <tr key={row.id} className="bg-stone-50 font-medium">
                    <td
                      colSpan={table.getAllLeafColumns().filter((col) => col.getIsVisible()).length}
                      className="px-3 py-2"
                    >
                      <button
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-2 text-stone-900 hover:text-orange-600"
                      >
                        {row.getIsExpanded() ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <span className="font-semibold">
                          {groupingValue || 'Ungrouped'}
                        </span>
                        <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
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
                  className="hover:bg-stone-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
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
      <div className="mt-4 flex items-center justify-between text-xs text-stone-600">
        <span>
          Showing {table.getRowModel().rows.length} of {employees.length} employees
        </span>
        {Object.keys(rowSelection).length > 0 && (
          <span className="font-medium text-orange-600">
            {Object.keys(rowSelection).length} selected
          </span>
        )}
      </div>
    </>
  );
}
