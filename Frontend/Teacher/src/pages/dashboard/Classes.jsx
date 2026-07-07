import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ClassFilter from '../../components/ClassFilter';

const Classes = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState({ year: '', department: '', section: '' });

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">My Classes</h1>
            <ClassFilter onFilterChange={setFilter} user={user} />
            <div className="text-gray-400 mt-4">
                Selected: Year: {filter.year}, Department: {filter.department}, Section: {filter.section}
            </div>
        </div>
    );
};

export default Classes;