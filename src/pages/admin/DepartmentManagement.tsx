import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, BuildingIcon, UsersIcon, MonitorIcon, SettingsIcon, FilterIcon, RefreshCwIcon } from 'lucide-react';
import { generateMockUsers, generateMockAssets, departments } from '../../utils/mockData';
const DepartmentManagement: React.FC = () => {
  const {
    addNotification
  } = useNotifications();
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterUserCount, setFilterUserCount] = useState('All');
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    budget: '',
    manager: ''
  });
  useEffect(() => {
    // Fetch departments and related data
    const fetchData = async () => {
      try {
        // In a real app, this would be API calls
        const mockUsers = generateMockUsers(30);
        const mockAssets = generateMockAssets(50);
        // Create department data from the mock data
        const deptData = departments.map(dept => {
          const deptUsers = mockUsers.filter(user => user.department === dept);
          const deptAssets = mockAssets.filter(asset => asset.department === dept);
          // Find a manager (department_officer or first user)
          const manager = deptUsers.find(user => user.role === 'department_officer') || (deptUsers.length > 0 ? deptUsers[0] : null);
          // Calculate total asset value (random for demo purposes)
          const totalAssetValue = deptAssets.length * Math.floor(Math.random() * 1000) + 500;
          return {
            id: `D-${dept.replace(/\s+/g, '').toLowerCase()}`,
            name: dept,
            description: `${dept} department responsible for ${dept.toLowerCase()} operations.`,
            location: ['Floor 1', 'Floor 2', 'Floor 3', 'Remote'][Math.floor(Math.random() * 4)],
            userCount: deptUsers.length,
            assetCount: deptAssets.length,
            budget: `$${Math.floor(Math.random() * 900000) + 100000}`,
            assetValue: `$${totalAssetValue}`,
            manager: manager ? manager.name : 'Unassigned',
            managerId: manager ? manager.id : null,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString() // Random date within the last year
          };
        });
        setDepartmentData(deptData);
        setFilteredDepartments(deptData);
      } catch (error) {
        console.error('Error fetching department data:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load department data',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);
  useEffect(() => {
    // Filter departments based on search term and filters
    let result = departmentData;
    
    if (searchTerm) {
      result = result.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dept.manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterLocation !== 'All') {
      result = result.filter(dept => dept.location === filterLocation);
    }
    
    if (filterUserCount !== 'All') {
      result = result.filter(dept => {
        const userCount = dept.userCount;
        switch (filterUserCount) {
          case '0-5':
            return userCount >= 0 && userCount <= 5;
          case '6-10':
            return userCount >= 6 && userCount <= 10;
          case '11-20':
            return userCount >= 11 && userCount <= 20;
          case '20+':
            return userCount > 20;
          default:
            return true;
        }
      });
    }
    
    setFilteredDepartments(result);
  }, [departmentData, searchTerm, filterLocation, filterUserCount]);
  const handleAddDepartment = e => {
    e.preventDefault();
    // Generate a unique ID
    const newId = `D-${newDepartment.name.replace(/\s+/g, '').toLowerCase()}`;
    // Create the new department object
    const departmentToAdd = {
      id: newId,
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
      userCount: 0,
      assetCount: 0,
      budget: newDepartment.budget,
      assetValue: '$0',
      manager: newDepartment.manager || 'Unassigned',
      managerId: null,
      createdAt: new Date().toISOString()
    };
    // Add the new department to the list
    setDepartmentData([...departmentData, departmentToAdd]);
    // Close the modal and reset the form
    setShowAddDepartmentModal(false);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      budget: '',
      manager: ''
    });
    // Show a notification
    addNotification({
      title: 'Department Added',
      message: `New department "${departmentToAdd.name}" has been added successfully`,
      type: 'success'
    });
  };
  const handleEditDepartment = e => {
    e.preventDefault();
    if (!selectedDepartment) return;
    // Update the department in the list
    const updatedDepartments = departmentData.map(dept => dept.id === selectedDepartment.id ? {
      ...dept,
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
      budget: newDepartment.budget,
      manager: newDepartment.manager || dept.manager
    } : dept);
    setDepartmentData(updatedDepartments);
    // Close the modal and reset the form
    setShowEditDepartmentModal(false);
    setSelectedDepartment(null);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      budget: '',
      manager: ''
    });
    // Show a notification
    addNotification({
      title: 'Department Updated',
      message: `Department "${newDepartment.name}" has been updated successfully`,
      type: 'success'
    });
  };
  const handleDeleteDepartment = () => {
    if (!selectedDepartment) return;
    // Filter out the selected department
    const updatedDepartments = departmentData.filter(dept => dept.id !== selectedDepartment.id);
    setDepartmentData(updatedDepartments);
    // Show a notification
    addNotification({
      title: 'Department Deleted',
      message: `Department "${selectedDepartment.name}" has been deleted`,
      type: 'info'
    });
    // Close the modal and reset the selected department
    setShowDeleteModal(false);
    setSelectedDepartment(null);
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Department Management</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">View, add, edit, and manage all company departments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddDepartmentModal(true)} className="button-primary flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" /> Add New Department
          </button>
        </div>
      </div>
    </div>
    {/* Department Overview Cards */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightpurple rounded-full">
            <BuildingIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Total Departments</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{departmentData.length}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightgreen rounded-full">
            <UsersIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{departmentData.reduce((acc, dept) => acc + dept.userCount, 0)}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightpurple rounded-full">
            <MonitorIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Total Assets</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{departmentData.reduce((acc, dept) => acc + dept.assetCount, 0)}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-yellow-100 rounded-full">
            <SettingsIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Assets/Dept</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{departmentData.length > 0 ? Math.round(departmentData.reduce((acc, dept) => acc + dept.assetCount, 0) / departmentData.length) : 0}</p>
          </div>
        </div>
      </div>
    </div>
    {/* Search and Filter */}
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search departments by name, description, or manager..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="All">All Locations</option>
              <option value="Floor 1">Floor 1</option>
              <option value="Floor 2">Floor 2</option>
              <option value="Floor 3">Floor 3</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterUserCount} onChange={e => setFilterUserCount(e.target.value)}>
              <option value="All">All Sizes</option>
              <option value="0-5">0-5 Users</option>
              <option value="6-10">6-10 Users</option>
              <option value="11-20">11-20 Users</option>
              <option value="20+">20+ Users</option>
            </select>
          </div>
          <button onClick={() => { setSearchTerm(''); setFilterLocation('All'); setFilterUserCount('All'); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center">
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
          </button>
        </div>
      </div>
    </div>
      {/* Departments List */}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Departments</h2>
          <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">{filteredDepartments.length} departments</span>
        </div>
        </div>
        {filteredDepartments.length > 0 ? <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Manager</th>
              <th scope="col" className="px-6 py-3">Users</th>
              <th scope="col" className="px-6 py-3">Assets</th>
              <th scope="col" className="px-6 py-3">Location</th>
              <th scope="col" className="px-6 py-3">Budget</th>
              <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
            {filteredDepartments.map(dept => <tr key={dept.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                      <div className="flex items-center">
                  <div className="p-2 mr-3 text-secondary bg-lightpurple rounded-full">
                          <BuildingIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{dept.name}</div>
                    <div className="text-xs text-gray-500">{new Date(dept.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                  <div className="p-1 mr-2 text-gray-400 bg-lightgreen rounded-full">
                          <UsersIcon className="w-4 h-4" />
                        </div>
                        <span>{dept.manager}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium text-primary bg-lightgreen rounded-full">{dept.userCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium text-secondary bg-lightpurple rounded-full">{dept.assetCount}</span>
                  <span className="ml-2 text-xs text-gray-500">{dept.assetValue}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{dept.location}</td>
                    <td className="px-6 py-4">{dept.budget}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                  <button onClick={() => { setSelectedDepartment(dept); setNewDepartment({ name: dept.name, description: dept.description, location: dept.location, budget: dept.budget, manager: dept.manager !== 'Unassigned' ? dept.manager : '' }); setShowEditDepartmentModal(true); }} className="p-1 text-yellow-600 rounded hover:bg-yellow-100" title="Edit Department"><EditIcon className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedDepartment(dept); setShowDeleteModal(true); }} className="p-1 text-red-600 rounded hover:bg-red-100" title="Delete Department"><TrashIcon className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div> : <div className="flex flex-col items-center justify-center py-12">
            {searchTerm ? <>
                <AlertCircleIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No matching departments found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search criteria</p>
          <button onClick={() => setSearchTerm('')} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Clear Search</button>
              </> : <>
                <BuildingIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No departments found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first department</p>
          <button onClick={() => setShowAddDepartmentModal(true)} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Add New Department</button>
              </>}
          </div>}
      </div>
      {/* Add Department Modal */}
      {showAddDepartmentModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Add New Department</h3>
          <button onClick={() => setShowAddDepartmentModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Department Name</label>
            <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. Marketing" value={newDepartment.name} onChange={e => setNewDepartment({ ...newDepartment, name: e.target.value })} required />
              </div>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Description</label>
            <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows={3} placeholder="Department description and responsibilities" value={newDepartment.description} onChange={e => setNewDepartment({ ...newDepartment, description: e.target.value })} required></textarea>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                <div>
              <label className="block mb-2 text-sm font-medium text-primary">Location</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. Floor 2" value={newDepartment.location} onChange={e => setNewDepartment({ ...newDepartment, location: e.target.value })} required />
                </div>
                <div>
              <label className="block mb-2 text-sm font-medium text-primary">Budget</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. $100,000" value={newDepartment.budget} onChange={e => setNewDepartment({ ...newDepartment, budget: e.target.value })} required />
                </div>
              </div>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Department Manager</label>
            <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Manager Name (optional)" value={newDepartment.manager} onChange={e => setNewDepartment({ ...newDepartment, manager: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowAddDepartmentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2 text-sm font-medium">Add Department</button>
              </div>
            </form>
          </div>
        </div>}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && selectedDepartment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Edit Department
              </h3>
              <button onClick={() => {
            setShowEditDepartmentModal(false);
            setSelectedDepartment(null);
          }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditDepartment}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department Name
                </label>
                <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="e.g. Marketing" value={newDepartment.name} onChange={e => setNewDepartment({
              ...newDepartment,
              name: e.target.value
            })} required />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" rows={3} placeholder="Department description and responsibilities" value={newDepartment.description} onChange={e => setNewDepartment({
              ...newDepartment,
              description: e.target.value
            })} required></textarea>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="e.g. Floor 2" value={newDepartment.location} onChange={e => setNewDepartment({
                ...newDepartment,
                location: e.target.value
              })} required />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget
                  </label>
                  <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="e.g. $100,000" value={newDepartment.budget} onChange={e => setNewDepartment({
                ...newDepartment,
                budget: e.target.value
              })} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department Manager
                </label>
                <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="Manager Name (optional)" value={newDepartment.manager} onChange={e => setNewDepartment({
              ...newDepartment,
              manager: e.target.value
            })} />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => {
              setShowEditDepartmentModal(false);
              setSelectedDepartment(null);
            }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Confirm Deletion
              </h3>
              <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedDepartment(null);
          }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the department "
                {selectedDepartment.name}"? This action cannot be undone.
              </p>
              {(selectedDepartment.userCount > 0 || selectedDepartment.assetCount > 0) && <div className="p-4 mt-4 text-yellow-800 bg-yellow-100 rounded-md dark:bg-yellow-900 dark:bg-opacity-20 dark:text-yellow-300">
                  <p className="flex items-center">
                    <AlertCircleIcon className="w-5 h-5 mr-2" />
                    Warning: This department has {selectedDepartment.userCount}{' '}
                    users and {selectedDepartment.assetCount} assets assigned to
                    it.
                  </p>
                </div>}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedDepartment(null);
          }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={handleDeleteDepartment} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Delete Department
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default DepartmentManagement;