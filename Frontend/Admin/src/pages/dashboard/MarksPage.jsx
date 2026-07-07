import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { faker } from '@faker-js/faker';
import { Award, TrendingUp, TrendingDown, User, Trash2 } from 'lucide-react';

const generateUsers = (count) => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement(['student', 'teacher', 'admin']),
    createdAt: faker.date.recent({ days: 120 }).toLocaleDateString()
  }));
};

const MarksPage = () => {
  const [users, setUsers] = useState(generateUsers(12));

  const handleDelete = (id) => {
    if (!window.confirm('Delete this user?')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6 text-white">System Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Total Users</h3>
          <p className="text-4xl font-bold text-cyan-400">{users.length}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Admins</h3>
          <p className="text-4xl font-bold text-green-400">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-cyan-500/20">
          <h3 className="text-gray-400 mb-2">Teachers</h3>
          <p className="text-4xl font-bold text-indigo-400">{users.filter(u => u.role === 'teacher').length}</p>
        </div>
      </div>

      <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl font-bold mb-6">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Email</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Role</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400">Joined</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(u => (
                <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-4 px-4 text-cyan-400 font-medium">{u.name}</td>
                  <td className="py-4 px-4">{u.email}</td>
                  <td className="py-4 px-4">{u.role}</td>
                  <td className="py-4 px-4 text-gray-400">{u.createdAt}</td>
                  <td className="py-4 px-4 text-right"><button onClick={() => handleDelete(u.id)} className="text-red-400 inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MarksPage;
