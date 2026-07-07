import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { faker } from '@faker-js/faker';
import { FileText, ClipboardCheck, Clock } from 'lucide-react';

const generateTasks = (count, type, status) => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    title: `${faker.word.adjective()} ${type === 'assignment' ? 'Assignment' : 'Quiz'}`,
    subject: faker.company.name(),
    dueDate: status === 'pending' ? faker.date.future({ years: 0.1 }).toLocaleDateString() : faker.date.past({ years: 0.1 }).toLocaleDateString(),
    status,
    type,
  }));
};

const TasksPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [tasks] = useState({
    pending: [
      ...generateTasks(3, 'assignment', 'pending'),
      ...generateTasks(2, 'quiz', 'pending'),
    ],
    completed: [
      ...generateTasks(5, 'assignment', 'completed'),
      ...generateTasks(4, 'quiz', 'completed'),
    ],
  });

  const TaskCard = ({ task }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800/50 p-5 rounded-lg border border-cyan-500/20"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.type === 'assignment' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
            {task.type === 'assignment' ? <FileText className="w-3 h-3 mr-1.5" /> : <ClipboardCheck className="w-3 h-3 mr-1.5" />}
            {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
          </span>
          <h3 className="text-lg font-bold mt-3 text-white">{task.title}</h3>
          <p className="text-sm text-gray-400">{task.subject}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            {task.status === 'pending' ? 'Due:' : 'Completed:'} {task.dueDate}
          </p>
        </div>
      </div>
      {task.status === 'pending' && (
        <button className="mt-4 w-full bg-cyan-500/80 text-white font-semibold py-2 rounded-lg hover:bg-cyan-500 transition-colors">
          Start Now
        </button>
      )}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6 text-white">Tasks</h1>
      
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 max-w-sm">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:text-white'}`}>
            Pending ({tasks.pending.length})
          </button>
          <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:text-white'}`}>
            Completed ({tasks.completed.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks[activeTab].map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </motion.div>
  );
};

export default TasksPage;
