'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricsChartsProps {
  departments: {
    [key: string]: {
      fte: number;
      cost: number;
      employeeCount: number;
      percentage: number;
    };
  };
  currency: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function MetricsCharts({ departments, currency }: MetricsChartsProps) {
  // Prepare data for charts
  const departmentData = Object.entries(departments).map(([name, data], index) => ({
    name,
    fte: Number(data.fte.toFixed(1)),
    cost: Number((data.cost / 1000).toFixed(0)), // in thousands
    employees: data.employeeCount,
    percentage: Number(data.percentage.toFixed(1)),
    color: COLORS[index % COLORS.length],
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 mt-1">
              {entry.name === 'cost' && `${currency} `}
              {entry.name}: {entry.value}
              {entry.name === 'cost' && 'k'}
              {entry.name === 'percentage' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Workforce Visualizations
      </h2>

      <div className="space-y-8">
        {/* Department Cost Bar Chart */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Department Costs ({currency})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{
                  value: `Cost (${currency} thousands)`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="cost"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Cost (thousands)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* FTE Distribution Bar Chart */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            FTE Distribution by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{
                  value: 'FTE',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="fte"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="FTE"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution Pie Chart */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Department Distribution (% of Total Cost)
          </h3>
          <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between">
            <ResponsiveContainer width="100%" height={300} className="lg:w-1/2">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend with detailed info */}
            <div className="mt-4 w-full space-y-2 lg:mt-0 lg:w-1/2">
              {departmentData.map((dept) => (
                <div
                  key={dept.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-medium text-gray-900">{dept.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {dept.percentage}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {dept.fte} FTE · {currency} {dept.cost}k
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Count vs Cost Comparison */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Employee Count vs. Cost by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{
                  value: 'Employee Count',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#6b7280' },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{
                  value: `Cost (${currency} thousands)`,
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12, fill: '#6b7280' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="employees"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                name="Employees"
              />
              <Bar
                yAxisId="right"
                dataKey="cost"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
                name="Cost (thousands)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> Hover over charts for detailed information.
          These visualizations help identify department cost concentrations and resource allocation patterns.
        </p>
      </div>
    </div>
  );
}
