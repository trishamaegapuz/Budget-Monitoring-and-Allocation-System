// frontend/src/components/LoginPage.jsx
import { API_URL } from '../config/api';
import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Activity, PieChart, FileText, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage({ onSwitchToRegister, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Client-side validation
  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('${API_URL}/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Login failed.');
      } else {
        // If "Remember Me" is checked, set token with longer expiry (7 days)
        // We'll just store it normally, but the flag will auto-login on next visit.
        localStorage.setItem('token', data.token);
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        // Also store user data for quick access
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setMessage('Unable to connect to server. Please check your backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password handler (mock)
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMessage('Please enter your email address.');
      return;
    }
    // Mock: show success message
    setForgotMessage('A password reset link has been sent to your email (if the account exists).');
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotEmail('');
      setForgotMessage('');
    }, 3000);
  };

  return (
    <>
      <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-gray-100 font-sans">
        {/* LEFT PANEL â€“ Branding */}
        <div 
          className="w-full lg:w-[58%] bg-[#1a237e] text-white p-6 lg:p-10 flex flex-col justify-between items-center relative"
          style={{ backgroundColor: '#1a237e' }}
        >
          <div className="w-full flex flex-col items-center text-center">
            <img 
              src="/UA_logo.jpg" 
              alt="University of Abra Logo" 
              className="w-20 h-20 rounded-full border-2 border-white shadow-lg object-cover mb-2"
            />
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white">UNIVERSITY OF ABRA</h1>
            <p className="text-blue-200 text-sm mt-0.5">Budget Monitoring & Allocation System (BMAS)</p>
          </div>

          <div className="flex-1 flex items-center justify-center w-full my-1">
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 shadow-xl text-center">
              <img 
                src="/hero_photo.png" 
                alt="Budget dashboard" 
                className="w-full h-auto rounded-lg max-h-28 object-cover"
              />
              <p className="text-[10px] text-blue-100 mt-1 font-medium">
                Visual Insights & Analytics â€“ Graphical overview of university budget utilization
              </p>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-blue-800/60 pt-4 mt-1">
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-200" />
              </div>
              <span className="text-[11px] font-bold tracking-wide leading-tight">SECURE ACCESS</span>
              <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Protection for all user accounts and data</span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <Activity className="w-4 h-4 text-blue-200" />
              </div>
              <span className="text-[11px] font-bold tracking-wide leading-tight">REAL-TIME MONITORING</span>
              <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Live updates of budget utilization</span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <PieChart className="w-4 h-4 text-blue-200" />
              </div>
              <span className="text-[11px] font-bold tracking-wide leading-tight">SMART ALLOCATION</span>
              <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Intelligent tools for optimal budget planning</span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <FileText className="w-4 h-4 text-blue-200" />
              </div>
              <span className="text-[11px] font-bold tracking-wide leading-tight">ACCURATE REPORTS</span>
              <span className="text-[10px] text-blue-100 leading-snug mt-0.5">Detailed analysis and insight generation</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL â€“ Login Form */}
        <div className="w-full lg:w-[42%] bg-gray-50 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
          <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-blue-50 text-[#1a237e] rounded-2xl mb-4 shadow-sm border border-blue-100">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
              <p className="text-xs text-gray-500 mt-1">Sign in to continue to your account</p>
            </div>

            {message && (
              <div className={`mb-4 p-3 text-xs text-center rounded-xl border ${
                message.includes('successful') 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${
                      errors.username ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition ${
                      errors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your password"
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
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-[#1a237e] focus:ring-[#1a237e]"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#1a237e] font-semibold hover:underline bg-transparent border-0"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl font-semibold text-sm transition shadow-lg mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={onSwitchToRegister} 
                className="text-[#1a237e] font-bold hover:underline bg-transparent border-0 cursor-pointer ml-1"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            {forgotMessage && (
              <div className="mb-4 p-3 text-sm text-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                {forgotMessage}
              </div>
            )}
            <form onSubmit={handleForgotSubmit}>
              <div className="relative mb-4">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:bg-white focus:outline-none transition"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl font-semibold text-sm transition"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotEmail('');
                    setForgotMessage('');
                  }}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
