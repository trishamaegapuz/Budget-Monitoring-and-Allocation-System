import { API_URL } from '../config/api';
// frontend/src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import Toast from './Toast';
import {
  Users,
  UserCheck,
  Lock,
  Shield,
  Wrench,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  CheckCircle,
} from 'lucide-react';



export default function UserManagement({ user: currentUser, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem('token');

  // --- States ---
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, roles: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter & Pagination States
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 8,
  });
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0, currentPage: 1 });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });
  const hideToast = () => setToast(null);

  // --- Modals States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [addForm, setAddForm] = useState({
    full_name: '', username: '', email: '', password: '', role: 'Budget Staff', status: 'pending'
  });
  const [editForm, setEditForm] = useState({});

  // Determine if current user is Administrator
  const isAdmin = currentUser?.role === 'Administrator';

  // --- Data Fetching ---
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/user-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let statusParam = filters.status;
      if (statusParam === 'Active') statusParam = 'approved';
      else if (statusParam === 'Inactive') statusParam = 'rejected';
      else statusParam = '';

      const query = new URLSearchParams({
        search: filters.search || '',
        role: filters.role || '',
        status: statusParam || '',
        page: filters.page,
        limit: filters.limit,
      }).toString();

      const res = await fetch(`${API_URL}/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination({
          totalPages: data.totalPages || 1,
          totalItems: data.totalItems || 0,
          currentPage: data.currentPage || 1,
        });
      }
    } catch (err) {
      console.error('Users fetch error:', err);
      showToast('Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [filters.page, filters.search, filters.role, filters.status]);

  // --- Handlers ---
  const handleResetFilters = () => {
    setFilters({ search: '', role: '', status: '', page: 1, limit: 8 });
  };

  // Only Admin can add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Only Administrators can add users.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: addForm.full_name,
          username: addForm.username,
          email: addForm.email,
          password: addForm.password,
          role: addForm.role,
          status: addForm.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to add user');
      await fetchUsers();
      await fetchStats();
      setShowAddModal(false);
      showToast('User added successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Only Admin can edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Only Administrators can edit users.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: editForm.full_name,
          email: editForm.email,
          role: editForm.role,
          status: editForm.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchUsers();
      await fetchStats();
      setShowEditModal(false);
      showToast('User updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Only Admin can delete
  const handleDeleteClick = (id) => {
    if (!isAdmin) {
      showToast('Only Administrators can delete users.', 'error');
      return;
    }
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
      await fetchStats();
      setShowDeleteModal(false);
      showToast('User deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Approve User (Admin only) ---
  const handleApproveUser = async (userId) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to approve user');
      showToast('User approved successfully!', 'success');
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- UI Helpers ---
  const getRoleBadge = (role) => {
    const styles = {
      Administrator: 'bg-blue-100 text-blue-600',
      'Budget Officer': 'bg-blue-100 text-blue-600',
      'Budget Staff': 'bg-blue-100 text-blue-600',
      'Budget Viewer': 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const isActive = status?.toLowerCase() === 'approved' || status?.toLowerCase() === 'active';
    return (
      <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const activeCount = stats.approved || 0;
  const inactiveCount = (stats.pending || 0) + (stats.rejected || 0);

  return (
    <Layout user={currentUser} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="space-y-6 pb-8">

        {/* 1. TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">TOTAL USERS</span>
              <span className="text-2xl font-extrabold text-gray-900 my-0.5 block">{stats.total}</span>
              <span className="text-[11px] text-gray-500">All system users</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">ACTIVE USERS</span>
              <span className="text-2xl font-extrabold text-emerald-600 my-0.5 block">{activeCount}</span>
              <span className="text-[11px] text-gray-500">Currently active</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">INACTIVE USERS</span>
              <span className="text-2xl font-extrabold text-red-500 my-0.5 block">{inactiveCount}</span>
              <span className="text-[11px] text-gray-500">Currently inactive</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">ROLES</span>
              <span className="text-2xl font-extrabold text-gray-900 my-0.5 block">{stats.roles}</span>
              <span className="text-[11px] text-gray-500">System roles</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">PERMISSIONS</span>
              <span className="text-2xl font-extrabold text-gray-900 my-0.5 block">—</span>
              <span className="text-[11px] text-gray-500">System permissions</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. FILTERS & SEARCH (no department) */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-600"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
            >
              <option value="">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Budget Officer">Budget Officer</option>
              <option value="Budget Staff">Budget Staff</option>
              <option value="Budget Viewer">Budget Viewer</option>
            </select>
          </div>

          <div className="w-full sm:w-40">
            <select
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-600"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>

            {/* Only Admin can see Add button */}
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. TABLE (no department column) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">USER LIST</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="px-4 py-3.5 w-12 text-center">#</th>
                  <th className="px-4 py-3.5">Full Name</th>
                  <th className="px-4 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-400">No users found.</td></tr>
                ) : (
                  users.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3.5 text-center text-gray-400 font-medium">
                        {((pagination.currentPage || 1) - 1) * 8 + index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{row.full_name}</td>
                      <td className="px-4 py-3.5 text-gray-600">{row.username}</td>
                      <td className="px-4 py-3.5 text-gray-600">{row.email}</td>
                      <td className="px-4 py-3.5">{getRoleBadge(row.role)}</td>
                      <td className="px-4 py-3.5 text-center">{getStatusBadge(row.status)}</td>
                      <td className="px-4 py-3.5 text-gray-500">{row.last_login ? new Date(row.last_login).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View button always visible */}
                          <button
                            onClick={() => { setSelectedUser(row); setShowViewModal(true); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Only Admin can see Edit, Delete, Approve */}
                          {isAdmin && (
                            <>
                              {/* Approve button only for pending users */}
                              {row.status?.toLowerCase() === 'pending' && (
                                <button
                                  onClick={() => handleApproveUser(row.id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 border border-green-100 rounded-lg transition"
                                  title="Approve User"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => { setSelectedUser(row); setEditForm({ ...row }); setShowEditModal(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(row.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing {((pagination.currentPage || 1) - 1) * 8 + 1} to{' '}
              {Math.min((pagination.currentPage || 1) * 8, pagination.totalItems)} of {pagination.totalItems} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                disabled={filters.page <= 1}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {[...Array(Math.min(pagination.totalPages, 5)).keys()].map((i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setFilters({ ...filters, page: p })}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs ${
                      p === (filters.page || 1)
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && <span className="px-1 text-gray-400">â€¦</span>}
              {pagination.totalPages > 5 && (
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.totalPages })}
                  className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs"
                >
                  {pagination.totalPages}
                </button>
              )}
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, (filters.page || 1) + 1) })}
                disabled={filters.page >= pagination.totalPages}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM INFO BANNER */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 text-white rounded-full shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-600">
            Manage user accounts, roles and permissions to control access to system features and data.
          </p>
        </div>
      </div>

      {/* ====== MODALS ====== */}

      {/* ADD USER MODAL â€“ only Admin sees it, but keep as is */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Username</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                  <option value="Administrator">Administrator</option>
                  <option value="Budget Officer">Budget Officer</option>
                  <option value="Budget Staff">Budget Staff</option>
                  <option value="Budget Viewer">Budget Viewer</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">User Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-gray-500">Name:</span> {selectedUser.full_name}</p>
              <p><span className="font-semibold text-gray-500">Username:</span> {selectedUser.username}</p>
              <p><span className="font-semibold text-gray-500">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold text-gray-500">Role:</span> {selectedUser.role}</p>
              <p><span className="font-semibold text-gray-500">Status:</span> {selectedUser.status}</p>
              <p><span className="font-semibold text-gray-500">Last Login:</span> {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL â€“ only Admin sees it, but keep as is */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-600" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={editForm.role || 'Budget Staff'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="Administrator">Administrator</option>
                  <option value="Budget Officer">Budget Officer</option>
                  <option value="Budget Staff">Budget Staff</option>
                  <option value="Budget Viewer">Budget Viewer</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={editForm.status || 'pending'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL â€“ only Admin sees it */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-xs text-gray-500">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </Layout>
  );
}
