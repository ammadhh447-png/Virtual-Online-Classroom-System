import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [rollYear, setRollYear] = useState('');
  const [rollDept, setRollDept] = useState('');
  const [rollSerial, setRollSerial] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState([]);
  const [depts, setDepts] = useState([]);

  const { login } = useAuth();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch years and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearsRes, deptsRes] = await Promise.all([
          fetch(`${API}/api/admin/years`).then(r => r.json()),
          fetch(`${API}/api/admin/departments`).then(r => r.json())
        ]);
        setYears(yearsRes || []);
        setDepts(deptsRes || []);
      } catch (err) {
        console.error('Error fetching years/depts:', err);
      }
    };
    fetchData();
  }, [API]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollYear || !rollDept || !rollSerial || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // Construct roll number from components (no dashes, matching backend format)
    const rollNumber = `${rollYear}${rollDept}${rollSerial}`.toLowerCase();
    // debug: ensure login is called and record its result
    // eslint-disable-next-line no-console
    console.log('Login attempt for:', rollNumber);
    const res = await login(rollNumber, password);
    // eslint-disable-next-line no-console
    console.log('Login response:', res);
    if (res.success) {
      toast.success('Signed in successfully');
      navigate('/dashboard');
    } else {
      toast.error(res.message || 'Invalid roll number or password');
      setError(res.message || 'Invalid roll number or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-cyan-500/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <GraduationCap className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Virtual CUI</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your account to continue learning</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Roll Number
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="rollYear" className="block text-xs text-gray-400 mb-1">Year</label>
                  <select
                    id="rollYear"
                    value={rollYear}
                    onChange={(e) => { setRollYear(e.target.value); setRollDept(''); }}
                    className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="">Select Year</option>
                    {years.map(y => (
                      <option key={y._id} value={y.code}>{y.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rollDept" className="block text-xs text-gray-400 mb-1">Department</label>
                  <select
                    id="rollDept"
                    value={rollDept}
                    onChange={(e) => setRollDept(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="">Select Dept</option>
                    {depts
                      .filter(d => {
                        // department may have populated yearId object or raw id
                        if (!rollYear) return true;
                        if (!d) return false;
                        if (d.yearId && typeof d.yearId === 'object') return d.yearId.code === rollYear;
                        if (d.yearId && typeof d.yearId === 'string') return d.yearId === rollYear;
                        return d.code?.startsWith(rollYear) || false;
                      })
                      .map(d => (
                        <option key={d._id} value={d.code}>{d.code}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rollSerial" className="block text-xs text-gray-400 mb-1">Serial</label>
                  <input
                    id="rollSerial"
                    type="text"
                    value={rollSerial}
                    onChange={(e) => setRollSerial(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    placeholder="e.g., 255"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2" />
                <span className="ml-2 text-sm text-gray-300">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 rounded-lg text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
