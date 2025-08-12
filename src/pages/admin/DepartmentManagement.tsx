import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, BuildingIcon, UsersIcon, MonitorIcon, SettingsIcon, FilterIcon, RefreshCwIcon } from 'lucide-react';
import { departmentService, userService, assetService } from '../../services/database';
import { Department } from '../../lib/supabase';

const DepartmentManagement: React.FC = () => {
  const { addNotification, addToast } = useNotifications();
  const [departmentData, setDepartmentData] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterUserCount, setFilterUserCount] = useState('All');
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    manager: ''
  });

  // Fetch departments from database
    const fetchData = async () => {
      try {
      setLoading(true);
      const departments = await departmentService.getAll();
      setDepartmentData(departments);
      setFilteredDepartments(departments);
      } catch (error) {
        console.error('Error fetching department data:', error);
        addNotification({
          title: 'Error',
        message: 'Failed to load department data. Please check your database connection.',
          type: 'error'
        });
        addToast({
          title: 'Error',
        message: 'Failed to load department data. Please check your database connection.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
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
        const userCount = dept.user_count;
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

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    // Create the new department object
    const departmentToAdd = {
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
        user_count: 0,
        asset_count: 0,
        asset_value: '$0',
      manager: newDepartment.manager || 'Unassigned',
        manager_id: null
    };

      const newDepartmentData = await departmentService.create(departmentToAdd);
      
    // Add the new department to the list
      setDepartmentData([...departmentData, newDepartmentData]);
      
    // Close the modal and reset the form
    setShowAddDepartmentModal(false);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      manager: ''
    });
      
    // Show a notification
    addNotification({
      title: 'Department Added',
        message: `New department "${newDepartmentData.name}" has been added successfully`,
      type: 'success'
    });
    addToast({
      title: 'Department Added',
        message: `New department "${newDepartmentData.name}" has been added successfully`,
      type: 'success'
    });
    } catch (error) {
      console.error('Error adding department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to add department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to add department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    
    try {
      // Update the department in the database
      const updatedDepartment = await departmentService.update(selectedDepartment.id, {
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
        manager: newDepartment.manager || selectedDepartment.manager
      });

      // Update the department in the list
      const updatedDepartments = departmentData.map(dept => 
        dept.id === selectedDepartment.id ? updatedDepartment : dept
      );
    setDepartmentData(updatedDepartments);
      setFilteredDepartments(updatedDepartments);
      
    // Close the modal and reset the form
    setShowEditDepartmentModal(false);
    setSelectedDepartment(null);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      manager: ''
    });
      
    // Show a notification
    addNotification({
      title: 'Department Updated',
        message: `Department "${updatedDepartment.name}" has been updated successfully`,
      type: 'success'
    });
    addToast({
      title: 'Department Updated',
        message: `Department "${updatedDepartment.name}" has been updated successfully`,
      type: 'success'
    });
    } catch (error) {
      console.error('Error updating department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to update department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      // Delete the department from the database
      await departmentService.delete(selectedDepartment.id);
      
    // Filter out the selected department
    const updatedDepartments = departmentData.filter(dept => dept.id !== selectedDepartment.id);
    setDepartmentData(updatedDepartments);
      setFilteredDepartments(updatedDepartments);
      
    // Show a notification
    addNotification({
      title: 'Department Deleted',
      message: `Department "${selectedDepartment.name}" has been deleted`,
      type: 'info'
    });
    addToast({
      title: 'Department Deleted',
      message: `Department "${selectedDepartment.name}" has been deleted`,
      type: 'success'
    });
      
    // Close the modal and reset the selected department
    setShowDeleteModal(false);
    setSelectedDepartment(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to delete department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(departmentData.map(dept => dept.location))).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Department Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization's departments and their resources</p>
        </div>
        <button
          onClick={() => setShowAddDepartmentModal(true)}
          className="mt-4 sm:mt-0 px-6 py-3 bg-primary text-white rounded-xl shadow-button hover:opacity-90 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Department
          </button>
        </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
          </div>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <select
              value={filterUserCount}
              onChange={(e) => setFilterUserCount(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Sizes</option>
              <option value="0-5">0-5 Users</option>
              <option value="6-10">6-10 Users</option>
              <option value="11-20">11-20 Users</option>
              <option value="20+">20+ Users</option>
            </select>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setFilterLocation('All'); setFilterUserCount('All'); }} 
            className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Departments List */}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Departments</h2>
            <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">
              {filteredDepartments.length} departments
            </span>
        </div>
        </div>
        
        {filteredDepartments.length > 0 ? (
          <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Manager</th>
              <th scope="col" className="px-6 py-3">Users</th>
              <th scope="col" className="px-6 py-3">Assets</th>
              <th scope="col" className="px-6 py-3">Location</th>
              <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map(dept => (
                  <tr key={dept.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                      <div className="flex items-center">
                  <div className="p-2 mr-3 text-secondary bg-lightpurple rounded-full">
                          <BuildingIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(dept.created_at).toLocaleDateString()}
                          </div>
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
                      <span className="px-2 py-1 text-xs font-medium text-primary bg-lightgreen rounded-full">
                        {dept.user_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium text-secondary bg-lightpurple rounded-full">
                          {dept.asset_count}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{dept.asset_value}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{dept.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setNewDepartment({
                              name: dept.name,
                              description: dept.description,
                              location: dept.location,
                              manager: dept.manager !== 'Unassigned' ? dept.manager : ''
                            });
                            setShowEditDepartmentModal(true);
                          }}
                          className="p-1 text-yellow-600 rounded hover:bg-yellow-100"
                          title="Edit Department"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 rounded hover:bg-red-100"
                          title="Delete Department"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            {searchTerm ? (
              <>
                <AlertCircleIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No matching departments found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search criteria</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <BuildingIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No departments found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first department</p>
                <button
                  onClick={() => setShowAddDepartmentModal(true)}
                  className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90"
                >
                  Add New Department
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Add New Department</h3>
              <button
                onClick={() => setShowAddDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Department Name</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Marketing"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Description</label>
                <textarea
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brief description of the department"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Location</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Floor 2, Building A"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-primary">Manager</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. John Doe"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({ ...newDepartment, manager: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90"
                >
                  Add Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDepartmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">Edit Department</h3>
              <button
                onClick={() => setShowEditDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditDepartment}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Department Name</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Description</label>
                <textarea
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Location</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-primary">Manager</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({ ...newDepartment, manager: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90"
                >
                  Update Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditDepartmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Delete Department</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete "{selectedDepartment.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleDeleteDepartment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default DepartmentManagement;