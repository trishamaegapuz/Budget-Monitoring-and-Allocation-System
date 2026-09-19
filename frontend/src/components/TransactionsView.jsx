import { API_URL } from '../config/api';
// frontend/src/components/TransactionsView.jsx
import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';



export default function TransactionsView({ user, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem('token');
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/dashboard/transactions?page=${currentPage}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
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
        <h2 className="text-2xl font-bold text-[#0f172a]">All Transactions</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0b1e42] text-white text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-4">DATE</th>
                <th className="px-5 py-4">REFERENCE NO.</th>
                <th className="px-5 py-4">PARTICULARS</th>
                <th className="px-5 py-4">TYPE</th>
                <th className="px-5 py-4 text-right">AMOUNT</th>
                <th className="px-5 py-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-6 text-center text-gray-400">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-6 text-center text-gray-400">No transactions found.</td></tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{tx.ref}</td>
                    <td className="px-5 py-4 text-gray-600 truncate max-w-[200px]">{tx.particulars}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${tx.type === 'RAOD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-800">?{Number(tx.amount).toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {!loading && transactions.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-600">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 3 + i + 1;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 flex justify-center items-center rounded border text-xs font-medium ${currentPage === pageNum ? 'bg-[#0b1e42] text-white border-[#0b1e42]' : 'border-gray-200 hover:bg-gray-50'}`}>
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

