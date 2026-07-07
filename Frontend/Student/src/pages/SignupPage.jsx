import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GraduationCap, Eye, EyeOff, ArrowLeft, Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollYear: '',
    rollDept: '',
    rollSerial: '',
    section: '',
    profileImage: null
  });
  const [role, setRole] = useState('student');
  const [years, setYears] = useState([]);
  const [depts, setDepts] = useState([]);
  const [sections, setSections] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Email verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailValidating, setEmailValidating] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const { signup } = useAuth();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // OTP Timer effect
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Email validation - check if email is valid format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate email existence and format
  const validateEmail = async () => {
    if (!formData.email) {
      setEmailError('Email is required');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setEmailError('Invalid email format');
      return;
    }

    setEmailValidating(true);
    setEmailError('');
    try {
      const res = await axios.post(`${API}/api/auth/check-email`, {
        email: formData.email
      });

      if (res.data.exists) {
        setEmailError('Email already registered');
      } else {
        setEmailError('');
        toast.success('Email is valid and available');
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Error validating email');
    } finally {
      setEmailValidating(false);
    }
  };

  // Send OTP to email
  const sendOTP = async () => {
    if (!formData.email) {
      setEmailError('Email is required');
      return;
    }

    if (emailError) {
      toast.error('Please fix email errors first');
      return;
    }

    setSendingOTP(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API}/api/auth/send-otp`, {
        email: formData.email,
        userType: 'Student'
      });

      setOtpSent(true);
      setOtpTimer(300); // 5 minutes
      toast.success('OTP sent to your email');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP');
      toast.error('Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP
  const verifyOTPCode = async () => {
    if (!otp) {
      setOtpError('Please enter OTP');
      return;
    }

    if (otp.length !== 4) {
      setOtpError('OTP must be 4 digits');
      return;
    }

    setVerifyingOTP(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API}/api/auth/verify-otp`, {
        email: formData.email,
        otp: otp
      });

      setEmailVerified(true);
      setOtp('');
      setOtpSent(false);
      toast.success('Email verified successfully');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Fetch years and departments with cache busting
  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const [yearsRes, deptsRes, sectionsRes] = await Promise.all([
          fetch(`${API}/api/admin/years?t=${timestamp}`).then(r => r.json()),
          fetch(`${API}/api/admin/departments?t=${timestamp}`).then(r => r.json()),
          fetch(`${API}/api/admin/sections?t=${timestamp}`).then(r => r.json())
        ]);
        setYears(yearsRes || []);
        setDepts(deptsRes || []);
        setSections(sectionsRes || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [API]);

  // Get departments for selected year
  const getDeptsForYear = (yearCode) => {
    return depts.filter(d => d.yearId?.code === yearCode);
  };

  // Get the selected department object by code
  const getSelectedDept = (deptCode) => {
    return depts.find(d => d.code === deptCode);
  };

  // Get sections for selected department
  const getSectionsForDept = (deptCode) => {
    const selectedDept = getSelectedDept(deptCode);
    if (!selectedDept) return [];
    return sections.filter(s => s.departmentId?._id === selectedDept._id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset dependent fields when year changes
    if (name === 'rollYear') {
      setFormData(prev => ({
        ...prev,
        rollDept: '',
        section: ''
      }));
    }

    // Reset section when department changes
    if (name === 'rollDept') {
      setFormData(prev => ({
        ...prev,
        section: ''
      }));
    }
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const form = new FormData();
      form.append('image', file);

      const res = await axios.post(`${API}/api/upload/image`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.url) {
        setFormData(prev => ({ ...prev, profileImage: res.data.url }));
        setProfileImagePreview(res.data.url);
        toast.success('Profile picture uploaded successfully');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setProfileImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.email || !emailVerified) {
      setError('Please verify your email before proceeding');
      return;
    }

    if (!formData.profileImage) {
      setError('Profile picture is required');
      return;
    }

    if (role === 'student' && (!formData.rollYear || !formData.rollDept || !formData.rollSerial || !formData.section)) {
      setError('Please provide year, department, serial number, and section');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    const payload = {
      ...formData,
      role,
      profileImage: formData.profileImage
    };
    const res = await signup(payload);
    if (res.success) {
      toast.success('Account created successfully');
      navigate('/dashboard');
    } else {
      toast.error(res.message || 'Failed to create account');
      setError(res.message || 'Failed to create account');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-2xl"
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
            <h1 className="text-3xl font-bold text-white mb-2">Create Student Account</h1>
            <p className="text-gray-300">Join thousands of students and teachers in the future of education</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Profile Picture *
              </label>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-cyan-500"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500/80 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                    disabled={uploading}
                  >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload Picture'}
                  </button>
                  {profileImagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="w-full flex items-center justify-center gap-2 bg-red-500/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remove Picture
                    </button>
                  )}
                  <p className="text-xs text-gray-400">JPG, PNG or WebP. Max 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {role === 'student' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number *</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="rollYear" className="block text-xs text-gray-400 mb-1">Year</label>
                    <select
                      id="rollYear"
                      name="rollYear"
                      value={formData.rollYear}
                      onChange={handleChange}
                      className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
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
                      name="rollDept"
                      value={formData.rollDept}
                      onChange={handleChange}
                      disabled={!formData.rollYear}
                      className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Dept</option>
                      {getDeptsForYear(formData.rollYear).map(d => (
                        <option key={d._id} value={d.code}>{d.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rollSerial" className="block text-xs text-gray-400 mb-1">Serial</label>
                    <input
                      id="rollSerial"
                      name="rollSerial"
                      type="text"
                      value={formData.rollSerial}
                      onChange={handleChange}
                      className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                      placeholder="e.g., 255"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="section" className="block text-sm font-medium text-gray-300 mb-2">Section *</label>
                  <select
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    disabled={!formData.rollDept}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Section</option>
                    {getSectionsForDept(formData.rollDept).map(s => (
                      <option key={s._id} value={s.code}>{s.code}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email {role === 'student' ? '*' : ''}
              </label>
              <div className="space-y-3">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    setEmailVerified(false);
                    setOtpSent(false);
                  }}
                  disabled={emailVerified}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter email"
                />

                {/* Email validation message */}
                {emailError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </div>
                )}

                {emailVerified && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Email verified
                  </div>
                )}

                {/* OTP Section */}
                {!emailVerified && formData.email && isValidEmail(formData.email) && (
                  <div className="space-y-3 pt-3 border-t border-gray-600">
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={sendingOTP}
                        className="w-full px-4 py-3 bg-cyan-500/80 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingOTP ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength="4"
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtp(val);
                              setOtpError('');
                            }}
                            placeholder="Enter 4-digit OTP"
                            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none text-center tracking-widest font-bold text-lg"
                          />
                          <button
                            type="button"
                            onClick={verifyOTPCode}
                            disabled={verifyingOTP || otp.length !== 4}
                            className="px-4 py-3 bg-green-500/80 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {verifyingOTP ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>

                        {otpError && (
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {otpError}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          {otpTimer > 0 ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                            </div>
                          ) : (
                            <span>OTP expired</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all pr-12"
                    placeholder="Create password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all pr-12"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2" />
              <span className="ml-2 text-sm text-gray-300">
                I agree to the <a href="#" className="text-cyan-400 hover:text-cyan-300">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 rounded-lg text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div >
    </div >
  );
};

export default SignupPage;
