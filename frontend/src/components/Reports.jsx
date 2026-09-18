// ============================================================
// BMAS - FINANCIAL REPORTS
// components/Reports.jsx
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "./layout/Layout";

import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  FileText,
  Landmark,
  Percent,
  RefreshCw,
  Scale,
  Search,
  Wallet,
} from "lucide-react";

const API_URL =
  "http://localhost:5000/api";

// ============================================================
// HELPERS
// ============================================================

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) =>
  `₱${numberValue(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

const numberText = (value) =>
  numberValue(value).toLocaleString(
    "en-US"
  );

const percent = (value) =>
  `${numberValue(value).toFixed(2)}%`;

// Safely calculate a percentage from a value and total.
// This fixes the React ReferenceError: pct is not defined.
const pct = (value, total) => {
  const amount = numberValue(value);
  const denominator = numberValue(total);

  if (denominator <= 0) {
    return 0;
  }

  return Math.min(
    Math.max((amount / denominator) * 100, 0),
    100
  );
};

const monthName = (month) => {
  const n = numberValue(month);

  if (n < 1 || n > 12) {
    return "—";
  }

  return new Date(
    2000,
    n - 1,
    1
  ).toLocaleString("en-US", {
    month: "long",
  });
};

const dateText = (value) => {
  if (!value) return "—";

  const date =
    new Date(
      `${String(value).slice(
        0,
        10
      )}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

// ============================================================
// DEFAULTS
// ============================================================

