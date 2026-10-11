// frontend/src/components/BudgetProposals.jsx

import React, { useEffect, useMemo, useState } from 'react';
import Layout from './layout/Layout';
import { API_URL } from '../config/api';

import {
  BarChart3,
  Plus,
  FileText,
  Users,
  Search,
  Eye,
  Pencil,
  Paperclip,
  RotateCcw,
  History,
  CheckCircle2,
  Clock3,
  XCircle,
  Send,
  ClipboardList,
  Filter,
  FileSpreadsheet,
  Database,
  PieChart,
  ArrowRight,
  FileCheck2,
  FolderOpen,
  ArrowLeft,
  Building2,
  WalletCards,
  Layers3,
  RefreshCcw,
  ChevronDown,
  TrendingUp,
  CircleDollarSign,
  Save,
  Upload,
  Check,
  Download,
  Printer,
  MessageSquare,
  UserCheck,
  CalendarDays,
  ArrowUpRight,
  FileClock,
  ListChecks,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';


// ============================================================
// BUDGET PROPOSALS
// Database Version
// Based on RBUD / RAOD terminology
// ============================================================

export default function BudgetProposals({
  user,
  onLogout,
  onNavigate,
  activePath
}) {

  // ==========================================================
  // ROLE-BASED ACCESS
  // ==========================================================

  const currentRole = user?.role || '';
  const isAdministration = currentRole === 'Administration';
  const isBudget = currentRole === 'Budget';
  const isAccountant = currentRole === 'Accountant';
  const isProcurement = currentRole === 'Procurement';

  // Budget Proposal ownership: Administration has full oversight;
  // Budget owns proposal creation, editing, submission, and workflow review.
  // Accountant has relevant read-only access; Procurement has no access.
  const canViewProposal = isAdministration || isBudget || isAccountant;
  const canCreateProposal = isAdministration || isBudget;
  const canEditProposal = isAdministration || isBudget;
  const canSubmitProposal = isAdministration || isBudget;
  const canReviewProposal = isAdministration || isBudget;

  // ==========================================================
  // STATE
  // ==========================================================

  const [selectedYear, setSelectedYear] = useState(2026);

  const [selectedSection, setSelectedSection] =
    useState('modules');

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [overviewFundGroup, setOverviewFundGroup] =
    useState('All Fund Groups');

  const [selectedProposal, setSelectedProposal] =
    useState(null);

  const [reportType, setReportType] =
    useState('Proposal Summary');

  const [reportFundGroup, setReportFundGroup] =
    useState('All Fund Groups');

  const [reportStatus, setReportStatus] =
    useState('All');

  const [formSaved, setFormSaved] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState('');

  const [workflowAction, setWorkflowAction] =
    useState(null);

  const [overviewMode, setOverviewMode] = useState('summary');
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [allHistory, setAllHistory] = useState([]);
  const [selectedSupportingFile, setSelectedSupportingFile] = useState(null);

  // Pagination state for database tables
  const PAGE_SIZE = 5;
  const [overviewPage, setOverviewPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [workflowPage, setWorkflowPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [proposalError, setProposalError] = useState('');
  const [proposalHistory, setProposalHistory] = useState([]);

  // Existing RBUD/RAOD Master Data used by the Budget Proposal form.
  const [fundClusters, setFundClusters] = useState([]);
  const [fundSources, setFundSources] = useState([]);
  const [fundCodes, setFundCodes] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [responsibilityCenters, setResponsibilityCenters] = useState([]);
  const [papOptions, setPapOptions] = useState([]);
  const [uacsOptions, setUacsOptions] = useState([]);
  const [wfpOptions, setWfpOptions] = useState([]);
  const [mfoOptions, setMfoOptions] = useState([]);
  const [allotmentClasses, setAllotmentClasses] = useState([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [proposalForm, setProposalForm] = useState({
    fundCluster: '',
    fundCode: '',
    campus: '',
    responsibilityCenter: '',
    wfpDescription: '',
    sourceCode: '',
    proposingOffice: '',
    pap: '',
    mfo: '',
    uacsCode: '',
    classification: '',
    psAmount: '',
    mooeAmount: '',
    coAmount: '',
    amount: '',
    particulars: '',
    justification: '',
    expectedOutputs: '',
    proponent: '',
    title: '',
    remarks: ''
  });

  
  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  };

  const loadBudgetProposalReferences = async () => {
    setLoadingReferenceData(true);
    try {
      const response = await fetch(
        `${API_URL}/rbud/references`,
        { headers: { ...authHeaders() } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to load Master Data.');
      }

      const refs = data.references || data;

      setFundClusters(
        Array.isArray(refs.fundClusters)
          ? refs.fundClusters
          : Array.isArray(refs.fund_clusters)
            ? refs.fund_clusters
            : []
      );

      setFundSources(
        Array.isArray(refs.fundSources)
          ? refs.fundSources
          : Array.isArray(refs.fund_sources)
            ? refs.fund_sources
            : []
      );

      const loadedFundCodes =
        Array.isArray(refs.fundCodes)
          ? refs.fundCodes
          : Array.isArray(refs.fund_codes)
            ? refs.fund_codes
            : [];

      // Normalize the parent-cluster key so the dropdown keeps working even
      // when the API returns the equivalent key using a slightly different
      // name. The actual master-data relationship is still Fund Cluster ->
      // Fund Code; no database values are changed here.
      setFundCodes(
        loadedFundCodes.map(item => ({
          ...item,
          fund_cluster_id:
            item.fund_cluster_id ??
            item.fundClusterId ??
            item.cluster_id ??
            item.fund_cluster?.id ??
            item.fundCluster?.id ??
            null
        }))
      );

      setCampuses(
        Array.isArray(refs.campuses) ? refs.campuses : []
      );

      setResponsibilityCenters(
        Array.isArray(refs.responsibilityCenters)
          ? refs.responsibilityCenters
          : Array.isArray(refs.responsibility_centers)
            ? refs.responsibility_centers
            : []
      );

      setPapOptions(Array.isArray(refs.pap) ? refs.pap : Array.isArray(refs.paps) ? refs.paps : []);
      setMfoOptions(Array.isArray(refs.mfo) ? refs.mfo : Array.isArray(refs.mfoList) ? refs.mfoList : []);
      setUacsOptions(Array.isArray(refs.uacsCodes) ? refs.uacsCodes : Array.isArray(refs.uacs_codes) ? refs.uacs_codes : []);
      setWfpOptions(Array.isArray(refs.wfpSources) ? refs.wfpSources : Array.isArray(refs.wfp_sources) ? refs.wfp_sources : []);
      setAllotmentClasses(Array.isArray(refs.allotmentClasses) ? refs.allotmentClasses : Array.isArray(refs.allotment_classes) ? refs.allotment_classes : []);
    } catch (error) {
      console.error('Budget Proposal Master Data load error:', error);
      setProposalError(error.message || 'Unable to load Master Data.');
    } finally {
      setLoadingReferenceData(false);
    }
  };

  const loadProposalHistory = async (proposalId) => {
    if (!proposalId) {
      setProposalHistory([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/budget-proposals/${proposalId}/history`,
        { headers: { ...authHeaders() } }
      );
      const data = await response.json();
      setProposalHistory(response.ok && Array.isArray(data.history) ? data.history : []);
    } catch (error) {
      console.error('Budget Proposal history error:', error);
      setProposalHistory([]);
    }
  };

  const loadAllHistory = async () => {
    try {
      const response = await fetch(
        `${API_URL}/budget-proposals/history?year=${selectedYear}`,
        { headers: { ...authHeaders() } }
      );
      const data = await response.json();
      setAllHistory(response.ok && Array.isArray(data.history) ? data.history : []);
    } catch (error) {
      console.error('Budget Proposal all-history error:', error);
      setAllHistory([]);
    }
  };

  const loadBudgetProposals = async () => {
    setLoadingProposals(true);
    setProposalError('');

    try {
      const response = await fetch(
        `${API_URL}/budget-proposals?year=${selectedYear}`,
        { headers: { ...authHeaders() } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to load budget proposals.');
      }

      setProposals(Array.isArray(data.proposals) ? data.proposals : []);
    } catch (error) {
      console.error('Budget Proposal load error:', error);
      setProposalError(error.message || 'Unable to load budget proposals.');
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    loadBudgetProposals();
    loadAllHistory();
    setOverviewPage(1);
    setRecentPage(1);
    setRecordsPage(1);
    setReviewPage(1);
    setWorkflowPage(1);
    setHistoryPage(1);
    setReportPage(1);
  }, [selectedYear]);

  useEffect(() => {
    loadBudgetProposalReferences();
  }, []);

  useEffect(() => {
    loadProposalHistory(selectedProposal?.id);
  }, [selectedProposal?.id]);

  const updateProposalForm = (field, value) => {
    setProposalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProposal = async (submit = false) => {
    try {
      // Clear previous validation/success messages before every new save attempt.
      // This prevents an old success banner from appearing together with a
      // validation error when the user starts a new proposal.
      setProposalError('');
      setFormSaved(false);

      const psAmount = Number(proposalForm.psAmount || 0);
      const mooeAmount = Number(proposalForm.mooeAmount || 0);
      const coAmount = Number(proposalForm.coAmount || 0);
      const amount = psAmount + mooeAmount + coAmount;

      if (!proposalForm.proposingOffice.trim()) {
        throw new Error('Proposing Office / Department is required.');
      }
      if (!proposalForm.pap) {
        throw new Error('P/A/P is required.');
      }
      if (!proposalForm.title.trim()) {
        throw new Error('Proposal Title is required.');
      }
      if (!proposalForm.particulars.trim()) {
        throw new Error('Particulars / Description is required.');
      }

      const selectedClusterHasFundCodes = fundCodes.some(
        item => String(item.fund_cluster_id) === String(proposalForm.fundCluster)
      );

      if (
        !proposalForm.fundCluster ||
        (selectedClusterHasFundCodes && !proposalForm.fundCode) ||
        !proposalForm.campus ||
        !proposalForm.responsibilityCenter ||
        !proposalForm.wfpDescription ||
        !proposalForm.mfo ||
        !proposalForm.uacsCode ||
        !proposalForm.classification
      ) {
        throw new Error(
          'Please complete Fund Cluster, Fund Code, Campus, Responsibility Center, WFP Description, P/A/P, MFO, UACS Code, and Allotment Class.'
        );
      }

      if (
        ![psAmount, mooeAmount, coAmount].every(Number.isFinite) ||
        psAmount < 0 ||
        mooeAmount < 0 ||
        coAmount < 0 ||
        amount <= 0
      ) {
        throw new Error('At least one proposed amount (PS, MOOE, or CO) must be greater than zero.');
      }

      const fc = fundClusters.find(x => String(x.id) === String(proposalForm.fundCluster));
      const fcFundCode = fundCodes.find(x => String(x.id) === String(proposalForm.fundCode));
      const campus = campuses.find(x => String(x.id) === String(proposalForm.campus));
      const rc = responsibilityCenters.find(x => String(x.id) === String(proposalForm.responsibilityCenter));
      const wfp = wfpOptions.find(x => String(x.id) === String(proposalForm.wfpDescription));
      const pap = papOptions.find(x => String(x.id) === String(proposalForm.pap));
      const mfo = mfoOptions.find(x => String(x.id) === String(proposalForm.mfo));
      const uacs = uacsOptions.find(x => String(x.id) === String(proposalForm.uacsCode));
      const allotment = allotmentClasses.find(x => String(x.id) === String(proposalForm.classification));

      const payload = {
        fiscal_year: selectedYear,

        // Proposal identity
        department: proposalForm.proposingOffice.trim(),
        proposing_office: proposalForm.proposingOffice.trim(),
        proponent: proposalForm.proponent || user?.name || user?.username || 'System User',
        title: proposalForm.title.trim(),
        description: proposalForm.particulars.trim(),
        particulars: proposalForm.particulars.trim(),
        justification: proposalForm.justification || null,
        expected_outputs: proposalForm.expectedOutputs || null,
        remarks: proposalForm.remarks || null,
        created_by: user?.id || user?.user_id || null,

        // Budget/WFP classification
        // budget_proposals.fund_source_id remains the FK to fund_sources.
        // The selected Fund Code is stored in the existing fund_source text field.
        fund_source: fcFundCode?.code || proposalForm.fundCode || null,
        fund_cluster_id: fc?.id || null,
        fund_source_id: fc?.fund_source_id || null,
        campus_id: campus?.id || null,
        responsibility_center_id: rc?.id || null,
        wfp_source_id: wfp?.id || null,
        pap_id: pap?.id || null,
        mfo_id: mfo?.id || null,
        uacs_code_id: uacs?.id || null,
        allotment_class_id: allotment?.id || null,

        fund_cluster: fc?.code || null,
        fund_code: fcFundCode?.code || proposalForm.fundCode || null,
        campus: campus?.code || campus?.name || null,
        responsibility_center: rc?.code || rc?.name || null,
        wfp_description: wfp?.name || proposalForm.wfpDescription || null,
        source_code: proposalForm.sourceCode || null,
        pap: pap?.name || null,
        mfo: mfo?.name || null,
        uacs_code: uacs?.code || null,
        budget_classification: allotment?.code || null,

        amount,
        proposed_ps: psAmount,
        proposed_mooe: mooeAmount,
        proposed_co: coAmount
      };

      const url = editingProposalId
        ? `${API_URL}/budget-proposals/${editingProposalId}`
        : `${API_URL}/budget-proposals`;

      const method = editingProposalId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to save budget proposal.');
      }

      const savedId = data.proposal?.id || editingProposalId;

      if (submit && savedId) {
        const submitResponse = await fetch(`${API_URL}/budget-proposals/${savedId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            status: 'Submitted',
            actor_id: user?.id || user?.user_id || null,
            actor_name: user?.name || user?.username || 'System User'
          })
        });

        const submitData = await submitResponse.json();

        if (!submitResponse.ok) {
          throw new Error(submitData.error || 'Proposal was saved but could not be submitted.');
        }
      }

      setFormSaved(true);
      setEditingProposalId(null);
      setSelectedSupportingFile(null);

      setProposalForm({
        fundCluster: '',
        fundCode: '',
        campus: '',
        responsibilityCenter: '',
        wfpDescription: '',
        sourceCode: '',
        proposingOffice: '',
        pap: '',
        mfo: '',
            uacsCode: '',
        classification: '',
        psAmount: '',
        mooeAmount: '',
        coAmount: '',
        amount: '',
        particulars: '',
        justification: '',
        expectedOutputs: '',
        proponent: '',
        title: '',
        remarks: ''
      });

      await Promise.all([loadBudgetProposals(), loadAllHistory()]);

      if (submit) setSelectedSection('records');
    } catch (error) {
      console.error('Budget Proposal save error:', error);
      setProposalError(error.message || 'Unable to save budget proposal.');
    }
  };

  const editProposal = (proposal) => {
    setEditingProposalId(proposal.id);
    setSelectedProposal(proposal);
    setFormSaved(false);
    setProposalError('');

    const allotmentCode = String(proposal.allotment_code || proposal.budget_classification || '').toUpperCase();

    setProposalForm({
      fundCluster: proposal.fund_cluster_id ? String(proposal.fund_cluster_id) : '',
      fundCode: proposal.fundCode
        ? String(fundCodes.find(x => String(x.fund_cluster_id) === String(proposal.fund_cluster_id) && String(x.code).toLowerCase() === String(proposal.fundCode).toLowerCase())?.id || '')
        : '',
      campus: proposal.campus_id ? String(proposal.campus_id) : '',
      responsibilityCenter: proposal.responsibility_center_id ? String(proposal.responsibility_center_id) : '',
      wfpDescription: proposal.wfp_source_id ? String(proposal.wfp_source_id) : '',
      sourceCode: proposal.sourceCode || proposal.source_code || '',
      proposingOffice: proposal.department || proposal.department_unit || '',
      pap: proposal.pap_id ? String(proposal.pap_id) : '',
      mfo: proposal.mfo_id ? String(proposal.mfo_id) : '',
      uacsCode: proposal.uacs_code_id ? String(proposal.uacs_code_id) : '',
      classification: proposal.allotment_class_id ? String(proposal.allotment_class_id) : '',
      psAmount: proposal.proposed_ps != null
        ? String(proposal.proposed_ps)
        : allotmentCode === 'PS' ? String(proposal.amount ?? '') : '',
      mooeAmount: proposal.proposed_mooe != null
        ? String(proposal.proposed_mooe)
        : allotmentCode === 'MOOE' ? String(proposal.amount ?? '') : '',
      coAmount: proposal.proposed_co != null
        ? String(proposal.proposed_co)
        : allotmentCode === 'CO' ? String(proposal.amount ?? '') : '',
      amount: String(proposal.amount ?? ''),
      particulars: proposal.particulars || proposal.description || '',
      justification: proposal.justification || '',
      expectedOutputs: proposal.expected_outputs || '',
      proponent: proposal.proponent || '',
      title: proposal.title || proposal.proposal_title || '',
      remarks: proposal.remarks || ''
    });

    setSelectedSection('create');
  };

  const deleteProposal = async (proposal) => {
    if (!proposal?.id) return;
    if (!window.confirm(`Delete budget proposal ${proposal.reference}?`)) return;
    try {
      const response = await fetch(`${API_URL}/budget-proposals/${proposal.id}`, { method:'DELETE', headers:{...authHeaders()} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete proposal.');
      setSelectedProposal(null);
      await Promise.all([loadBudgetProposals(), loadAllHistory()]);
    } catch (error) {
      setProposalError(error.message || 'Unable to delete proposal.');
    }
  };

  const handleSupportingFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) { setSelectedSupportingFile(null); return; }
    setSelectedSupportingFile({ name:file.name, size:file.size, type:file.type, lastModified:file.lastModified });
  };


  const changeProposalStatus = async (status) => {
    if (!selectedProposal?.id) {
      setProposalError('Select a proposal first.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/budget-proposals/${selectedProposal.id}/status`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json', ...authHeaders()},
        body:JSON.stringify({
          status,
          remarks:reviewMessage,
          actor_id:user?.id || user?.user_id || null,
          actor_name:user?.name || user?.username || 'System User'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Unable to update proposal status.');
      const updatedProposal = data.proposal || selectedProposal;
      setSelectedProposal(updatedProposal);
      setWorkflowAction(status.toLowerCase());
      setReviewMessage('');
      await Promise.all([loadBudgetProposals(), loadProposalHistory(updatedProposal.id), loadAllHistory()]);
    } catch (error) {
      setProposalError(error.message || 'Unable to update proposal status.');
    }
  };


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigateTo = (path) => {

    if (typeof onNavigate === 'function') {
      onNavigate(path);
    }

  };


  // ==========================================================
  // SECTION NAVIGATION
  // ==========================================================

  const handleSectionClick = (section) => {

    // A new proposal starts with a clean message state.
    // Do not carry the previous proposal's success/error banner into the new form.
    if (section === 'create') {
      setFormSaved(false);
      setProposalError('');
      setWorkflowAction(null);
      setEditingProposalId(null);
      setSelectedSupportingFile(null);
    }

    setSelectedSection(section);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  };


  const goBackToModules = () => {

    setSelectedSection('modules');

    setSelectedProposal(null);

    setFormSaved(false);

    setWorkflowAction(null);
    setEditingProposalId(null);
    setSelectedSupportingFile(null);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  };


  // ==========================================================
  // DATABASE PROPOSAL DATA
  // ==========================================================

  const proposalRecords = proposals;

  const fundGroupData = useMemo(() => {
    const groups = new Map();

    // Keep all valid Master Data fund sources visible even when there is
    // no proposal under that source yet. Existing proposal values are then
    // added to the corresponding group.
    fundSources.forEach(source => {
      const name = source?.name || source?.code || 'Other Funds';
      if (!groups.has(name)) {
        groups.set(name, {
          name,
          code: source?.code || '',
          budget: 0,
          obligations: 0,
          disbursements: 0,
          balance: 0
        });
      }
    });

    proposalRecords.forEach(item => {
      const name = item.fundGroup || item.fund_source || 'Other Funds';
      const current = groups.get(name) || {
        name,
        code: item.fundCode || '',
        budget: 0,
        obligations: 0,
        disbursements: 0,
        balance: 0
      };

      const amount = Number(item.amount) || 0;
      current.budget += amount;
      current.balance += amount;
      groups.set(name, current);
    });

    return Array.from(groups.values());
  }, [proposalRecords, fundSources]);

  const classificationTotals = useMemo(() => {
    const totals = { PS: 0, MOOE: 0, CO: 0 };

    proposalRecords.forEach(item => {
      const classification = String(
        item.classification ||
        item.budget_classification ||
        item.allotmentClass ||
        item.allotment_class ||
        ''
      ).trim().toUpperCase();

      const amount = Number(item.amount) || 0;
      if (classification.includes('PS')) totals.PS += amount;
      else if (classification.includes('MOOE')) totals.MOOE += amount;
      else if (classification.includes('CO')) totals.CO += amount;
    });

    return { ...totals, total: totals.PS + totals.MOOE + totals.CO };
  }, [proposalRecords]);

  // ==========================================================
  // FORMATTING
  // ==========================================================

  const formatCurrency = (amount) => {

    return new Intl.NumberFormat(
      'en-PH',
      {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
      }
    ).format(amount || 0);

  };


  const formatCompact = (amount) => {

    if (amount >= 1000000) {

      return (
        '\u20B1' +
        (
          amount / 1000000
        ).toFixed(2) +
        'M'
      );

    }

    if (amount >= 1000) {

      return (
        '\u20B1' +
        (
          amount / 1000
        ).toFixed(1) +
        'K'
      );

    }

    return '\u20B1' + amount;

  };


  // ==========================================================
  // PROPOSAL SUMMARY
  // ==========================================================

  const summaryData = useMemo(() => ({
    totalProposals: proposalRecords.length,
    draftProposals: proposalRecords.filter(item => item.status === 'Draft').length,
    submittedProposals: proposalRecords.filter(item => item.status === 'Submitted').length,
    reviewProposals: proposalRecords.filter(item => item.status === 'Under Review').length,
    revisionProposals: proposalRecords.filter(item => item.status === 'For Revision').length,
    endorsedProposals: proposalRecords.filter(item => item.status === 'Endorsed').length,
    approvedProposals: proposalRecords.filter(item => item.status === 'Approved').length,
    rejectedProposals: proposalRecords.filter(item => item.status === 'Rejected').length
  }), [proposalRecords]);

  // ==========================================================
  // FILTERED RECORDS
  // ==========================================================

  const filteredProposals =
    proposalRecords.filter((proposal) => {

      const search =
        searchTerm.toLowerCase().trim();

      const searchableText = [

        proposal.reference,

        proposal.department,

        proposal.fundGroup,

        proposal.fundCode,

        proposal.campus,

        proposal.responsibilityCenter,

        proposal.wfpDescription,

        proposal.pap,

        proposal.particulars

      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(search);

      const matchesStatus =
        statusFilter === 'All' ||
        proposal.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );

    });


  useEffect(() => {
    setRecordsPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setReportPage(1);
  }, [reportType, reportFundGroup, reportStatus]);

  useEffect(() => {
    setOverviewPage(1);
  }, [overviewMode, overviewFundGroup]);

  const getDepartment = (proposal) => {
    if (!proposal) return '—';
    return proposal.department || proposal.proposing_office || proposal.department_unit || proposal.department_name || proposal.office_name || proposal.pap || '—';
  };

  const paginate = (items, page) => {
    const list = Array.isArray(items) ? items : [];
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return {
      rows: list.slice(startIndex, startIndex + PAGE_SIZE),
      page: safePage,
      totalPages,
      totalRows: list.length,
      start: list.length ? startIndex + 1 : 0,
      end: Math.min(startIndex + PAGE_SIZE, list.length)
    };
  };

  const Pagination = ({ page, totalPages, totalRows, start, end, onPageChange }) => {
    if (!totalRows) return null;
    return (
      <div className="bp-pagination">
        <span className="bp-pagination-info">Showing {start}–{end} of {totalRows}</span>
        <div className="bp-pagination-controls">
          <button type="button" className="bp-page-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button type="button" key={n} className={`bp-page-button ${n === page ? 'active' : ''}`} onClick={() => onPageChange(n)}>{n}</button>
          ))}
          <button type="button" className="bp-page-button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</button>
        </div>
      </div>
    );
  };

  // ==========================================================
  // OVERVIEW
  // ==========================================================

  const overviewData = useMemo(() => {
    if (overviewMode === 'status') {
      const groups = new Map();
      proposalRecords.forEach(item => { const key=item.status || 'Unspecified'; const row=groups.get(key)||{name:key,budget:0,obligations:0,disbursements:0,balance:0}; row.budget += Number(item.amount||0); row.balance += Number(item.amount||0); groups.set(key,row); });
      return Array.from(groups.values()).sort((a,b)=>b.budget-a.budget);
    }
    if (overviewMode === 'department') {
      const groups = new Map();
      proposalRecords.forEach(item => { const key=item.department || 'Unspecified'; const row=groups.get(key)||{name:key,budget:0,obligations:0,disbursements:0,balance:0}; row.budget += Number(item.amount||0); row.balance += Number(item.amount||0); groups.set(key,row); });
      return Array.from(groups.values()).sort((a,b)=>b.budget-a.budget);
    }
    if (overviewFundGroup === 'All Fund Groups') return fundGroupData;
    return fundGroupData.filter(item => item.name === overviewFundGroup);
  }, [overviewMode, overviewFundGroup, fundGroupData, proposalRecords]);


  const overviewTotals =
    overviewData.reduce(
      (acc, item) => {

        acc.budget += item.budget;

        acc.obligations +=
          item.obligations;

        acc.disbursements +=
          item.disbursements;

        acc.balance +=
          item.balance;

        return acc;

      },
      {
        budget: 0,
        obligations: 0,
        disbursements: 0,
        balance: 0
      }
    );


  const utilizationRate =
    overviewTotals.budget > 0
      ? (
          overviewTotals.obligations /
          overviewTotals.budget
        ) * 100
      : 0;


  const disbursementRate =
    overviewTotals.budget > 0
      ? (
          overviewTotals.disbursements /
          overviewTotals.budget
        ) * 100
      : 0;


  const overviewPagination = paginate(overviewData, overviewPage);
  const recentPagination = paginate(proposalRecords, recentPage);


  // ==========================================================
  // STATUS DATA
  // ==========================================================

  const proposalStatuses = [
    { label: 'Draft', count: summaryData.draftProposals, className: 'bp-status-pending' },
    { label: 'Submitted', count: summaryData.submittedProposals, className: 'bp-status-review' },
    { label: 'Under Review', count: summaryData.reviewProposals, className: 'bp-status-review' },
    { label: 'For Revision', count: summaryData.revisionProposals, className: 'bp-status-returned' },
    { label: 'Endorsed', count: summaryData.endorsedProposals, className: 'bp-status-endorsed' },
    { label: 'Approved', count: summaryData.approvedProposals, className: 'bp-status-approved' },
    { label: 'Rejected', count: summaryData.rejectedProposals, className: 'bp-status-disapproved' }
  ];


  // Compact proposal-status chart data.
  // Uses the same live proposal counts; this only changes presentation.
  const statusTotal = proposalStatuses.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );

  const statusColors = {
    Draft: '#f59e0b',
    Submitted: '#3b82f6',
    'Under Review': '#3b82f6',
    'For Revision': '#f97316',
    Endorsed: '#8b5cf6',
    Approved: '#10b981',
    Rejected: '#ef4444'
  };

  const statusGradient = (() => {
    if (statusTotal <= 0) return '#eef2f7';

    let current = 0;

    return `conic-gradient(${proposalStatuses
      .filter(item => Number(item.count || 0) > 0)
      .map(item => {
        const start = (current / statusTotal) * 100;
        current += Number(item.count || 0);
        const end = (current / statusTotal) * 100;
        return `${statusColors[item.label]} ${start}% ${end}%`;
      })
      .join(', ')})`;
  })();


  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'bp-badge-pending';
      case 'Submitted': return 'bp-badge-review';
      case 'Under Review': return 'bp-badge-review';
      case 'For Revision': return 'bp-badge-returned';
      case 'Endorsed': return 'bp-badge-endorsed';
      case 'Approved': return 'bp-badge-approved';
      case 'Rejected': return 'bp-badge-disapproved';
      default: return 'bp-badge-default';
    }
  };


  // ==========================================================
  // OPEN PROPOSAL
  // ==========================================================

  const openProposal = async (proposal) => {

    setSelectedProposal(proposal);
    await loadProposalHistory(proposal?.id);

    setSelectedSection('proposal-details');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  };


  // ==========================================================
  // STYLES
  // ==========================================================

  const styles = `

    * {
      box-sizing: border-box;
    }

    button,
    input,
    select,
    textarea {
      font-family: inherit;
    }

    .bp-page {
      width: 100%;
      min-height: 100%;
    }


    /* ========================================================
       COMMON
    ======================================================== */

    .bp-section-page {
      width: 100%;
    }

    .bp-screen-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }

    .bp-screen-toolbar-right {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }

    .bp-back-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      background: #ffffff;
      border: 1px solid #dbe3ee;
      border-radius: 6px;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .bp-back-button:hover {
      background: #f8fafc;
    }

    .bp-back-button svg {
      width: 14px;
      height: 14px;
    }

    .bp-screen-heading {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 15px 17px;
      margin-bottom: 14px;
    }

    .bp-screen-heading h2 {
      margin: 0;
      color: #10255c;
      font-size: 18px;
      font-weight: 850;
    }

    .bp-screen-heading p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }

    .bp-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 14px;
      min-width: 0;
    }

    .bp-panel + .bp-panel {
      margin-top: 14px;
    }

    .bp-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .bp-panel-title {
      margin: 0;
      color: #10255c;
      font-size: 13px;
      font-weight: 850;
      text-transform: uppercase;
    }

    .bp-panel-subtitle {
      margin: 3px 0 0;
      color: #64748b;
      font-size: 10px;
    }


    /* ========================================================
       TOP BAR
    ======================================================== */

    .bp-topbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .bp-year-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.05);
    }

    .bp-year-icon {
      width: 16px;
      height: 16px;
      color: #123b7a;
    }

    .bp-year-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }

    .bp-year-select {
      border: none;
      outline: none;
      background: transparent;
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }


    /* ========================================================
       MODULE GRID
    ======================================================== */

    .bp-grid {
      display: grid;
      grid-template-columns:
        repeat(12, minmax(0, 1fr));
      gap: 14px;
      width: 100%;
      min-height: calc(100vh - 255px);
      align-items: stretch;
    }

    .bp-grid .bp-card:nth-child(-n + 4) {
      grid-column: span 3;
    }

    .bp-grid .bp-card:nth-child(5),
    .bp-grid .bp-card:nth-child(6),
    .bp-grid .bp-card:nth-child(7) {
      grid-column: span 4;
    }


    /* ========================================================
       CARD
    ======================================================== */

    .bp-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      min-width: 0;
      width: 100%;
      min-height: 360px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.04);
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }

    .bp-card:hover {
      transform: translateY(-1px);
      box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.08);
    }

    .bp-card-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
    }

    .bp-card-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #ffffff;
    }

    .bp-card-icon svg {
      width: 23px;
      height: 23px;
    }

    .bp-icon-blue {
      background: #2563eb;
    }

    .bp-icon-green {
      background: #10a968;
    }

    .bp-icon-purple {
      background: #7138d5;
    }

    .bp-icon-orange {
      background: #f57c00;
    }

    .bp-icon-teal {
      background: #14a9aa;
    }

    .bp-icon-yellow {
      background: #f2ae00;
    }

    .bp-icon-red {
      background: #ed394b;
    }

    .bp-card-title-area {
      min-width: 0;
      flex: 1;
    }

    .bp-card-title {
      margin: 0 0 3px;
      color: #10255c;
      font-size: 14px;
      line-height: 1.25;
      font-weight: 800;
    }

    .bp-card-description {
      margin: 0;
      color: #64748b;
      font-size: 10.5px;
      line-height: 1.45;
    }


    /* ========================================================
       ACTIONS
    ======================================================== */

    .bp-actions {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 5px;
      margin-top: 8px;
    }

    .bp-action {
      min-height: 62px;
      background: #ffffff;
      border: 1px solid #dbe3ee;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 5px 3px;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        transform 0.15s ease;
    }

    .bp-action:hover {
      background: #f8fafc;
      border-color: #b8c7dc;
      transform: translateY(-1px);
    }

    .bp-action-icon {
      width: 18px;
      height: 18px;
      color: #0755b8;
    }

    .bp-action-label {
      color: #475569;
      font-size: 8.5px;
      line-height: 1.15;
      text-align: center;
      font-weight: 600;
    }


    /* ========================================================
       CARD BUTTON
    ======================================================== */

    .bp-card-features {
      margin: 18px 0 18px;
      padding: 14px 14px 14px 30px;
      background: #f8fafc;
      border: 1px solid #e8edf3;
      border-radius: 7px;
      color: #475569;
      font-size: 12px;
      line-height: 1.65;
      flex: 1;
    }

    .bp-card-features li {
      margin-bottom: 7px;
    }

    .bp-card-features li:last-child {
      margin-bottom: 0;
    }

    .bp-card-button {
      width: 100%;
      margin-top: auto;
      padding-top: 9px;
      padding-bottom: 9px;
      height: 31px;
      background: #ffffff;
      border: 1px solid #2563eb;
      border-radius: 4px;
      color: #2563eb;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
    }

    .bp-card-button:hover {
      background: #eff6ff;
    }

    .bp-card-button svg {
      width: 13px;
      height: 13px;
    }

    .bp-button-green {
      border-color: #10a968;
      color: #0b9158;
    }

    .bp-button-green:hover {
      background: #f0fdf4;
    }

    .bp-button-purple {
      border-color: #7138d5;
      color: #7138d5;
    }

    .bp-button-purple:hover {
      background: #faf5ff;
    }

    .bp-button-orange {
      border-color: #f57c00;
      color: #f57c00;
    }

    .bp-button-orange:hover {
      background: #fff7ed;
    }

    .bp-button-teal {
      border-color: #14a9aa;
      color: #079293;
    }

    .bp-button-teal:hover {
      background: #f0fdfa;
    }

    .bp-button-yellow {
      border-color: #e5a900;
      color: #d49400;
    }

    .bp-button-yellow:hover {
      background: #fffbeb;
    }

    .bp-button-red {
      border-color: #ed394b;
      color: #df2639;
    }

    .bp-button-red:hover {
      background: #fff1f2;
    }


    /* ========================================================
       OVERVIEW
    ======================================================== */

    .bp-overview-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .bp-overview-filter {
      display: flex;
      align-items: center;
      gap: 7px;
      background: #ffffff;
      border: 1px solid #dbe3ee;
      border-radius: 6px;
      height: 34px;
      padding: 0 9px;
    }

    .bp-overview-filter svg {
      width: 14px;
      height: 14px;
      color: #64748b;
    }

    .bp-overview-filter select {
      border: none;
      outline: none;
      background: transparent;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .bp-overview-heading {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 14px 16px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    .bp-overview-heading-title {
      margin: 0;
      color: #10255c;
      font-size: 15px;
      font-weight: 800;
    }

    .bp-overview-heading-text {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 10px;
    }

    .bp-overview-fy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 5px;
      background: #eff6ff;
      color: #174ea6;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }

    .bp-overview-fy svg {
      width: 14px;
      height: 14px;
    }


    /* ========================================================
       KPI
    ======================================================== */

    .bp-overview-kpis {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .bp-kpi {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 13px;
      min-width: 0;
    }

    .bp-kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .bp-kpi-label {
      color: #64748b;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .bp-kpi-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bp-kpi-icon svg {
      width: 16px;
      height: 16px;
    }

    .bp-kpi-blue {
      background: #eff6ff;
      color: #2563eb;
    }

    .bp-kpi-orange {
      background: #fff7ed;
      color: #f57c00;
    }

    .bp-kpi-green {
      background: #ecfdf5;
      color: #059669;
    }

    .bp-kpi-red {
      background: #fff1f2;
      color: #e11d48;
    }

    .bp-kpi-value {
      margin-top: 9px;
      color: #10255c;
      font-size: 21px;
      line-height: 1;
      font-weight: 900;
    }

    .bp-kpi-note {
      margin-top: 6px;
      color: #94a3b8;
      font-size: 8.5px;
    }


    /* ========================================================
       TWO COLUMN
    ======================================================== */

    .bp-overview-two-col {
      display: grid;
      grid-template-columns:
        minmax(0, 1.15fr)
        minmax(0, 0.85fr);
      gap: 14px;
      margin-bottom: 14px;
    }


    /* ========================================================
       STATUS
    ======================================================== */

    /* ========================================================
       COMPACT PROPOSAL STATUS CHART
       Replaces the old long horizontal bars with a compact
       donut + readable status list.
    ======================================================== */

    .bp-proposal-status-visual {
      display: grid;
      grid-template-columns: 148px minmax(0, 1fr);
      align-items: center;
      gap: 18px;
      min-height: 190px;
      padding: 10px 4px 8px;
    }

    .bp-proposal-status-donut {
      width: 136px;
      height: 136px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      position: relative;
      flex: 0 0 136px;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .04);
    }

    .bp-proposal-status-donut::before {
      content: '';
      position: absolute;
      inset: 16px;
      border-radius: 50%;
      background: #ffffff;
    }

    .bp-proposal-status-donut-hole {
      position: relative;
      z-index: 1;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }

    .bp-proposal-status-donut-hole strong {
      color: #10255c;
      font-size: 25px;
      line-height: 1;
      font-weight: 850;
    }

    .bp-proposal-status-donut-hole span {
      margin-top: 5px;
      color: #64748b;
      font-size: 10px;
      font-weight: 700;
    }

    .bp-proposal-status-list {
      min-width: 0;
      display: grid;
      gap: 7px;
    }

    .bp-proposal-status-item {
      min-height: 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 4px 7px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #edf2f7;
    }

    .bp-proposal-status-label {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #334155;
      font-size: 10.5px;
      font-weight: 700;
    }

    .bp-proposal-status-label > span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bp-proposal-status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex: 0 0 9px;
    }

    .bp-proposal-status-item > strong {
      color: #10255c;
      font-size: 11px;
      font-weight: 850;
      min-width: 18px;
      text-align: right;
    }


    .bp-status-pending {
      background: #f59e0b;
    }

    .bp-status-review {
      background: #3b82f6;
    }

    .bp-status-endorsed {
      background: #8b5cf6;
    }

    .bp-status-approved {
      background: #10b981;
    }

    .bp-status-returned {
      background: #f97316;
    }

    .bp-status-disapproved {
      background: #ef4444;
    }

    .bp-status-count {
      color: #10255c;
      font-size: 9px;
      font-weight: 800;
      text-align: right;
    }


    /* ========================================================
       FUND
    ======================================================== */

    .bp-fund-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .bp-fund-pill {
      border: 1px solid #dbe3ee;
      background: #ffffff;
      color: #64748b;
      border-radius: 5px;
      padding: 6px 9px;
      font-size: 8.5px;
      font-weight: 700;
      cursor: pointer;
    }

    .bp-fund-pill.active {
      background: #10255c;
      border-color: #10255c;
      color: #ffffff;
    }

    /* Compact fund-group visualization:
       keeps the reference section short so the whole dashboard row
       does not create a large empty area. */
    .bp-fund-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .bp-fund-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 4px 8px;
      min-width: 0;
      padding: 7px 8px;
      border: 1px solid #edf2f7;
      border-radius: 6px;
      background: #fafcff;
    }

    .bp-fund-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #334155;
      font-size: 9.5px;
      line-height: 1.2;
      font-weight: 750;
    }

    .bp-fund-value {
      color: #10255c;
      font-size: 9.5px;
      line-height: 1.2;
      font-weight: 850;
      text-align: right;
      white-space: nowrap;
    }

    .bp-fund-mini-bar {
      grid-column: 1 / -1;
      width: 100%;
      height: 5px;
      background: #eaf0f7;
      border-radius: 10px;
      overflow: hidden;
    }

    .bp-fund-mini-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 10px;
      min-width: 2px;
    }

    @media (max-width: 900px) {
      .bp-fund-list {
        grid-template-columns: 1fr;
      }
    }


    /* ========================================================
       TABLE
    ======================================================== */

    .bp-budget-table-wrap {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      overflow-y: visible;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .bp-budget-table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      table-layout: fixed;
    }

    .bp-budget-table th,
    .bp-budget-table td {
      box-sizing: border-box;
      overflow-wrap: anywhere;
      word-break: break-word;
      white-space: normal;
    }

    .bp-budget-table th {
      padding: 8px 6px;
      background: #f8fafc;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      font-size: 7.5px;
      line-height: 1.25;
      font-weight: 800;
      text-transform: uppercase;
      text-align: left;
      vertical-align: middle;
    }

    .bp-budget-table td {
      padding: 8px 6px;
      border-bottom: 1px solid #edf2f7;
      color: #475569;
      font-size: 8px;
      line-height: 1.35;
      vertical-align: middle;
    }

    .bp-budget-table tr:last-child td {
      border-bottom: none;
    }

    .bp-budget-table .amount {
      text-align: right;
      color: #10255c;
      font-weight: 800;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .bp-budget-table .bp-badge {
      max-width: 100%;
      white-space: normal;
      text-align: center;
      justify-content: center;
    }

    .bp-budget-table .bp-small-button {
      max-width: 100%;
      white-space: normal;
      min-width: 0;
    }

    .bp-total-row td {
      background: #f8fafc;
      color: #10255c;
      font-weight: 900;
    }

    /* Fixed, responsive widths for each database table.
       These keep every table inside the panel without a horizontal scrollbar. */
    .bp-table-summary th:nth-child(1), .bp-table-summary td:nth-child(1) { width: 32%; }
    .bp-table-summary th:nth-child(n+2), .bp-table-summary td:nth-child(n+2) { width: 17%; text-align: right; }

    .bp-table-recent th:nth-child(1), .bp-table-recent td:nth-child(1) { width: 14%; }
    .bp-table-recent th:nth-child(2), .bp-table-recent td:nth-child(2) { width: 13%; }
    .bp-table-recent th:nth-child(3), .bp-table-recent td:nth-child(3) { width: 21%; }
    .bp-table-recent th:nth-child(4), .bp-table-recent td:nth-child(4) { width: 14%; }
    .bp-table-recent th:nth-child(5), .bp-table-recent td:nth-child(5) { width: 13%; text-align: right; }
    .bp-table-recent th:nth-child(6), .bp-table-recent td:nth-child(6) { width: 13%; text-align: center; }
    .bp-table-recent th:nth-child(7), .bp-table-recent td:nth-child(7) { width: 12%; text-align: center; }

    .bp-table-records th:nth-child(1), .bp-table-records td:nth-child(1) { width: 10%; }
    .bp-table-records th:nth-child(2), .bp-table-records td:nth-child(2) { width: 10%; }
    .bp-table-records th:nth-child(3), .bp-table-records td:nth-child(3) { width: 10%; }
    .bp-table-records th:nth-child(4), .bp-table-records td:nth-child(4) { width: 8%; }
    .bp-table-records th:nth-child(5), .bp-table-records td:nth-child(5) { width: 12%; }
    .bp-table-records th:nth-child(6), .bp-table-records td:nth-child(6) { width: 8%; }
    .bp-table-records th:nth-child(7), .bp-table-records td:nth-child(7) { width: 14%; }
    .bp-table-records th:nth-child(8), .bp-table-records td:nth-child(8) { width: 10%; text-align: right; }
    .bp-table-records th:nth-child(9), .bp-table-records td:nth-child(9) { width: 9%; text-align: center; }
    .bp-table-records th:nth-child(10), .bp-table-records td:nth-child(10) { width: 9%; text-align: center; }

    .bp-table-review th:nth-child(1), .bp-table-review td:nth-child(1) { width: 16%; }
    .bp-table-review th:nth-child(2), .bp-table-review td:nth-child(2) { width: 24%; }
    .bp-table-review th:nth-child(3), .bp-table-review td:nth-child(3) { width: 21%; }
    .bp-table-review th:nth-child(4), .bp-table-review td:nth-child(4) { width: 15%; text-align: right; }
    .bp-table-review th:nth-child(5), .bp-table-review td:nth-child(5) { width: 13%; text-align: center; }
    .bp-table-review th:nth-child(6), .bp-table-review td:nth-child(6) { width: 11%; text-align: center; }

    .bp-table-workflow th:nth-child(1), .bp-table-workflow td:nth-child(1) { width: 20%; }
    .bp-table-workflow th:nth-child(2), .bp-table-workflow td:nth-child(2) { width: 30%; }
    .bp-table-workflow th:nth-child(3), .bp-table-workflow td:nth-child(3) { width: 17%; text-align: right; }
    .bp-table-workflow th:nth-child(4), .bp-table-workflow td:nth-child(4) { width: 18%; text-align: center; }
    .bp-table-workflow th:nth-child(5), .bp-table-workflow td:nth-child(5) { width: 15%; text-align: center; }

    .bp-table-history th:nth-child(1), .bp-table-history td:nth-child(1) { width: 12%; }
    .bp-table-history th:nth-child(2), .bp-table-history td:nth-child(2) { width: 16%; }
    .bp-table-history th:nth-child(3), .bp-table-history td:nth-child(3) { width: 16%; }
    .bp-table-history th:nth-child(4), .bp-table-history td:nth-child(4) { width: 13%; text-align: center; }
    .bp-table-history th:nth-child(5), .bp-table-history td:nth-child(5) { width: 25%; }
    .bp-table-history th:nth-child(6), .bp-table-history td:nth-child(6) { width: 18%; }

    .bp-table-report th:nth-child(1), .bp-table-report td:nth-child(1) { width: 10%; }
    .bp-table-report th:nth-child(2), .bp-table-report td:nth-child(2) { width: 10%; }
    .bp-table-report th:nth-child(3), .bp-table-report td:nth-child(3) { width: 10%; }
    .bp-table-report th:nth-child(4), .bp-table-report td:nth-child(4) { width: 8%; }
    .bp-table-report th:nth-child(5), .bp-table-report td:nth-child(5) { width: 12%; }
    .bp-table-report th:nth-child(6), .bp-table-report td:nth-child(6) { width: 11%; text-align: right; }
    .bp-table-report th:nth-child(7), .bp-table-report td:nth-child(7) { width: 9%; text-align: center; }
    .bp-table-report th:nth-child(8), .bp-table-report td:nth-child(8) { width: 10%; }
    .bp-table-report th:nth-child(9), .bp-table-report td:nth-child(9) { width: 7%; text-align: center; }
    .bp-table-report th:nth-child(10), .bp-table-report td:nth-child(10) { width: 7%; text-align: right; }
    .bp-table-report th:nth-child(11), .bp-table-report td:nth-child(11) { width: 6%; text-align: right; }

    @media (max-width: 1100px) {
      .bp-budget-table th { font-size: 7px; padding: 7px 5px; }
      .bp-budget-table td { font-size: 7.5px; padding: 7px 5px; }
      .bp-small-button { font-size: 8px; padding: 0 7px; }
    }

    @media (max-width: 800px) {
      .bp-budget-table th { font-size: 6.5px; padding: 6px 4px; }
      .bp-budget-table td { font-size: 7px; padding: 6px 4px; }
      .bp-pagination { font-size: 9px; }
      .bp-page-button { min-width: 25px; height: 25px; padding: 0 6px; }
    }

    /* ========================================================
       BADGES
    ======================================================== */

    .bp-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 7px;
      border-radius: 20px;
      font-size: 7.5px;
      font-weight: 800;
      white-space: nowrap;
    }

    .bp-badge-pending {
      background: #fff7ed;
      color: #c2410c;
    }

    .bp-badge-review {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .bp-badge-endorsed {
      background: #f5f3ff;
      color: #6d28d9;
    }

    .bp-badge-approved {
      background: #ecfdf5;
      color: #047857;
    }

    .bp-badge-returned {
      background: #fff7ed;
      color: #c2410c;
    }

    .bp-badge-disapproved {
      background: #fff1f2;
      color: #be123c;
    }

    .bp-badge-default {
      background: #f1f5f9;
      color: #475569;
    }


    /* ========================================================
       TOOLBAR / SEARCH
    ======================================================== */

    .bp-proposal-tools {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }

    .bp-search {
      height: 31px;
      width: 220px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 9px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
    }

    .bp-search svg {
      width: 14px;
      height: 14px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .bp-search input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 9px;
      color: #334155;
      background: transparent;
    }

    .bp-filter-select {
      height: 31px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      font-size: 9px;
      padding: 0 8px;
      outline: none;
      cursor: pointer;
    }

    .bp-small-button {
      height: 31px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 0 10px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
    }

    .bp-small-button:hover {
      background: #f8fafc;
    }

    .bp-small-button svg {
      width: 13px;
      height: 13px;
    }


    /* ========================================================
       EMPTY
    ======================================================== */

    .bp-pagination {
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      margin-top:10px; padding:8px 2px 2px; font-size:10px; color:#64748b; flex-wrap:wrap;
    }
    .bp-pagination-controls { display:flex; align-items:center; gap:4px; }
    .bp-page-button { min-width:27px; height:27px; padding:0 7px; border:1px solid #dbe3ee; border-radius:5px; background:#fff; color:#334155; font-size:10px; font-weight:700; cursor:pointer; }
    .bp-page-button:hover:not(:disabled) { background:#f1f5f9; }
    .bp-page-button.active { background:#0f4cbd; color:#fff; border-color:#0f4cbd; }
    .bp-page-button:disabled { opacity:.45; cursor:not-allowed; }

    .bp-empty {
      border: 1px dashed #dbe3ee;
      border-radius: 6px;
      min-height: 110px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      gap: 5px;
      padding: 20px;
    }

    .bp-empty svg {
      width: 24px;
      height: 24px;
    }

    .bp-empty-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }

    .bp-empty-text {
      font-size: 9px;
      text-align: center;
      line-height: 1.5;
    }


    @media (max-width: 900px) {
      .bp-workflow {
        overflow-x: auto;
        padding-bottom: 12px;
      }

      .bp-workflow-step {
        flex: 0 0 145px;
        border-radius: 0 !important;
      }
    }

    @media (max-width: 600px) {
      .bp-workflow-step {
        flex-basis: 135px;
      }
    }

    /* ========================================================
       FORM
    ======================================================== */

    .bp-form-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .bp-form-grid-three {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .bp-form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .bp-form-group.full {
      grid-column: 1 / -1;
    }

    .bp-form-label {
      color: #334155;
      font-size: 9px;
      font-weight: 800;
    }

    .bp-form-label span {
      color: #dc2626;
    }

    .bp-form-input,
    .bp-form-select,
    .bp-form-textarea {
      width: 100%;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
      color: #334155;
      font-size: 9px;
      padding: 8px 9px;
      outline: none;
    }

    .bp-form-input,
    .bp-form-select {
      height: 34px;
    }

    .bp-form-textarea {
      min-height: 75px;
      resize: vertical;
    }

    .bp-form-input:focus,
    .bp-form-select:focus,
    .bp-form-textarea:focus {
      border-color: #2563eb;
      box-shadow:
        0 0 0 2px rgba(37, 99, 235, 0.08);
    }

    .bp-form-help {
      color: #94a3b8;
      font-size: 7.5px;
      line-height: 1.4;
    }

    .bp-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #edf2f7;
    }

    .bp-primary-button {
      height: 34px;
      padding: 0 14px;
      border: 1px solid #2563eb;
      border-radius: 5px;
      background: #2563eb;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    .bp-primary-button:hover {
      background: #1d4ed8;
    }

    .bp-secondary-button {
      height: 34px;
      padding: 0 14px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      font-size: 9px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    .bp-secondary-button:hover {
      background: #f8fafc;
    }

    .bp-primary-button svg,
    .bp-secondary-button svg {
      width: 13px;
      height: 13px;
    }

    .bp-success-message {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 12px;
      padding: 9px 11px;
      border: 1px solid #bbf7d0;
      border-radius: 5px;
      background: #f0fdf4;
      color: #166534;
      font-size: 9px;
      font-weight: 700;
    }

    .bp-success-message svg {
      width: 15px;
      height: 15px;
    }


    /* ========================================================
       FORM INFO CARDS
    ======================================================== */

    .bp-info-grid {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 9px;
      margin-bottom: 14px;
    }

    .bp-rate-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 9px;
      margin-top: 9px;
    }

    .bp-info-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }

    .bp-info-label {
      color: #94a3b8;
      font-size: 7.5px;
      text-transform: uppercase;
      font-weight: 800;
    }

    .bp-info-value {
      margin-top: 4px;
      color: #10255c;
      font-size: 11px;
      font-weight: 900;
    }


    /* ========================================================
       DETAIL
    ======================================================== */

    .bp-detail-grid {
      display: grid;
      grid-template-columns:
        minmax(0, 1.35fr)
        minmax(280px, 0.65fr);
      gap: 14px;
    }

    .bp-detail-list {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .bp-detail-item {
      padding: 9px;
      border: 1px solid #edf2f7;
      border-radius: 5px;
      background: #fafcff;
    }

    .bp-detail-item.full {
      grid-column: 1 / -1;
    }

    .bp-detail-label {
      color: #94a3b8;
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .bp-detail-value {
      margin-top: 4px;
      color: #334155;
      font-size: 9px;
      font-weight: 700;
      line-height: 1.5;
    }

    .bp-detail-amount {
      color: #10255c;
      font-size: 19px;
      font-weight: 900;
    }


    /* ========================================================
       REVIEW
    ======================================================== */

    .bp-review-layout {
      display: grid;
      grid-template-columns:
        minmax(0, 1.3fr)
        minmax(270px, 0.7fr);
      gap: 14px;
    }

    .bp-review-item {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      padding: 10px;
      border: 1px solid #edf2f7;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .bp-review-icon {
      width: 29px;
      height: 29px;
      border-radius: 7px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bp-review-icon svg {
      width: 15px;
      height: 15px;
    }

    .bp-review-label {
      color: #94a3b8;
      font-size: 7.5px;
      text-transform: uppercase;
      font-weight: 800;
    }

    .bp-review-value {
      margin-top: 3px;
      color: #334155;
      font-size: 9px;
      font-weight: 700;
    }

    .bp-review-actions {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .bp-review-action {
      width: 100%;
      min-height: 36px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px;
      background: #ffffff;
      font-size: 9px;
      font-weight: 800;
      cursor: pointer;
    }

    .bp-review-action svg {
      width: 14px;
      height: 14px;
    }

    .bp-review-action.endorse {
      border: 1px solid #10b981;
      color: #047857;
    }

    .bp-review-action.return {
      border: 1px solid #f97316;
      color: #c2410c;
    }

    .bp-review-action.neutral {
      border: 1px solid #dbe3ee;
      color: #475569;
    }

    .bp-review-action:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }

    .bp-review-action:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .bp-card-button, .bp-action, .bp-small-button, .bp-primary-button, .bp-secondary-button {
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }

    .bp-card-button:hover, .bp-primary-button:hover, .bp-secondary-button:hover, .bp-small-button:hover {
      transform: translateY(-1px);
    }

    .bp-review-textarea {
      width: 100%;
      min-height: 80px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      padding: 8px;
      font-size: 9px;
      resize: vertical;
      outline: none;
    }


    /* ========================================================
       WORKFLOW
    ======================================================== */

    .bp-workflow {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      width: 100%;
      gap: 0;
      overflow: visible;
      padding: 8px 2px 14px;
    }

    .bp-workflow-step {
      min-width: 0;
      flex: 1 1 0;
      position: relative;
      padding: 16px 10px;
      border: 1px solid #dbe3ee;
      background: #ffffff;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 92px;
    }

    .bp-workflow-step:first-child {
      border-radius: 6px 0 0 6px;
    }

    .bp-workflow-step:last-child {
      border-radius: 0 6px 6px 0;
    }

    .bp-workflow-step.active {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .bp-workflow-number {
      width: 29px;
      height: 29px;
      margin: 0 auto 7px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 900;
    }

    .bp-workflow-step.active .bp-workflow-number {
      background: #2563eb;
      color: #ffffff;
    }

    .bp-workflow-title {
      color: #334155;
      font-size: 8.5px;
      font-weight: 850;
    }

    .bp-workflow-subtitle {
      margin-top: 3px;
      color: #94a3b8;
      font-size: 7px;
    }

    .bp-workflow-arrow {
      width: 28px;
      min-width: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      flex-shrink: 0;
      background: #ffffff;
    }

    .bp-workflow-arrow svg {
      width: 16px;
      height: 16px;
    }


    /* ========================================================
       HISTORY
    ======================================================== */

    .bp-history {
      position: relative;
      padding-left: 20px;
    }

    .bp-history::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 5px;
      bottom: 5px;
      width: 1px;
      background: #dbe3ee;
    }

    .bp-history-item {
      position: relative;
      padding: 0 0 16px 12px;
    }

    .bp-history-dot {
      position: absolute;
      left: -19px;
      top: 2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #2563eb;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 1px #bfdbfe;
    }

    .bp-history-date {
      color: #94a3b8;
      font-size: 7.5px;
      font-weight: 700;
    }

    .bp-history-title {
      margin-top: 3px;
      color: #334155;
      font-size: 9px;
      font-weight: 850;
    }

    .bp-history-description {
      margin-top: 3px;
      color: #64748b;
      font-size: 8px;
      line-height: 1.45;
    }

    .bp-history-user {
      margin-top: 4px;
      color: #94a3b8;
      font-size: 7.5px;
    }


    /* ========================================================
       REPORTS
    ======================================================== */

    .bp-report-layout {
      display: grid;
      grid-template-columns:
        260px
        minmax(0, 1fr);
      gap: 14px;
    }

    .bp-report-menu {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bp-report-menu-button {
      width: 100%;
      min-height: 39px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      border: 1px solid #dbe3ee;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      font-size: 9px;
      font-weight: 750;
      text-align: left;
      cursor: pointer;
    }

    .bp-report-menu-button:hover,
    .bp-report-menu-button.active {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #174ea6;
    }

    .bp-report-menu-button svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    .bp-report-filters {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 9px;
      margin-bottom: 14px;
    }

    .bp-report-preview {
      border: 1px solid #dbe3ee;
      border-radius: 6px;
      overflow: hidden;
    }

    .bp-report-preview-header {
      padding: 13px;
      background: #f8fafc;
      border-bottom: 1px solid #dbe3ee;
      text-align: center;
    }

    .bp-report-preview-logo {
      display: block;
      width: 58px;
      height: 58px;
      object-fit: contain;
      margin: 0 auto 7px;
    }

    .bp-report-preview-header strong {
      display: block;
      color: #10255c;
      font-size: 11px;
    }

    .bp-report-preview-header span {
      display: block;
      margin-top: 3px;
      color: #64748b;
      font-size: 8px;
    }

    .bp-report-summary {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 8px;
      padding: 10px;
      background: #ffffff;
    }

    .bp-report-summary-card {
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 9px;
      text-align: center;
    }

    .bp-report-summary-card span {
      display: block;
      color: #94a3b8;
      font-size: 7px;
      text-transform: uppercase;
      font-weight: 800;
    }

    .bp-report-summary-card strong {
      display: block;
      margin-top: 4px;
      color: #10255c;
      font-size: 13px;
      font-weight: 900;
    }

    .bp-report-actions {
      display: flex;
      justify-content: flex-end;
      gap: 7px;
      padding: 10px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }


    /* ========================================================
       NOTICE
    ======================================================== */

    .bp-system-note {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      padding: 9px 10px;
      margin-bottom: 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 5px;
      color: #92400e;
      font-size: 8px;
      line-height: 1.5;
    }

    .bp-system-note svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }


    /* ========================================================
       RESPONSIVE
    ======================================================== */

    @media (max-width: 1200px) {

      .bp-grid {
        min-height: auto;
      }

      .bp-card {
        min-height: 300px;
      }

      .bp-grid {
        grid-template-columns:
          repeat(6, minmax(0, 1fr));
      }

      .bp-grid .bp-card:nth-child(-n + 4) {
        grid-column: span 3;
      }

      .bp-grid .bp-card:nth-child(5),
      .bp-grid .bp-card:nth-child(6),
      .bp-grid .bp-card:nth-child(7) {
        grid-column: span 2;
      }

      .bp-overview-kpis {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .bp-detail-grid,
      .bp-review-layout {
        grid-template-columns: 1fr;
      }

      .bp-report-layout {
        grid-template-columns: 220px minmax(0, 1fr);
      }

    }


    @media (max-width: 900px) {

      .bp-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .bp-grid .bp-card:nth-child(-n + 4),
      .bp-grid .bp-card:nth-child(5),
      .bp-grid .bp-card:nth-child(6),
      .bp-grid .bp-card:nth-child(7) {
        grid-column: span 1;
      }

      .bp-overview-two-col {
        grid-template-columns: 1fr;
      }

      .bp-form-grid-three {
        grid-template-columns: 1fr;
      }

      .bp-info-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .bp-report-layout {
        grid-template-columns: 1fr;
      }

    }


    @media (max-width: 700px) {

      .bp-grid {
        grid-template-columns: 1fr;
      }

      .bp-grid .bp-card:nth-child(-n + 4),
      .bp-grid .bp-card:nth-child(5),
      .bp-grid .bp-card:nth-child(6),
      .bp-grid .bp-card:nth-child(7) {
        grid-column: span 1;
      }

      .bp-overview-kpis {
        grid-template-columns: 1fr;
      }

      .bp-overview-toolbar,
      .bp-screen-toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .bp-overview-filter {
        width: 100%;
      }

      .bp-overview-filter select {
        width: 100%;
      }

      .bp-overview-heading {
        align-items: flex-start;
        flex-direction: column;
      }

      .bp-form-grid,
      .bp-detail-list {
        grid-template-columns: 1fr;
      }

      .bp-info-grid {
        grid-template-columns: 1fr;
      }

      .bp-report-filters,
      .bp-report-summary {
        grid-template-columns: 1fr 1fr;
      }

      .bp-proposal-tools {
        width: 100%;
      }

      .bp-search {
        width: 100%;
      }

      .bp-screen-toolbar-right {
        width: 100%;
      }

    }


    /* ========================================================
       REDESIGNED BUDGET PROPOSALS DASHBOARD
       UI-only layer. Existing navigation, API calls, forms,
       workflow and database actions remain unchanged.
    ======================================================== */

    .bp-dashboard-page {
      width: 100%;
      min-width: 0;
      padding-bottom: 18px;
    }

    .bp-dashboard-system-area {
      display: grid;
      gap: 8px;
      margin-bottom: 10px;
    }

    .bp-dashboard-note-error,
    .bp-dashboard-note-loading {
      margin: 0;
      border-radius: 10px;
    }

    .bp-dashboard-toolbar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 12px;
    }

    .bp-dashboard-year-selector {
      height: 36px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px;
      background: #ffffff;
      border: 1px solid #dbe4f0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      color: #334155;
      font-size: 10px;
      font-weight: 700;
    }

    .bp-dashboard-year-selector > svg:first-child {
      width: 14px;
      height: 14px;
      color: #123b7a;
    }

    .bp-dashboard-year-selector > svg:last-child {
      width: 13px;
      height: 13px;
      color: #64748b;
      pointer-events: none;
      margin-left: -2px;
    }

    .bp-dashboard-year-selector select {
      appearance: none;
      border: 0;
      outline: 0;
      background: transparent;
      padding: 0 1px;
      color: #0f172a;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
    }

    .bp-dashboard-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .bp-dashboard-summary-card {
      min-width: 0;
      min-height: 92px;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      background: #ffffff;
      padding: 13px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: left;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.035);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }

    .bp-dashboard-summary-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
    }

    .bp-dashboard-summary-card::after {
      content: '';
      position: absolute;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      right: -25px;
      top: -22px;
      opacity: .12;
    }

    .summary-blue::after { background: #2563eb; }
    .summary-green::after { background: #10a968; }
    .summary-orange::after { background: #f59e0b; }
    .summary-red::after { background: #ef4444; }

    .bp-summary-icon {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      flex: 0 0 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .summary-blue .bp-summary-icon { background: #2563eb; }
    .summary-green .bp-summary-icon { background: #10a968; }
    .summary-orange .bp-summary-icon { background: #f59e0b; }
    .summary-red .bp-summary-icon { background: #ef4444; }

    .bp-summary-icon svg {
      width: 22px;
      height: 22px;
    }

    .bp-summary-content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .bp-summary-label {
      color: #64748b;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .03em;
    }

    .bp-summary-content strong {
      margin: 4px 0 2px;
      color: #10255c;
      font-size: 22px;
      line-height: 1;
      font-weight: 850;
    }

    .bp-summary-content > span:last-child {
      color: #94a3b8;
      font-size: 8px;
      white-space: nowrap;
    }

    .bp-summary-arrow {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      flex: 0 0 30px;
    }

    .summary-blue .bp-summary-arrow { color: #2563eb; background: #eaf2ff; }
    .summary-green .bp-summary-arrow { color: #10a968; background: #e8f8f0; }
    .summary-orange .bp-summary-arrow { color: #f59e0b; background: #fff3df; }
    .summary-red .bp-summary-arrow { color: #ef4444; background: #fee7e7; }

    .bp-summary-arrow svg {
      width: 15px;
      height: 15px;
    }

    .bp-dashboard-hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(340px, .95fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .bp-dashboard-hero-card,
    .bp-dashboard-status-card,
    .bp-dashboard-recent-card {
      background: #ffffff;
      border: 1px solid #e1e8f2;
      border-radius: 10px;
      box-shadow: 0 2px 9px rgba(15, 23, 42, 0.035);
    }

    .bp-dashboard-hero-card {
      min-height: 235px;
      padding: 20px 22px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      background:
        radial-gradient(circle at 84% 42%, rgba(99, 102, 241, .13), transparent 31%),
        linear-gradient(115deg, #ffffff 0%, #fbfcff 64%, #f3f5ff 100%);
    }

    .bp-dashboard-hero-copy {
      width: 59%;
      position: relative;
      z-index: 2;
    }

    .bp-dashboard-eyebrow {
      color: #315bdc;
      font-size: 9px;
      font-weight: 850;
      letter-spacing: .04em;
    }

    .bp-dashboard-hero-copy h1 {
      margin: 5px 0 8px;
      color: #10255c;
      font-size: 23px;
      line-height: 1.05;
      font-weight: 850;
      letter-spacing: -.02em;
    }

    .bp-dashboard-hero-copy p {
      max-width: 470px;
      margin: 0 0 13px;
      color: #64748b;
      font-size: 9.5px;
      line-height: 1.55;
    }

    .bp-dashboard-primary-button {
      height: 34px;
      padding: 0 15px;
      border: 0;
      border-radius: 7px;
      background: linear-gradient(135deg, #4633ff, #5b3df1);
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      box-shadow: 0 5px 13px rgba(79, 70, 229, .22);
    }

    .bp-dashboard-primary-button svg {
      width: 14px;
      height: 14px;
    }

    .bp-dashboard-hero-art {
      position: absolute;
      right: 4%;
      top: 50%;
      width: 255px;
      height: 205px;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .bp-hero-orbit {
      position: absolute;
      border-radius: 50%;
      background: rgba(99, 102, 241, .10);
    }

    .orbit-one {
      width: 175px;
      height: 175px;
      right: 26px;
      top: 11px;
    }

    .orbit-two {
      width: 118px;
      height: 118px;
      right: 55px;
      top: 40px;
      border: 1px solid rgba(99, 102, 241, .16);
      background: rgba(255,255,255,.3);
    }

    .bp-hero-document {
      position: absolute;
      right: 68px;
      top: 19px;
      width: 115px;
      height: 156px;
      border: 6px solid #8ca0ff;
      border-radius: 7px;
      background: #ffffff;
      transform: rotate(-1deg);
      box-shadow: 0 11px 20px rgba(53, 70, 173, .18);
      color: #5c70ec;
      padding: 13px 11px;
    }

    .bp-hero-document > svg {
      width: 27px;
      height: 27px;
      margin-bottom: 6px;
    }

    .bp-hero-lines {
      display: grid;
      gap: 4px;
    }

    .bp-hero-lines span {
      height: 4px;
      border-radius: 4px;
      background: #d9e0ff;
    }

    .bp-hero-lines span:nth-child(1) { width: 75%; }
    .bp-hero-lines span:nth-child(2) { width: 90%; }
    .bp-hero-lines span:nth-child(3) { width: 62%; }
    .bp-hero-lines span:nth-child(4) { width: 82%; }

    .bp-hero-chart {
      display: flex;
      align-items: flex-end;
      gap: 5px;
      height: 37px;
      margin-top: 11px;
      padding: 5px 8px;
      background: #f0f3ff;
      border-radius: 5px;
    }

    .bp-hero-chart i {
      width: 10px;
      border-radius: 2px 2px 0 0;
      background: #6678ef;
    }

    .bp-hero-chart i:nth-child(1) { height: 12px; }
    .bp-hero-chart i:nth-child(2) { height: 20px; }
    .bp-hero-chart i:nth-child(3) { height: 27px; }
    .bp-hero-chart i:nth-child(4) { height: 17px; }

    .bp-hero-check {
      position: absolute;
      right: -15px;
      bottom: 12px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #6c7cf0;
      border: 4px solid #ffffff;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 7px 14px rgba(61, 73, 175, .25);
    }

    .bp-hero-check svg {
      width: 22px;
      height: 22px;
    }

    .bp-dashboard-status-card {
      padding: 15px 16px;
      min-height: 235px;
    }

    .bp-dashboard-status-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .bp-dashboard-status-header h2,
    .bp-dashboard-recent-header h2,
    .bp-dashboard-section-heading h2 {
      margin: 0;
      color: #10255c;
      font-size: 11px;
      font-weight: 850;
    }

    .bp-dashboard-status-header p,
    .bp-dashboard-recent-header p,
    .bp-dashboard-section-heading p {
      margin: 3px 0 0;
      color: #64748b;
      font-size: 8.5px;
    }

    .bp-mini-year {
      height: 29px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid #dbe4f0;
      border-radius: 6px;
      padding: 0 6px;
      background: #ffffff;
      color: #64748b;
    }

    .bp-mini-year svg {
      width: 12px;
      height: 12px;
    }

    .bp-mini-year svg:last-child {
      pointer-events: none;
    }

    .bp-mini-year select {
      appearance: none;
      border: 0;
      outline: 0;
      background: transparent;
      font-size: 8.5px;
      font-weight: 800;
      color: #334155;
    }

    .bp-status-chart-area {
      min-height: 176px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding-top: 4px;
    }

    .bp-donut {
      width: 132px;
      height: 132px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      flex: 0 0 132px;
      position: relative;
    }

    .bp-donut::before {
      content: '';
      position: absolute;
      inset: 17px;
      border-radius: 50%;
      background: #ffffff;
    }

    .bp-donut-center {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1;
    }

    .bp-donut-center strong {
      color: #10255c;
      font-size: 22px;
      font-weight: 850;
    }

    .bp-donut-center span {
      margin-top: 4px;
      color: #64748b;
      font-size: 8px;
    }

    .bp-status-legend {
      min-width: 0;
      flex: 1;
      display: grid;
      gap: 12px;
    }

    .bp-status-legend-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      color: #334155;
      font-size: 8.5px;
    }

    .bp-status-legend-row span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .bp-status-legend-row strong {
      color: #334155;
      font-size: 8px;
      white-space: nowrap;
    }

    .legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
      flex: 0 0 9px;
    }

    .dot-green { background: #10a968; }
    .dot-orange { background: #f59e0b; }
    .dot-red { background: #ef4444; }

    .bp-dashboard-section-heading {
      margin: 3px 0 7px;
    }

    .bp-dashboard-module-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .bp-dashboard-module-card {
      min-width: 0;
      min-height: 105px;
      position: relative;
      overflow: hidden;
      padding: 12px;
      border: 1px solid #e1e8f2;
      border-radius: 9px;
      background: #ffffff;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: auto 27px;
      column-gap: 9px;
      row-gap: 7px;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(15, 23, 42, .03);
      transition: transform .15s ease, box-shadow .15s ease;
    }

    .bp-dashboard-module-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(15, 23, 42, .07);
    }

    .bp-module-icon {
      width: 39px;
      height: 39px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      grid-row: 1;
    }

    .module-blue .bp-module-icon { background: #2563eb; }
    .module-green .bp-module-icon { background: #10a968; }
    .module-purple .bp-module-icon { background: #7138d5; }
    .module-orange .bp-module-icon { background: #f57c00; }

    .bp-module-icon svg {
      width: 20px;
      height: 20px;
    }

    .bp-module-copy {
      min-width: 0;
    }

    .bp-module-copy h3 {
      margin: 1px 0 4px;
      color: #10255c;
      font-size: 12px;
      font-weight: 850;
    }

    .bp-module-copy p {
      margin: 0;
      color: #64748b;
      font-size: 10px;
      line-height: 1.4;
    }

    .bp-module-action {
      grid-column: 1 / -1;
      height: 27px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 800;
    }

    .module-blue .bp-module-action { color: #2563eb; background: #edf4ff; }
    .module-green .bp-module-action { color: #10a968; background: #ebf9f2; }
    .module-purple .bp-module-action { color: #7138d5; background: #f3edff; }
    .module-orange .bp-module-action { color: #f57c00; background: #fff3e7; }

    .bp-module-action svg {
      width: 12px;
      height: 12px;
    }

    .bp-dashboard-recent-card {
      overflow: hidden;
    }

    .bp-dashboard-recent-header {
      padding: 12px 13px 9px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }

    .bp-recent-tools {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }

    .bp-recent-search {
      width: 250px;
      height: 31px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      border: 1px solid #dbe4f0;
      border-radius: 6px;
      background: #ffffff;
    }

    .bp-recent-search svg {
      width: 13px;
      height: 13px;
      color: #94a3b8;
      flex: 0 0 13px;
    }

    .bp-recent-search input {
      width: 100%;
      border: 0;
      outline: 0;
      color: #334155;
      font-size: 10px;
      background: transparent;
    }

    .bp-recent-search input::placeholder {
      color: #94a3b8;
    }

    .bp-recent-filter {
      height: 31px;
      border: 1px solid #dbe4f0;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      padding: 0 8px;
      font-size: 10px;
      font-weight: 700;
      outline: 0;
    }

    .bp-view-all-button {
      height: 31px;
      border: 0;
      background: transparent;
      color: #3b6eea;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
    }

    .bp-view-all-button svg {
      width: 12px;
      height: 12px;
    }

    .bp-dashboard-table-wrap {
      width: 100%;
      overflow-x: auto;
      border-top: 1px solid #eef2f7;
    }

    .bp-dashboard-table {
      width: 100%;
      min-width: 900px;
      border-collapse: collapse;
      table-layout: auto;
    }

    .bp-dashboard-table th {
      padding: 8px 9px;
      background: #f8fafc;
      color: #52627a;
      border-bottom: 1px solid #e7edf5;
      font-size: 10px;
      font-weight: 850;
      text-align: left;
      white-space: nowrap;
    }

    .bp-dashboard-table td {
      padding: 8px 9px;
      color: #52627a;
      border-bottom: 1px solid #edf1f6;
      font-size: 10px;
      vertical-align: middle;
      white-space: nowrap;
    }

    .bp-dashboard-table tbody tr:hover {
      background: #fbfdff;
    }

    /* Readability improvements for the dashboard only */
    .bp-dashboard-section-heading h2 {
      font-size: 14px;
      font-weight: 850;
      color: #10255c;
      margin: 0;
    }

    .bp-dashboard-section-heading p {
      font-size: 10px;
      color: #64748b;
      margin: 3px 0 0;
    }

    .bp-dashboard-status-pill {
      font-size: 9px !important;
      padding: 4px 7px !important;
    }

    .bp-table-reference {
      color: #1d3d78 !important;
      font-weight: 850;
    }

    .bp-table-title {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bp-table-amount {
      color: #243b6b !important;
      font-weight: 800;
    }

    .bp-dashboard-status-pill {
      display: inline-flex;
      align-items: center;
      min-height: 19px;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 7px;
      font-weight: 800;
    }

    .bp-dashboard-status-pill.bp-badge-approved {
      color: #087a4d;
      background: #dff7ea;
    }

    .bp-dashboard-status-pill.bp-badge-review {
      color: #a05d00;
      background: #fff0d6;
    }

    .bp-dashboard-status-pill.bp-badge-disapproved {
      color: #b42318;
      background: #fee2e2;
    }

    .bp-dashboard-status-pill.bp-badge-pending,
    .bp-dashboard-status-pill.bp-badge-default {
      color: #52627a;
      background: #eef2f7;
    }

    .bp-dashboard-status-pill.bp-badge-returned {
      color: #9f3f20;
      background: #ffeadf;
    }

    .bp-dashboard-status-pill.bp-badge-endorsed {
      color: #5f35b5;
      background: #eee7ff;
    }

    .bp-table-view-button {
      height: 23px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 7px;
      border: 1px solid #dce4ee;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      font-size: 7px;
      font-weight: 800;
      cursor: pointer;
    }

    .bp-table-view-button:hover {
      border-color: #b8c8df;
      color: #1d4ed8;
      background: #f8fbff;
    }

    .bp-table-view-button svg {
      width: 11px;
      height: 11px;
    }

    .bp-dashboard-empty-row {
      text-align: center !important;
      padding: 28px 12px !important;
      color: #94a3b8 !important;
    }

    .bp-dashboard-recent-footer {
      min-height: 43px;
      padding: 7px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: #64748b;
      font-size: 7.5px;
    }

    .bp-dashboard-recent-pagination {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .bp-dashboard-recent-pagination button {
      width: 25px;
      height: 25px;
      border: 1px solid #dce4ee;
      border-radius: 5px;
      background: #ffffff;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      cursor: pointer;
    }

    .bp-dashboard-recent-pagination button.active {
      color: #ffffff;
      border-color: #2563eb;
      background: #2563eb;
      font-weight: 800;
    }

    .bp-dashboard-recent-pagination button:disabled {
      opacity: .45;
      cursor: default;
    }

    .bp-dashboard-recent-pagination svg {
      width: 11px;
      height: 11px;
    }

    @media (max-width: 1100px) {
      .bp-dashboard-summary-grid,
      .bp-dashboard-module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .bp-dashboard-hero-grid {
        grid-template-columns: 1fr;
      }

      .bp-dashboard-hero-card {
        min-height: 235px;
      }
    }

    @media (max-width: 760px) {
      .bp-proposal-status-visual {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 12px;
      }

      .bp-proposal-status-list {
        width: 100%;
      }

      .bp-dashboard-summary-grid,
      .bp-dashboard-module-grid {
        grid-template-columns: 1fr;
      }

      .bp-dashboard-hero-copy {
        width: 100%;
      }

      .bp-dashboard-hero-art {
        opacity: .18;
        right: -28px;
      }

      .bp-dashboard-recent-header {
        align-items: stretch;
        flex-direction: column;
      }

      .bp-recent-tools {
        flex-wrap: wrap;
      }

      .bp-recent-search {
        width: 100%;
      }

      .bp-dashboard-status-chart-area {
        gap: 10px;
      }
    }

  `;


  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  const BackButton = () => (

    <button
      className="bp-back-button"
      onClick={goBackToModules}
    >

      <ArrowLeft />

      Back to Budget Proposals

    </button>

  );


  // ==========================================================
  // OVERVIEW
  // ==========================================================

  const renderOverview = () => {

    const maximumBudget =
      Math.max(
        ...overviewData.map(
          item => item.budget
        ),
        1
      );

    return (

      <div className="bp-section-page">

        <div className="bp-overview-toolbar">

          <BackButton />

          <div className="bp-overview-filter">

            <Filter />

            <select
              value={overviewFundGroup}
              onChange={(event) =>
                setOverviewFundGroup(
                  event.target.value
                )
              }
            >

              <option>
                All Fund Groups
              </option>

              {fundGroupData.map(item => (

                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>

              ))}

            </select>

          </div>

        </div>


        <div className="bp-overview-heading">

          <div>

            <h2 className="bp-overview-heading-title">
              Budget Proposal Overview
            </h2>

            <p className="bp-overview-heading-text">
              Monitor budget proposal submission,
              review, endorsement, and approval
              for FY {selectedYear}.
            </p>

          </div>

          <div className="bp-overview-fy">

            <FileSpreadsheet />

            FY {selectedYear}

          </div>

        </div>


        <div className="bp-overview-kpis">

          <div className="bp-kpi">

            <div className="bp-kpi-top">

              <span className="bp-kpi-label">
                Total Proposals
              </span>

              <div className="bp-kpi-icon bp-kpi-blue">
                <FileText />
              </div>

            </div>

            <div className="bp-kpi-value">
              {summaryData.totalProposals}
            </div>

            <div className="bp-kpi-note">
              Database proposal records
            </div>

          </div>


          <div className="bp-kpi">

            <div className="bp-kpi-top">

              <span className="bp-kpi-label">
                Pending / Review
              </span>

              <div className="bp-kpi-icon bp-kpi-orange">
                <Clock3 />
              </div>

            </div>

            <div className="bp-kpi-value">
              {summaryData.submittedProposals + summaryData.reviewProposals + summaryData.revisionProposals}
            </div>

            <div className="bp-kpi-note">
              Awaiting action
            </div>

          </div>


          <div className="bp-kpi">

            <div className="bp-kpi-top">

              <span className="bp-kpi-label">
                Endorsed
              </span>

              <div className="bp-kpi-icon bp-kpi-blue">
                <Send />
              </div>

            </div>

            <div className="bp-kpi-value">
              {summaryData.endorsedProposals}
            </div>

            <div className="bp-kpi-note">
              Endorsed for approval
            </div>

          </div>


          <div className="bp-kpi">

            <div className="bp-kpi-top">

              <span className="bp-kpi-label">
                Approved
              </span>

              <div className="bp-kpi-icon bp-kpi-green">
                <CheckCircle2 />
              </div>

            </div>

            <div className="bp-kpi-value">
              {summaryData.approvedProposals}
            </div>

            <div className="bp-kpi-note">
              Successfully approved
            </div>

          </div>

        </div>


        <div className="bp-overview-two-col">

          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  Proposal Status
                </h3>

                <p className="bp-panel-subtitle">
                  Current proposal workflow status
                </p>

              </div>

            </div>

            <div className="bp-proposal-status-visual">

              <div
                className="bp-proposal-status-donut"
                style={{
                  background: statusGradient
                }}
              >
                <div className="bp-proposal-status-donut-hole">
                  <strong>{statusTotal}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="bp-proposal-status-list">

                {proposalStatuses.map(item => (

                  <div
                    className="bp-proposal-status-item"
                    key={item.label}
                  >

                    <div className="bp-proposal-status-label">

                      <span
                        className="bp-proposal-status-dot"
                        style={{
                          background:
                            statusColors[item.label]
                        }}
                      />

                      <span>
                        {item.label}
                      </span>

                    </div>

                    <strong>
                      {item.count}
                    </strong>

                  </div>

                ))}

              </div>

            </div>

          </div>


          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  Fund Group Reference
                </h3>

                <p className="bp-panel-subtitle">
                  Reference budget structure
                </p>

              </div>

            </div>

            <div className="bp-fund-selector">

              <button
                className={
                  `bp-fund-pill ${
                    overviewFundGroup ===
                    'All Fund Groups'
                      ? 'active'
                      : ''
                  }`
                }
                onClick={() =>
                  setOverviewFundGroup(
                    'All Fund Groups'
                  )
                }
              >
                All
              </button>

              {fundGroupData.map(item => (

                <button
                  key={item.name}
                  className={
                    `bp-fund-pill ${
                      overviewFundGroup ===
                      item.name
                        ? 'active'
                        : ''
                    }`
                  }
                  onClick={() =>
                    setOverviewFundGroup(
                      item.name
                    )
                  }
                >
                  {item.name}
                </button>

              ))}

            </div>

            <div className="bp-fund-list">

              {overviewData.map(item => (

                <div
                  className="bp-fund-row"
                  key={item.name}
                >

                  <span className="bp-fund-name">
                    {item.name}
                  </span>

                  <span className="bp-fund-value">
                    {formatCompact(
                      item.budget
                    )}
                  </span>

                  <div className="bp-fund-mini-bar">

                    <div
                      className="bp-fund-mini-fill"
                      style={{
                        width:
                          `${(
                            item.budget /
                            maximumBudget
                          ) * 100}%`
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>


        <div className="bp-overview-two-col">

          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  {overviewMode === 'status' ? 'Proposal Status Summary' : overviewMode === 'department' ? 'Proposals by Department' : overviewMode === 'fund' ? 'Proposals by Fund Group' : 'Proposal Summary by Fund Group'}
                </h3>

                <p className="bp-panel-subtitle">
                  Actual proposal records and proposed amounts for the selected breakdown.
                </p>

              </div>

            </div>

            <div className="bp-budget-table-wrap">

              <table className="bp-budget-table bp-table-summary">

                <thead>

                  <tr>
                    <th>Fund Group</th>
                    <th>Budget</th>
                    <th>Obligations</th>
                    <th>Disbursements</th>
                    <th>Balance</th>
                  </tr>

                </thead>

                <tbody>

                  {overviewPagination.rows.map(item => (

                    <tr key={item.name}>

                      <td>{item.name}</td>

                      <td className="amount">
                        {formatCurrency(item.budget)}
                      </td>

                      <td className="amount">
                        {formatCurrency(item.obligations)}
                      </td>

                      <td className="amount">
                        {formatCurrency(item.disbursements)}
                      </td>

                      <td className="amount">
                        {formatCurrency(item.balance)}
                      </td>

                    </tr>

                  ))}

                  <tr className="bp-total-row">

                    <td>TOTAL</td>

                    <td className="amount">
                      {formatCurrency(
                        overviewTotals.budget
                      )}
                    </td>

                    <td className="amount">
                      {formatCurrency(
                        overviewTotals.obligations
                      )}
                    </td>

                    <td className="amount">
                      {formatCurrency(
                        overviewTotals.disbursements
                      )}
                    </td>

                    <td className="amount">
                      {formatCurrency(
                        overviewTotals.balance
                      )}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>


          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  Budget Classification
                </h3>

                <p className="bp-panel-subtitle">
                  Allotment class reference
                </p>

              </div>

            </div>

            <div className="bp-info-grid">

              <div className="bp-info-card">
                <div className="bp-info-label">
                  PS
                </div>
                <div className="bp-info-value">
                  {formatCurrency(classificationTotals.PS)}
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  MOOE
                </div>
                <div className="bp-info-value">
                  {formatCurrency(classificationTotals.MOOE)}
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  CO
                </div>
                <div className="bp-info-value">
                  {formatCurrency(classificationTotals.CO)}
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  Total
                </div>
                <div className="bp-info-value">
                  {formatCurrency(classificationTotals.total)}
                </div>
              </div>

            </div>

            <div className="bp-rate-grid">

              <div className="bp-info-card">

                <div className="bp-info-label">
                  Obligation Reference Rate
                </div>

                <div className="bp-info-value">
                  {utilizationRate.toFixed(2)}%
                </div>

              </div>

              <div className="bp-info-card">

                <div className="bp-info-label">
                  Disbursement Reference Rate
                </div>

                <div className="bp-info-value">
                  {disbursementRate.toFixed(2)}%
                </div>

              </div>

            </div>

          </div>

        </div>


        <div className="bp-panel">

          <div className="bp-panel-header">

            <div>

              <h3 className="bp-panel-title">
                Recent Proposal Submissions
              </h3>

              <p className="bp-panel-subtitle">
                Database records for FY {selectedYear}
              </p>

            </div>

            <button
              className="bp-small-button"
              onClick={() =>
                handleSectionClick('records')
              }
            >
              View All
              <ArrowRight />
            </button>

          </div>

          <div className="bp-budget-table-wrap">

            <table className="bp-budget-table bp-table-recent">

              <thead>

                <tr>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Department / Unit</th>
                  <th>Fund Group</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {recentPagination.rows.map(
                  proposal => (

                    <tr key={proposal.id}>

                      <td>
                        {proposal.reference}
                      </td>

                      <td>
                        {proposal.date}
                      </td>

                      <td>
                        {getDepartment(proposal)}
                      </td>

                      <td>
                        {proposal.fundGroup}
                      </td>

                      <td className="amount">
                        {formatCurrency(
                          proposal.amount
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            `bp-badge ${
                              getStatusClass(
                                proposal.status
                              )
                            }`
                          }
                        >
                          {proposal.status}
                        </span>
                      </td>

                      <td>

                        <button
                          className="bp-small-button"
                          onClick={() =>
                            openProposal(
                              proposal
                            )
                          }
                        >
                          <Eye />
                          View
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          <Pagination {...recentPagination} onPageChange={setRecentPage} />

        </div>

      </div>

    );

  };


  // ==========================================================
  // CREATE PROPOSAL
  // ==========================================================

  const renderCreateProposal = () => (
    <div className="bp-section-page">

      <div className="bp-screen-toolbar">
        <BackButton />
        <div className="bp-screen-toolbar-right">
          <span className="bp-overview-fy">
            <FileSpreadsheet />
            FY {selectedYear}
          </span>
        </div>
      </div>

      <div className="bp-screen-heading">
        <h2>Budget Proposal Submission</h2>
        <p>
          Prepare a proposed budget before approval using the same
          WFP, fund, PAP, MFO, UACS and allotment terminology used
          by the budget registries.
        </p>
      </div>

      {proposalError && (
        <div className="bp-error-message">
          <AlertCircle />
          {proposalError}
        </div>
      )}

      {formSaved && (
        <div className="bp-success-message">
          <Check />
          Budget proposal saved successfully.
        </div>
      )}

      <div className="bp-info-grid">
        <div className="bp-info-card">
          <div className="bp-info-label">Fiscal Year</div>
          <div className="bp-info-value">{selectedYear}</div>
        </div>
        <div className="bp-info-card">
          <div className="bp-info-label">Proposal Stage</div>
          <div className="bp-info-value">Budget Preparation</div>
        </div>
        <div className="bp-info-card">
          <div className="bp-info-label">Workflow</div>
          <div className="bp-info-value">
            {editingProposalId ? 'Editing Draft / Revision' : 'Draft'}
          </div>
        </div>
        <div className="bp-info-card">
          <div className="bp-info-label">Total Proposed</div>
          <div className="bp-info-value">
            {formatCurrency(
              Number(proposalForm.psAmount || 0) +
              Number(proposalForm.mooeAmount || 0) +
              Number(proposalForm.coAmount || 0)
            )}
          </div>
        </div>
      </div>

      <div className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h3 className="bp-panel-title">1. Proposal Identification</h3>
            <p className="bp-panel-subtitle">
              Information about the office and the proposed budget requirement
            </p>
          </div>
        </div>

        <div className="bp-form-grid-three">
          <div className="bp-form-group">
            <label className="bp-form-label">Proposing Office / Department <span>*</span></label>
            <input
              className="bp-form-input"
              placeholder="e.g. Information Technology Office"
              value={proposalForm.proposingOffice}
              onChange={event => updateProposalForm('proposingOffice', event.target.value)}
            />
            <span className="bp-form-help">
              Separate from P/A/P and Responsibility Center.
            </span>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Proponent</label>
            <input
              className="bp-form-input"
              placeholder={user?.name || user?.username || 'Name of proposing staff'}
              value={proposalForm.proponent}
              onChange={event => updateProposalForm('proponent', event.target.value)}
            />
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Proposal Title <span>*</span></label>
            <input
              className="bp-form-input"
              placeholder="Enter the proposed budget title"
              value={proposalForm.title}
              onChange={event => updateProposalForm('title', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h3 className="bp-panel-title">2. WFP / Budget Classification</h3>
            <p className="bp-panel-subtitle">
              Reference fields aligned with the WFP, RAOD and RBUD source files.
            </p>
          </div>
        </div>

        <div className="bp-form-grid-three">
          <div className="bp-form-group">
            <label className="bp-form-label">Fund Cluster <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.fundCluster}
              disabled={loadingReferenceData}
              onChange={event => {
                const value = event.target.value;
                updateProposalForm('fundCluster', value);
                // Fund Code is a separate master-data level and is dependent
                // on the selected Fund Cluster. Never use fund_sources as the
                // Fund Code dropdown.
                updateProposalForm('fundCode', '');
                updateProposalForm('sourceCode', '');
              }}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select Fund Cluster'}
              </option>
              {fundClusters.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Fund Code <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.fundCode}
              disabled={
                loadingReferenceData ||
                !proposalForm.fundCluster ||
                !fundCodes.some(item => String(item.fund_cluster_id) === String(proposalForm.fundCluster))
              }
              onChange={event => updateProposalForm('fundCode', event.target.value)}
            >
              <option value="">
                {loadingReferenceData
                  ? 'Loading Master Data...'
                  : !proposalForm.fundCluster
                    ? 'Select Fund Cluster first'
                    : fundCodes.some(item => String(item.fund_cluster_id) === String(proposalForm.fundCluster))
                      ? 'Select Fund Code'
                      : 'No Fund Code configured for this Fund Cluster'}
              </option>
              {fundCodes
                .filter(item => String(item.fund_cluster_id) === String(proposalForm.fundCluster))
                .map(item => (
                  <option key={item.id} value={String(item.id)}>
                    {item.code} - {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Campus <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.campus}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('campus', event.target.value)}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select Campus'}
              </option>
              {campuses.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Responsibility Center <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.responsibilityCenter}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('responsibilityCenter', event.target.value)}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select Responsibility Center'}
              </option>
              {responsibilityCenters.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">WFP Description <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.wfpDescription}
              disabled={loadingReferenceData}
              onChange={event => {
                const value = event.target.value;
                updateProposalForm('wfpDescription', value);
                const selected = wfpOptions.find(item => String(item.id) === String(value));
                if (selected?.source_code && !proposalForm.sourceCode) {
                  updateProposalForm('sourceCode', selected.source_code);
                } else if (selected?.code && !proposalForm.sourceCode) {
                  updateProposalForm('sourceCode', selected.code);
                }
              }}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select WFP Description'}
              </option>
              {wfpOptions.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Source Code</label>
            <input
              className="bp-form-input"
              placeholder="Enter WFP source code if applicable"
              value={proposalForm.sourceCode}
              onChange={event => updateProposalForm('sourceCode', event.target.value)}
            />
            <span className="bp-form-help">
              Separate from Fund Code because the registry files identify WFP Source Code separately.
            </span>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">P/A/P <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.pap}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('pap', event.target.value)}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select P/A/P'}
              </option>
              {papOptions.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">MFO <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.mfo}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('mfo', event.target.value)}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select MFO'}
              </option>
              {mfoOptions.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">UACS Code <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.uacsCode}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('uacsCode', event.target.value)}
            >
              <option value="">
                {loadingReferenceData ? 'Loading Master Data...' : 'Select UACS Code'}
              </option>
              {uacsOptions.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code}
                  {item.account_title ? ` - ${item.account_title}` : item.name ? ` - ${item.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Allotment Class <span>*</span></label>
            <select
              className="bp-form-select"
              value={proposalForm.classification}
              disabled={loadingReferenceData}
              onChange={event => updateProposalForm('classification', event.target.value)}
            >
              <option value="">Select Allotment Class</option>
              {allotmentClasses.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h3 className="bp-panel-title">3. Proposed Budget</h3>
            <p className="bp-panel-subtitle">
              The WFP structure separates proposed amounts into PS, MOOE and CO.
            </p>
          </div>
        </div>

        <div className="bp-form-grid-three">
          <div className="bp-form-group">
            <label className="bp-form-label">Proposed PS</label>
            <input type="number" min="0" step="0.01" className="bp-form-input"
              placeholder="0.00" value={proposalForm.psAmount}
              onChange={event => updateProposalForm('psAmount', event.target.value)} />
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Proposed MOOE</label>
            <input type="number" min="0" step="0.01" className="bp-form-input"
              placeholder="0.00" value={proposalForm.mooeAmount}
              onChange={event => updateProposalForm('mooeAmount', event.target.value)} />
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Proposed CO</label>
            <input type="number" min="0" step="0.01" className="bp-form-input"
              placeholder="0.00" value={proposalForm.coAmount}
              onChange={event => updateProposalForm('coAmount', event.target.value)} />
          </div>

          <div className="bp-form-group">
            <label className="bp-form-label">Total Proposed</label>
            <input type="text" readOnly className="bp-form-input"
              value={formatCurrency(
                Number(proposalForm.psAmount || 0) +
                Number(proposalForm.mooeAmount || 0) +
                Number(proposalForm.coAmount || 0)
              )} />
            <span className="bp-form-help">Automatically calculated as PS + MOOE + CO.</span>
          </div>
        </div>
      </div>

      <div className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h3 className="bp-panel-title">4. Proposal Details</h3>
            <p className="bp-panel-subtitle">
              Explain the requirement and the expected result of the proposed budget.
            </p>
          </div>
        </div>

        <div className="bp-form-grid">
          <div className="bp-form-group full">
            <label className="bp-form-label">Particulars / Description <span>*</span></label>
            <textarea className="bp-form-textarea"
              placeholder="Describe the proposed budget requirement..."
              value={proposalForm.particulars}
              onChange={event => updateProposalForm('particulars', event.target.value)} />
          </div>

          <div className="bp-form-group full">
            <label className="bp-form-label">Justification</label>
            <textarea className="bp-form-textarea"
              placeholder="Why is this budget requirement needed?"
              value={proposalForm.justification}
              onChange={event => updateProposalForm('justification', event.target.value)} />
          </div>

          <div className="bp-form-group full">
            <label className="bp-form-label">Expected Outputs</label>
            <textarea className="bp-form-textarea"
              placeholder="What output/result is expected from the proposed budget?"
              value={proposalForm.expectedOutputs}
              onChange={event => updateProposalForm('expectedOutputs', event.target.value)} />
          </div>

          <div className="bp-form-group full">
            <label className="bp-form-label">Remarks</label>
            <textarea className="bp-form-textarea"
              placeholder="Additional remarks..."
              value={proposalForm.remarks}
              onChange={event => updateProposalForm('remarks', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="bp-panel">
        <div className="bp-panel-header">
          <div>
            <h3 className="bp-panel-title">5. Supporting Documents</h3>
            <p className="bp-panel-subtitle">
              Attach documents required for proposal review.
            </p>
          </div>
        </div>

        <div className="bp-form-group">
          <label className="bp-form-label">Supporting Document</label>
          <input type="file" className="bp-form-input" onChange={handleSupportingFile} />
          <span className="bp-form-help">
            The selected file metadata is stored with the proposal record.
          </span>
        </div>

        <div className="bp-form-actions">
          <button className="bp-secondary-button" onClick={goBackToModules}>Cancel</button>
          <button className="bp-primary-button" onClick={() => saveProposal(false)}>
            <Save />
            Save Proposal Draft
          </button>
          <button className="bp-primary-button" onClick={() => saveProposal(true)}>
            <Send />
            Submit Proposal
          </button>
        </div>
      </div>

    </div>
  );

  // ==========================================================
  // PROPOSAL RECORDS
  // ==========================================================

  const renderRecords = () => {
    const recordsPagination = paginate(filteredProposals, recordsPage);
    return (
    <div className="bp-section-page">

      <div className="bp-screen-toolbar">

        <BackButton />

        <div className="bp-screen-toolbar-right">

          <button
            className="bp-small-button"
            onClick={() =>
              handleSectionClick(
                'create'
              )
            }
          >

            <Plus />

            New Proposal

          </button>

        </div>

      </div>


      <div className="bp-screen-heading">

        <h2>
          Proposal Records
        </h2>

        <p>
          Registry of budget proposals using
          fund, campus, responsibility center,
          WFP and UACS information.
        </p>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Proposal Registry — FY {selectedYear}
            </h3>

            <p className="bp-panel-subtitle">
              Search, filter and view proposal details
            </p>

          </div>

          <div className="bp-proposal-tools">

            <div className="bp-search">

              <Search />

              <input
                placeholder="Search reference, fund, RC..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>


            <select
              className="bp-filter-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              {['All','Draft','Submitted','Under Review','For Revision','Endorsed','Approved','Rejected'].map(status => <option key={status}>{status}</option>)}

            </select>


            <button
              className="bp-small-button"
              onClick={() => {

                setSearchTerm('');

                setStatusFilter('All');

              }}
            >

              <RefreshCcw />

              Clear

            </button>

          </div>

        </div>


        <div className="bp-budget-table-wrap">

          <table className="bp-budget-table bp-table-records">

            <thead>

              <tr>

                <th>Reference</th>
                <th>Date</th>
                <th>Fund Cluster</th>
                <th>Fund Code</th>
                <th>Campus</th>
                <th>RC</th>
                <th>Proposing Office</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {recordsPagination.rows.map(
                proposal => (

                  <tr key={proposal.id}>

                    <td>
                      <strong>
                        {proposal.reference}
                      </strong>
                    </td>

                    <td>
                      {proposal.date}
                    </td>

                    <td>
                      {proposal.fundGroup}
                    </td>

                    <td>
                      {proposal.fundCode}
                    </td>

                    <td>
                      {proposal.campus}
                    </td>

                    <td>
                      {proposal.responsibilityCenter}
                    </td>

                    <td>
                      {getDepartment(proposal)}
                    </td>

                    <td className="amount">
                      {formatCurrency(
                        proposal.amount
                      )}
                    </td>

                    <td>

                      <span
                        className={
                          `bp-badge ${
                            getStatusClass(
                              proposal.status
                            )
                          }`
                        }
                      >
                        {proposal.status}
                      </span>

                    </td>

                    <td>

                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button className="bp-small-button" onClick={() => openProposal(proposal)}><Eye /> View</button>
                        {canEditProposal && ['Draft', 'For Revision'].includes(proposal.status) && (
                          <button className="bp-small-button" onClick={() => editProposal(proposal)}>
                            <Pencil /> Edit
                          </button>
                        )}
                        {(isAdministration || isBudget) && proposal.status === 'Draft' && (
                          <button className="bp-small-button" onClick={() => deleteProposal(proposal)}>
                            <XCircle /> Delete
                          </button>
                        )}
                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>


        {filteredProposals.length === 0 && (

          <div
            className="bp-empty"
            style={{
              marginTop: 10
            }}
          >

            <FolderOpen />

            <div className="bp-empty-title">
              No matching proposal records
            </div>

            <div className="bp-empty-text">
              Try another search term or status filter.
            </div>

          </div>

        )}

      </div>

      <Pagination {...recordsPagination} onPageChange={setRecordsPage} />

    </div>
  );
  };


  // ==========================================================
  // REVIEW & ENDORSEMENT
  // ==========================================================

  const renderReview = () => {
    const reviewRecords = proposalRecords.filter(item => ['Submitted','Under Review'].includes(item.status));
    const reviewPagination = paginate(reviewRecords, reviewPage);
    return (
      <div className="bp-section-page">
        <div className="bp-screen-toolbar"><BackButton /></div>
        <div className="bp-screen-heading"><h2>Review &amp; Endorsement</h2><p>Review submitted proposals, return them for revision, or endorse them for approval.</p></div>
        <div className="bp-review-layout">
          <div className="bp-panel"><div className="bp-panel-header"><div><h3 className="bp-panel-title">Proposals for Review</h3><p className="bp-panel-subtitle">Submitted and currently under review</p></div></div>
            <div className="bp-budget-table-wrap"><table className="bp-budget-table bp-table-review"><thead><tr><th>Reference</th><th>Department</th><th>Fund</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
              {reviewPagination.rows.map(proposal => <tr key={proposal.id}><td>{proposal.reference}</td><td>{getDepartment(proposal)}</td><td>{proposal.fundGroup} / {proposal.fundCode}</td><td className="amount">{formatCurrency(proposal.amount)}</td><td><span className={`bp-badge ${getStatusClass(proposal.status)}`}>{proposal.status}</span></td><td><button className="bp-small-button" onClick={() => setSelectedProposal(proposal)}><Eye /> Review</button></td></tr>)}
            </tbody></table></div>
            <Pagination {...reviewPagination} onPageChange={setReviewPage} />
            {!reviewRecords.length && <div className="bp-empty"><FileCheck2 /><div className="bp-empty-title">No proposals awaiting review</div><div className="bp-empty-text">Submitted proposals will appear here.</div></div>}
          </div>
          <div className="bp-panel"><div className="bp-panel-header"><div><h3 className="bp-panel-title">Review Action</h3><p className="bp-panel-subtitle">Select a proposal to process</p></div></div>
            {selectedProposal ? <><div className="bp-review-item"><div className="bp-review-icon"><FileText /></div><div><div className="bp-review-label">Proposal</div><div className="bp-review-value">{selectedProposal.reference}</div></div></div><div className="bp-review-item"><div className="bp-review-icon"><Building2 /></div><div><div className="bp-review-label">Department / Unit</div><div className="bp-review-value">{getDepartment(selectedProposal)}</div></div></div><div className="bp-review-item"><div className="bp-review-icon"><WalletCards /></div><div><div className="bp-review-label">Proposed Amount</div><div className="bp-review-value">{formatCurrency(selectedProposal.amount)}</div></div></div>
              <textarea className="bp-review-textarea" placeholder="Review remarks..." value={reviewMessage} onChange={e => setReviewMessage(e.target.value)} />
              <div className="bp-review-actions">
                {selectedProposal.status === 'Submitted' && <button className="bp-review-action neutral" onClick={() => changeProposalStatus('Under Review')}><Clock3 /> Start Review</button>}
                <button className="bp-review-action return" onClick={() => changeProposalStatus('For Revision')}><RotateCcw /> Return for Revision</button>
                <button className="bp-review-action endorse" disabled={selectedProposal.status !== 'Under Review'} onClick={() => changeProposalStatus('Endorsed')}><CheckCircle2 /> Endorse Proposal</button>
                <button className="bp-review-action neutral" onClick={() => openProposal(selectedProposal)}><Eye /> View Full Details</button>
              </div>
            </> : <div className="bp-empty"><FileCheck2 /><div className="bp-empty-title">No Proposal Selected</div><div className="bp-empty-text">Select a proposal from the review table.</div></div>}
          </div>
        </div>
      </div>
    );
  };


  // ==========================================================
  // APPROVAL WORKFLOW
  // ==========================================================

  const renderWorkflow = () => {
    const activeWorkflow = proposalRecords.filter(item => !['Approved','Rejected'].includes(item.status));
    const workflowPagination = paginate(activeWorkflow, workflowPage);
    const selectedStatus = selectedProposal?.status || '—';
    return (
      <div className="bp-section-page">
        <div className="bp-screen-toolbar"><BackButton /></div>
        <div className="bp-screen-heading"><h2>Approval Workflow</h2><p>Process proposals through the actual database workflow: Draft → Submitted → Under Review → For Revision → Submitted → Under Review → Endorsed → Approved.</p></div>
        <div className="bp-panel"><div className="bp-panel-header"><div><h3 className="bp-panel-title">Workflow Queue</h3><p className="bp-panel-subtitle">Select a proposal to see its allowed next actions</p></div></div>
          <div className="bp-budget-table-wrap"><table className="bp-budget-table bp-table-workflow"><thead><tr><th>Reference</th><th>Department</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {workflowPagination.rows.map(p => <tr key={p.id}><td>{p.reference}</td><td>{getDepartment(p)}</td><td className="amount">{formatCurrency(p.amount)}</td><td><span className={`bp-badge ${getStatusClass(p.status)}`}>{p.status}</span></td><td><button className="bp-small-button" onClick={() => setSelectedProposal(p)}><Eye /> Select</button></td></tr>)}
          </tbody></table></div>
          <Pagination {...workflowPagination} onPageChange={setWorkflowPage} />
        </div>
        <div className="bp-panel"><div className="bp-panel-header"><div><h3 className="bp-panel-title">Selected Workflow</h3><p className="bp-panel-subtitle">{selectedProposal ? selectedProposal.reference : 'No proposal selected'}</p></div></div>
          {selectedProposal ? <><div className="bp-info-grid"><div className="bp-info-card"><div className="bp-info-label">Current Status</div><div className="bp-info-value"><span className={`bp-badge ${getStatusClass(selectedStatus)}`}>{selectedStatus}</span></div></div><div className="bp-info-card"><div className="bp-info-label">Department</div><div className="bp-info-value">{getDepartment(selectedProposal)}</div></div><div className="bp-info-card"><div className="bp-info-label">Proposed Amount</div><div className="bp-info-value">{formatCurrency(selectedProposal.amount)}</div></div><div className="bp-info-card"><div className="bp-info-label">Fiscal Year</div><div className="bp-info-value">FY {selectedYear}</div></div></div>
            <div className="bp-form-actions">
              {selectedStatus === 'Draft' && <button className="bp-primary-button" onClick={() => changeProposalStatus('Submitted')}><Send /> Submit</button>}
              {selectedStatus === 'Submitted' && <button className="bp-primary-button" onClick={() => changeProposalStatus('Under Review')}><Clock3 /> Start Review</button>}
              {selectedStatus === 'Under Review' && <><button className="bp-secondary-button" onClick={() => changeProposalStatus('For Revision')}><RotateCcw /> For Revision</button><button className="bp-primary-button" onClick={() => changeProposalStatus('Endorsed')}><CheckCircle2 /> Endorse</button><button className="bp-secondary-button" onClick={() => changeProposalStatus('Rejected')}><XCircle /> Reject</button></>}
              {selectedStatus === 'For Revision' && <button className="bp-primary-button" onClick={() => changeProposalStatus('Submitted')}><Send /> Resubmit</button>}
              {selectedStatus === 'Endorsed' && <><button className="bp-primary-button" onClick={() => changeProposalStatus('Approved')}><CheckCircle2 /> Approve</button><button className="bp-secondary-button" onClick={() => changeProposalStatus('Rejected')}><XCircle /> Reject</button></>}
            </div>
          </> : <div className="bp-empty"><ListChecks /><div className="bp-empty-title">Select a proposal</div><div className="bp-empty-text">The action buttons will follow the proposal's current database status.</div></div>}
        </div>
      </div>
    );
  };


  // ==========================================================
  // PROPOSAL HISTORY
  // ==========================================================

  const renderHistory = () => {
    const historyRows = selectedProposal?.id
      ? proposalHistory
      : allHistory;
    const historyPagination = paginate(historyRows, historyPage);
    return (
      <div className="bp-section-page">
        <div className="bp-screen-toolbar"><BackButton /></div>
        <div className="bp-screen-heading">
          <h2>Proposal History</h2>
          <p>Database-backed chronological record of proposal actions.</p>
        </div>
        <div className="bp-panel">
          <div className="bp-panel-header">
            <div><h3 className="bp-panel-title">{selectedProposal ? `History — ${selectedProposal.reference}` : 'All Proposal History'}</h3><p className="bp-panel-subtitle">Actual workflow activity from the database</p></div>
            {selectedProposal && <button className="bp-secondary-button" onClick={() => { setSelectedProposal(null); setHistoryPage(1); }}>Show All</button>}
          </div>
          <div className="bp-budget-table-wrap">
            <table className="bp-budget-table bp-table-history"><thead><tr><th>Date</th><th>Reference</th><th>Action</th><th>Status</th><th>Remarks</th><th>Actor</th></tr></thead><tbody>
              {historyPagination.rows.map((row, index) => { const p = proposalRecords.find(x => Number(x.id) === Number(row.proposal_id)); return <tr key={`${row.id || index}-${row.created_at}`}><td>{row.created_at ? new Date(row.created_at).toLocaleString('en-PH') : '—'}</td><td>{p?.reference || `Proposal #${row.proposal_id}`}</td><td>{row.action || '—'}</td><td><span className={`bp-badge ${getStatusClass(row.status)}`}>{row.status || '—'}</span></td><td>{row.remarks || '—'}</td><td>{row.actor_name || 'System User'}</td></tr>; })}
            </tbody></table>
          </div>
          <Pagination {...historyPagination} onPageChange={setHistoryPage} />
          {!historyRows.length && <div className="bp-empty"><History /><div className="bp-empty-title">No history records yet</div><div className="bp-empty-text">Workflow actions will appear here after a proposal is created or updated.</div></div>}
        </div>
      </div>
    );
  };


  const downloadTextFile = (filename, content, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportReportCsv = () => {
    let header;
    let rows;
    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    if (reportType === 'Proposal Summary') {
      header = ['Reference','Date','Fund Group','Fund Code','Campus','Responsibility Center','Proposing Office','UACS Code','Proposed Amount','Status','Remarks'];
      rows = reportFilteredRecords.map(item => [item.reference,item.date ? new Date(item.date).toLocaleDateString('en-PH') : '',item.fundGroup,item.fundCode,item.campus,item.responsibilityCenter,item.department,item.uacsCode,Number(item.amount||0).toFixed(2),item.status,item.remarks]);
    } else {
      header = [reportType === 'By Department' ? 'Department' : reportType === 'By Fund Source' ? 'Fund Source' : 'Status','Proposals','Total Proposed','Approved'];
      rows = reportGroupedRows.map(item => [item.label,item.count,Number(item.total||0).toFixed(2),item.approved]);
    }
    downloadTextFile(`budget-proposals-${reportType.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${selectedYear}.csv`, [header,...rows].map(row => row.map(escapeCsv).join(',')).join('\n'),'text/csv;charset=utf-8');
  };


  const printReport = () => {
    const rows = reportType === 'Proposal Summary'
      ? reportFilteredRecords.map(item => `<tr><td>${item.reference || ''}</td><td>${item.fundGroup || ''}</td><td>${item.fundCode || ''}</td><td>${item.campus || ''}</td><td>${item.responsibilityCenter || ''}</td><td>${item.department || ''}</td><td style="text-align:right">${formatCurrency(item.amount)}</td><td>${item.status || ''}</td></tr>`).join('')
      : reportGroupedRows.map(item => `<tr><td colspan="2">${item.label}</td><td>${item.count}</td><td style="text-align:right">${formatCurrency(item.total)}</td><td>${item.approved}</td></tr>`).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      setProposalError('Please allow pop-ups in the browser to print the report.');
      return;
    }

    const logoUrl = `${window.location.origin}/UA_logo.jpg`;

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Proposal Summary - FY ${selectedYear}</title>
        <style>
          *{box-sizing:border-box}
          body{
            font-family:Arial,sans-serif;
            margin:0;
            padding:28px;
            color:#1e293b;
            background:#fff
          }
          .report-header{
            text-align:center;
            border-bottom:2px solid #173b78;
            padding-bottom:14px;
            margin-bottom:18px
          }
          .report-logo{
            display:block;
            width:72px;
            height:72px;
            object-fit:contain;
            margin:0 auto 8px
          }
          .university{
            font-size:20px;
            font-weight:700;
            color:#173b78;
            margin:0
          }
          .system-name{
            font-size:11px;
            color:#64748b;
            margin:4px 0 0
          }
          .report-title{
            font-size:18px;
            font-weight:700;
            color:#173b78;
            margin:18px 0 4px
          }
          .report-subtitle{
            font-size:12px;
            color:#64748b;
            margin:0
          }
          table{
            width:100%;
            border-collapse:collapse;
            margin-top:18px
          }
          th,td{
            border:1px solid #cbd5e1;
            padding:7px;
            font-size:10px;
            text-align:left
          }
          th{
            background:#f1f5f9;
            color:#173b78
          }
          .footer{
            text-align:center;
            margin-top:18px;
            font-size:9px;
            color:#64748b
          }
          @media print{
            body{padding:18mm}
          }
        

    /* READABILITY PASS — slightly larger typography at 100% zoom */
    .bp-panel-title { font-size: 15px !important; }
    .bp-panel-subtitle { font-size: 11.5px !important; }

    .bp-proposal-status-label { font-size: 12px !important; }
    .bp-proposal-status-item > strong { font-size: 12px !important; }
    .bp-proposal-status-donut-hole strong { font-size: 27px !important; }
    .bp-proposal-status-donut-hole span { font-size: 11.5px !important; }

    .bp-fund-pill { font-size: 10px !important; padding: 7px 10px !important; }
    .bp-fund-name { font-size: 11px !important; }
    .bp-fund-value { font-size: 11px !important; }
    .bp-fund-mini-bar { height: 6px !important; }

    .bp-dashboard-status-header h2,
    .bp-dashboard-recent-header h2,
    .bp-dashboard-section-heading h2 { font-size: 14px !important; }

    .bp-dashboard-status-header p,
    .bp-dashboard-recent-header p,
    .bp-dashboard-section-heading p { font-size: 10.5px !important; }

    .bp-mini-year select { font-size: 10.5px !important; }
    .bp-mini-year svg { width: 14px; height: 14px; }

    .bp-status-legend-row { font-size: 11.5px !important; }
    .bp-status-legend-row strong { font-size: 11.5px !important; }
</style>
      </head>
      <body>
        <div class="report-header">
          <img class="report-logo" src="${logoUrl}" alt="University of Abra Logo" />
          <h1 class="university">UNIVERSITY OF ABRA</h1>
          <p class="system-name">Budget Monitoring &amp; Allocation System</p>
          <div class="report-title">${reportType} - FY ${selectedYear}</div>
          <p class="report-subtitle">Budget Proposal Monitoring Report</p>
        </div>

        <table>
          <thead>
            <tr>
              ${reportType === 'Proposal Summary' ? '<th>Reference</th><th>Fund Group</th><th>Fund Code</th><th>Campus</th><th>RC</th><th>Proposing Office</th><th>Proposed Amount</th><th>Status</th>' : `<th colspan="2">${reportType === 'By Department' ? 'Department' : reportType === 'By Fund Source' ? 'Fund Source' : 'Status'}</th><th>Proposals</th><th>Total Proposed</th><th>Approved</th>`}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          Generated from BMAS Budget Proposals - FY ${selectedYear}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Give the logo a moment to load before the browser print dialog opens.
    const doPrint = () => {
      printWindow.focus();
      printWindow.print();
    };

    const logo = printWindow.document.querySelector('.report-logo');
    if (logo && !logo.complete) {
      logo.onload = doPrint;
      logo.onerror = doPrint;
    } else {
      setTimeout(doPrint, 150);
    }
  };

  // ==========================================================
  // REPORTS
  // ==========================================================

  const reportFilteredRecords =
    proposalRecords.filter(item => {

      const fundMatch =
        reportFundGroup ===
        'All Fund Groups' ||
        item.fundGroup ===
        reportFundGroup;

      const statusMatch =
        reportStatus === 'All' ||
        item.status === reportStatus;

      return (
        fundMatch &&
        statusMatch
      );

    });


  const reportTotalAmount = reportFilteredRecords.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const reportGroupedRows = useMemo(() => {
    const groups = new Map();
    const keyFor = item => {
      if (reportType === 'By Department') return getDepartment(item) || 'Unspecified';
      if (reportType === 'By Fund Source') return item.fundCode || item.fundGroup || 'Unspecified';
      if (reportType === 'By Status') return item.status || 'Unspecified';
      return null;
    };
    if (reportType === 'Proposal Summary') return [];
    reportFilteredRecords.forEach(item => {
      const key = keyFor(item);
      const row = groups.get(key) || { label:key, count:0, total:0, approved:0 };
      row.count += 1; row.total += Number(item.amount || 0); if (item.status === 'Approved') row.approved += 1;
      groups.set(key,row);
    });
    return Array.from(groups.values()).sort((a,b) => b.total-a.total);
  }, [reportFilteredRecords, reportType]);

  const reportTableRows = reportType === 'Proposal Summary' ? reportFilteredRecords : reportGroupedRows;
  const reportPagination = paginate(reportTableRows, reportPage);

  const renderReports = () => (

    <div className="bp-section-page">

      <div className="bp-screen-toolbar">

        <BackButton />

      </div>


      <div className="bp-screen-heading">

        <h2>
          Proposal Reports &amp; Export
        </h2>

        <p>
          Generate proposal summaries by department,
          fund source, status and other budget proposal
          classifications.
        </p>

      </div>
      <div className="bp-report-layout">

        <div className="bp-panel">

          <div className="bp-panel-header">

            <div>

              <h3 className="bp-panel-title">
                Report Type
              </h3>

              <p className="bp-panel-subtitle">
                Select report
              </p>

            </div>

          </div>


          <div className="bp-report-menu">

            {[
              [
                'Proposal Summary',
                <FileText />
              ],
              [
                'By Department',
                <Building2 />
              ],
              [
                'By Fund Source',
                <Database />
              ],
              [
                'By Status',
                <PieChart />
              ]

            ].map(
              ([name, icon]) => (

                <button
                  key={name}
                  className={
                    `bp-report-menu-button ${
                      reportType === name
                        ? 'active'
                        : ''
                    }`
                  }
                  onClick={() =>
                    setReportType(
                      name
                    )
                  }
                >

                  {icon}

                  {name}

                </button>

              )
            )}

          </div>

        </div>


        <div className="bp-panel">

          <div className="bp-panel-header">

            <div>

              <h3 className="bp-panel-title">
                Report Filters
              </h3>

              <p className="bp-panel-subtitle">
                Define the report coverage
              </p>

            </div>

          </div>


          <div className="bp-report-filters">

            <div className="bp-form-group">

              <label className="bp-form-label">
                Fiscal Year
              </label>

              <select className="bp-form-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {[2026,2025,2024,2023].map(year => <option key={year} value={year}>FY {year}</option>)}
              </select>

            </div>


            <div className="bp-form-group">

              <label className="bp-form-label">
                Fund Group
              </label>

              <select
                className="bp-form-select"
                value={reportFundGroup}
                onChange={(event) =>
                  setReportFundGroup(
                    event.target.value
                  )
                }
              >

                <option>
                  All Fund Groups
                </option>

                {fundGroupData.map(item => (

                  <option
                    key={item.name}
                  >
                    {item.name}
                  </option>

                ))}

              </select>

            </div>


            <div className="bp-form-group">

              <label className="bp-form-label">
                Status
              </label>

              <select
                className="bp-form-select"
                value={reportStatus}
                onChange={(event) =>
                  setReportStatus(
                    event.target.value
                  )
                }
              >

                <option>
                  All
                </option>

                <option>Draft</option>

                <option>Submitted</option>
                <option>Under Review</option>

                <option>
                  Endorsed
                </option>

                <option>
                  Approved
                </option>

                <option>For Revision</option>

                <option>Rejected</option>

              </select>

            </div>

          </div>


          <div className="bp-report-preview">

            <div className="bp-report-preview-header">

              <img
                className="bp-report-preview-logo"
                src="/UA_logo.jpg"
                alt="University of Abra Logo"
              />

              <strong>
                UNIVERSITY OF ABRA
              </strong>

              <span>
                {reportType} — FY {selectedYear}
              </span>

              <span>
                Budget Proposal Monitoring Report
              </span>

            </div>


            <div className="bp-report-summary">

              <div className="bp-report-summary-card">

                <span>
                  Proposals
                </span>

                <strong>
                  {reportFilteredRecords.length}
                </strong>

              </div>


              <div className="bp-report-summary-card">

                <span>
                  Total Proposed
                </span>

                <strong>
                  {formatCompact(
                    reportTotalAmount
                  )}
                </strong>

              </div>


              <div className="bp-report-summary-card">

                <span>
                  Approved
                </span>

                <strong>
                  {
                    reportFilteredRecords.filter(
                      item =>
                        item.status ===
                        'Approved'
                    ).length
                  }
                </strong>

              </div>


              <div className="bp-report-summary-card">

                <span>
                  Pending / Review
                </span>

                <strong>
                  {
                    reportFilteredRecords.filter(
                      item =>
                        item.status === 'Submitted' ||
                        item.status === 'Under Review'
                    ).length
                  }
                </strong>

              </div>

            </div>


            <div className="bp-budget-table-wrap">

              <table className="bp-budget-table bp-table-report">

                <thead>

                  <tr>
                    {reportType === 'Proposal Summary' ? <>
                      <th>Reference</th><th>Fund Group</th><th>Campus</th><th>RC</th><th>Proposing Office</th><th>Proposed Amount</th><th>Status</th>
                    </> : <>
                      <th colSpan={2}>{reportType === 'By Department' ? 'Department' : reportType === 'By Fund Source' ? 'Fund Source' : 'Status'}</th><th>Proposals</th><th>Total Proposed</th><th>Approved</th>
                    </>}
                  </tr>

                </thead>

                <tbody>
                  {reportType === 'Proposal Summary' ? reportPagination.rows.filter(item => reportType === 'Proposal Summary').map(item => (
                    <tr key={item.id}><td>{item.reference}</td><td>{item.fundGroup}</td><td>{item.campus}</td><td>{item.responsibilityCenter}</td><td>{getDepartment(item)}</td><td className="amount">{formatCurrency(item.amount)}</td><td><span className={`bp-badge ${getStatusClass(item.status)}`}>{item.status}</span></td></tr>
                  )) : reportPagination.rows.filter(row => reportType !== 'Proposal Summary').map(row => (
                    <tr key={row.label}><td colSpan={2}>{row.label}</td><td>{row.count}</td><td className="amount">{formatCurrency(row.total)}</td><td>{row.approved}</td></tr>
                  ))}
                </tbody>

              </table>

            </div>

            <Pagination {...reportPagination} onPageChange={setReportPage} />


            <div className="bp-report-actions">

              <button
                className="bp-secondary-button"
                onClick={printReport}
              >

                <Printer />

                Print

              </button>


              <button
                className="bp-secondary-button"
                onClick={exportReportCsv}
              >

                <FileSpreadsheet />

                Export CSV

              </button>


              <button
                className="bp-primary-button"
                onClick={exportReportCsv}
              >

                <Download />

                Export Report

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );


  // ==========================================================
  // PROPOSAL DETAILS
  // ==========================================================

  const renderProposalDetails = () => {

    if (!selectedProposal) {

      return (

        <div className="bp-section-page">

          <div className="bp-screen-toolbar">
            <BackButton />
          </div>

          <div className="bp-empty">

            <FolderOpen />

            <div className="bp-empty-title">
              No Proposal Selected
            </div>

          </div>

        </div>

      );

    }


    return (

      <div className="bp-section-page">

        <div className="bp-screen-toolbar">

          <button
            className="bp-back-button"
            onClick={() =>
              handleSectionClick(
                'records'
              )
            }
          >

            <ArrowLeft />

            Back to Proposal Records

          </button>

          <span
            className={
              `bp-badge ${
                getStatusClass(
                  selectedProposal.status
                )
              }`
            }
          >
            {selectedProposal.status}
          </span>

        </div>


        <div className="bp-screen-heading">

          <h2>
            Proposal Details
          </h2>

          <p>
            Detailed proposal information for
            {` ${selectedProposal.reference}`}.
          </p>

        </div>


        <div className="bp-detail-grid">

          <div>

            <div className="bp-panel">

              <div className="bp-panel-header">

                <div>

                  <h3 className="bp-panel-title">
                    Proposal Information
                  </h3>

                  <p className="bp-panel-subtitle">
                    Budget proposal registry details
                  </p>

                </div>

              </div>


              <div className="bp-detail-list">

                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Reference
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.reference}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Date
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.date}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Fund Cluster
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.fundGroup}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Fund Code
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.fundCode}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Campus
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.campus}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Responsibility Center
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.responsibilityCenter}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    WFP Description
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.wfpDescription}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Source Code
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.sourceCode || selectedProposal.raw?.source_code || '—'}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    Proposing Office / Department
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.department || selectedProposal.department_unit || '—'}
                  </div>

                  <div className="bp-detail-item">
                    <div className="bp-detail-label">P/A/P</div>
                    <div className="bp-detail-value">
                      {selectedProposal.pap || '—'}
                    </div>
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    UACS Code
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.uacsCode}
                  </div>

                </div>


                <div className="bp-detail-item full">

                  <div className="bp-detail-label">
                    Particulars / Description
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.particulars}
                  </div>

                </div>

              </div>

            </div>


            <div className="bp-panel">

              <div className="bp-panel-header">

                <div>

                  <h3 className="bp-panel-title">
                    Workflow
                  </h3>

                  <p className="bp-panel-subtitle">
                    Current proposal stage
                  </p>

                </div>

              </div>


              <div className="bp-workflow">

                {[
                  'Draft',
                  'Submitted',
                  'Under Review',
                  'For Revision',
                  'Endorsed',
                  'Approved'
                ].map(
                  (step, index) => (

                    <React.Fragment
                      key={step}
                    >

                      <div
                        className={
                          `bp-workflow-step ${
                            ['Draft','Submitted','Under Review','For Revision','Endorsed','Approved'].indexOf(selectedProposal.status) >= index
                              ? 'active'
                              : ''
                          }`
                        }
                      >

                        <div className="bp-workflow-number">
                          {index + 1}
                        </div>

                        <div className="bp-workflow-title">
                          {step}
                        </div>

                      </div>

                      {index < 5 && (

                        <div className="bp-workflow-arrow">
                          <ArrowRight />
                        </div>

                      )}

                    </React.Fragment>

                  )
                )}

              </div>

            </div>

          </div>


          <div>

            <div className="bp-panel">

              <div className="bp-panel-header">

                <div>

                  <h3 className="bp-panel-title">
                    Proposed Budget
                  </h3>

                  <p className="bp-panel-subtitle">
                    Financial information
                  </p>

                </div>

              </div>


              <div className="bp-detail-item">

                <div className="bp-detail-label">
                  Proposed Amount
                </div>

                <div className="bp-detail-amount">
                  {formatCurrency(
                    selectedProposal.amount
                  )}
                </div>

              </div>


              <div
                className="bp-detail-item"
                style={{
                  marginTop: 8
                }}
              >

                <div className="bp-detail-label">
                  Status
                </div>

                <div
                  style={{
                    marginTop: 5
                  }}
                >

                  <span
                    className={
                      `bp-badge ${
                        getStatusClass(
                          selectedProposal.status
                        )
                      }`
                    }
                  >
                    {selectedProposal.status}
                  </span>

                </div>

              </div>

            </div>


            <div className="bp-panel">

              <div className="bp-panel-header">

                <div>

                  <h3 className="bp-panel-title">
                    Available Actions
                  </h3>

                  <p className="bp-panel-subtitle">
                    Current database actions
                  </p>

                </div>

              </div>


              <div className="bp-review-actions">
                {canEditProposal && ['Draft', 'For Revision'].includes(selectedProposal.status) && (
                  <button className="bp-review-action neutral" onClick={() => editProposal(selectedProposal)}><Pencil /> Edit / Update</button>
                )}
                {canSubmitProposal && selectedProposal.status === 'Draft' && (
                  <button className="bp-review-action neutral" onClick={() => changeProposalStatus('Submitted')}><Send /> Submit</button>
                )}
                {canReviewProposal && selectedProposal.status === 'Submitted' && (
                  <button className="bp-review-action neutral" onClick={() => changeProposalStatus('Under Review')}><Clock3 /> Start Review</button>
                )}
                {canReviewProposal && selectedProposal.status === 'Under Review' && (
                  <>
                    <button className="bp-review-action endorse" onClick={() => changeProposalStatus('Endorsed')}><CheckCircle2 /> Endorse</button>
                    <button className="bp-review-action return" onClick={() => changeProposalStatus('For Revision')}><RotateCcw /> For Revision</button>
                    <button className="bp-review-action return" onClick={() => changeProposalStatus('Rejected')}><XCircle /> Reject</button>
                  </>
                )}
                {canSubmitProposal && selectedProposal.status === 'For Revision' && (
                  <button className="bp-review-action neutral" onClick={() => changeProposalStatus('Submitted')}><Send /> Resubmit</button>
                )}
                {canReviewProposal && selectedProposal.status === 'Endorsed' && (
                  <>
                    <button className="bp-review-action endorse" onClick={() => changeProposalStatus('Approved')}><CheckCircle2 /> Approve</button>
                    <button className="bp-review-action return" onClick={() => changeProposalStatus('Rejected')}><XCircle /> Reject</button>
                  </>
                )}
                <button className="bp-review-action neutral" onClick={() => handleSectionClick('history')}><History /> View History</button>
              </div>

            </div>

          </div>

        </div>

      </div>

    );

  };


  // ==========================================================
  // MODULES
  // ==========================================================

  const renderModules = () => {

    const total = summaryData.totalProposals || 0;
    const approved = summaryData.approvedProposals || 0;
    const review = (summaryData.submittedProposals || 0) + (summaryData.reviewProposals || 0);
    const rejected = summaryData.rejectedProposals || 0;

    const percentage = (value) => total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';

    const recentRecords = [...proposalRecords]
      .sort((a, b) => {
        const da = new Date(a.submitted_at || a.date_submitted || a.created_at || a.updated_at || 0).getTime();
        const db = new Date(b.submitted_at || b.date_submitted || b.created_at || b.updated_at || 0).getTime();
        return db - da;
      })
      .slice(0, 5);

    const formatRecentDate = (proposal) => {
      const raw = proposal?.submitted_at || proposal?.date_submitted || proposal?.created_at || proposal?.updated_at;
      if (!raw) return '—';
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const referenceOf = (proposal) =>
      proposal?.reference || proposal?.reference_no || proposal?.referenceNo || proposal?.proposal_reference || '—';

    const titleOf = (proposal) =>
      proposal?.title || proposal?.proposal_title || proposal?.particulars || proposal?.description || '—';

    const departmentOf = (proposal) => getDepartment(proposal);

    const fundOf = (proposal) =>
      proposal?.fundGroup || proposal?.fund_group || proposal?.fund_source || proposal?.fundCode || '—';

    const amountOf = (proposal) => Number(proposal?.amount || 0);

    const statusLabel = (proposal) => proposal?.status || 'Draft';

    return (
      <div className="bp-page bp-dashboard-page">

        {(proposalError || loadingProposals) && (
          <div className="bp-dashboard-system-area">
            {proposalError && (
              <div className="bp-system-note bp-dashboard-note-error">
                <AlertCircle />
                <span>{proposalError}</span>
              </div>
            )}
            {loadingProposals && (
              <div className="bp-system-note bp-dashboard-note-loading">
                <RefreshCcw />
                <span>Loading budget proposals from the database...</span>
              </div>
            )}
          </div>
        )}

        {/* Fiscal year */}
        <div className="bp-dashboard-toolbar">
          <div className="bp-dashboard-year-selector">
            <CalendarDays />
            <span>Fiscal Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              aria-label="Fiscal Year"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
            <ChevronDown />
          </div>
        </div>

        {/* Summary cards */}
        <div className="bp-dashboard-summary-grid">

          <button
            type="button"
            className="bp-dashboard-summary-card summary-blue"
            onClick={() => handleSectionClick('overview')}
          >
            <div className="bp-summary-icon"><ClipboardList /></div>
            <div className="bp-summary-content">
              <span className="bp-summary-label">TOTAL PROPOSALS</span>
              <strong>{total}</strong>
              <span>for FY {selectedYear}</span>
            </div>
            <span className="bp-summary-arrow"><ArrowRight /></span>
          </button>

          <button
            type="button"
            className="bp-dashboard-summary-card summary-green"
            onClick={() => {
              setStatusFilter('Approved');
              handleSectionClick('records');
            }}
          >
            <div className="bp-summary-icon"><CheckCircle2 /></div>
            <div className="bp-summary-content">
              <span className="bp-summary-label">APPROVED</span>
              <strong>{approved}</strong>
              <span>{percentage(approved)}% of total</span>
            </div>
            <span className="bp-summary-arrow"><ArrowRight /></span>
          </button>

          <button
            type="button"
            className="bp-dashboard-summary-card summary-orange"
            onClick={() => {
              setStatusFilter('Under Review');
              handleSectionClick('records');
            }}
          >
            <div className="bp-summary-icon"><Clock3 /></div>
            <div className="bp-summary-content">
              <span className="bp-summary-label">FOR REVIEW</span>
              <strong>{review}</strong>
              <span>{percentage(review)}% of total</span>
            </div>
            <span className="bp-summary-arrow"><ArrowRight /></span>
          </button>

          <button
            type="button"
            className="bp-dashboard-summary-card summary-red"
            onClick={() => {
              setStatusFilter('Rejected');
              handleSectionClick('records');
            }}
          >
            <div className="bp-summary-icon"><XCircle /></div>
            <div className="bp-summary-content">
              <span className="bp-summary-label">REJECTED</span>
              <strong>{rejected}</strong>
              <span>{percentage(rejected)}% of total</span>
            </div>
            <span className="bp-summary-arrow"><ArrowRight /></span>
          </button>

        </div>

        {/* Hero + status chart */}
        <div className="bp-dashboard-hero-grid">

          <div className="bp-dashboard-hero-card">
            <div className="bp-dashboard-hero-copy">
              <span className="bp-dashboard-eyebrow">BUDGET PROPOSALS</span>
              <h1>Plan, Submit, and Track<br />Budget Proposals</h1>
              <p>
                Create and submit budget proposals, manage records,
                track approval status, and generate summaries for better
                financial planning and decision-making.
              </p>
              {canCreateProposal && (
                <button
                  type="button"
                  className="bp-dashboard-primary-button"
                  onClick={() => handleSectionClick('create')}
                >
                  Create New Proposal <ArrowRight />
                </button>
              )}
            </div>

            <div className="bp-dashboard-hero-art" aria-hidden="true">
              <div className="bp-hero-orbit orbit-one"></div>
              <div className="bp-hero-orbit orbit-two"></div>
              <div className="bp-hero-document">
                <FileText />
                <div className="bp-hero-lines">
                  <span></span><span></span><span></span><span></span>
                </div>
                <div className="bp-hero-chart">
                  <i></i><i></i><i></i><i></i>
                </div>
                <div className="bp-hero-check"><Check /></div>
              </div>
            </div>
          </div>

          <div className="bp-dashboard-status-card">
            <div className="bp-dashboard-status-header">
              <div>
                <h2>PROPOSALS BY STATUS</h2>
                <p>Distribution of budget proposals for FY {selectedYear}.</p>
              </div>
              <div className="bp-mini-year">
                <CalendarDays />
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  aria-label="Status fiscal year"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
                <ChevronDown />
              </div>
            </div>

            <div className="bp-status-chart-area">
              <div
                className="bp-donut"
                style={{
                  background: `conic-gradient(#10a968 0% ${percentage(approved)}%, #f59e0b ${percentage(approved)}% ${percentage(approved + review)}%, #ef4444 ${percentage(approved + review)}% ${percentage(approved + review + rejected)}%, #e2e8f0 ${percentage(approved + review + rejected)}% 100%)`
                }}
              >
                <div className="bp-donut-center">
                  <strong>{total}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="bp-status-legend">
                <div className="bp-status-legend-row">
                  <span><i className="legend-dot dot-green"></i>Approved</span>
                  <strong>{approved} ({percentage(approved)}%)</strong>
                </div>
                <div className="bp-status-legend-row">
                  <span><i className="legend-dot dot-orange"></i>For Review</span>
                  <strong>{review} ({percentage(review)}%)</strong>
                </div>
                <div className="bp-status-legend-row">
                  <span><i className="legend-dot dot-red"></i>Rejected</span>
                  <strong>{rejected} ({percentage(rejected)}%)</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Module shortcuts */}
        <div className="bp-dashboard-section-heading">
          <div>
            <h2>MODULES</h2>
            <p>Quick access to budget proposal functions.</p>
          </div>
        </div>

        <div className="bp-dashboard-module-grid">

          <button type="button" className="bp-dashboard-module-card module-blue" onClick={() => { setOverviewMode('summary'); handleSectionClick('overview'); }}>
            <div className="bp-module-icon"><BarChart3 /></div>
            <div className="bp-module-copy">
              <h3>1. Overview</h3>
              <p>View proposal summary, status, and recent submissions.</p>
            </div>
            <span className="bp-module-action">View Overview <ArrowRight /></span>
          </button>

          <button type="button" className="bp-dashboard-module-card module-green" onClick={() => handleSectionClick('create')}>
            <div className="bp-module-icon"><Plus /></div>
            <div className="bp-module-copy">
              <h3>2. Create Proposal</h3>
              <p>Create a new budget proposal and enter required information.</p>
            </div>
            <span className="bp-module-action">Create Proposal <ArrowRight /></span>
          </button>

          <button type="button" className="bp-dashboard-module-card module-purple" onClick={() => handleSectionClick('records')}>
            <div className="bp-module-icon"><ClipboardList /></div>
            <div className="bp-module-copy">
              <h3>3. Manage &amp; Review</h3>
              <p>View, edit, and process proposals through the approval workflow.</p>
            </div>
            <span className="bp-module-action">Manage Proposals <ArrowRight /></span>
          </button>

          <button type="button" className="bp-dashboard-module-card module-orange" onClick={() => handleSectionClick('reports')}>
            <div className="bp-module-icon"><History /></div>
            <div className="bp-module-copy">
              <h3>4. History &amp; Reports</h3>
              <p>View proposal history and generate summaries and reports.</p>
            </div>
            <span className="bp-module-action">View Reports <ArrowRight /></span>
          </button>

        </div>

        {/* Recent proposals */}
        <div className="bp-dashboard-recent-card">
          <div className="bp-dashboard-recent-header">
            <div>
              <h2>RECENT BUDGET PROPOSALS</h2>
              <p>Latest submitted budget proposals for FY {selectedYear}.</p>
            </div>
            <div className="bp-recent-tools">
              <label className="bp-recent-search">
                <Search />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search reference no., department, or title..."
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bp-recent-filter"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="For Revision">For Revision</option>
                <option value="Endorsed">Endorsed</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button type="button" className="bp-view-all-button" onClick={() => handleSectionClick('records')}>
                View All <ArrowRight />
              </button>
            </div>
          </div>

          <div className="bp-dashboard-table-wrap">
            <table className="bp-dashboard-table">
              <thead>
                <tr>
                  <th>REFERENCE NO.</th>
                  <th>DATE SUBMITTED</th>
                  <th>DEPARTMENT</th>
                  <th>FUND</th>
                  <th>TITLE / PARTICULARS</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((proposal) => (
                  <tr key={proposal.id || referenceOf(proposal)}>
                    <td className="bp-table-reference">{referenceOf(proposal)}</td>
                    <td>{formatRecentDate(proposal)}</td>
                    <td>{departmentOf(proposal)}</td>
                    <td>{fundOf(proposal)}</td>
                    <td className="bp-table-title" title={titleOf(proposal)}>{titleOf(proposal)}</td>
                    <td className="bp-table-amount">{formatCurrency(amountOf(proposal))}</td>
                    <td>
                      <span className={`bp-dashboard-status-pill ${getStatusClass(statusLabel(proposal))}`}>
                        {statusLabel(proposal)}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="bp-table-view-button" onClick={() => openProposal(proposal)}>
                        <Eye /> View
                      </button>
                    </td>
                  </tr>
                ))}

                {recentRecords.length === 0 && (
                  <tr>
                    <td colSpan="8" className="bp-dashboard-empty-row">
                      No budget proposals found for FY {selectedYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bp-dashboard-recent-footer">
            <span>Showing {recentRecords.length ? 1 : 0} to {recentRecords.length} of {proposalRecords.length} entries</span>
            <div className="bp-dashboard-recent-pagination">
              <button type="button" disabled><ArrowLeft /></button>
              <button type="button" className="active">1</button>
              {proposalRecords.length > 5 && <button type="button" onClick={() => handleSectionClick('records')}>2</button>}
              <button type="button" onClick={() => handleSectionClick('records')}><ArrowRight /></button>
            </div>
          </div>
        </div>

      </div>
    );
  };


  // ==========================================================
  // SELECT SCREEN
  // ==========================================================

  const renderContent = () => {

    switch (selectedSection) {

      case 'overview':
        return renderOverview();

      case 'create':
        return renderCreateProposal();

      case 'records':
        return renderRecords();

      case 'review':
        return renderReview();

      case 'workflow':
        return renderWorkflow();

      case 'history':
        return renderHistory();

      case 'reports':
        return renderReports();

      case 'proposal-details':
        return renderProposalDetails();

      default:
        return renderModules();

    }

  };


  // ==========================================================
  // FINAL RENDER
  // ==========================================================

  return (

    <Layout
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath={activePath}
    >

      <style>
        {styles}
      </style>

      {renderContent()}

    </Layout>

  );

}