import React, { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, Activity, PieChart, FileText } from 'lucide-react';

export default function RegisterPage({ onSwitchToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',    // ✅ changed from 'name' to 'full_name'
    username: '',
    email: '',
    password: '',
    role: 'Staff',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscore)';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const payload = {
        full_name: formData.full_name,   // ✅ send correct field name
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSuccess(false);
        setMessage(data.message || data.error || 'Registration failed.');
      } else {
        setIsSuccess(true);
        setMessage(data.message || 'Registration submitted successfully. A confirmation email has been sent to your email address. Please wait for Administrator approval.');
        setTimeout(() => {
          if (typeof onSwitchToLogin === 'function') {
            onSwitchToLogin();
          }
        }, 2500);
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage('Cannot connect to the server. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-gray-100 font-sans">
      {/* LEFT PANEL - unchanged */}
      <div className="w-full lg:w-[58%] bg-[#1a237e] text-white p-6 lg:p-10 flex flex-col justify-between items-center relative">
        <div className="w-full flex flex-col items-center text-center">
          <img src="/UA_logo.jpg" alt="University of Abra Logo" className="w-20 h-20 rounded-full border-2 border-white shadow-lg object-cover mb-2" />
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white">UNIVERSITY OF ABRA</h1>
          <p className="text-blue-200 text-sm mt-0.5">Budget Monitoring & Allocation System (BMAS)</p>
        </div>
        <div className="flex-1 flex items-center justify-center w-full my-1">
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 shadow-xl text-center">
            <img src="/hero_photo.png" alt="Budget dashboard" className="w-full h-auto rounded-lg max-h-28 object-cover" />
            <p className="text-[10px] text-blue-100 mt-1 font-medium">Visual Insights & Analytics – Graphical overview of university budget utilization</p>
          </div>
        </div>
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-blue-800/60 pt-4 mt-1">
          <div className="flex flex-col items-center text-center px-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1"><ShieldCheck className="w-4 h-4 text-blue-200" /></div>
            <span className="text-[11px] font-bold tracking-wide leading-tight">SECURE ACCESS</span>
            <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Protection for all user accounts and data</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1"><Activity className="w-4 h-4 text-blue-200" /></div>
            <span className="text-[11px] font-bold tracking-wide leading-tight">REAL-TIME MONITORING</span>
            <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Live updates of budget utilization</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1"><PieChart className="w-4 h-4 text-blue-200" /></div>
            <span className="text-[11px] font-bold tracking-wide leading-tight">SMART ALLOCATION</span>
            <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Intelligent tools for optimal budget planning</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1"><FileText className="w-4 h-4 text-blue-200" /></div>
            <span className="text-[11px] font-bold tracking-wide leading-tight">ACCURATE REPORTS</span>
            <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Detailed analysis and insight generation</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL – Registration Form */}
      <div className="w-full lg:w-[42%] bg-gray-50 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
            <p className="text-xs text-gray-500 mt-1">Budget Office Staff Registration</p>
          </div>

          {message && (
            <div className={`mb-4 p-3 text-xs rounded-xl border flex items-center gap-2 ${isSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isSuccess && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${errors.full_name ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Juan Dela Cruz"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    if (errors.full_name) setErrors({ ...errors, full_name: '' });
                  }}
                />
              </div>
              {errors.full_name && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.full_name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${errors.username ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: '' });
                  }}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.password}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role Requested</label>
              <select
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Budget Officer">Budget Officer</option>
                <option value="Accountant">Accountant</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl font-semibold text-sm transition shadow-lg mt-2 disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : 'Submit Registration'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Already registered?{' '}
            <button onClick={onSwitchToLogin} className="text-[#1a237e] font-bold hover:underline bg-transparent border-0 cursor-pointer">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}