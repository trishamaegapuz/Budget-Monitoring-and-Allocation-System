import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from './layout/Layout';
import { API_URL } from '../config/api';
import Toast from './Toast';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  HelpCircle,
  AlertCircle,
  PieChart,
  FileBarChart,
} from 'lucide-react';

const UA_LOGO = '/UA_logo.jpg';

const EMPTY_REFERENCES = {
  years: [new Date().getFullYear()],
  fundGroups: [],
  fundClusters: [],
  fundSources: [],
  departments: [],
};

const CATEGORY_CARDS = [
  {
    id: 'FAR',
    title: 'FAR Reports',
    description: 'FAR 1, 1a, 2, 2a',
    icon: FileText,
    activeClass: 'border-blue-500 bg-blue-50/30',
    iconClass: 'bg-blue-600',
  },
  {
    id: 'WFP',
    title: 'WFP Reports',
    description: 'Work and Financial Plan Balance',
    icon: PieChart,
    activeClass: 'border-blue-500 bg-blue-50/30',
    iconClass: 'bg-blue-600',
  },
  {
    id: 'PRINT',
    title: 'Print Reports',
    description: 'Main, BGD, CHED, DOST, DA, LAPAZ, etc.',
    icon: Printer,
    activeClass: 'border-purple-500 bg-purple-50/30',
    iconClass: 'bg-purple-600',
  },
  {
    id: 'OTHER',
    title: 'Other Reports',
    description: 'Budget Utilization, Breakdown, Summary, etc.',
    icon: FileBarChart,
    activeClass: 'border-emerald-500 bg-emerald-50/30',
    iconClass: 'bg-emerald-600',
  },
];

