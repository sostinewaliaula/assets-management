import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertCircleIcon, UserIcon, LockIcon, MailIcon, BuildingIcon, BadgeIcon } from 'lucide-react';
import { departments } from '../../utils/mockData';
import { supabase } from '../../lib/supabase';
import { userService } from '../../services/database';
const UserManagement: React.FC = () => {
  const {
    addNotification,
    addToast
  } = useNotifications();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    department_id: 'IT',
    position: '',
    phone: ''
  });
  useEffect(() => {
    // Fetch users and departments from Supabase
    const fetchData = async () => {
      try {
        // Fetch users
        const fetchedUsers = await userService.getAll();
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        
        if (deptError) {
          console.error('Error fetching departments:', deptError);
        } else {
          setDepartmentsList(deptData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load data',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);
  useEffect(() => {
    // Filter users based on search term and filters
    let result = users;
    if (searchTerm) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterRole !== 'All') {
      result = result.filter(user => user.role === filterRole);
    }
    if (filterDepartment !== 'All') {
      result = result.filter(user => getDepartmentName(user.department_id) === filterDepartment);
    }
    setFilteredUsers(result);
  }, [users, searchTerm, filterRole, filterDepartment]);
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Get the department ID from the department name
      let departmentId = null;
      if (newUser.department_id && newUser.department_id !== '') {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', newUser.department_id)
          .single();
        
        if (deptError) {
          throw new Error('Invalid department selected');
        }
        departmentId = deptData.id;
      }
      
      // Create user directly in the users table (since we're not using Supabase Auth for this demo)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          department_id: departmentId,
          position: newUser.position,
          phone: newUser.phone,
          is_active: true
        }])
        .select()
        .single();
      
      if (userError) {
        throw userError;
      }
      
      // Refresh the users list
      const fetchedUsers = await userService.getAll();
      setUsers(fetchedUsers);
      
      // Close modal and reset form
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'user',
        department_id: '',
        position: '',
        phone: ''
      });
      
      addNotification({
        title: 'User Added',
        message: `New user "${newUser.name}" has been added successfully`,
        type: 'success'
      });
      addToast({
        title: 'User Added',
        message: `New user "${newUser.name}" has been added successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to create user. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: error.message || 'Failed to create user. Please try again.',
        type: 'error'
      });
    }
  };
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      // Get the department ID from the department name
      let departmentId = null;
      if (newUser.department_id && newUser.department_id !== '') {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', newUser.department_id)
          .single();
        
        if (deptError) {
          throw new Error('Invalid department selected');
        }
        departmentId = deptData.id;
      }
      
      // Update user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          department_id: departmentId,
          position: newUser.position,
          phone: newUser.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);
      
      if (profileError) {
        throw profileError;
      }
      
      // Refresh the users list
      const fetchedUsers = await userService.getAll();
      setUsers(fetchedUsers);
      
      // Close modal and reset form
      setShowEditUserModal(false);
      setSelectedUser(null);
      setNewUser({
        name: '',
        email: '',
        role: 'user',
        department_id: '',
        position: '',
        phone: ''
      });
      
      addNotification({
        title: 'User Updated',
        message: `User "${newUser.name}" has been updated successfully`,
        type: 'success'
      });
      addToast({
        title: 'User Updated',
        message: `User "${newUser.name}" has been updated successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to update user. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: error.message || 'Failed to update user. Please try again.',
        type: 'error'
      });
    }
  };
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete user profile from the users table
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);
      
      if (profileError) {
        throw profileError;
      }
      
      // Refresh the users list
      const fetchedUsers = await userService.getAll();
      setUsers(fetchedUsers);
      
      // Show notification and close modal
      addNotification({
        title: 'User Deleted',
        message: `User "${selectedUser.name}" has been deleted successfully`,
        type: 'info'
      });
      addToast({
        title: 'User Deleted',
        message: `User "${selectedUser.name}" has been deleted successfully`,
        type: 'success'
      });
      
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to delete user. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: error.message || 'Failed to delete user. Please try again.',
        type: 'error'
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      addNotification({
        title: 'Weak password',
        message: 'Password must be at least 8 characters long',
        type: 'warning'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification({
        title: 'Password mismatch',
        message: 'New password and confirmation do not match',
        type: 'error'
      });
      return;
    }
    
    try {
      // Update password using Supabase Auth Admin API
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { password: newPassword }
      );
      
      if (error) {
        throw error;
      }
      
      addNotification({
        title: 'Password Updated',
        message: `Password for "${selectedUser.name}" has been updated successfully`,
        type: 'success'
      });
      
      setShowChangePasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update password. Please try again.',
        type: 'error'
      });
    }
  };
  const getRoleBadgeClass = role => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'department_officer':
        return 'bg-lightpurple text-secondary';
      case 'user':
        return 'bg-lightgreen text-primary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatRoleName = role => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'department_officer':
        return 'Department Officer';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'N/A';
    const dept = departmentsList.find(d => d.id === departmentId);
    return dept ? dept.name : 'N/A';
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    </div>;
  }
  return <div className="space-y-6">
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">View, add, edit, and manage all system users.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddUserModal(true)} className="button-primary flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" /> Add New User
          </button>
        </div>
      </div>
    </div>
    {/* User Statistics */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightgreen rounded-full">
            <UserIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{users.length}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightpurple rounded-full">
            <LockIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Administrators</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{users.filter(user => user.role === 'admin').length}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-yellow-100 rounded-full">
            <BuildingIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Department Officers</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{users.filter(user => user.role === 'department_officer').length}</p>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-blue-100 rounded-full">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Regular Users</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{users.filter(user => user.role === 'user').length}</p>
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
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search by name, email, or position..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="department_officer">Department Officer</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
              <option value="All">All Departments</option>
              {departmentsList.map(department => <option key={department.id} value={department.name}>{department.name}</option>)}
            </select>
          </div>
          <button onClick={() => { setSearchTerm(''); setFilterRole('All'); setFilterDepartment('All'); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center">
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
          </button>
        </div>
      </div>
    </div>
    {/* Users List */}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Users</h2>
          <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">{filteredUsers.length} users</span>
        </div>
      </div>
      {filteredUsers.length > 0 ? <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3">User</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Position</th>
              <th scope="col" className="px-6 py-3">Phone</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => <tr key={user.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 mr-3 rounded-full bg-lightgreen flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span>{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user.role)}`}>{formatRoleName(user.role)}</span>
              </td>
              <td className="px-6 py-4">{getDepartmentName(user.department_id)}</td>
              <td className="px-6 py-4">{user.position || 'N/A'}</td>
              <td className="px-6 py-4">{user.phone || 'N/A'}</td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button onClick={() => { setSelectedUser(user); setNewUser({ name: user.name, email: user.email, role: user.role, department_id: user.department_id, position: user.position, phone: user.phone }); setShowEditUserModal(true); }} className="p-1 text-yellow-600 rounded hover:bg-yellow-100" title="Edit User"><EditIcon className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedUser(user); setShowChangePasswordModal(true); }} className="p-1 text-blue-600 rounded hover:bg-blue-100" title="Change Password"><LockIcon className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-1 text-red-600 rounded hover:bg-red-100" title="Delete User" disabled={user.role === 'admin'}><TrashIcon className="w-5 h-5" style={{ opacity: user.role === 'admin' ? 0.5 : 1 }} /></button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div> : <div className="flex flex-col items-center justify-center py-12">
        {searchTerm || filterRole !== 'All' || filterDepartment !== 'All' ? <>
          <AlertCircleIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No matching users found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          <button onClick={() => { setSearchTerm(''); setFilterRole('All'); setFilterDepartment('All'); }} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Clear Filters</button>
        </> : <>
          <UserIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No users found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first user</p>
          <button onClick={() => setShowAddUserModal(true)} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Add New User</button>
        </>}
      </div>}
    </div>

    {/* Add User Modal */}
    {showAddUserModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Add New User</h3>
          <button onClick={() => setShowAddUserModal(false)} className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleAddUser}>
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MailIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input type="email" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="john.doe@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Role</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} required>
                <option value="user">User</option>
                <option value="department_officer">Department Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Department</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newUser.department_id || ''} onChange={e => setNewUser({ ...newUser, department_id: e.target.value })} required>
                <option value="">Select Department</option>
                {departmentsList.map(department => <option key={department.id} value={department.name}>{department.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Position</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <BadgeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Software Developer" value={newUser.position} onChange={e => setNewUser({ ...newUser, position: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Phone Number</label>
              <input type="tel" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="555-123-4567" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2 text-sm font-medium">Add User</button>
          </div>
        </form>
      </div>
    </div>}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Edit User
              </h3>
              <button onClick={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({
                  ...newUser,
                  name: e.target.value
                })} required />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MailIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="john.doe@example.com" value={newUser.email} onChange={e => setNewUser({
                  ...newUser,
                  email: e.target.value
                })} required />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" value={newUser.role} onChange={e => setNewUser({
                ...newUser,
                role: e.target.value
              })} required>
                    <option value="user">User</option>
                    <option value="department_officer">
                      Department Officer
                    </option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" value={newUser.department_id || ''} onChange={e => setNewUser({
                ...newUser,
                department_id: e.target.value
              })} required>
                    <option value="">Select Department</option>
                    {departmentsList.map(department => <option key={department.id} value={department.name}>
                        {department.name}
                      </option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Position
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <BadgeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="Software Developer" value={newUser.position} onChange={e => setNewUser({
                  ...newUser,
                  position: e.target.value
                })} required />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input type="tel" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="555-123-4567" value={newUser.phone} onChange={e => setNewUser({
                ...newUser,
                phone: e.target.value
              })} />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => {
              setShowEditUserModal(false);
              setSelectedUser(null);
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
      {showDeleteModal && selectedUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Confirm Deletion
              </h3>
              <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the user "{selectedUser.name}"?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700" disabled={selectedUser.role === 'admin'}>
                Delete User
              </button>
            </div>
          </div>
        </div>}

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Change Password</h3>
              <button
                onClick={() => { setShowChangePasswordModal(false); setSelectedUser(null); setNewPassword(''); setConfirmPassword(''); }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-primary">New Password</label>
                  <input
                    type="password"
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-primary">Confirm Password</label>
                  <input
                    type="password"
                    className="block w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Note: This is a demo. Hook this up to your auth backend to persist changes.</p>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowChangePasswordModal(false); setSelectedUser(null); setNewPassword(''); setConfirmPassword(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>;
};
export default UserManagement;