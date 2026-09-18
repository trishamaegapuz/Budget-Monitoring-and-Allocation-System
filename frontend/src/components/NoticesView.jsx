// frontend/src/components/NoticesView.jsx
import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function NoticesView({ user, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem('token');
  const [notices, setNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/dashboard/notices?page=${currentPage}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotices(data.notices);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [currentPage, token]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => onNavigate('/')} className="text-[#1a237e] hover:underline flex items-center gap-1 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-[#0f172a]">All System Notices</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0b1e42] text-white text-[10px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-5 py-4">DATE</th>
              <th className="px-5 py-4">MESSAGE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="2" className="px-5 py-6 text-center text-gray-400">Loading notices...</td></tr>
            ) : notices.length === 0 ? (
              <tr><td colSpan="2" className="px-5 py-6 text-center text-gray-400">No notices available.</td></tr>
            ) : (
              notices.map((notice, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-gray-600">{new Date(notice.date).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-gray-800">{notice.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {!loading && notices.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-600">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i + 1;
                return (
                  <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 flex justify-center items-center rounded border text-xs font-medium ${currentPage === pageNum ? 'bg-[#0b1e42] text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}