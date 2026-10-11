// frontend/src/components/MasterData.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Layout from './layout/Layout';
import { API_URL } from '../config/api';
import Toast from './Toast';

import {
  Layers,
  BookOpen,
  Building2,
  ListOrdered,
  PieChart,
  Flower2,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Info,
  Search,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  FileText,
  Users,
} from 'lucide-react';


const DEFAULT_FORM = {
  code: '',
  name: '',
  description: '',
  category: '',
  fund_source_id: '',
  fund_group_id: '',
  old_code: '',
  account_title: '',
  abbreviation: '',
  campus_id: '',
  status: 'Active',
};



export default function MasterData({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  // ==========================================================
  // AUTH
  // ==========================================================

  const token = localStorage.getItem('token');

  // ==========================================================
  // STATE
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState('fundClusters');

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [toast, setToast] =
    useState(null);

  const [items, setItems] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 30,
      totalItems: 0,
      totalPages: 1,
    });

  const [modalOpen, setModalOpen] =
    useState(false);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  const [deleteItemName, setDeleteItemName] =
    useState('');

  const [editingId, setEditingId] =
    useState(null);

  const [formData, setFormData] =
    useState({
      ...DEFAULT_FORM,
    });

  const [campusOptions, setCampusOptions] =
    useState([]);

  const [fundSourceOptions, setFundSourceOptions] =
    useState([]);


  // ==========================================================
  // TAB CONFIGURATION
  // ==========================================================

  const tabs = useMemo(
    () => [
      {
        id: 'fundClusters',
        label: 'Fund Codes / Clusters',
        icon: Layers,
        endpoint: 'funds',
        description:
          'Manage official fund codes/clusters and their funding source relationship.',
        canEdit: true,
      },
      {
        id: 'departments',
        label: 'Departments',
        icon: Building2,
        endpoint: 'departments',
        description:
          'Manage departments used by budget and working-document workflows.',
        canEdit: true,
      },
      {
        id: 'responsibilityCenters',
        label: 'Responsibility Centers',
        icon: Building2,
        endpoint: 'centers',
        description:
          'Manage responsibility centers referenced by RBUD, RAOD, IGP, and budget records.',
        canEdit: true,
      },
      {
        id: 'objects',
        label: 'Object of Expenditure',
        icon: ListOrdered,
        endpoint: 'objects',
        description:
          'Manage expenditure object classifications used by budget records.',
        canEdit: true,
      },
      {
        id: 'sources',
        label: 'Funding Sources',
        icon: Flower2,
        endpoint: 'sources',
        description:
          'Manage government and other funding sources.',
        canEdit: true,
      },
      {
        id: 'allotments',
        label: 'Allotment Classes',
        icon: PieChart,
        endpoint: 'allotments',
        description:
          'Manage allotment classification references.',
        canEdit: true,
      },
      {
        id: 'mfo',
        label: 'MFO',
        icon: Layers,
        endpoint: 'others',
        referenceType: 'mfo',
        description:
          'Manage Major Final Outputs used throughout the system.',
        canEdit: true,
      },
      {
        id: 'uacs',
        label: 'UACS Codes',
        icon: ListOrdered,
        endpoint: 'others',
        referenceType: 'uacs',
        description:
          'Manage UACS codes and account classifications.',
        canEdit: true,
      },
      {
        id: 'campuses',
        label: 'Campuses',
        icon: Building2,
        endpoint: 'others',
        referenceType: 'campuses',
        description:
          'Manage campuses used throughout the system.',
        canEdit: true,
      },
      {
        id: 'pap',
        label: 'PAP',
        icon: BookOpen,
        endpoint: 'others',
        referenceType: 'pap',
        description:
          'Manage Programs, Activities, and Projects.',
        canEdit: true,
      },
      {
        id: 'wfp',
        label: 'WFP / Activity Sources',
        icon: FileText,
        endpoint: 'others',
        referenceType: 'wfp',
        description:
          'Manage Work and Financial Plan/activity reference sources.',
        canEdit: true,
      },
    ],
    []
  );

  // ==========================================================
  // CURRENT TAB
  // ==========================================================

  const activeTabConfig = useMemo(() => {
    return (
      tabs.find(
        (tab) => tab.id === activeTab
      ) || tabs[0]
    );
  }, [
    tabs,
    activeTab,
  ]);

  const activeReferenceType =
    activeTabConfig.referenceType || '';

  const isOtherReference =
    Boolean(activeReferenceType);

  const isReadOnly = false;

  // ==========================================================
  // LABEL HELPERS
  // ==========================================================

  const getSingularLabel = useCallback(() => {
    const labels = {
      fundClusters: 'Fund Cluster',
      departments: 'Department',
      objects: 'Object Code',
      sources: 'Funding Source',
      allotments: 'Allotment Class',
      mfo: 'MFO',
      uacs: 'UACS Code',
      campuses: 'Campus',
      pap: 'PAP',
      wfp: 'WFP Source',
    };

    return labels[activeTab] || 'Master Data';
  }, [activeTab]);

  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = useCallback(
    (
      message,
      type = 'success'
    ) => {
      setToast({
        message,
        type,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // ==========================================================
  // FORMAT NUMBER
  // ==========================================================

  const formatNumber = (
    value
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      'en-US'
    );
  };

  // ==========================================================
  // AUTH HEADERS
  // ==========================================================

  const getAuthHeaders = useCallback(
    (
      includeContentType = false
    ) => {
      const headers = {
        Authorization:
          `Bearer ${token}`,
      };

      if (
        includeContentType
      ) {
        headers[
          'Content-Type'
        ] =
          'application/json';
      }

      return headers;
    },
    [token]
  );

  // ==========================================================
  // FETCH DATA
  // ==========================================================

  const fetchData =
    useCallback(
      async (
        requestedPage = 1
      ) => {
        setLoading(true);
        setError('');

        try {
          const endpoint =
            activeTabConfig.endpoint;

          const params =
            new URLSearchParams();

          params.set(
            'page',
            String(
              requestedPage
            )
          );

          params.set(
            'limit',
            String(
              pagination.limit
            )
          );

          if (
            searchTerm.trim()
          ) {
            params.set(
              'search',
              searchTerm.trim()
            );
          }

          if (
            isOtherReference
          ) {
            params.set(
              'type',
              activeReferenceType
            );
          }

          const response =
            await fetch(
              `${API_URL}/masterdata/${endpoint}?${params.toString()}`,
              {
                headers:
                  getAuthHeaders(),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                data.details ||
                'Failed to load Master Data.'
            );
          }

          const resultItems =
            Array.isArray(
              data.items
            )
              ? data.items
              : [];

          setItems(
            resultItems
          );

          setPagination(
            (previous) => ({
              ...previous,

              page:
                Number(
                  data.currentPage
                ) ||
                requestedPage,

              totalItems:
                Number(
                  data.totalItems
                ) || 0,

              totalPages:
                Number(
                  data.totalPages
                ) || 1,
            })
          );
        } catch (err) {
          console.error(
            'Master Data fetch error:',
            err
          );

          setItems([]);

          setError(
            err.message ||
              'Could not load Master Data.'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        activeTab,
        activeTabConfig.endpoint,
        getAuthHeaders,
        activeReferenceType,
        pagination.limit,
        searchTerm,
      ]
    );

  // ==========================================================
  // LOAD ACTIVE CAMPUSES FOR DEPARTMENT FORM
  // ==========================================================

  const fetchFundSourceOptions = useCallback(
    async () => {
      try {
        const response = await fetch(
          `${API_URL}/masterdata/sources?page=1&limit=100`,
          { headers: getAuthHeaders() }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.details ||
              'Failed to load funding sources.'
          );
        }

        const options = Array.isArray(data.items)
          ? data.items
              .filter((item) => item.is_active !== false)
              .sort((a, b) =>
                String(a.code || '').localeCompare(String(b.code || ''))
              )
          : [];

        setFundSourceOptions(options);
      } catch (err) {
        console.error('Funding source options error:', err);
        setFundSourceOptions([]);
      }
    },
    [getAuthHeaders]
  );

  const fetchCampusOptions = useCallback(
    async () => {
      try {
        const response = await fetch(
          `${API_URL}/masterdata/others?type=campuses&page=1&limit=100`,
          { headers: getAuthHeaders() }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.details ||
              'Failed to load campuses.'
          );
        }

        const options = Array.isArray(data.items)
          ? data.items
              .filter((item) => item.is_active !== false)
              .sort((a, b) =>
                String(a.name || '').localeCompare(String(b.name || ''))
              )
          : [];

        setCampusOptions(options);
      } catch (err) {
        console.error('Campus options error:', err);
        setCampusOptions([]);
      }
    },
    [getAuthHeaders]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (activeTab === 'departments') {
      fetchCampusOptions();
    }

    if (activeTab === 'fundClusters') {
      fetchFundSourceOptions();
    }
  }, [activeTab, fetchCampusOptions, fetchFundSourceOptions]);

  // ==========================================================
  // FETCH DATA WHEN TAB / SEARCH CHANGES
  // ==========================================================

  useEffect(() => {
    fetchData(1);
  }, [
    activeTab,
    activeReferenceType,
    searchTerm,
    fetchData,
  ]);

  // ==========================================================
  // CREATE
  // ==========================================================

  const openCreateModal =
    () => {
      setEditingId(null);

      setFormData({
        ...DEFAULT_FORM,
      });

      setModalOpen(true);
    };

  // ==========================================================
  // EDIT
  // ==========================================================

  const openEditModal =
    (item) => {
      setEditingId(
        item.id
      );

      setFormData({
        code:
          item.code ||
          item.username ||
          '',

        name:
          item.name ||
          item.account_title ||
          item.full_name ||
          '',

        description:
          item.description ||
          item.account_description ||
          item.revised_description ||
          '',

        category:
          item.category ||
          '',

        old_code:
          item.old_code ||
          '',

        account_title:
          item.account_title ||
          item.name ||
          '',

        abbreviation:
          item.abbreviation ||
          '',

        campus_id:
          item.campus_id != null
            ? String(item.campus_id)
            : '',

        fund_source_id:
          item.fund_source_id !=
            null
            ? String(
                item.fund_source_id
              )
            : '',

        fund_group_id:
          item.fund_group_id !=
            null
            ? String(
                item.fund_group_id
              )
            : '',

        status:
          item.status ||
          (
            item.is_active ===
            false
              ? 'Inactive'
              : 'Active'
          ),
      });

      setModalOpen(true);
    };

  // ==========================================================
  // CLOSE FORM MODAL
  // ==========================================================

  const closeModal =
    () => {
      if (
        saving
      ) {
        return;
      }

      setModalOpen(false);

      setEditingId(null);

      setFormData({
        ...DEFAULT_FORM,
      });
    };

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave =
    async (event) => {
      event.preventDefault();

      if (
        isReadOnly
      ) {
        showToast(
          'This section is view-only.',
          'info'
        );

        return;
      }

      const code =
        formData.code.trim();

      const name =
        formData.name.trim();

      if (
        !code ||
        !name
      ) {
        showToast(
          'Code and Name are required.',
          'error'
        );

        return;
      }

      if (activeTab === 'departments' && !formData.campus_id) {
        showToast(
          'Please select a Campus.',
          'error'
        );

        return;
      }

      setSaving(true);

      try {
        const endpoint =
          activeTabConfig.endpoint;

        const typeQuery =
          isOtherReference
            ? `?type=${encodeURIComponent(activeReferenceType)}`
            : '';

        const url =
          editingId
            ? `${API_URL}/masterdata/${endpoint}/${editingId}${typeQuery}`
            : `${API_URL}/masterdata/${endpoint}${typeQuery}`;

        const method =
          editingId
            ? 'PUT'
            : 'POST';

        const payload = {
          code,
          name,

          description:
            formData.description.trim(),

          category:
            formData.category.trim(),

          status:
            formData.status,
        };

        if (activeTab === 'departments') {
          payload.campus_id = formData.campus_id
            ? Number(formData.campus_id)
            : null;
        }

        if (activeTab === 'responsibilityCenters') {
          payload.category = formData.category.trim();
        }

        // ----------------------------------------------------
        // FUND CLUSTER REFERENCES
        // ----------------------------------------------------

        if (
          activeTab ===
          'fundClusters'
        ) {
          payload.fund_source_id =
            formData.fund_source_id
              ? Number(
                  formData.fund_source_id
                )
              : null;
        }

        // ----------------------------------------------------
        // OTHER REFERENCE DATA
        // ----------------------------------------------------

        if (isOtherReference) {
          payload.type =
            activeReferenceType;

          if (
            activeReferenceType ===
            'uacs'
          ) {
            payload.old_code =
              formData.old_code.trim();

            payload.account_title =
              (
                formData.account_title ||
                formData.name
              ).trim();
          }

          if (
            activeReferenceType ===
            'campuses'
          ) {
            payload.abbreviation =
              formData.abbreviation.trim();
          }
        }

        const response =
          await fetch(
            url,
            {
              method,

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              data.details ||
              'Failed to save record.'
          );
        }

        const label =
          getSingularLabel();

        showToast(
          editingId
            ? `${label} updated successfully.`
            : `${label} added successfully.`,
          'success'
        );

        setModalOpen(false);
        setEditingId(null);

        setFormData({
          ...DEFAULT_FORM,
        });

        await fetchData(
          editingId
            ? pagination.page
            : 1
        );
      } catch (err) {
        console.error(
          'Master Data save error:',
          err
        );

        showToast(
          err.message ||
            'Failed to save record.',
          'error'
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================================
  // OPEN DELETE CONFIRMATION
  // ==========================================================

  const openDeleteModal =
    (item) => {
      setDeleteId(
        item.id
      );

      setDeleteItemName(
        getDisplayName(item)
      );

      setDeleteModalOpen(
        true
      );
    };

  // ==========================================================
  // CLOSE DELETE MODAL
  // ==========================================================

  const closeDeleteModal =
    () => {
      setDeleteModalOpen(
        false
      );

      setDeleteId(null);

      setDeleteItemName('');
    };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete =
    async () => {
      if (
        !deleteId ||
        isReadOnly
      ) {
        return;
      }

      try {
        const endpoint =
          activeTabConfig.endpoint;

        const typeQuery =
          isOtherReference
            ? `?type=${encodeURIComponent(activeReferenceType)}`
            : '';

        const response =
          await fetch(
            `${API_URL}/masterdata/${endpoint}/${deleteId}${typeQuery}`,
            {
              method:
                'DELETE',

              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              data.details ||
              'Failed to delete record.'
          );
        }

        showToast(
          `${getSingularLabel()} deleted successfully.`,
          'success'
        );

        closeDeleteModal();

        const currentPage =
          pagination.page;

        if (
          items.length ===
            1 &&
          currentPage > 1
        ) {
          await fetchData(
            currentPage - 1
          );
        } else {
          await fetchData(
            currentPage
          );
        }
      } catch (err) {
        console.error(
          'Master Data delete error:',
          err
        );

        showToast(
          err.message ||
            'Failed to delete record.',
          'error'
        );
      }
    };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const goToPage =
    (page) => {
      if (
        page < 1 ||
        page >
          pagination.totalPages
      ) {
        return;
      }

      fetchData(page);
    };

  const pageNumbers =
    useMemo(() => {
      const total =
        pagination.totalPages;

      const current =
        pagination.page;

      if (
        total <= 5
      ) {
        return Array.from(
          {
            length:
              total,
          },
          (_, index) =>
            index + 1
        );
      }

      if (
        current <= 3
      ) {
        return [
          1,
          2,
          3,
          4,
          5,
        ];
      }

      if (
        current >=
        total - 2
      ) {
        return [
          total - 4,
          total - 3,
          total - 2,
          total - 1,
          total,
        ];
      }

      return [
        current - 2,
        current - 1,
        current,
        current + 1,
        current + 2,
      ];
    }, [
      pagination.page,
      pagination.totalPages,
    ]);

  // ==========================================================
  // TAB CHANGE
  // ==========================================================

  const handleTabChange =
    (tabId) => {
      setActiveTab(
        tabId
      );

      setSearchTerm('');

      setError('');

      setItems([]);

      setPagination(
        (previous) => ({
          ...previous,
          page: 1,
        })
      );

    };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh =
    async () => {
      setError('');

      await fetchData(
        pagination.page
      );

      showToast(
        'Master Data refreshed successfully.',
        'success'
      );
    };

  // ==========================================================
  // DISPLAY HELPERS
  // ==========================================================

  const getDisplayName =
    (item) => {
      return (
        item.name ||
        item.account_title ||
        item.full_name ||
        '-'
      );
    };

  const getDisplayCode =
    (item) => {
      return (
        item.code ||
        item.username ||
        '-'
      );
    };

  const getDisplayDescription =
    (item) => {
      return (
        item.description ||
        item.account_description ||
        item.revised_description ||
        '-'
      );
    };

  const getDisplayStatus =
    (item) => {
      if (
        item.is_active ===
        false
      ) {
        return 'Inactive';
      }

      return (
        item.status ||
        'Active'
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

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

            <div className="flex items-start gap-2">

              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />

              <div>
                <strong className="font-semibold">
                  Unable to load Master Data.
                </strong>

                <div className="mt-0.5 text-xs">
                  {error}
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* ====================================================
            TABS
        ==================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">

          {tabs.map(
            (tab) => {
              const Icon =
                tab.icon;

              const isActive =
                activeTab ===
                tab.id;

              return (
                <button
                  key={
                    tab.id
                  }
                  type="button"
                  onClick={() =>
                    handleTabChange(
                      tab.id
                    )
                  }
                  className={`w-full min-h-9 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >

                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  />

                  <span>
                    {
                      tab.label
                    }
                  </span>

                </button>
              );
            }
          )}

          </div>
        </div>

        {/* ====================================================
            SECTION HEADER
        ==================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-base font-bold text-gray-900">
{activeTabConfig.label}
              </h2>

              {isReadOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-semibold">
                  <Eye className="w-3 h-3" />
                  View Only
                </span>
              )}

            </div>

            <p className="text-xs text-gray-500 mt-0.5">
{activeTabConfig.description}
            </p>

          </div>

          <div className="flex items-center gap-2 flex-wrap">

            {/* Search */}

            <div className="relative">

              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                placeholder={`Search ${activeTabConfig.label}...`}
                value={
                  searchTerm
                }
                onChange={(event) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                className="pl-8 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-[220px]"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm(
                      ''
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

            </div>

            {/* Refresh */}

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                loading
              }
              title="Refresh"
              className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >

              <RefreshCw
                className={`w-4 h-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

            </button>

            {/* ADD */}

            {!isReadOnly && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm"
              >
                <Plus className="w-4 h-4" />

                <span>
                  Add{' '}
                  {
                    getSingularLabel()
                  }
                </span>
              </button>
            )}

          </div>

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse text-xs">

              <thead>
                <tr className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100">

                  <th className="px-4 py-3.5 w-12 text-center">
                    #
                  </th>

                  <th className="px-4 py-3.5">
                    Code
                  </th>

                  <th className="px-4 py-3.5">
                    Name
                  </th>

                  {activeTab === 'fundClusters' && (
                    <th className="px-4 py-3.5">
                      Funding Source
                    </th>
                  )}

                  {activeTab === 'departments' && (
                    <th className="px-4 py-3.5">
                      Campus
                    </th>
                  )}

                  {activeTab === 'responsibilityCenters' && (
                    <th className="px-4 py-3.5">
                      Category
                    </th>
                  )}

                  <th className="px-4 py-3.5">
                    Description
                  </th>

                  <th className="px-4 py-3.5 text-center">
                    Status
                  </th>

                  <th className="px-4 py-3.5 text-center">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700">

                {loading ? (
                  <tr>
                    <td
                      colSpan={(activeTab === 'departments' || activeTab === 'fundClusters' || activeTab === 'responsibilityCenters') ? 7 : 6}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">

                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />

                        <span>
                          Loading Master Data...
                        </span>

                      </div>
                    </td>
                  </tr>
                ) : items.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={(activeTab === 'departments' || activeTab === 'fundClusters' || activeTab === 'responsibilityCenters') ? 7 : 6}
                      className="px-4 py-10 text-center"
                    >

                      <div className="flex flex-col items-center">

                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>

                        <p className="text-sm font-semibold text-gray-600">
                          No records found
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {searchTerm
                            ? 'Try changing your search keyword.'
                            : 'There are no records available in this section.'}
                        </p>

                      </div>

                    </td>
                  </tr>
                ) : (
                  items.map(
                    (
                      item,
                      index
                    ) => {
                      const displayStatus =
                        getDisplayStatus(
                          item
                        );

                      return (
                        <tr
                          key={
                            item.id ||
                            index
                          }
                          className="hover:bg-gray-50/50 transition"
                        >

                          <td className="px-4 py-3.5 text-center text-gray-400 font-medium">
                            {(
                              (
                                pagination.page -
                                1
                              ) *
                                pagination.limit
                            ) +
                              index +
                              1}
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-gray-900">
                            {
                              getDisplayCode(
                                item
                              )
                            }
                          </td>

                          <td className="px-4 py-3.5 font-medium text-gray-800">
                            {
                              getDisplayName(
                                item
                              )
                            }
                          </td>

                          {activeTab === 'fundClusters' && (
                            <td className="px-4 py-3.5 text-gray-700 font-medium">
                              {item.fund_source_code
                                ? `${item.fund_source_code}${item.fund_source_name ? ` — ${item.fund_source_name}` : ''}`
                                : '-'}
                            </td>
                          )}

                          {activeTab === 'departments' && (
                            <td className="px-4 py-3.5 text-gray-700 font-medium">
                              {item.campus_name || item.campus_code || '-'}
                            </td>
                          )}

                          {activeTab === 'responsibilityCenters' && (
                            <td className="px-4 py-3.5 text-gray-700 font-medium">
                              {item.category || '-'}
                            </td>
                          )}

                          <td className="px-4 py-3.5 text-gray-500 max-w-[280px]">
                            <span
                              className="block truncate"
                              title={getDisplayDescription(item)}
                            >
                              {
                                getDisplayDescription(
                                  item
                                )
                              }
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">

                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                displayStatus ===
                                'Active'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {
                                displayStatus
                              }
                            </span>

                          </td>

                          <td className="px-4 py-3.5 text-center">

                            {isReadOnly ? (
                              <span className="text-[11px] text-gray-400">
                                View only
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      item
                                    )
                                  }
                                  title="Edit"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteModal(
                                      item
                                    )
                                  }
                                  title="Delete"
                                  className="p-1.5 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}

          <div className="px-4 py-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 text-xs text-gray-500">

            <span>
              {pagination.totalItems >
              0 ? (
                <>
                  Showing{' '}
                  {(
                    (
                      pagination.page -
                      1
                    ) *
                      pagination.limit
                  ) +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.totalItems
                  )}{' '}
                  of{' '}
                  {
                    pagination.totalItems
                  }{' '}
                  entries
                </>
              ) : (
                'Showing 0 entries'
              )}
            </span>

            <div className="flex items-center gap-1">

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    pagination.page -
                      1
                  )
                }
                disabled={
                  pagination.page <=
                    1 ||
                  loading
                }
                className="p-1.5 border border-gray-200 rounded bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {pageNumbers.map(
                (page) => (
                  <button
                    key={
                      page
                    }
                    type="button"
                    onClick={() =>
                      goToPage(
                        page
                      )
                    }
                    disabled={
                      loading
                    }
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs ${
                      page ===
                      pagination.page
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {
                      page
                    }
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    pagination.page +
                      1
                  )
                }
                disabled={
                  pagination.page >=
                    pagination.totalPages ||
                  loading
                }
                className="p-1.5 border border-gray-200 rounded bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

        </div>

        {/* ====================================================
            ABOUT MASTER DATA
        ==================================================== */}

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div className="flex items-start gap-3">

            <div className="p-2 bg-blue-600 text-white rounded-full shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>

            <div>

              <h4 className="text-xs font-bold text-gray-900">
                About Master Data
              </h4>

              <p className="text-xs text-gray-500 mt-0.5 max-w-3xl">
                Master Data maintains the reference
                information used throughout the system
                to ensure accuracy, consistency, and
                proper classification of budget records.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              showToast(
                'Data Import will be enabled after the import format is confirmed.',
                'info'
              )
            }
            className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />

            <span>
              Data Import
            </span>
          </button>

        </div>

        {/* ====================================================
            CREATE / EDIT MODAL
        ==================================================== */}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">

              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">

                <div>

                  <h3 className="text-lg font-bold text-gray-800">
                    {editingId
                      ? `Edit ${getSingularLabel()}`
                      : `Add ${getSingularLabel()}`}
                  </h3>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Enter the required reference information.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

              </div>

              <form
                onSubmit={
                  handleSave
                }
                className="p-6 space-y-4"
              >

                {/* CODE */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Code *
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={
                      formData.code
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter code"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    required
                  />

                </div>

                {/* NAME */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isOtherReference && activeReferenceType === 'uacs'
                      ? 'Account Title *'
                      : 'Name *'}
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    required
                  />

                </div>

                {/* DEPARTMENT CAMPUS */}

                {activeTab === 'departments' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Campus *
                    </label>

                    <select
                      name="campus_id"
                      value={formData.campus_id}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    >
                      <option value="">Select Campus</option>
                      {campusOptions.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.code} — {campus.name}
                        </option>
                      ))}
                    </select>

                    {campusOptions.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active campuses found. Add/activate a Campus in the Campuses tab first.
                      </p>
                    )}
                  </div>
                )}

                {/* UACS-SPECIFIC FIELDS */}

                {isOtherReference &&
                  activeReferenceType ===
                    'uacs' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Old UACS Code
                      </label>

                      <input
                        type="text"
                        name="old_code"
                        value={
                          formData.old_code
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Optional old UACS code"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Account Title
                      </label>

                      <input
                        type="text"
                        name="account_title"
                        value={
                          formData.account_title
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="Enter account title"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                  </>
                )}

                {/* CAMPUS-SPECIFIC FIELDS */}

                {isOtherReference &&
                  activeReferenceType ===
                    'campuses' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Abbreviation
                    </label>

                    <input
                      type="text"
                      name="abbreviation"
                      value={
                        formData.abbreviation
                      }
                      onChange={
                        handleFormChange
                      }
                      placeholder="Optional abbreviation"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                )}

                {/* FUND SOURCE */}

                {activeTab === 'fundClusters' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Funding Source *
                    </label>

                    <select
                      name="fund_source_id"
                      value={formData.fund_source_id}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    >
                      <option value="">Select Funding Source</option>
                      {fundSourceOptions.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.code} — {source.name}
                        </option>
                      ))}
                    </select>

                    {fundSourceOptions.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active Funding Sources found. Add/activate one in Funding Sources first.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'responsibilityCenters' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      placeholder="e.g. Responsibility Center"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                )}

                {/* DESCRIPTION */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Optional description"
                    rows="3"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleFormChange
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-2 pt-3">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                    className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                  >

                    {saving && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}

                    {saving
                      ? 'Saving...'
                      : editingId
                      ? 'Update'
                      : 'Create'}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ====================================================
            DELETE CONFIRMATION MODAL
            NO window.confirm()
        ==================================================== */}

        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">

            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">

              <div className="p-6">

                <div className="flex items-center justify-center mb-4">

                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>

                </div>

                <h3 className="text-base font-bold text-gray-900 text-center">
                  Delete{' '}
                  {
                    getSingularLabel()
                  }?
                </h3>

                <p className="text-xs text-gray-500 text-center mt-2 leading-5">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-700">
                    {deleteItemName}
                  </span>
                  ? This action cannot be undone.
                </p>

                <div className="flex justify-center gap-2 mt-6">

                  <button
                    type="button"
                    onClick={
                      closeDeleteModal
                    }
                    className="px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleDelete
                    }
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          TOAST
      ====================================================== */}

      {toast && (
        <Toast
          message={
            toast.message
          }
          type={
            toast.type
          }
          onClose={
            hideToast
          }
        />
      )}

    </Layout>
  );
}