const EMPTY_SUMMARY = {
  budget: {
    approved: 0,
    ps: 0,
    mooe: 0,
    co: 0,
  },

  utilization: {
    utilized: 0,
    remaining_balance: 0,
    utilization_rate: 0,
    unpaid_utilization: 0,
  },

  disbursement: {
    disbursed: 0,
    rbud_disbursed: 0,
    raod_disbursed: 0,
    undisbursed_utilization: 0,
    disbursement_rate: 0,
  },

  raod: {
    records: 0,
    allotment: 0,
    obligation: 0,
    disbursement: 0,
    unobligated_balance: 0,
    undisbursed_obligation: 0,
  },

  rbud: {
    records: 0,
    utilized: 0,
    disbursed: 0,
    unpaid: 0,
  },

  overall: {
    total_budget: 0,
    total_obligations: 0,
    total_disbursements: 0,
    total_balance: 0,
  },
};

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconClass,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-xl font-bold text-slate-800">
            {value}
          </p>

          {subtext && (
            <p className="mt-1 text-[10px] text-slate-400">
              {subtext}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            iconClass ||
            "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
  right,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-800">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  message,
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center text-center">
      <div>
        <FileBarChart className="mx-auto mb-2 h-6 w-6 text-slate-300" />

        <p className="text-[11px] font-semibold text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Reports({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  const currentYear =
    new Date().getFullYear();

  const [selectedYear, setSelectedYear] =
    useState(currentYear);

  const [
    selectedFundGroup,
    setSelectedFundGroup,
  ] = useState("All");

  const [
    selectedFundCluster,
    setSelectedFundCluster,
  ] = useState("");

  const [
    selectedFundSource,
    setSelectedFundSource,
  ] = useState("");

  const [
    selectedResponsibilityCenter,
    setSelectedResponsibilityCenter,
  ] = useState("");

  const [
    activeReport,
    setActiveReport,
  ] = useState("overview");

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY
  );

  const [
    fundGroups,
    setFundGroups,
  ] = useState([]);

  const [
    departments,
    setDepartments,
  ] = useState([]);

  const [
    monthly,
    setMonthly,
  ] = useState([]);

  const [
    raodRecords,
    setRaodRecords,
  ] = useState([]);

  const [
    rbudRecords,
    setRbudRecords,
  ] = useState([]);

  const [
    references,
    setReferences,
  ] = useState({
    fund_clusters: [],
    fund_sources: [],
    responsibility_centers: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadingReport,
    setLoadingReport,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  // ==========================================================
  // AUTH
  // ==========================================================

  const getHeaders = useCallback(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    return token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {};
  }, []);

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchJson = useCallback(
    async (
      url,
      options = {}
    ) => {
      const response =
        await fetch(url, {
          ...options,

          headers: {
            ...getHeaders(),
            ...(options.headers ||
              {}),
          },
        });

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Request failed."
        );
      }

      return data;
    },
    [getHeaders]
  );

  // ==========================================================
  // BUILD FILTERS
  // ==========================================================

  const buildQuery = useCallback(
    () => {
      const params =
        new URLSearchParams();

      params.set(
        "year",
        String(selectedYear)
      );

      if (
        selectedFundCluster
      ) {
        params.set(
          "fund_cluster_id",
          selectedFundCluster
        );
      }

      if (
        selectedFundSource
      ) {
        params.set(
          "fund_source_id",
          selectedFundSource
        );
      }

      if (
        selectedResponsibilityCenter
      ) {
        params.set(
          "responsibility_center_id",
          selectedResponsibilityCenter
        );
      }

      if (
        selectedFundGroup !==
        "All"
      ) {
        params.set(
          "group",
          selectedFundGroup
        );
      }

      return params.toString();
    },
    [
      selectedYear,
      selectedFundCluster,
      selectedFundSource,
      selectedResponsibilityCenter,
      selectedFundGroup,
    ]
  );

  // ==========================================================
  // REFERENCES
  // ==========================================================

  const loadReferences =
    useCallback(
      async () => {
        try {
          const data =
            await fetchJson(
              `${API_URL}/financial-reports/references`
            );

          setReferences({
            fund_clusters:
              data.fund_clusters ||
              [],

            fund_sources:
              data.fund_sources ||
              [],

            responsibility_centers:
              data.responsibility_centers ||
              [],
          });
        } catch (err) {
          console.error(
            "Reference loading error:",
            err
          );
        }
      },
      [fetchJson]
    );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const loadSummary =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/summary?${query}`
          );

        setSummary({
          ...EMPTY_SUMMARY,
          ...data,
        });
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // FUND GROUPS
  // ==========================================================

  const loadFundGroups =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/fund-groups?${query}`
          );

        setFundGroups(
          Array.isArray(
            data.fund_groups
          )
            ? data.fund_groups
            : []
        );
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // DEPARTMENTS
  // ==========================================================

  const loadDepartments =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/departments?${query}`
          );

        setDepartments(
          Array.isArray(
            data.departments
          )
            ? data.departments
            : []
        );
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // MONTHLY
  // ==========================================================

  const loadMonthly =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/monthly?${query}`
          );

        setMonthly(
          Array.isArray(
            data.months
          )
            ? data.months
            : []
        );
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // RAOD
  // ==========================================================

  const loadRaod =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/raod?${query}`
          );

        setRaodRecords(
          Array.isArray(
            data.records
          )
            ? data.records
            : []
        );
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // RBUD
  // ==========================================================

  const loadRbud =
    useCallback(
      async () => {
        const query =
          buildQuery();

        const data =
          await fetchJson(
            `${API_URL}/financial-reports/rbud?${query}`
          );

        setRbudRecords(
          Array.isArray(
            data.records
          )
            ? data.records
            : []
        );
      },
      [
        buildQuery,
        fetchJson,
      ]
    );

  // ==========================================================
  // LOAD EVERYTHING
  // ==========================================================

  const loadAll =
    useCallback(
      async () => {
        setError("");

        await Promise.all([
          loadReferences(),
          loadSummary(),
          loadFundGroups(),
          loadDepartments(),
          loadMonthly(),
          loadRaod(),
          loadRbud(),
        ]);

        setLastUpdated(
          new Date()
        );
      },
      [
        loadReferences,
        loadSummary,
        loadFundGroups,
        loadDepartments,
        loadMonthly,
        loadRaod,
        loadRbud,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);

        await loadAll();
      } catch (err) {
        console.error(
          "Financial Reports loading error:",
          err
        );

        if (mounted) {
          setError(
            err.message ||
              "Failed to load Financial Reports."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [loadAll]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);
        setError("");

        await loadAll();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to refresh reports."
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ==========================================================
  // CALCULATED VALUES
  // ==========================================================

  const totalBudget =
    numberValue(
      summary?.budget?.approved
    );

  const utilized =
    numberValue(
      summary?.utilization?.utilized
    );

  const remaining =
    numberValue(
      summary?.utilization
        ?.remaining_balance
    );

  const totalDisbursed =
    numberValue(
      summary?.disbursement
        ?.disbursed
    );

  const utilizationRate =
    numberValue(
      summary?.utilization
        ?.utilization_rate
    );

  const disbursementRate =
    numberValue(
      summary?.disbursement
        ?.disbursement_rate
    );

  // ==========================================================
  // SEARCH FILTER
  // ==========================================================

  const filteredDepartments =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return departments;
      }

      return departments.filter(
        (row) =>
          String(
            row.code || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.name || ""
          )
            .toLowerCase()
            .includes(value)
      );
    }, [
      departments,
      search,
    ]);

  const filteredRaod =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return raodRecords;
      }

      return raodRecords.filter(
        (row) =>
          String(
            row.registry_no ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.payee || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.particulars ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.fund_cluster_name ||
              ""
          )
            .toLowerCase()
            .includes(value)
      );
    }, [
      raodRecords,
      search,
    ]);

  const filteredRbud =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return rbudRecords;
      }

      return rbudRecords.filter(
        (row) =>
          String(
            row.registry_no ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.payee || ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.particulars ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          String(
            row.fund_cluster_name ||
              ""
          )
            .toLowerCase()
            .includes(value)
      );
    }, [
      rbudRecords,
      search,
    ]);

  // ==========================================================
  // DONUT
  // ==========================================================

  const Donut =
    ({
      value,
      label,
    }) => {
      const safe =
        Math.min(
          Math.max(
            numberValue(value),
            0
          ),
          100
        );

      return (
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#2563EB ${safe}%, #E5E7EB ${safe}% 100%)`,
            }}
          />

          <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-xl font-bold text-slate-800">
              {percent(safe)}
            </span>

            <span className="text-[9px] text-slate-400">
              {label}
            </span>
          </div>
        </div>
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      activePath={activePath}
      onNavigate={onNavigate}
    >
      <div className="space-y-5 pb-8">

        {/* Financial Reports title is intentionally omitted because it is already shown in the header navigation. */}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <div>
              <p className="text-xs font-bold text-red-800">
                Financial Reports Error
              </p>

              <p className="mt-0.5 text-[10px] text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">

            {/* YEAR */}

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Fiscal Year
              </label>

              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              >
                {[
                  currentYear,
                  currentYear - 1,
                  currentYear - 2,
                  currentYear - 3,
                  currentYear - 4,
                ].map(
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
            </div>

            {/* FUND GROUP */}

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Fund Group
              </label>

              <div className="relative">
                <select
                  value={
                    selectedFundGroup
                  }
                  onChange={(e) =>
                    setSelectedFundGroup(
                      e.target.value
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="All">
                    All Fund Groups
                  </option>

                  <option value="Main">
                    Main
                  </option>

                  <option value="BGD">
                    BGD
                  </option>

                  <option value="Other Funds">
                    Other Funds
                  </option>

                  <option value="DOST">
                    DOST
                  </option>

                  <option value="DA">
                    DA
                  </option>

                  <option value="CHED">
                    CHED
                  </option>

                  <option value="LAPAZ">
                    LAPAZ
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* FUND CLUSTER */}

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Fund Cluster
              </label>

              <select
                value={
                  selectedFundCluster
                }
                onChange={(e) =>
                  setSelectedFundCluster(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
              >
                <option value="">
                  All Fund Clusters
                </option>

                {references.fund_clusters.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.code} -{" "}
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* RESPONSIBILITY CENTER */}

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Department / Unit
              </label>

              <select
                value={
                  selectedResponsibilityCenter
                }
                onChange={(e) =>
                  setSelectedResponsibilityCenter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
              >
                <option value="">
                  All Departments
                </option>

                {references.responsibility_centers.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.code} -{" "}
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SEARCH */}

            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Search
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search records..."
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="flex flex-wrap gap-2">
          {[
            [
              "overview",
              "Overview",
            ],
            [
              "funds",
              "Fund Groups",
            ],
            [
              "departments",
              "Departments",
            ],
            [
              "monthly",
              "Monthly",
            ],
            [
              "raod",
              "RAOD",
            ],
            [
              "rbud",
              "RBUD",
            ],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setActiveReport(
                    value
                  )
                }
                className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${
                  activeReport === value
                    ? "bg-[#0B3B82] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeReport ===
          "overview" && (
          <>
            <section>
              <SectionHeader
                icon={Wallet}
                title="Overall Financial Summary"
                description={`Connected to RBUD and RAOD Registry records for FY ${selectedYear}`}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <SummaryCard
                  icon={Wallet}
                  label="Total Budget / Allotment"
                  value={money(
                    totalBudget
                  )}
                  subtext="Approved budget"
                  iconClass="bg-blue-50 text-blue-600"
                />

                <SummaryCard
                  icon={ClipboardList}
                  label="Total Obligations"
                  value={money(
                    summary?.raod
                      ?.obligation
                  )}
                  subtext={`${percent(
                    pct(
                      summary?.raod
                        ?.obligation,
                      summary?.raod
                        ?.allotment
                    )
                  )} of RAOD allotment`}
                  iconClass="bg-amber-50 text-amber-600"
                />

                <SummaryCard
                  icon={Wallet}
                  label="Total Disbursements"
                  value={money(
                    totalDisbursed
                  )}
                  subtext={`${percent(
                    disbursementRate
                  )} disbursement rate`}
                  iconClass="bg-emerald-50 text-emerald-600"
                />

                <SummaryCard
                  icon={Percent}
                  label="Remaining Balance"
                  value={money(
                    remaining
                  )}
                  subtext={`${percent(
                    100 -
                      utilizationRate
                  )} remaining`}
                  iconClass="bg-violet-50 text-violet-600"
                />

              </div>
            </section>

            {/* UTILIZATION / RAOD */}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <SectionHeader
                  icon={BarChart3}
                  title="Budget Utilization"
                  description="Approved budget compared with RBUD utilization"
                />

                <Donut
                  value={
                    utilizationRate
                  }
                  label="Utilization"
                />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-amber-600">
                      Utilized
                    </p>

                    <p className="mt-1 text-sm font-bold text-amber-700">
                      {money(
                        utilized
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-violet-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-violet-600">
                      Remaining
                    </p>

                    <p className="mt-1 text-sm font-bold text-violet-700">
                      {money(
                        remaining
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <p className="text-[9px] font-bold uppercase text-amber-600">
                    Unpaid Utilization
                  </p>

                  <p className="mt-1 text-sm font-bold text-amber-700">
                    {money(
                      summary
                        ?.utilization
                        ?.unpaid_utilization
                    )}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <SectionHeader
                  icon={ClipboardList}
                  title="RAOD Financial Position"
                  description="Allotment, obligation and disbursement"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-blue-600">
                      Allotment
                    </p>

                    <p className="mt-1 text-sm font-bold text-blue-700">
                      {money(
                        summary?.raod
                          ?.allotment
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-amber-600">
                      Obligation
                    </p>

                    <p className="mt-1 text-sm font-bold text-amber-700">
                      {money(
                        summary?.raod
                          ?.obligation
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-emerald-600">
                      Disbursement
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      {money(
                        summary?.raod
                          ?.disbursement
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-violet-50 p-3">
                    <p className="text-[9px] font-semibold uppercase text-violet-600">
                      Unobligated
                    </p>

                    <p className="mt-1 text-sm font-bold text-violet-700">
                      {money(
                        summary?.raod
                          ?.unobligated_balance
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-[9px] font-semibold text-slate-500">
                    RAOD Records
                  </span>

                  <span className="text-[11px] font-bold text-slate-700">
                    {numberText(
                      summary?.raod
                        ?.records
                    )}
                  </span>
                </div>
              </section>
            </div>

            {/* DISBURSEMENT */}

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <SectionHeader
                icon={Wallet}
                title="Disbursement Position"
                description="Utilization compared with disbursement"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-[9px] font-semibold uppercase text-emerald-600">
                    Disbursed
                  </p>

                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {money(
                      totalDisbursed
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-[9px] font-semibold uppercase text-amber-600">
                    Undisbursed Utilization
                  </p>

                  <p className="mt-1 text-sm font-bold text-amber-700">
                    {money(
                      summary
                        ?.disbursement
                        ?.undisbursed_utilization
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-[9px] font-semibold uppercase text-blue-600">
                    Disbursement Rate
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {percent(
                      disbursementRate
                    )}
                  </p>
                </div>

              </div>
            </section>
          </>
        )}

        {/* ====================================================
            FUND GROUPS
        ==================================================== */}

        {activeReport ===
          "funds" && (
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <SectionHeader
              icon={Landmark}
              title="Fund Group Financial Report"
              description={`Financial position by fund group for FY ${selectedYear}`}
              right={
                loadingReport && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )
              }
            />

            {fundGroups.length ===
            0 ? (
              <EmptyState message="No fund group data available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3 text-left">
                        Fund Group
                      </th>

                      <th className="px-3 py-3 text-right">
                        Funds
                      </th>

                      <th className="px-3 py-3 text-right">
                        Approved Budget
                      </th>

                      <th className="px-3 py-3 text-right">
                        Utilized
                      </th>

                      <th className="px-3 py-3 text-right">
                        Remaining
                      </th>

                      <th className="px-3 py-3 text-right">
                        Disbursed
                      </th>

                      <th className="px-3 py-3 text-right">
                        Utilization
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {fundGroups.map(
                      (row) => (
                        <tr
                          key={
                            row.fund_group
                          }
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-3 text-[10px] font-semibold text-slate-700">
                            {
                              row.fund_group
                            }
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-slate-600">
                            {numberText(
                              row.num_funds
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] font-semibold text-slate-700">
                            {money(
                              row.approved_budget
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                            {money(
                              row.utilized
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-violet-700">
                            {money(
                              row.remaining_balance
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                            {money(
                              row.disbursed
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] font-semibold text-blue-600">
                            {percent(
                              row.utilization_rate
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            DEPARTMENTS
        ==================================================== */}

        {activeReport ===
          "departments" && (
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <SectionHeader
              icon={Building2}
              title="Department Financial Report"
              description={`Budget utilization by responsibility center for FY ${selectedYear}`}
            />

            {filteredDepartments.length ===
            0 ? (
              <EmptyState message="No department data available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3 text-left">
                        Department / Unit
                      </th>

                      <th className="px-3 py-3 text-right">
                        Records
                      </th>

                      <th className="px-3 py-3 text-right">
                        Approved Budget
                      </th>

                      <th className="px-3 py-3 text-right">
                        Utilized
                      </th>

                      <th className="px-3 py-3 text-right">
                        Remaining
                      </th>

                      <th className="px-3 py-3 text-right">
                        Disbursed
                      </th>

                      <th className="px-3 py-3 text-right">
                        Rate
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDepartments.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-3">
                            <p className="text-[10px] font-semibold text-slate-700">
                              {
                                row.code
                              }
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {
                                row.name
                              }
                            </p>
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-slate-600">
                            {numberText(
                              row.records
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] font-semibold text-slate-700">
                            {money(
                              row.approved_budget
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                            {money(
                              row.utilized
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-violet-700">
                            {money(
                              row.remaining_balance
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                            {money(
                              row.disbursed
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] font-semibold text-blue-600">
                            {percent(
                              row.utilization_rate
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            MONTHLY
        ==================================================== */}

        {activeReport ===
          "monthly" && (
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <SectionHeader
              icon={CalendarDays}
              title="Monthly Financial Report"
              description={`Monthly movement for FY ${selectedYear}`}
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3 text-left">
                      Month
                    </th>

                    <th className="px-3 py-3 text-right">
                      RAOD Allotment
                    </th>

                    <th className="px-3 py-3 text-right">
                      RAOD Obligation
                    </th>

                    <th className="px-3 py-3 text-right">
                      RAOD Disbursement
                    </th>

                    <th className="px-3 py-3 text-right">
                      RBUD Utilized
                    </th>

                    <th className="px-3 py-3 text-right">
                      RBUD Disbursed
                    </th>

                    <th className="px-3 py-3 text-right">
                      Unpaid Utilization
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {monthly.map(
                    (row) => (
                      <tr
                        key={
                          row.month
                        }
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 text-[10px] font-semibold text-slate-700">
                          {monthName(
                            row.month
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-blue-700">
                          {money(
                            row.allotment
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                          {money(
                            row.obligation
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                          {money(
                            row.raod_disbursement
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                          {money(
                            row.utilized
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                          {money(
                            row.disbursed
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-[10px] text-violet-700">
                          {money(
                            row.unpaid_utilization
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ====================================================
            RAOD
        ==================================================== */}

        {activeReport ===
          "raod" && (
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <SectionHeader
              icon={ClipboardList}
              title="RAOD Financial Report"
              description={`Registry of Allotment, Obligation and Disbursement — FY ${selectedYear}`}
            />

            {filteredRaod.length ===
            0 ? (
              <EmptyState message="No RAOD records found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3 text-left">
                        Registry No.
                      </th>

                      <th className="px-3 py-3 text-left">
                        Date
                      </th>

                      <th className="px-3 py-3 text-left">
                        Fund
                      </th>

                      <th className="px-3 py-3 text-left">
                        Payee / Particulars
                      </th>

                      <th className="px-3 py-3 text-left">
                        Department
                      </th>

                      <th className="px-3 py-3 text-right">
                        Allotment
                      </th>

                      <th className="px-3 py-3 text-right">
                        Obligation
                      </th>

                      <th className="px-3 py-3 text-right">
                        Disbursement
                      </th>

                      <th className="px-3 py-3 text-right">
                        Unobligated
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRaod.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 hover:bg-blue-50/30"
                        >
                          <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                            {
                              row.registry_no
                            }
                          </td>

                          <td className="px-3 py-3 text-[10px] text-slate-500">
                            {dateText(
                              row.entry_date
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <p className="text-[10px] font-semibold text-slate-700">
                              {
                                row.fund_source_code ||
                                row.fund_cluster_code ||
                                "—"
                              }
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {
                                row.fund_source_name ||
                                row.fund_cluster_name ||
                                "—"
                              }
                            </p>
                          </td>

                          <td className="max-w-[230px] px-3 py-3">
                            <p className="truncate text-[10px] font-semibold text-slate-700">
                              {
                                row.payee ||
                                "—"
                              }
                            </p>

                            <p className="mt-1 truncate text-[9px] text-slate-400">
                              {
                                row.particulars ||
                                "—"
                              }
                            </p>
                          </td>

                          <td className="px-3 py-3 text-[10px] text-slate-600">
                            {
                              row.responsibility_center_name ||
                              row.responsibility_center_code ||
                              "—"
                            }
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-blue-700">
                            {money(
                              row.allotment_amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                            {money(
                              row.obligation_amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                            {money(
                              row.disbursement_amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-violet-700">
                            {money(
                              row.unobligated_balance
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            RBUD
        ==================================================== */}

        {activeReport ===
          "rbud" && (
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <SectionHeader
              icon={Wallet}
              title="RBUD Financial Report"
              description={`Registry of Budget Utilization and Disbursement — FY ${selectedYear}`}
            />

            {filteredRbud.length ===
            0 ? (
              <EmptyState message="No RBUD records found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3 text-left">
                        Registry No.
                      </th>

                      <th className="px-3 py-3 text-left">
                        Date
                      </th>

                      <th className="px-3 py-3 text-left">
                        Fund
                      </th>

                      <th className="px-3 py-3 text-left">
                        Payee / Particulars
                      </th>

                      <th className="px-3 py-3 text-left">
                        Department
                      </th>

                      <th className="px-3 py-3 text-right">
                        Utilized
                      </th>

                      <th className="px-3 py-3 text-right">
                        Disbursed
                      </th>

                      <th className="px-3 py-3 text-right">
                        Unpaid
                      </th>

                      <th className="px-3 py-3 text-right">
                        Running Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRbud.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 hover:bg-blue-50/30"
                        >
                          <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                            {
                              row.registry_no
                            }
                          </td>

                          <td className="px-3 py-3 text-[10px] text-slate-500">
                            {dateText(
                              row.entry_date
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <p className="text-[10px] font-semibold text-slate-700">
                              {
                                row.fund_source_code ||
                                row.fund_cluster_code ||
                                "—"
                              }
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {
                                row.fund_source_name ||
                                row.fund_cluster_name ||
                                "—"
                              }
                            </p>
                          </td>

                          <td className="max-w-[230px] px-3 py-3">
                            <p className="truncate text-[10px] font-semibold text-slate-700">
                              {
                                row.payee ||
                                "—"
                              }
                            </p>

                            <p className="mt-1 truncate text-[9px] text-slate-400">
                              {
                                row.particulars ||
                                "—"
                              }
                            </p>
                          </td>

                          <td className="px-3 py-3 text-[10px] text-slate-600">
                            {
                              row.responsibility_center_name ||
                              row.responsibility_center_code ||
                              "—"
                            }
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-amber-700">
                            {money(
                              row.utilization_amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-emerald-700">
                            {money(
                              row.disbursement_amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] text-violet-700">
                            {money(
                              row.unpaid_utilization
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-[10px] font-semibold text-slate-700">
                            {money(
                              row.running_balance
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        {!loading && (
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>
              Financial data is generated from the connected RBUD Registry and RAOD Registry.
            </span>

            {lastUpdated && (
              <span>
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}