import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportAnalyticsOptions {
  datasetName: string;
  currency: string;
  metrics: any;
  employees: any[];
  benchmarks?: any;
  outliers?: any;
  insights?: any[];
  tenure?: any;
}

export function exportAnalyticsToPDF(options: ExportAnalyticsOptions) {
  const { datasetName, currency, metrics, employees, benchmarks, outliers, insights, tenure } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Workforce Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Dataset name and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Dataset: ${datasetName}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`Generated: ${date}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Executive Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPosition);
  yPosition += 8;

  if (metrics?.summary) {
    const summaryData = [
      ['Metric', 'Value'],
      ['Total FTE', metrics.summary.totalFTE.toFixed(1)],
      ['Total Compensation Cost', `${currency} ${(metrics.summary.totalCost / 1000000).toFixed(2)}M`],
      ['Cost per FTE', `${currency} ${(metrics.summary.costPerFTE / 1000).toFixed(0)}k`],
      ['Total Employees', metrics.summary.employeeCount.toString()],
    ];

    if (metrics.summary.revenuePerFTE) {
      summaryData.push(['Revenue per FTE', `${currency} ${(metrics.summary.revenuePerFTE / 1000).toFixed(0)}k`]);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Key Ratios
  if (metrics?.ratios) {
    checkAddPage(doc, yPosition, 50);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Organizational Ratios', 14, yPosition);
    yPosition += 8;

    const ratiosData = [
      ['Ratio', 'Value', 'Description'],
      [
        'R&D to GTM Ratio',
        metrics.ratios.rdToGTM.toFixed(2) + ':1',
        'Balance between R&D and GTM functions'
      ],
      [
        'Manager to IC Ratio',
        metrics.ratios.managerToIC.toFixed(2) + ':1',
        'Ratio of managers to individual contributors'
      ],
      [
        'Avg Span of Control',
        metrics.ratios.avgSpanOfControl.toFixed(1),
        'Average direct reports per manager'
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [ratiosData[0]],
      body: ratiosData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Department Breakdown & Visualizations
  if (metrics?.departments) {
    checkAddPage(doc, yPosition, 70);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Department Breakdown & Visualizations', 14, yPosition);
    yPosition += 8;

    // Detailed department table
    const deptData = [
      ['Department', 'FTE', 'Employees', 'Cost', '% of Total', 'Avg Comp'],
    ];

    Object.entries(metrics.departments).forEach(([dept, data]: [string, any]) => {
      deptData.push([
        dept,
        data.fte.toFixed(1),
        data.employeeCount.toString(),
        `${currency} ${(data.cost / 1000).toFixed(0)}k`,
        data.percentage.toFixed(1) + '%',
        `${currency} ${(data.avgCompensation / 1000).toFixed(0)}k`,
      ]);
    });

    autoTable(doc, {
      startY: yPosition,
      head: [deptData[0]],
      body: deptData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;

    // Add visual representation using ASCII-style bars
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Department Cost Distribution', 14, yPosition);
    yPosition += 8;

    // Sort departments by cost for better visualization
    const sortedDepts = Object.entries(metrics.departments)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.cost - a.cost);

    sortedDepts.forEach(([dept, data]: [string, any]) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Department name
      doc.text(dept, 14, yPosition);

      // Bar representation (using filled rectangle)
      const maxBarWidth = 120;
      const barWidth = (data.percentage / 100) * maxBarWidth;
      doc.setFillColor(79, 70, 229);
      doc.rect(70, yPosition - 3, barWidth, 4, 'F');

      // Percentage and cost
      doc.text(`${data.percentage.toFixed(1)}%`, 195, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`${currency} ${(data.cost / 1000).toFixed(0)}k`, 165, yPosition);

      yPosition += 8;

      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 10;

    // FTE Distribution
    checkAddPage(doc, yPosition, 70);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FTE Distribution by Department', 14, yPosition);
    yPosition += 8;

    const sortedByFTE = Object.entries(metrics.departments)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.fte - a.fte);

    const totalFTE = sortedByFTE.reduce((sum, [, data]: [string, any]) => sum + data.fte, 0);

    sortedByFTE.forEach(([dept, data]: [string, any]) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const ftePercentage = (data.fte / totalFTE) * 100;

      // Department name
      doc.text(dept, 14, yPosition);

      // Bar representation
      const maxBarWidth = 120;
      const barWidth = (ftePercentage / 100) * maxBarWidth;
      doc.setFillColor(16, 185, 129); // green
      doc.rect(70, yPosition - 3, barWidth, 4, 'F');

      // FTE and percentage
      doc.text(`${ftePercentage.toFixed(1)}%`, 195, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.fte.toFixed(1)} FTE`, 160, yPosition);

      yPosition += 8;

      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    yPosition += 5;
  }

  // Tenure Analysis (if available)
  if (tenure || metrics?.tenure) {
    const tenureData = tenure || metrics.tenure;
    checkAddPage(doc, yPosition, 70);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tenure Analysis', 14, yPosition);
    yPosition += 8;

    if (tenureData.avgTenure !== undefined) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Average Tenure: ${tenureData.avgTenure.toFixed(1)} years`, 14, yPosition);
      yPosition += 5;
      doc.text(`Median Tenure: ${tenureData.medianTenure?.toFixed(1) || 'N/A'} years`, 14, yPosition);
      yPosition += 10;
    }

    if (tenureData.distribution) {
      const tenureTableData = [
        ['Tenure Range', 'Employees', 'Percentage'],
      ];

      Object.entries(tenureData.distribution).forEach(([range, count]: [string, any]) => {
        const percentage = ((count / employees.length) * 100).toFixed(1);
        tenureTableData.push([
          range,
          count.toString(),
          percentage + '%',
        ]);
      });

      autoTable(doc, {
        startY: yPosition,
        head: [tenureTableData[0]],
        body: tenureTableData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [147, 51, 234], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Benchmarks (if available)
  if (benchmarks) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Benchmark Comparison', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Industry: ${benchmarks.industry || 'N/A'}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Company Size: ${benchmarks.companySize || 'N/A'}`, 14, yPosition);
    yPosition += 10;

    if (benchmarks.comparisons) {
      const benchData = [
        ['Metric', 'Your Value', 'Benchmark', 'Status'],
      ];

      Object.entries(benchmarks.comparisons).forEach(([metric, data]: [string, any]) => {
        const status = data.status === 'within' ? '✓ On Target' :
                      data.status === 'above' ? '↑ Above' : '↓ Below';
        benchData.push([
          formatMetricName(metric),
          data.value?.toFixed(2) || 'N/A',
          data.benchmark?.median?.toFixed(2) || 'N/A',
          status,
        ]);
      });

      autoTable(doc, {
        startY: yPosition,
        head: [benchData[0]],
        body: benchData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Outliers (if available)
  if (outliers && (outliers.highCostEmployees?.length > 0 || outliers.lowSpanManagers?.length > 0)) {
    checkAddPage(doc, yPosition, 70);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Outlier Analysis', 14, yPosition);
    yPosition += 8;

    // High cost employees
    if (outliers.highCostEmployees?.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('High Compensation Outliers', 14, yPosition);
      yPosition += 6;

      const outlierData = [
        ['Department', 'Role', 'Compensation', 'Z-Score'],
      ];

      outliers.highCostEmployees.slice(0, 10).forEach((emp: any) => {
        outlierData.push([
          emp.department,
          emp.role || 'N/A',
          `${currency} ${(emp.totalCompensation / 1000).toFixed(0)}k`,
          emp.zScore.toFixed(2),
        ]);
      });

      autoTable(doc, {
        startY: yPosition,
        head: [outlierData[0]],
        body: outlierData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 12;
    }

    // Low span managers
    if (outliers.lowSpanManagers?.length > 0) {
      checkAddPage(doc, yPosition, 50);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Low Span of Control', 14, yPosition);
      yPosition += 6;

      const managerData = [
        ['Department', 'Direct Reports', 'Expected Min'],
      ];

      outliers.lowSpanManagers.slice(0, 10).forEach((mgr: any) => {
        managerData.push([
          mgr.department,
          mgr.directReportsCount.toString(),
          mgr.expectedMin.toString(),
        ]);
      });

      autoTable(doc, {
        startY: yPosition,
        head: [managerData[0]],
        body: managerData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // AI Insights (if available)
  if (insights && insights.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Powered Insights', 14, yPosition);
    yPosition += 10;

    insights.slice(0, 10).forEach((insight: any, index: number) => {
      checkAddPage(doc, yPosition, 40);

      // Insight number and severity
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const severityColor = getSeverityColor(insight.severity);
      doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.text(`${index + 1}. ${insight.title}`, 14, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;

      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(insight.description, pageWidth - 28);
      doc.text(descLines, 14, yPosition);
      yPosition += descLines.length * 5 + 8;
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `ScaleOrg Analytics Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${datasetName.replace(/[^a-z0-9]/gi, '_')}_analytics_${Date.now()}.pdf`;
  doc.save(fileName);
}

// Helper functions
function checkAddPage(doc: jsPDF, yPosition: number, requiredSpace: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition + requiredSpace > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return yPosition;
}

function formatMetricName(metric: string): string {
  return metric
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function getSeverityColor(severity: string): [number, number, number] {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return [220, 38, 38]; // red-600
    case 'high':
      return [239, 68, 68]; // red-500
    case 'medium':
      return [251, 146, 60]; // orange-400
    case 'low':
      return [59, 130, 246]; // blue-500
    default:
      return [0, 0, 0]; // black
  }
}
