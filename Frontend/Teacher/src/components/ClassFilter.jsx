import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';

const ClassFilter = ({ onFilterChange, user }) => {
    const [years, setYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Parse teacher's classes from their department field (format: "FA22-BCS-A,FA22-BCS-B,...")
    useEffect(() => {
        if (user?.department) {
            const classes = user.department.split(',').map(c => c.trim());

            // Extract unique years, departments, and sections
            const uniqueYears = [...new Set(classes.map(c => c.split('-')[0]))];
            setYears(uniqueYears);

            // Set first year as default
            if (uniqueYears.length > 0) {
                setSelectedYear(uniqueYears[0]);
            }
        }
    }, [user]);

    // Update departments when year changes
    useEffect(() => {
        if (user?.department && selectedYear) {
            const classes = user.department.split(',').map(c => c.trim());
            const deptList = [...new Set(
                classes
                    .filter(c => c.split('-')[0] === selectedYear)
                    .map(c => c.split('-')[1])
            )];
            setDepartments(deptList);

            // Set first department as default
            if (deptList.length > 0) {
                setSelectedDept(deptList[0]);
            } else {
                setSelectedDept('');
            }
        }
    }, [selectedYear, user]);

    // Update sections when department changes
    useEffect(() => {
        if (user?.department && selectedYear && selectedDept) {
            const classes = user.department.split(',').map(c => c.trim());
            const sectionList = [...new Set(
                classes
                    .filter(c => {
                        const parts = c.split('-');
                        return parts[0] === selectedYear && parts[1] === selectedDept;
                    })
                    .map(c => c.split('-')[2])
            )];
            setSections(sectionList);

            // Set first section as default
            if (sectionList.length > 0) {
                setSelectedSection(sectionList[0]);
            } else {
                setSelectedSection('');
            }
        }
    }, [selectedDept, selectedYear, user]);

    // Notify parent of changes
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({
                year: selectedYear,
                department: selectedDept,
                section: selectedSection
            });
        }
    }, [selectedYear, selectedDept, selectedSection, onFilterChange]);

    if (!user?.department) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 rounded-xl border border-blue-500/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-300" />
                <h3 className="text-lg font-semibold text-blue-300">Filter by Class</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Year Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Select Year</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Department Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        disabled={!selectedYear}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Section Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Section</label>
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={!selectedDept}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Section</option>
                        {sections.map(section => (
                            <option key={section} value={section}>{section}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ClassFilter;