const FALLBACK_CATALOG = [
  {
    key: 'far-1',
    name: 'FAR 1',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'Status of Allotments, Obligations and Balances',
    sheetName: 'FAR 1 worksheet',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1a',
    name: 'FAR 1a',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'Financial Accountability Report 1a',
    sheetName: 'FAR 1a worksheet',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-2',
    name: 'FAR 2',
    category: 'FAR',
    type: 'FAR',
    registry: 'RBUD',
    description: 'Summary of Approved Budget, Utilizations and Balances',
    sheetName: 'FAR 2 worksheet',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-2a',
    name: 'FAR 2a',
    category: 'FAR',
    type: 'FAR',
    registry: 'RBUD',
    description: 'Financial Accountability Report 2a',
    sheetName: 'FAR 2a worksheet',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-main',
    name: 'FAR 1 - Main Fund',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for Main Fund',
    sheetName: 'FAR 1 - Main Fund',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-bgd',
    name: 'FAR 1 - BGD',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for BGD Fund',
    sheetName: 'FAR 1 - BGD',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-ched',
    name: 'FAR 1 - CHED',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for CHED Fund',
    sheetName: 'FAR 1 - CHED',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-dost',
    name: 'FAR 1 - DOST',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for DOST Fund',
    sheetName: 'FAR 1 - DOST',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-da',
    name: 'FAR 1 - DA',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for DA Fund',
    sheetName: 'FAR 1 - DA',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-1-lapaz',
    name: 'FAR 1 - LAPAZ',
    category: 'FAR',
    type: 'FAR',
    registry: 'RAOD',
    description: 'FAR 1 for LAPAZ Fund',
    sheetName: 'FAR 1 - LAPAZ',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'far-2-2a-merge',
    name: 'FAR 2 & 2A Merge',
    category: 'FAR',
    type: 'FAR',
    registry: 'RBUD',
    description: 'Combined FAR 2 and FAR 2a reporting structure',
    sheetName: 'FAR 2 & 2A Merge',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'saronca',
    name: 'SARONCA',
    category: 'FAR',
    type: 'FAR',
    registry: 'RBUD',
    description: 'SARONCA reporting sheet',
    sheetName: 'SARONCA',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'wfp-balance',
    name: 'WFP Balance',
    category: 'WFP',
    type: 'WFP',
    registry: 'RAOD/RBUD',
    description: 'Work and Financial Plan Balance',
    sheetName: 'WFP Balance',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'wfp',
    name: 'Work and Financial Plan',
    category: 'WFP',
    type: 'WFP',
    registry: 'RAOD/RBUD',
    description: 'Work and Financial Plan report',
    sheetName: 'WFP',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-main',
    name: 'Print 164 - Main',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'Main fund print sheet',
    sheetName: 'Print 164 Main',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-bgd',
    name: 'Print 164 - BGD',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'BGD fund print sheet',
    sheetName: 'Print 164 BGD',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-ched',
    name: 'Print 164 - CHED',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'CHED fund print sheet',
    sheetName: 'Print 164 CHED',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-dost',
    name: 'Print 164 - DOST',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'DOST fund print sheet',
    sheetName: 'Print 164 DOST',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-da',
    name: 'Print 164 - DA',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'DA fund print sheet',
    sheetName: 'Print 164 DA',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'print-lapaz',
    name: 'Print 164 - LAPAZ',
    category: 'PRINT',
    type: 'Print',
    registry: 'RAOD',
    description: 'LAPAZ fund print sheet',
    sheetName: 'Print 164 LAPAZ',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'breakdown',
    name: 'Breakdown Report',
    category: 'OTHER',
    type: 'Breakdown',
    registry: 'RAOD/RBUD',
    description: 'Breakdown of registry financial values',
    sheetName: 'Breakdown',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'summary',
    name: 'Summary Report',
    category: 'OTHER',
    type: 'Summary',
    registry: 'RAOD/RBUD',
    description: 'Summary of registry financial values',
    sheetName: 'Summary',
    formats: ['Excel', 'PDF', 'Print'],
  },
  {
    key: 'budget-utilization',
    name: 'Budget Utilization Report',
    category: 'OTHER',
    type: 'Summary',
    registry: 'RBUD/RAOD',
    description: 'Budget utilization and remaining balance',
    sheetName: 'Budget Utilization',
    formats: ['Excel', 'PDF', 'Print'],
  },
];

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) =>
  `â‚±${numberValue(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) => {
  if (!value) return 'â€”';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'â€”'
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

export default function Exports({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [references, setReferences] = useState(EMPTY_REFERENCES);

  const [selectedCategory, setSelectedCategory] =
    useState('FAR');

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [preview, setPreview] = useState(null);

  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    fiscal_year: String(new Date().getFullYear()),
    report_type: 'FAR Reports',
    fund_group: '',
    fund_cluster_id: '',
    fund_source_id: '',
    department: '',
    period: 'annual',
  });

  const [appliedFilters, setAppliedFilters] =
    useState(filters);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState('');

  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token]
  );

  const showToast = (
    message,
    type = 'success'
  ) => {
    setToast({
      message,
      type,
    });
  };

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/exports/catalog`,
        {
          headers,
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (
        Array.isArray(data.catalog) &&
        data.catalog.length
      ) {
        setCatalog(data.catalog);
      }
    } catch (err) {
      console.error(
        'Catalog load error:',
        err
      );
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const loadReferences = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/exports/references`,
        {
          headers,
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setReferences({
        ...EMPTY_REFERENCES,
        ...data,
      });

      if (
        Array.isArray(data.years) &&
        data.years.length &&
        !data.years.includes(
          Number(filters.fiscal_year)
        )
      ) {
        setFilters((previous) => ({
          ...previous,
          fiscal_year: String(
            data.years[0]
          ),
        }));

        setAppliedFilters((previous) => ({
          ...previous,
          fiscal_year: String(
            data.years[0]
          ),
        }));
      }
    } catch (err) {
      console.error(
        'Reference load error:',
        err
      );
    }
  }, [headers, filters.fiscal_year]);

  useEffect(() => {
    loadCatalog();
    loadReferences();
  }, [loadCatalog, loadReferences]);

  const reportsForCategory = useMemo(() => {
    const list = catalog.filter(
      (item) =>
        item.category === selectedCategory
    );

    const term = search
      .trim()
      .toLowerCase();

    if (!term) return list;

    return list.filter((item) =>
      `${item.name} ${item.description} ${item.registry}`
        .toLowerCase()
        .includes(term)
    );
  }, [
    catalog,
    selectedCategory,
    search,
  ]);

  const pageSize = 8;

  const totalPages = Math.max(
    1,
    Math.ceil(
      reportsForCategory.length /
        pageSize
    )
  );

  const pageItems =
    reportsForCategory.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    search,
  ]);

  const loadPreview = useCallback(
    async (
      report,
      currentFilters = appliedFilters
    ) => {
      if (!report) return;

      setSelectedReport(report);
      setPreviewLoading(true);
      setError('');

      try {
        const params =
          new URLSearchParams({
            fiscal_year: String(
              currentFilters.fiscal_year ||
                new Date().getFullYear()
            ),
            period:
              currentFilters.period ||
              'annual',
          });

        if (
          currentFilters.fund_cluster_id
        ) {
          params.set(
            'fund_cluster_id',
            currentFilters.fund_cluster_id
          );
        }

        if (
          currentFilters.fund_source_id
        ) {
          params.set(
            'fund_source_id',
            currentFilters.fund_source_id
          );
        }

        if (currentFilters.fund_group) {
          params.set(
            'fund_group',
            currentFilters.fund_group
          );
        }

        if (currentFilters.department) {
          params.set(
            'department',
            currentFilters.department
          );
        }

        const response = await fetch(
          `${API_URL}/exports/preview/${encodeURIComponent(
            report.key
          )}?${params.toString()}`,
          {
            headers,
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load report preview.'
          );
        }

        setPreview(data);
      } catch (err) {
        console.error(
          'Preview error:',
          err
        );

        setPreview(null);

        setError(
          err.message ||
            'Failed to load report preview.'
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [appliedFilters, headers]
  );

  useEffect(() => {
    if (!selectedReport) {
      const first = pageItems[0];

      if (first) {
        loadPreview(
          first,
          appliedFilters
        );
      }
    }
  }, [
    pageItems,
    selectedReport,
    loadPreview,
    appliedFilters,
  ]);

  const handleCategory = (id) => {
    setSelectedCategory(id);

    const first = catalog.find(
      (item) =>
        item.category === id
    );

    if (first) {
      loadPreview(
        first,
        appliedFilters
      );
    }
  };

  const applyFilters = () => {
    const next = {
      ...filters,
    };

    setAppliedFilters(next);
    setPage(1);

    if (selectedReport) {
      loadPreview(
        selectedReport,
        next
      );
    }

    showToast(
      'Report filters applied successfully.'
    );
  };

  const resetFilters = () => {
    const next = {
      fiscal_year: String(
        references.years?.[0] ||
          new Date().getFullYear()
      ),
      report_type: 'FAR Reports',
      fund_group: '',
      fund_cluster_id: '',
      fund_source_id: '',
      department: '',
      period: 'annual',
    };

    setFilters(next);
    setAppliedFilters(next);
    setSelectedCategory('FAR');
    setPage(1);

    const first = catalog.find(
      (item) =>
        item.category === 'FAR'
    );

    if (first) {
      loadPreview(
        first,
        next
      );
    }

    showToast(
      'Report filters reset successfully.'
    );
  };

  const handleSelectReport = (
    report
  ) => {
    loadPreview(
      report,
      appliedFilters
    );
  };

  const createAndDownload = async (
    format
  ) => {
    if (!selectedReport) return;

    setExporting(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/exports/generate`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            report_key:
              selectedReport.key,
            report_name:
              selectedReport.name,
            category:
              selectedReport.category,
            report_type:
              selectedReport.type,
            fiscal_year: Number(
              appliedFilters.fiscal_year
            ),
            format,
            period:
              appliedFilters.period,
            fund_cluster_id:
              appliedFilters.fund_cluster_id ||
              null,
            fund_source_id:
              appliedFilters.fund_source_id ||
              null,
            fund_group:
              appliedFilters.fund_group ||
              null,
            department:
              appliedFilters.department ||
              null,
            generated_by:
              user?.id || null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to generate report.'
        );
      }

      const downloadResponse =
        await fetch(
          `${API_URL}/exports/download/${data.id}`,
          {
            headers,
          }
        );

      if (!downloadResponse.ok) {
        const downloadData =
          await downloadResponse
            .json()
            .catch(() => ({}));

        throw new Error(
          downloadData.error ||
            'Failed to download report.'
        );
      }

      const blob =
        await downloadResponse.blob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download = `${selectedReport.name.replace(
        /[^a-z0-9_-]+/gi,
        '_'
      )}.${format === 'Excel'
        ? 'xlsx'
        : 'pdf'
      }`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

      showToast(
        `${selectedReport.name} exported as ${format}.`
      );
    } catch (err) {
      console.error(
        'Export error:',
        err
      );

      setError(
        err.message ||
          'Failed to export report.'
      );

      showToast(
        err.message ||
          'Failed to export report.',
        'error'
      );
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (
      !selectedReport ||
      !preview
    ) {
      return;
    }

    const popup = window.open(
      '',
      '_blank',
      'width=1200,height=850'
    );

    if (!popup) {
      showToast(
        'Please allow pop-ups to print the report.',
        'error'
      );

      return;
    }

    const columns =
      preview.columns || [];

    const rows =
      preview.rows || [];

    const esc = (value) =>
      String(value ?? '').replace(
        /[&<>"']/g,
        (c) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[c]
      );

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>
            ${esc(selectedReport.name)}
          </title>

          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 28px;
              color: #111827;
            }

            .report-header {
              text-align: center;
              margin-bottom: 18px;
            }

            .report-header img {
              width: 80px;
              height: 80px;
              object-fit: contain;
              display: block;
              margin: 0 auto 8px auto;
            }

            .report-header > div {
              text-align: center;
            }

            h1 {
              text-align: center;
              font-size: 16px;
              margin: 0;
              font-weight: 500;
            }

            h2 {
              text-align: center;
              font-size: 18px;
              margin: 4px 0;
            }

            h3 {
              text-align: center;
              font-size: 15px;
              margin: 8px 0 3px 0;
            }

            .meta {
              text-align: center;
              font-size: 11px;
              color: #475569;
              margin-bottom: 18px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th {
              background: #dbe7f5;
              color: #0b3b82;
              border: 1px solid #94a3b8;
              padding: 6px;
              text-align: left;
            }

            td {
              border: 1px solid #cbd5e1;
              padding: 6px;
            }

            tfoot td {
              font-weight: bold;
              background: #eef3f8;
            }

            .footer {
              margin-top: 35px;
              font-size: 10px;
              color: #64748b;
              text-align: center;
            }

            @media print {
              body {
                margin: 15mm;
              }
            }
          </style>
        </head>

        <body>
          <div class="report-header">
            <img
              src="${UA_LOGO}"
              alt="University of Abra"
            />

            <div>
              <h1>
                Republic of the Philippines
              </h1>

              <h2>
                UNIVERSITY OF ABRA
              </h2>

              <h3>
                ${esc(selectedReport.name)}
              </h3>

              <div class="meta">
                For the Year
                ${esc(appliedFilters.fiscal_year)}
                (${esc(
                  preview.context ||
                    'All Funds'
                )})
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                ${columns
                  .map(
                    (c) =>
                      `<th>${esc(
                        c.label
                      )}</th>`
                  )
                  .join('')}
              </tr>
            </thead>

            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>
                      ${columns
                        .map(
                          (c) =>
                            `<td>${esc(
                              row[c.key]
                            )}</td>`
                        )
                        .join('')}
                    </tr>`
                )
                .join('')}
            </tbody>

            ${
              preview.totals
                ? `
                  <tfoot>
                    <tr>
                      ${columns
                        .map(
                          (c) =>
                            `<td>${esc(
                              preview
                                .totals[
                                c.key
                              ] ?? ''
                            )}</td>`
                        )
                        .join('')}
                    </tr>
                  </tfoot>
                `
                : ''
            }
          </table>

          <div class="footer">
            Generated through the BMAS Reports &amp; Exports module.
          </div>
        </body>
      </html>
    `);

    popup.document.close();

    popup.focus();

    setTimeout(
      () => popup.print(),
      250
    );
  };

  const detailFormat = (
    format
  ) =>
    selectedReport?.formats?.includes(
      format
    );

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      activePath={activePath}
      onNavigate={onNavigate}
    >
      <div className="min-h-full bg-[#f8fafc] -m-4 md:-m-6 p-4 md:p-6">

        {/* =====================================================
            CATEGORY CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          {CATEGORY_CARDS.map(
            (card) => {
              const Icon = card.icon;

              const active =
                selectedCategory ===
                card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    handleCategory(
                      card.id
                    )
                  }
                  className={`text-left bg-white border rounded-lg shadow-sm p-3 flex items-center gap-3 transition ${
                    active
                      ? card.activeClass
                      : 'border-[#e0e6ef] hover:border-blue-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg ${card.iconClass} text-white flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-[#153b82]">
                      {card.title}
                    </div>

                    <div className="text-[10px] text-gray-500 mt-1 leading-4">
                      {card.description}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#173f87] shrink-0" />
                </button>
              );
            }
          )}
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />

            <div className="text-[11px] text-red-700 flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* =====================================================
            REPORT FILTERS
        ====================================================== */}

        <section className="bg-white border border-[#dfe6f0] rounded-lg shadow-sm mb-4">

          {/* FILTER HEADER WITH HELP ON RIGHT */}
          <div className="px-4 py-2.5 border-b border-[#edf1f6] flex items-center justify-between gap-3">

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0f63c7]" />

              <h2 className="text-[14px] font-bold text-[#12357a]">
                Report Filters
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                showToast(
                  'Use the filters to select the fiscal year, report type, fund, department, and reporting period. Select View on a report to open its preview.',
                  'success'
                )
              }
              className="h-8 px-3 rounded-md border border-[#cbd7e8] bg-white text-[#1450a3] text-[10px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />

              Help
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* FISCAL YEAR */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Fiscal Year

              <select
                value={
                  filters.fiscal_year
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      fiscal_year:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                {references.years.map(
                  (year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* REPORT TYPE */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Report Type

              <select
                value={
                  filters.report_type
                }
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setFilters(
                    (p) => ({
                      ...p,
                      report_type:
                        value,
                    })
                  );

                  const next =
                    value ===
                    'WFP Reports'
                      ? 'WFP'
                      : value ===
                        'Print Reports'
                      ? 'PRINT'
                      : value ===
                        'Other Reports'
                      ? 'OTHER'
                      : 'FAR';

                  setSelectedCategory(
                    next
                  );
                }}
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option>
                  FAR Reports
                </option>

                <option>
                  WFP Reports
                </option>

                <option>
                  Print Reports
                </option>

                <option>
                  Other Reports
                </option>
              </select>
            </label>

            {/* FUND GROUP */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Fund Group

              <select
                value={
                  filters.fund_group
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      fund_group:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option value="">
                  All
                </option>

                {references.fundGroups.map(
                  (x) => (
                    <option
                      key={
                        x.code ||
                        x.id
                      }
                      value={
                        x.code ||
                        x.name
                      }
                    >
                      {x.name ||
                        x.code}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* FUND CLUSTER */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Fund Cluster

              <select
                value={
                  filters.fund_cluster_id
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      fund_cluster_id:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option value="">
                  All
                </option>

                {references.fundClusters.map(
                  (x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.code} -{' '}
                      {x.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* FUND SOURCE */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Fund Source

              <select
                value={
                  filters.fund_source_id
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      fund_source_id:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option value="">
                  All
                </option>

                {references.fundSources.map(
                  (x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.code} -{' '}
                      {x.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* DEPARTMENT */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Department / Unit

              <select
                value={
                  filters.department
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      department:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option value="">
                  All Departments
                </option>

                {references.departments.map(
                  (x) => (
                    <option
                      key={
                        x.id ||
                        x.code
                      }
                      value={
                        x.id ||
                        x.code
                      }
                    >
                      {x.code
                        ? `${x.code} - `
                        : ''}
                      {x.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* PERIOD */}
            <label className="text-[10px] font-semibold text-[#34466a]">
              Period

              <select
                value={
                  filters.period
                }
                onChange={(e) =>
                  setFilters(
                    (p) => ({
                      ...p,
                      period:
                        e.target.value,
                    })
                  )
                }
                className="mt-1 w-full h-9 rounded-md border border-[#d7deea] px-2.5 text-[11px] font-normal text-[#24365f] bg-white"
              >
                <option value="annual">
                  Annual (Full Year)
                </option>

                <option value="q1">
                  1st Quarter
                </option>

                <option value="q2">
                  2nd Quarter
                </option>

                <option value="q3">
                  3rd Quarter
                </option>

                <option value="q4">
                  4th Quarter
                </option>
              </select>
            </label>

            {/* ACTION BUTTONS */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={
                  applyFilters
                }
                className="h-9 flex-1 rounded-md bg-[#1269d3] hover:bg-[#0e57b2] text-white text-[11px] font-bold flex items-center justify-center gap-2"
              >
                <Filter className="w-3.5 h-3.5" />

                Apply Filters
              </button>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="h-9 px-4 rounded-md border border-[#3980dc] bg-white text-[#1260bd] text-[11px] font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />

                Reset
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            REPORTS + DETAILS
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(370px,1fr)] gap-4">

          {/* ===================================================
              AVAILABLE REPORTS
          ==================================================== */}

          <section className="bg-white border border-[#dfe6f0] rounded-lg shadow-sm overflow-hidden">

            <div className="px-4 py-3 border-b border-[#edf1f6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1169cf]" />

                <h2 className="text-[14px] font-bold text-[#12357a]">
                  Available Reports (
                  {
                    CATEGORY_CARDS.find(
                      (x) =>
                        x.id ===
                        selectedCategory
                    )?.title ||
                    selectedCategory
                  }
                  )
                </h2>
              </div>

              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search report name or description..."
                  className="w-full h-9 pl-8 pr-3 border border-[#d7deea] rounded-md text-[10px] outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-[10px]">

                <thead>
                  <tr className="bg-[#eef3f8] text-[#12357a]">
                    <th className="w-10 px-3 py-2 text-center">
                      #
                    </th>

                    <th className="px-3 py-2 text-left">
                      Report Name
                    </th>

                    <th className="px-3 py-2 text-left">
                      Description
                    </th>

                    <th className="px-3 py-2 text-left">
                      Registry
                    </th>

                    <th className="px-3 py-2 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-12 text-center text-gray-400"
                      >
                        Loading reports...
                      </td>
                    </tr>
                  ) : pageItems.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-12 text-center text-gray-400"
                      >
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map(
                      (
                        report,
                        index
                      ) => {
                        const selected =
                          selectedReport?.key ===
                          report.key;

                        return (
                          <tr
                            key={
                              report.key
                            }
                            className={`border-t border-[#edf1f6] ${
                              selected
                                ? 'bg-blue-50/50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center text-gray-500">
                              {(page -
                                1) *
                                pageSize +
                                index +
                                1}
                            </td>

                            <td className="px-3 py-2.5 font-semibold text-[#183b8c]">
                              {report.name}
                            </td>

                            <td className="px-3 py-2.5 text-gray-600">
                              {
                                report.description
                              }
                            </td>

                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex px-2 py-1 rounded-md font-semibold ${
                                  report.registry?.includes(
                                    'RBUD'
                                  )
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {
                                  report.registry
                                }
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectReport(
                                    report
                                  )
                                }
                                className="h-8 px-3 rounded-md border border-[#3980dc] text-[#1260bd] bg-white hover:bg-blue-50 font-semibold inline-flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />

                                View
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#edf1f6] flex items-center justify-between text-[10px] text-gray-500">

              <span>
                Showing{' '}
                {reportsForCategory.length
                  ? (page - 1) *
                      pageSize +
                    1
                  : 0}{' '}
                to{' '}
                {Math.min(
                  page * pageSize,
                  reportsForCategory.length
                )}{' '}
                of{' '}
                {
                  reportsForCategory.length
                }{' '}
                reports
              </span>

              <div className="flex items-center gap-1">

                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (p) =>
                        Math.max(
                          1,
                          p - 1
                        )
                    )
                  }
                  className="w-8 h-8 rounded-md border border-gray-200 bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mx-auto" />
                </button>

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, i) =>
                    i + 1
                )
                  .slice(0, 5)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setPage(n)
                      }
                      className={`w-8 h-8 rounded-md border text-[10px] font-semibold ${
                        page === n
                          ? 'bg-[#1269d3] text-white border-[#1269d3]'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                <button
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (p) =>
                        Math.min(
                          totalPages,
                          p + 1
                        )
                    )
                  }
                  className="w-8 h-8 rounded-md border border-gray-200 bg-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================
              REPORT DETAILS
          ==================================================== */}

          <section className="bg-white border border-[#dfe6f0] rounded-lg shadow-sm overflow-hidden">

            <div className="px-4 py-3 border-b border-[#edf1f6] flex items-center justify-between">

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1169cf]" />

                <h2 className="text-[14px] font-bold text-[#12357a]">
                  Report Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport(
                    null
                  );
                  setPreview(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedReport ? (
              <div className="p-10 text-center text-gray-400 text-[11px]">
                Select a report to view
                its details.
              </div>
            ) : (
              <div className="p-4">

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <div className="text-[15px] font-bold text-[#12357a]">
                      {
                        selectedReport.name
                      }

                      <span className="ml-1 inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px]">
                        {
                          selectedReport.type
                        }
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 text-[10px]">

                      <div>
                        <span className="text-gray-500">
                          Registry
                        </span>

                        <div className="font-semibold text-[#24365f]">
                          {
                            selectedReport.registry
                          }
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Description
                        </span>

                        <div className="font-semibold text-[#24365f]">
                          {
                            selectedReport.description
                          }
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Sheet Name (Source)
                        </span>

                        <div className="font-semibold text-[#24365f]">
                          {
                            selectedReport.sheetName
                          }
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500">
                          Fiscal Year
                        </span>

                        <div className="font-semibold text-[#24365f]">
                          {
                            appliedFilters.fiscal_year
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXPORT BUTTONS */}

                <div className="mt-4 flex flex-wrap items-center gap-2">

                  <span className="text-[10px] font-semibold text-gray-500 mr-1">
                    Available Formats
                  </span>

                  {detailFormat(
                    'Excel'
                  ) && (
                    <button
                      disabled={
                        exporting
                      }
                      onClick={() =>
                        createAndDownload(
                          'Excel'
                        )
                      }
                      className="h-9 px-4 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-4 h-4" />

                      Excel
                    </button>
                  )}

                  {detailFormat(
                    'PDF'
                  ) && (
                    <button
                      disabled={
                        exporting
                      }
                      onClick={() =>
                        createAndDownload(
                          'PDF'
                        )
                      }
                      className="h-9 px-4 rounded-md border border-red-300 bg-red-50 text-red-700 text-[10px] font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />

                      PDF
                    </button>
                  )}

                  {detailFormat(
                    'Print'
                  ) && (
                    <button
                      disabled={
                        !preview
                      }
                      onClick={
                        handlePrint
                      }
                      className="h-9 px-4 rounded-md border border-blue-300 bg-white text-blue-700 text-[10px] font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4" />

                      Print
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      loadPreview(
                        selectedReport,
                        appliedFilters
                      )
                    }
                    className="ml-auto h-9 px-3 rounded-md border border-gray-200 text-gray-600 text-[10px] font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        previewLoading
                          ? 'animate-spin'
                          : ''
                      }`}
                    />

                    Refresh
                  </button>
                </div>

                {/* PREVIEW */}

                <div className="mt-4">

                  <div className="flex items-center gap-2 mb-2 text-[11px] font-bold text-[#12357a]">
                    <Eye className="w-4 h-4 text-[#1269d3]" />

                    Preview
                  </div>

                  <div className="border border-[#d9e2ef] rounded-md overflow-hidden bg-white">

                    {previewLoading ? (
                      <div className="py-16 text-center text-gray-400 text-[11px]">
                        Loading preview...
                      </div>
                    ) : preview ? (
                      <div className="max-h-[410px] overflow-auto">

                        {/* REPORT HEADER */}

                        <div className="p-4 border-b border-[#dfe6f0] text-center">

                          <img
                            src={UA_LOGO}
                            alt="University of Abra"
                            className="w-16 h-16 object-contain mx-auto mb-2"
                            onError={(
                              e
                            ) => {
                              e.currentTarget.style.display =
                                'none';
                            }}
                          />

                          <div className="text-[9px] text-gray-600">
                            Republic of the Philippines
                          </div>

                          <div className="text-[11px] font-bold text-[#111827]">
                            UNIVERSITY OF ABRA
                          </div>

                          <div className="text-[12px] font-bold text-[#111827] mt-1">
                            {
                              selectedReport.name
                            }
                          </div>

                          <div className="text-[9px] text-gray-600 mt-0.5">
                            For the Year{' '}
                            {
                              appliedFilters.fiscal_year
                            }{' '}
                            (
                            {preview.context ||
                              'All Funds'}
                            )
                          </div>
                        </div>

                        {/* PREVIEW TABLE */}

                        <table className="w-full text-[8px] min-w-[520px]">

                          <thead>
                            <tr className="bg-[#e7eef7] text-[#243b64]">

                              {preview.columns.map(
                                (
                                  column
                                ) => (
                                  <th
                                    key={
                                      column.key
                                    }
                                    className="px-2 py-2 border-b border-r border-[#cbd5e1] text-left whitespace-nowrap"
                                  >
                                    {
                                      column.label
                                    }
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {preview.rows
                              .length ? (
                              preview.rows.map(
                                (
                                  row,
                                  index
                                ) => (
                                  <tr
                                    key={
                                      index
                                    }
                                    className="border-b border-[#edf1f6]"
                                  >
                                    {preview.columns.map(
                                      (
                                        column
                                      ) => (
                                        <td
                                          key={
                                            column.key
                                          }
                                          className="px-2 py-1.5 border-r border-[#edf1f6] whitespace-nowrap"
                                        >
                                          {
                                            row[
                                              column
                                                .key
                                            ]
                                          }
                                        </td>
                                      )
                                    )}
                                  </tr>
                                )
                              )
                            ) : (
                              <tr>
                                <td
                                  colSpan={
                                    preview
                                      .columns
                                      .length
                                  }
                                  className="py-12 text-center text-gray-400"
                                >
                                  No registry data
                                  found for
                                  the selected
                                  filters.
                                </td>
                              </tr>
                            )}
                          </tbody>

                          {preview.totals && (
                            <tfoot>
                              <tr className="bg-[#e3edf7] font-bold">

                                {preview.columns.map(
                                  (
                                    column
                                  ) => (
                                    <td
                                      key={
                                        column.key
                                      }
                                      className="px-2 py-2 border-r border-[#cbd5e1] whitespace-nowrap"
                                    >
                                      {
                                        preview
                                          .totals[
                                          column
                                            .key
                                        ] ??
                                          ''
                                      }
                                    </td>
                                  )
                                )}
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-gray-400 text-[11px]">
                        No preview available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </Layout>
  );
}
