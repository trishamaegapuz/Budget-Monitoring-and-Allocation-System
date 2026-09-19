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

  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [proposalError, setProposalError] = useState('');
  const [proposalHistory, setProposalHistory] = useState([]);
  const [proposalForm, setProposalForm] = useState({
    fundCluster: '',
    fundCode: '',
    campus: '',
    responsibilityCenter: '',
    wfpDescription: '',
    sourceCode: '',
    department: '',
    uacsCode: '',
    classification: '',
    amount: '',
    fundingSource: '',
    particulars: '',
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
  }, [selectedYear]);

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
      setProposalError('');

      const amount = Number(proposalForm.amount);

      if (!proposalForm.department.trim()) {
        throw new Error('PAP / Department is required.');
      }

      if (!proposalForm.particulars.trim()) {
        throw new Error('Particulars / Description is required.');
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Proposed Amount must be greater than zero.');
      }

      const payload = {
        fiscal_year: selectedYear,
        department: proposalForm.department,
        proponent: proposalForm.proponent || user?.name || user?.username || 'System User',
        title: proposalForm.title || proposalForm.particulars,
        description: proposalForm.particulars,
        fund_source: proposalForm.fundingSource || proposalForm.fundCluster || null,
        amount,
        remarks: proposalForm.remarks || null,
        created_by: user?.id || user?.user_id || null,
        fund_cluster: proposalForm.fundCluster,
        fund_code: proposalForm.fundCode,
        campus: proposalForm.campus,
        responsibility_center: proposalForm.responsibilityCenter,
        wfp_description: proposalForm.wfpDescription,
        source_code: proposalForm.sourceCode,
        uacs_code: proposalForm.uacsCode,
        budget_classification: proposalForm.classification
      };

      const response = await fetch(
        `${API_URL}/budget-proposals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to save budget proposal.');
      }

      if (submit && data.proposal?.id) {
        await fetch(
          `${API_URL}/budget-proposals/${data.proposal.id}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders()
            },
            body: JSON.stringify({ status: 'Submitted' })
          }
        );
      }

      setFormSaved(true);
      setProposalForm({
        fundCluster: '',
        fundCode: '',
        campus: '',
        responsibilityCenter: '',
        wfpDescription: '',
        sourceCode: '',
        department: '',
        uacsCode: '',
        classification: '',
        amount: '',
        fundingSource: '',
        particulars: '',
        proponent: '',
        title: '',
        remarks: ''
      });

      await loadBudgetProposals();
    } catch (error) {
      console.error('Budget Proposal save error:', error);
      setProposalError(error.message || 'Unable to save budget proposal.');
    }
  };

  const changeProposalStatus = async (status) => {
    if (!selectedProposal?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/budget-proposals/${selectedProposal.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
          },
          body: JSON.stringify({
            status,
            remarks: reviewMessage
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to update proposal status.');
      }

      const updatedProposal = data.proposal || selectedProposal;
      setSelectedProposal(updatedProposal);
      setWorkflowAction(status.toLowerCase());
      await loadBudgetProposals();
      await loadProposalHistory(updatedProposal?.id);
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

    proposalRecords.forEach(item => {
      const name = item.fundGroup || item.fund_source || 'Other Funds';
      const current = groups.get(name) || {
        name,
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
    pendingProposals: proposalRecords.filter(item => item.status === 'Pending' || item.status === 'Draft').length,
    reviewProposals: proposalRecords.filter(item => item.status === 'For Review' || item.status === 'Submitted').length,
    endorsedProposals: proposalRecords.filter(item => item.status === 'Endorsed').length,
    approvedProposals: proposalRecords.filter(item => item.status === 'Approved').length,
    returnedProposals: proposalRecords.filter(item => item.status === 'Returned' || item.status === 'Disapproved').length
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


  // ==========================================================
  // OVERVIEW
  // ==========================================================

  const overviewData = useMemo(() => {

    if (
      overviewFundGroup ===
      'All Fund Groups'
    ) {
      return fundGroupData;
    }

    return fundGroupData.filter(
      item =>
        item.name ===
        overviewFundGroup
    );

  }, [
    overviewFundGroup
  ]);


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


  // ==========================================================
  // STATUS DATA
  // ==========================================================

  const proposalStatuses = [

    {
      label: 'Pending',
      count:
        summaryData.pendingProposals,
      className:
        'bp-status-pending'
    },

    {
      label: 'For Review',
      count:
        summaryData.reviewProposals,
      className:
        'bp-status-review'
    },

    {
      label: 'Endorsed',
      count:
        summaryData.endorsedProposals,
      className:
        'bp-status-endorsed'
    },

    {
      label: 'Approved',
      count:
        summaryData.approvedProposals,
      className:
        'bp-status-approved'
    },

    {
      label: 'Returned',
      count:
        summaryData.returnedProposals,
      className:
        'bp-status-returned'
    },

    {
      label: 'Disapproved',
      count: 0,
      className:
        'bp-status-disapproved'
    }

  ];


  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  const getStatusClass = (status) => {

    switch (status) {

      case 'Pending':
        return 'bp-badge-pending';

      case 'For Review':
        return 'bp-badge-review';

      case 'Endorsed':
        return 'bp-badge-endorsed';

      case 'Approved':
        return 'bp-badge-approved';

      case 'Returned':
        return 'bp-badge-returned';

      case 'Disapproved':
        return 'bp-badge-disapproved';

      default:
        return 'bp-badge-default';

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
      font-size: 16px;
      font-weight: 850;
    }

    .bp-screen-heading p {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 10px;
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
      font-size: 11px;
      font-weight: 850;
      text-transform: uppercase;
    }

    .bp-panel-subtitle {
      margin: 3px 0 0;
      color: #94a3b8;
      font-size: 8.5px;
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
      border-radius: 6px;
      padding: 14px;
      min-width: 0;
      width: 100%;
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

    .bp-card-button {
      width: 100%;
      margin-top: 7px;
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

    .bp-status-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bp-status-row {
      display: grid;
      grid-template-columns:
        95px
        minmax(0, 1fr)
        35px;
      align-items: center;
      gap: 8px;
    }

    .bp-status-name {
      color: #475569;
      font-size: 9px;
      font-weight: 700;
    }

    .bp-status-bar {
      height: 8px;
      background: #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
    }

    .bp-status-fill {
      height: 100%;
      border-radius: 20px;
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

    .bp-fund-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .bp-fund-row {
      display: grid;
      grid-template-columns:
        minmax(90px, 1fr)
        auto;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border: 1px solid #edf2f7;
      border-radius: 5px;
      background: #fafcff;
    }

    .bp-fund-name {
      color: #334155;
      font-size: 9px;
      font-weight: 700;
    }

    .bp-fund-value {
      color: #10255c;
      font-size: 9px;
      font-weight: 800;
      text-align: right;
    }

    .bp-fund-mini-bar {
      grid-column: 1 / -1;
      height: 5px;
      background: #eaf0f7;
      border-radius: 10px;
      overflow: hidden;
    }

    .bp-fund-mini-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 10px;
    }


    /* ========================================================
       TABLE
    ======================================================== */

    .bp-budget-table-wrap {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .bp-budget-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }

    .bp-budget-table th {
      padding: 9px;
      background: #f8fafc;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: left;
      white-space: nowrap;
    }

    .bp-budget-table td {
      padding: 9px;
      border-bottom: 1px solid #edf2f7;
      color: #475569;
      font-size: 8.5px;
      vertical-align: middle;
    }

    .bp-budget-table tr:last-child td {
      border-bottom: none;
    }

    .bp-budget-table .amount {
      text-align: right;
      color: #10255c;
      font-weight: 800;
      white-space: nowrap;
    }

    .bp-total-row td {
      background: #f8fafc;
      color: #10255c;
      font-weight: 900;
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
      align-items: stretch;
      gap: 0;
      overflow-x: auto;
      padding: 8px 2px 14px;
    }

    .bp-workflow-step {
      min-width: 145px;
      flex: 1;
      position: relative;
      padding: 12px 10px;
      border: 1px solid #dbe3ee;
      background: #ffffff;
      text-align: center;
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
      display: flex;
      align-items: center;
      color: #cbd5e1;
      flex-shrink: 0;
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

    const maximumStatus =
      Math.max(
        ...proposalStatuses.map(
          item => item.count
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
              {summaryData.pendingProposals +
                summaryData.reviewProposals}
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

            <div className="bp-status-list">

              {proposalStatuses.map(item => (

                <div
                  className="bp-status-row"
                  key={item.label}
                >

                  <span className="bp-status-name">
                    {item.label}
                  </span>

                  <div className="bp-status-bar">

                    <div
                      className={
                        `bp-status-fill ${item.className}`
                      }
                      style={{
                        width:
                          `${(
                            item.count /
                            maximumStatus
                          ) * 100}%`
                      }}
                    />

                  </div>

                  <span className="bp-status-count">
                    {item.count}
                  </span>

                </div>

              ))}

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
                  Budget Status by Fund Group
                </h3>

                <p className="bp-panel-subtitle">
                  Reference budget, obligation,
                  disbursement and balance
                </p>

              </div>

            </div>

            <div className="bp-budget-table-wrap">

              <table className="bp-budget-table">

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

                  {overviewData.map(item => (

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
                  ₱0.00
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  MOOE
                </div>
                <div className="bp-info-value">
                  ₱0.00
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  CO
                </div>
                <div className="bp-info-value">
                  ₱0.00
                </div>
              </div>

              <div className="bp-info-card">
                <div className="bp-info-label">
                  Total
                </div>
                <div className="bp-info-value">
                  ₱0.00
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

            <table className="bp-budget-table">

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

                {proposalRecords.slice(0, 4).map(
                  proposal => (

                    <tr key={proposal.id}>

                      <td>
                        {proposal.reference}
                      </td>

                      <td>
                        {proposal.date}
                      </td>

                      <td>
                        {proposal.department}
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

        <h2>
          Budget Proposal Submission
        </h2>

        <p>
          Encode the proposed budget using the
          fund, campus, responsibility center,
          WFP and UACS information reflected in
          the RBUD / RAOD structure.
        </p>

      </div>
      {formSaved && (

        <div className="bp-success-message">

          <Check />

          Proposal information has been prepared
          successfully for database submission.

        </div>

      )}


      <div className="bp-info-grid">

        <div className="bp-info-card">

          <div className="bp-info-label">
            Fiscal Year
          </div>

          <div className="bp-info-value">
            {selectedYear}
          </div>

        </div>

        <div className="bp-info-card">

          <div className="bp-info-label">
            Proposal Type
          </div>

          <div className="bp-info-value">
            Budget Proposal
          </div>

        </div>

        <div className="bp-info-card">

          <div className="bp-info-label">
            Workflow
          </div>

          <div className="bp-info-value">
            Draft
          </div>

        </div>

        <div className="bp-info-card">

          <div className="bp-info-label">
            Status
          </div>

          <div className="bp-info-value">
            For Submission
          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              1. Fund Information
            </h3>

            <p className="bp-panel-subtitle">
              Fund Cluster, Fund Code, Campus,
              RC, WFP Description and Source Code
            </p>

          </div>

        </div>


        <div className="bp-form-grid-three">

          <div className="bp-form-group">

            <label className="bp-form-label">
              Fund Cluster <span>*</span>
            </label>

            <select
              className="bp-form-select"
              value={proposalForm.fundCluster}
              onChange={event => updateProposalForm('fundCluster', event.target.value)}
            >
              <option value="">Select Fund Cluster</option>
              {fundGroupData.map(item => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Fund Code <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="Enter fund code"
              value={proposalForm.fundCode}
              onChange={event => updateProposalForm('fundCode', event.target.value)}
            />

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Campus <span>*</span>
            </label>

            <select
              className="bp-form-select"
              value={proposalForm.campus}
              onChange={event => updateProposalForm('campus', event.target.value)}
            >

              <option value="">
                Select Campus
              </option>

              <option>
                LAGANGILANG
              </option>

              <option>
                BANGUED
              </option>

              <option>
                Other Campus
              </option>

            </select>

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Responsibility Center (RC) <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="e.g. III-A"
              value={proposalForm.responsibilityCenter}
              onChange={event => updateProposalForm('responsibilityCenter', event.target.value)}
            />

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              WFP Description <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="Enter WFP description"
              value={proposalForm.wfpDescription}
              onChange={event => updateProposalForm('wfpDescription', event.target.value)}
            />

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Source Code <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="Enter source code"
              value={proposalForm.sourceCode}
              onChange={event => updateProposalForm('sourceCode', event.target.value)}
            />

          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              2. Department / Program Information
            </h3>

            <p className="bp-panel-subtitle">
              PAP / Department and UACS classification
            </p>

          </div>

        </div>


        <div className="bp-form-grid-three">

          <div className="bp-form-group">

            <label className="bp-form-label">
              PAP / Department <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="Enter PAP / Department"
              value={proposalForm.department}
              onChange={event => updateProposalForm('department', event.target.value)}
            />

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              UACS Code <span>*</span>
            </label>

            <input
              className="bp-form-input"
              placeholder="Enter UACS code"
              value={proposalForm.uacsCode}
              onChange={event => updateProposalForm('uacsCode', event.target.value)}
            />

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Budget Classification
            </label>

            <select
              className="bp-form-select"
              value={proposalForm.classification}
              onChange={event => updateProposalForm('classification', event.target.value)}
            >

              <option value="">
                Select Classification
              </option>

              <option>
                PS - Personnel Services
              </option>

              <option>
                MOOE - Maintenance and Other
                Operating Expenses
              </option>

              <option>
                CO - Capital Outlay
              </option>

            </select>

          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              3. Proposed Amounts
            </h3>

            <p className="bp-panel-subtitle">
              Proposed budget amount and description
            </p>

          </div>

        </div>


        <div className="bp-form-grid">

          <div className="bp-form-group">

            <label className="bp-form-label">
              Proposed Amount <span>*</span>
            </label>

            <input
              type="number"
              className="bp-form-input"
              placeholder="0.00"
              value={proposalForm.amount}
              onChange={event => updateProposalForm('amount', event.target.value)}
            />

            <span className="bp-form-help">
              Enter the amount proposed for allocation.
            </span>

          </div>


          <div className="bp-form-group">

            <label className="bp-form-label">
              Funding Source
            </label>

            <select
              className="bp-form-select"
              value={proposalForm.fundingSource}
              onChange={event => updateProposalForm('fundingSource', event.target.value)}
            >

              <option value="">
                Select Funding Source
              </option>

              <option>
                New General Appropriations
              </option>

              <option>
                Continuing Appropriations
              </option>

              <option>
                Supplemental Appropriations
              </option>

            </select>

          </div>


          <div className="bp-form-group full">

            <label className="bp-form-label">
              Particulars / Description <span>*</span>
            </label>

            <textarea
              className="bp-form-textarea"
              placeholder="Describe the proposed budget requirement..."
              value={proposalForm.particulars}
              onChange={event => updateProposalForm('particulars', event.target.value)}
            />

          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              4. Supporting Documents
            </h3>

            <p className="bp-panel-subtitle">
              Attach proposal supporting documents
            </p>

          </div>

        </div>


        <div className="bp-form-group">

          <label className="bp-form-label">
            Supporting Document
          </label>

          <input
            type="file"
            className="bp-form-input"
          />

          <span className="bp-form-help">
            Current database upload field only. File storage
            will be connected during database/backend
            integration.
          </span>

        </div>


        <div className="bp-form-actions">

          <button
            className="bp-secondary-button"
            onClick={goBackToModules}
          >
            Cancel
          </button>

          <button
            className="bp-primary-button"
            onClick={() => saveProposal(false)}
          >

            <Save />

            Save Proposal Draft

          </button>

          <button
            className="bp-primary-button"
            onClick={() => saveProposal(true)}
          >

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

  const renderRecords = () => (

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

              <option>
                All
              </option>

              <option>
                Pending
              </option>

              <option>
                For Review
              </option>

              <option>
                Endorsed
              </option>

              <option>
                Approved
              </option>

              <option>
                Returned
              </option>

              <option>
                Disapproved
              </option>

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

          <table className="bp-budget-table">

            <thead>

              <tr>

                <th>Reference</th>
                <th>Date</th>
                <th>Fund Cluster</th>
                <th>Fund Code</th>
                <th>Campus</th>
                <th>RC</th>
                <th>PAP / Department</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {filteredProposals.map(
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
                      {proposal.department}
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

    </div>

  );


  // ==========================================================
  // REVIEW & ENDORSEMENT
  // ==========================================================

  const renderReview = () => {

    const reviewRecords =
      proposalRecords.filter(
        item =>
          item.status === 'Pending' ||
          item.status === 'For Review'
      );

    return (

      <div className="bp-section-page">

        <div className="bp-screen-toolbar">

          <BackButton />

        </div>


        <div className="bp-screen-heading">

          <h2>
            Review &amp; Endorsement
          </h2>

          <p>
            Review submitted budget proposals,
            verify fund information and endorse
            proposals to the next stage.
          </p>

        </div>
        <div className="bp-review-layout">

          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  Proposals for Review
                </h3>

                <p className="bp-panel-subtitle">
                  Submitted proposals awaiting review
                </p>

              </div>

            </div>


            <div className="bp-budget-table-wrap">

              <table className="bp-budget-table">

                <thead>

                  <tr>

                    <th>Reference</th>
                    <th>Department</th>
                    <th>Fund Group</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {reviewRecords.map(
                    proposal => (

                      <tr key={proposal.id}>

                        <td>
                          {proposal.reference}
                        </td>

                        <td>
                          {proposal.department}
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
                              setSelectedProposal(
                                proposal
                              )
                            }
                          >

                            <Eye />

                            Review

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>


          <div className="bp-panel">

            <div className="bp-panel-header">

              <div>

                <h3 className="bp-panel-title">
                  Review Action
                </h3>

                <p className="bp-panel-subtitle">
                  Select a proposal from the table
                </p>

              </div>

            </div>


            {selectedProposal ? (

              <>

                <div className="bp-review-item">

                  <div className="bp-review-icon">
                    <FileText />
                  </div>

                  <div>

                    <div className="bp-review-label">
                      Proposal
                    </div>

                    <div className="bp-review-value">
                      {selectedProposal.reference}
                    </div>

                  </div>

                </div>


                <div className="bp-review-item">

                  <div className="bp-review-icon">
                    <Building2 />
                  </div>

                  <div>

                    <div className="bp-review-label">
                      Department / Unit
                    </div>

                    <div className="bp-review-value">
                      {selectedProposal.department}
                    </div>

                  </div>

                </div>


                <div className="bp-review-item">

                  <div className="bp-review-icon">
                    <WalletCards />
                  </div>

                  <div>

                    <div className="bp-review-label">
                      Proposed Amount
                    </div>

                    <div className="bp-review-value">
                      {formatCurrency(
                        selectedProposal.amount
                      )}
                    </div>

                  </div>

                </div>


                <textarea
                  className="bp-review-textarea"
                  placeholder="Review remarks..."
                  value={reviewMessage}
                  onChange={(event) =>
                    setReviewMessage(
                      event.target.value
                    )
                  }
                />


                <div
                  className="bp-review-actions"
                  style={{
                    marginTop: 8
                  }}
                >

                  <button
                    className="bp-review-action endorse"
                    onClick={() => changeProposalStatus('Endorsed')}
                  >

                    <CheckCircle2 />

                    Endorse Proposal

                  </button>


                  <button
                    className="bp-review-action return"
                    onClick={() => changeProposalStatus('Returned')}
                  >

                    <RotateCcw />

                    Return for Revision

                  </button>


                  <button
                    className="bp-review-action neutral"
                    onClick={() =>
                      openProposal(
                        selectedProposal
                      )
                    }
                  >

                    <Eye />

                    View Full Details

                  </button>

                </div>

              </>

            ) : (

              <div className="bp-empty">

                <FileCheck2 />

                <div className="bp-empty-title">
                  No Proposal Selected
                </div>

                <div className="bp-empty-text">
                  Select a proposal from the review
                  table to inspect its details.
                </div>

              </div>

            )}

          </div>

        </div>


        <div className="bp-panel">

          <div className="bp-panel-header">

            <div>

              <h3 className="bp-panel-title">
                Endorsement Checklist
              </h3>

              <p className="bp-panel-subtitle">
                Review points before endorsement
              </p>

            </div>

          </div>


          <div className="bp-info-grid">

            <div className="bp-info-card">

              <div className="bp-info-label">
                Fund Information
              </div>

              <div className="bp-info-value">
                <Check size={13} />
                Verified
              </div>

            </div>


            <div className="bp-info-card">

              <div className="bp-info-label">
                UACS / PAP
              </div>

              <div className="bp-info-value">
                <Check size={13} />
                Reviewed
              </div>

            </div>


            <div className="bp-info-card">

              <div className="bp-info-label">
                Proposed Amount
              </div>

              <div className="bp-info-value">
                <Check size={13} />
                Checked
              </div>

            </div>


            <div className="bp-info-card">

              <div className="bp-info-label">
                Documents
              </div>

              <div className="bp-info-value">
                <Clock3 size={13} />
                Pending
              </div>

            </div>

          </div>

        </div>

      </div>

    );

  };


  // ==========================================================
  // APPROVAL WORKFLOW
  // ==========================================================

  const renderWorkflow = () => (

    <div className="bp-section-page">

      <div className="bp-screen-toolbar">

        <BackButton />

      </div>


      <div className="bp-screen-heading">

        <h2>
          Approval Workflow
        </h2>

        <p>
          Track the movement of a budget proposal
          from preparation and submission through
          review, endorsement and approval.
        </p>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Proposal Approval Process
            </h3>

            <p className="bp-panel-subtitle">
              Database workflow based on the proposed
              budget proposal process
            </p>

          </div>

        </div>


        <div className="bp-workflow">

          {[
            [
              '1',
              'Draft',
              'Proposal preparation'
            ],
            [
              '2',
              'Submitted',
              'Submitted by unit'
            ],
            [
              '3',
              'For Review',
              'Budget review'
            ],
            [
              '4',
              'Endorsed',
              'Endorsement'
            ],
            [
              '5',
              'For Approval',
              'Approval review'
            ],
            [
              '6',
              'Approved',
              'Final approval'
            ]

          ].map(
            (step, index) => (

              <React.Fragment
                key={step[1]}
              >

                <div
                  className={
                    `bp-workflow-step ${
                      index <= 2
                        ? 'active'
                        : ''
                    }`
                  }
                >

                  <div className="bp-workflow-number">
                    {step[0]}
                  </div>

                  <div className="bp-workflow-title">
                    {step[1]}
                  </div>

                  <div className="bp-workflow-subtitle">
                    {step[2]}
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


        <div
          className="bp-info-grid"
          style={{
            marginTop: 5
          }}
        >

          <div className="bp-info-card">

            <div className="bp-info-label">
              Current Status
            </div>

            <div className="bp-info-value">
              For Review
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Current Office
            </div>

            <div className="bp-info-value">
              Budget Office
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Next Action
            </div>

            <div className="bp-info-value">
              Review / Endorse
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Fiscal Year
            </div>

            <div className="bp-info-value">
              FY {selectedYear}
            </div>

          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Workflow Actions
            </h3>

            <p className="bp-panel-subtitle">
              Current database actions for each approval stage
            </p>

          </div>

        </div>


        <div className="bp-info-grid">

          <div className="bp-info-card">

            <div className="bp-info-label">
              Pending Approvals
            </div>

            <div className="bp-info-value">
              {summaryData.reviewProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Endorsed
            </div>

            <div className="bp-info-value">
              {summaryData.endorsedProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Approved
            </div>

            <div className="bp-info-value">
              {summaryData.approvedProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Returned
            </div>

            <div className="bp-info-value">
              {summaryData.returnedProposals}
            </div>

          </div>

        </div>


        <div className="bp-form-actions">

          <button
            className="bp-secondary-button"
            onClick={() => changeProposalStatus('Returned')}
          >

            <RotateCcw />

            Return Proposal

          </button>


          <button
            className="bp-primary-button"
            onClick={() => changeProposalStatus('Approved')}
          >

            <CheckCircle2 />

            Approve Proposal

          </button>

        </div>


        {workflowAction && (

          <div className="bp-success-message">

            <Check />

            Database workflow action applied:
            {' '}
            {workflowAction === 'approved'
              ? 'Approve Proposal'
              : 'Return Proposal'}

          </div>

        )}

      </div>

    </div>

  );


  // ==========================================================
  // PROPOSAL HISTORY
  // ==========================================================

  const renderHistory = () => (

    <div className="bp-section-page">

      <div className="bp-screen-toolbar">

        <BackButton />

      </div>


      <div className="bp-screen-heading">

        <h2>
          Proposal History
        </h2>

        <p>
          Historical record of proposal submission,
          review, endorsement, approval and return actions.
        </p>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Proposal Action History
            </h3>

            <p className="bp-panel-subtitle">
              Chronological workflow activity
            </p>

          </div>

        </div>


        <div className="bp-history">

          <div className="bp-history-item">

            <div className="bp-history-dot" />

            <div className="bp-history-date">
              January 11, 2026 · 10:30 AM
            </div>

            <div className="bp-history-title">
              Proposal Submitted
            </div>

            <div className="bp-history-description">
              Budget proposal BP-2026-004 was submitted
              by the responsible department for review.
            </div>

            <div className="bp-history-user">
              Submitted by: Department / Unit
            </div>

          </div>


          <div className="bp-history-item">

            <div className="bp-history-dot" />

            <div className="bp-history-date">
              January 11, 2026 · 11:05 AM
            </div>

            <div className="bp-history-title">
              Proposal Received for Review
            </div>

            <div className="bp-history-description">
              The proposal was received by the Budget
              Office for initial checking.
            </div>

            <div className="bp-history-user">
              Action by: Budget Office
            </div>

          </div>


          <div className="bp-history-item">

            <div className="bp-history-dot" />

            <div className="bp-history-date">
              January 12, 2026 · 09:15 AM
            </div>

            <div className="bp-history-title">
              Fund Information Checked
            </div>

            <div className="bp-history-description">
              Fund cluster, fund code, campus,
              responsibility center and WFP information
              were checked during the review stage.
            </div>

            <div className="bp-history-user">
              Action by: Budget Reviewer
            </div>

          </div>


          <div className="bp-history-item">

            <div className="bp-history-dot" />

            <div className="bp-history-date">
              January 12, 2026 · 02:20 PM
            </div>

            <div className="bp-history-title">
              Proposal Pending Endorsement
            </div>

            <div className="bp-history-description">
              Proposal is ready for endorsement after
              the initial review process.
            </div>

            <div className="bp-history-user">
              Current status: For Review
            </div>

          </div>

        </div>

      </div>


      <div className="bp-panel">

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Historical Status Summary
            </h3>

            <p className="bp-panel-subtitle">
              Current database counts by workflow status
            </p>

          </div>

        </div>


        <div className="bp-info-grid">

          <div className="bp-info-card">

            <div className="bp-info-label">
              Submitted
            </div>

            <div className="bp-info-value">
              {summaryData.totalProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Endorsed
            </div>

            <div className="bp-info-value">
              {summaryData.endorsedProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Approved
            </div>

            <div className="bp-info-value">
              {summaryData.approvedProposals}
            </div>

          </div>

          <div className="bp-info-card">

            <div className="bp-info-label">
              Returned / Disapproved
            </div>

            <div className="bp-info-value">
              {summaryData.returnedProposals}
            </div>

          </div>

        </div>

      </div>

    </div>

  );


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
    const header = [
      'Reference','Date','Fund Group','Fund Code','Campus',
      'Responsibility Center','PAP / Department','UACS Code',
      'Proposed Amount','Status','Remarks'
    ];

    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = reportFilteredRecords.map(item => [
      item.reference,
      item.date ? new Date(item.date).toLocaleDateString('en-PH') : '',
      item.fundGroup,
      item.fundCode,
      item.campus,
      item.responsibilityCenter,
      item.department,
      item.uacsCode,
      Number(item.amount || 0).toFixed(2),
      item.status,
      item.remarks
    ]);

    downloadTextFile(
      `budget-proposals-${selectedYear}.csv`,
      [header, ...rows].map(row => row.map(escapeCsv).join(',')).join('\\n'),
      'text/csv;charset=utf-8'
    );
  };

  const printReport = () => {
    const rows = reportFilteredRecords.map(item => `
      <tr>
        <td>${item.reference || ''}</td>
        <td>${item.fundGroup || ''}</td>
        <td>${item.campus || ''}</td>
        <td>${item.responsibilityCenter || ''}</td>
        <td>${item.department || ''}</td>
        <td style="text-align:right">${formatCurrency(item.amount)}</td>
        <td>${item.status || ''}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      setProposalError('Please allow pop-ups in the browser to print the report.');
      return;
    }

    printWindow.document.write(`
      <!doctype html><html><head>
      <title>Budget Proposal Report - FY ${selectedYear}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}
        h1{font-size:18px;margin:0 0 5px}
        p{font-size:12px;color:#64748b}
        table{width:100%;border-collapse:collapse;margin-top:18px}
        th,td{border:1px solid #cbd5e1;padding:7px;font-size:10px;text-align:left}
        th{background:#f1f5f9}
      </style></head><body>
      <h1>ABRA STATE INSTITUTE OF SCIENCES AND TECHNOLOGY</h1>
      <p>${reportType} — FY ${selectedYear}</p>
      <table><thead><tr>
        <th>Reference</th><th>Fund Group</th><th>Campus</th><th>RC</th>
        <th>PAP / Department</th><th>Proposed Amount</th><th>Status</th>
      </tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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


  const reportTotalAmount =
    reportFilteredRecords.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );


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

              <select className="bp-form-select">

                <option>
                  FY {selectedYear}
                </option>

                <option>
                  FY 2025
                </option>

                <option>
                  FY 2024
                </option>

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

                <option>
                  Pending
                </option>

                <option>
                  For Review
                </option>

                <option>
                  Endorsed
                </option>

                <option>
                  Approved
                </option>

                <option>
                  Returned
                </option>

                <option>
                  Disapproved
                </option>

              </select>

            </div>

          </div>


          <div className="bp-report-preview">

            <div className="bp-report-preview-header">

              <strong>
                ABRA STATE INSTITUTE OF SCIENCES
                AND TECHNOLOGY
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
                        item.status ===
                          'Pending' ||
                        item.status ===
                          'For Review'
                    ).length
                  }
                </strong>

              </div>

            </div>


            <div className="bp-budget-table-wrap">

              <table className="bp-budget-table">

                <thead>

                  <tr>

                    <th>
                      Reference
                    </th>

                    <th>
                      Fund Group
                    </th>

                    <th>
                      Campus
                    </th>

                    <th>
                      RC
                    </th>

                    <th>
                      PAP / Department
                    </th>

                    <th>
                      Proposed Amount
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reportFilteredRecords.map(
                    item => (

                      <tr key={item.id}>

                        <td>
                          {item.reference}
                        </td>

                        <td>
                          {item.fundGroup}
                        </td>

                        <td>
                          {item.campus}
                        </td>

                        <td>
                          {item.responsibilityCenter}
                        </td>

                        <td>
                          {item.department}
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            item.amount
                          )}
                        </td>

                        <td>

                          <span
                            className={
                              `bp-badge ${
                                getStatusClass(
                                  item.status
                                )
                              }`
                            }
                          >
                            {item.status}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


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

                Export Excel

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
                    {selectedProposal.sourceCode}
                  </div>

                </div>


                <div className="bp-detail-item">

                  <div className="bp-detail-label">
                    PAP / Department
                  </div>

                  <div className="bp-detail-value">
                    {selectedProposal.department}
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
                  'For Review',
                  'Endorsed',
                  'For Approval',
                  'Approved'
                ].map(
                  (step, index) => (

                    <React.Fragment
                      key={step}
                    >

                      <div
                        className={
                          `bp-workflow-step ${
                            index <= 2
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

                <button
                  className="bp-review-action neutral"
                  onClick={() =>
                    handleSectionClick(
                      'create'
                    )
                  }
                >

                  <Pencil />

                  Edit / Update

                </button>


                <button
                  className="bp-review-action neutral"
                  onClick={() =>
                    handleSectionClick(
                      'review'
                    )
                  }
                >

                  <FileCheck2 />

                  Send to Review

                </button>


                <button
                  className="bp-review-action endorse"
                  onClick={() => changeProposalStatus('Endorsed')}
                >

                  <CheckCircle2 />

                  Endorse

                </button>


                <button
                  className="bp-review-action return"
                  onClick={() => changeProposalStatus('Returned')}
                >

                  <RotateCcw />

                  Return

                </button>

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

  const renderModules = () => (

    <div className="bp-page">

      {proposalError && (
        <div className="bp-system-note" style={{ background: '#fff1f2', borderColor: '#fecaca', color: '#991b1b' }}>
          <AlertCircle />
          <span>{proposalError}</span>
        </div>
      )}

      {loadingProposals && (
        <div className="bp-system-note" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
          <RefreshCcw />
          <span>Loading budget proposals from the database...</span>
        </div>
      )}

      <div className="bp-topbar">

        <div className="bp-year-selector">

          <FileSpreadsheet className="bp-year-icon" />

          <span className="bp-year-label">
            FY
          </span>

          <select
            value={selectedYear}
            onChange={(event) =>
              setSelectedYear(
                Number(event.target.value)
              )
            }
            className="bp-year-select"
          >

            <option value={2026}>
              2026
            </option>

            <option value={2025}>
              2025
            </option>

            <option value={2024}>
              2024
            </option>

            <option value={2023}>
              2023
            </option>

          </select>

        </div>

      </div>


      <div className="bp-grid">


        {/* =================================================
            1. OVERVIEW
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-blue">
              <BarChart3 />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                1. Overview
              </h2>

              <p className="bp-card-description">
                View summary of budget proposals,
                submission status, and approval progress.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick('overview')
              }
            >
              <FileText className="bp-action-icon" />
              <span className="bp-action-label">
                Summary
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick('overview')
              }
            >
              <PieChart className="bp-action-icon" />
              <span className="bp-action-label">
                By Status
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick('overview')
              }
            >
              <Users className="bp-action-icon" />
              <span className="bp-action-label">
                By Department
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick('overview')
              }
            >
              <Database className="bp-action-icon" />
              <span className="bp-action-label">
                By Fund Group
              </span>
            </button>

          </div>


          <button
            className="bp-card-button"
            onClick={() =>
              handleSectionClick('overview')
            }
          >

            Go to Overview

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            2. CREATE PROPOSAL
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-green">
              <Plus />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                2. Create Proposal
              </h2>

              <p className="bp-card-description">
                Encode and submit a new budget proposal
                by department and fund source.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'create'
                )
              }
            >
              <FileText className="bp-action-icon" />
              <span className="bp-action-label">
                New Proposal
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'create'
                )
            }
            >
              <Database className="bp-action-icon" />
              <span className="bp-action-label">
                Fund Information
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'create'
                )
              }
            >
              <ClipboardList className="bp-action-icon" />
              <span className="bp-action-label">
                Proposed Amounts
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'create'
                )
              }
            >
              <Paperclip className="bp-action-icon" />
              <span className="bp-action-label">
                Supporting
                <br />
                Documents
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-green"
            onClick={() =>
              handleSectionClick(
                'create'
              )
            }
          >

            Create Proposal

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            3. PROPOSAL RECORDS
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-purple">
              <FileText />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                3. Proposal Records
              </h2>

              <p className="bp-card-description">
                View and manage budget proposal
                records with their status and details.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'records'
                )
              }
            >
              <ClipboardList className="bp-action-icon" />
              <span className="bp-action-label">
                All Proposals
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'records'
                )
              }
            >
              <Search className="bp-action-icon" />
              <span className="bp-action-label">
                Search / Filter
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'records'
                )
              }
            >
              <Eye className="bp-action-icon" />
              <span className="bp-action-label">
                View Details
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'records'
                )
              }
            >
              <Pencil className="bp-action-icon" />
              <span className="bp-action-label">
                Edit / Update
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-purple"
            onClick={() =>
              handleSectionClick(
                'records'
              )
            }
          >

            View Records

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            4. REVIEW & ENDORSEMENT
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-orange">
              <Users />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                4. Review &amp; Endorsement
              </h2>

              <p className="bp-card-description">
                Review proposed budgets and endorse
                them to the next stage.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'review'
                )
              }
            >
              <FolderOpen className="bp-action-icon" />
              <span className="bp-action-label">
                For Review
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'review'
                )
              }
            >
              <Send className="bp-action-icon" />
              <span className="bp-action-label">
                Endorse
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'review'
                )
              }
            >
              <RotateCcw className="bp-action-icon" />
              <span className="bp-action-label">
                Return
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <History className="bp-action-icon" />
              <span className="bp-action-label">
                Endorsement
                <br />
                History
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-orange"
            onClick={() =>
              handleSectionClick(
                'review'
              )
            }
          >

            Go to Review

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            5. APPROVAL WORKFLOW
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-teal">
              <CheckCircle2 />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                5. Approval Workflow
              </h2>

              <p className="bp-card-description">
                Track the approval status and process
                of budget proposals.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'workflow'
                )
              }
            >
              <Clock3 className="bp-action-icon" />
              <span className="bp-action-label">
                Pending
                <br />
                Approvals
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'workflow'
                )
              }
            >
              <CheckCircle2 className="bp-action-icon" />
              <span className="bp-action-label">
                Approve
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'workflow'
                )
              }
            >
              <XCircle className="bp-action-icon" />
              <span className="bp-action-label">
                Return /
                <br />
                Disapprove
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <FileCheck2 className="bp-action-icon" />
              <span className="bp-action-label">
                Approval
                <br />
                History
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-teal"
            onClick={() =>
              handleSectionClick(
                'workflow'
              )
            }
          >

            View Workflow

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            6. PROPOSAL HISTORY
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-yellow">
              <Clock3 />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                6. Proposal History
              </h2>

              <p className="bp-card-description">
                View historical records of submitted,
                endorsed, approved, returned, and
                disapproved proposals.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <FileText className="bp-action-icon" />
              <span className="bp-action-label">
                Submitted
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <Send className="bp-action-icon" />
              <span className="bp-action-label">
                Endorsed
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <CheckCircle2 className="bp-action-icon" />
              <span className="bp-action-label">
                Approved
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'history'
                )
              }
            >
              <XCircle className="bp-action-icon" />
              <span className="bp-action-label">
                Returned /
                <br />
                Disapproved
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-yellow"
            onClick={() =>
              handleSectionClick(
                'history'
              )
            }
          >

            View History

            <ArrowRight />

          </button>

        </div>


        {/* =================================================
            7. REPORTS
        ================================================= */}

        <div className="bp-card">

          <div className="bp-card-header">

            <div className="bp-card-icon bp-icon-red">
              <BarChart3 />
            </div>

            <div className="bp-card-title-area">

              <h2 className="bp-card-title">
                7. Proposal Reports &amp; Export
              </h2>

              <p className="bp-card-description">
                Generate reports related to budget
                proposals and proposal status.
              </p>

            </div>

          </div>


          <div className="bp-actions">

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'reports'
                )
              }
            >
              <FileText className="bp-action-icon" />
              <span className="bp-action-label">
                Proposal
                <br />
                Summary
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'reports'
                )
              }
            >
              <Users className="bp-action-icon" />
              <span className="bp-action-label">
                By Department
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'reports'
                )
              }
            >
              <Database className="bp-action-icon" />
              <span className="bp-action-label">
                By Fund Source
              </span>
            </button>

            <button
              className="bp-action"
              onClick={() =>
                handleSectionClick(
                  'reports'
                )
              }
            >
              <PieChart className="bp-action-icon" />
              <span className="bp-action-label">
                By Status
              </span>
            </button>

          </div>


          <button
            className="bp-card-button bp-button-red"
            onClick={() =>
              handleSectionClick(
                'reports'
              )
            }
          >

            Generate Reports

            <ArrowRight />

          </button>

        </div>

      </div>


      <div
        className="bp-panel"
        style={{
          marginTop: 14
        }}
      >

        <div className="bp-panel-header">

          <div>

            <h3 className="bp-panel-title">
              Proposal Module Summary — FY {selectedYear}
            </h3>

            <p className="bp-panel-subtitle">
              Current database workflow totals
            </p>

          </div>

        </div>


        <div className="bp-info-grid">

          <div className="bp-info-card">

            <div className="bp-info-label">
              Total Proposals
            </div>

            <div className="bp-info-value">
              {summaryData.totalProposals}
            </div>

          </div>


          <div className="bp-info-card">

            <div className="bp-info-label">
              For Review
            </div>

            <div className="bp-info-value">
              {summaryData.reviewProposals}
            </div>

          </div>


          <div className="bp-info-card">

            <div className="bp-info-label">
              Endorsed
            </div>

            <div className="bp-info-value">
              {summaryData.endorsedProposals}
            </div>

          </div>


          <div className="bp-info-card">

            <div className="bp-info-label">
              Approved
            </div>

            <div className="bp-info-value">
              {summaryData.approvedProposals}
            </div>

          </div>

        </div>

      </div>

    </div>

  );


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

