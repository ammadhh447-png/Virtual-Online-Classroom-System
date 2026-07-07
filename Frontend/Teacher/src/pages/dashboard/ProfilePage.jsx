import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { User, Mail, Hash, Save, X, Upload, Lock, Eye, EyeOff } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // previously used Cloudinary client widget — switched to server upload (no widget)
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const form = new FormData();
      form.append('image', file);

      const res = await axios.post(`${API}/api/upload/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.url) {
        setFormData(prev => ({ ...prev, profileImage: res.data.url }));
        toast.success('Image uploaded successfully');
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

  const handleSaveProfile = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);
    const res = await updateProfile({
      name: formData.name,
      email: formData.email,
      profileImage: formData.profileImage,
    });

    if (res.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error(res.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      profileImage: user?.profileImage || null,
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.put(`${API}/api/auth/change-password`, passwordData);
      toast.success(res.data.message || 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Change password error:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-8 text-white">Edit Profile</h1>

        <div className="bg-gray-800/50 p-8 rounded-xl border border-cyan-500/20 max-w-2xl">
          {/* Profile Image Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture</label>
            <div className="flex items-center space-x-6">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-cyan-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-5xl font-bold text-white">
                  {formData.name.charAt(0)}
                </div>
              )}
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="flex items-center gap-2 bg-cyan-500/80 text-white font-semibold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload Picture'}
                </button>
              </>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>

            {/* Teachers do not have roll numbers */}
          </div>

          {/* Change Password Section */}
          <div className="mb-8 border-t border-gray-700 pt-8">
            <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Change Password
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all pr-12"
                    placeholder="Confirm new password"
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex items-center gap-2 bg-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-8 text-white">Teacher Profile</h1>

      <div className="bg-gray-800/50 p-8 rounded-xl border border-cyan-500/20">
        <div className="flex flex-col md:flex-row items-center md:space-x-8">
          <div className="relative mb-6 md:mb-0">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-5xl font-bold text-white">
                {user?.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white">{user?.name}</h2>
            <p className="text-lg text-cyan-400">Teacher</p>
          </div>

        </div>

        <div className="mt-10 border-t border-gray-700 pt-8">
          <h3 className="text-xl font-semibold mb-6 text-white">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="font-semibold text-white">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Address</p>
                <p className="font-semibold text-white">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <Hash className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="font-semibold text-white">{user?.role || 'Teacher'}</p>
              </div>
            </div>
            <div className="mt-8  text-right">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-cyan-500/80 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors flex items-center gap-2 ml-auto"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>


      </div>
    </motion.div>
  );
};

export default ProfilePage;
