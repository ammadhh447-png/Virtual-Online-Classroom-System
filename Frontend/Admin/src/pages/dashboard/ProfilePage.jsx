import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { User, Mail } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || null,
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
    setIsEditing(false);
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
          </div>

         
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Profile</h1>

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
            <p className="text-lg text-cyan-400">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</p>
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

          </div>
        </div>


      </div>
    </motion.div>
  );
};

export default ProfilePage;
