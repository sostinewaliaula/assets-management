import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSupabase } from '../../hooks/useSupabase';
import { AlertCircleIcon, MonitorIcon, XCircleIcon, WifiIcon, WifiOffIcon, SearchIcon, FilterIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react';
import { Asset, supabase } from '../../lib/supabase';
import { issueService, assetRequestsService, userService, notificationService, departmentService, auditService, assetService } from '../../services/database';
import { formatKES } from '../../utils/formatCurrency';

const assetTypes = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Phone', 'Tablet', 'Printer', 'Server', 'Router', 'Switch', 'Projector', 'Camera', 'Furniture', 'Vehicle'];
const manufacturers = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Samsung', 'Cisco', 'Logitech', 'Canon', 'Epson', 'LG', 'ASUS', 'Acer', 'Sony', 'Brother'];
const locations = ['Turnkey Africa', 'Branch Office - North', 'Branch Office - South', 'Branch Office - East', 'Branch Office - West', 'Data Center', 'Remote'];
const assetStatuses = ['Available', 'Assigned', 'In Maintenance', 'Reserved', 'Disposed'];
const assetConditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor', 'Defective'];

const UserAssets: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, addToast } = useNotifications();
  const { isConnected, isConnecting, lastError, query } = useSupabase();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  // Feature toggle state
  const [canSelfAddAsset, setCanSelfAddAsset] = useState<boolean>(false);
  // Add Asset form state
  const [showAddAssetForm, setShowAddAssetForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Laptop',
    category: 'Electronics',
    manufacturer: 'Dell',
    model: '',
    serial_number: '',
    condition: 'New',
    location: 'Turnkey Africa',
    department_id: '',
    last_maintenance: null as string | null,
    notes: '',
    purchase_date: '',
    purchase_price: 0,
    current_value: 0,
    warranty_expiry: null as string | null
  });
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  // Edit asset modal state
  const [showEditAssetForm, setShowEditAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  
  // Issue form state
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    type: 'Hardware Failure',
    priority: 'Medium'
  });
  const issueFormRef = useRef<HTMLFormElement | null>(null);
  
  // Asset request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newAssetRequest, setNewAssetRequest] = useState({
    type: '',
    reason: '',
    urgency: 'Medium'
  });
  
  // Loading states
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  // Employee department id for default assignment
  const [employeeDeptId, setEmployeeDeptId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Employee department id (if exists)
    const loadEmployeeDept = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .ilike('name', 'Employee')
          .maybeSingle();
        if (!error && data?.id) setEmployeeDeptId(data.id);
      } catch {
        // ignore
      }
    };
    loadEmployeeDept();
  }, []);

  useEffect(() => {
    // Fetch assets from Supabase
    const fetchAssets = async () => {
      try {
        // Check if user is authenticated
        if (!user?.id) {
          setAssets([]);
          setFilteredAssets([]);
          setLoading(false);
          return;
        }
        
        // Fetch assets from Supabase
        const { data, error } = await query(async () => {
          return await supabase
            .from('assets')
            .select('*')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false });
        });

        if (error) {
          throw error;
        }
        setAssets(data as Asset[]);
        setFilteredAssets(data as Asset[]);
      } catch (error) {
        console.error('Error fetching assets:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load assets',
          type: 'error'
        });
        // addToast({ // This line was removed as per the new_code, as per the new_code.
        //   title: 'Error',
        //   message: 'Failed to load assets',
        //   type: 'error'
        // });
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [addNotification, user?.id, query]);

  useEffect(() => {
    // Fetch feature toggle from system_settings
    const fetchSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'user_asset_self_add_enabled')
          .single();
        if (error) throw error;
        setCanSelfAddAsset(data?.value === 'true');
      } catch (e) {
        setCanSelfAddAsset(false);
      }
    };
    fetchSetting();
  }, []);

  // Handle issue form submission
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAsset || !user) return;
    
    setIsSubmittingIssue(true);
    
    try {
      // Create the issue object
      const newIssueObj = {
        id: `I-${Date.now()}`,
        title: newIssue.title,
        description: newIssue.description,
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        status: 'Open',
        type: newIssue.type,
        priority: newIssue.priority,
        createdBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [{
          id: `C-${Date.now()}`,
          text: newIssue.description,
          createdBy: user.name,
          createdAt: new Date().toISOString()
        }]
      };

      // Submit to Supabase
      const { error } = await query(async () => {
        return await supabase
          .from('issues')
          .insert({
            title: newIssue.title,
            description: newIssue.description,
            status: 'Open',
            priority: newIssue.priority,
            category: newIssue.type,
            reported_by: user.id,
            assigned_to: null,
            asset_id: selectedAsset.id,
            department_id: selectedAsset.department_id || null,
            estimated_resolution_date: null,
            actual_resolution_date: null
          });
      });

      if (error) throw error;

      // Notifications: persist + reporter + admins/department officers (IT dept only)
      try {
        // Persist a notification so it appears on the Notifications page
        await notificationService.create({
          user_id: user.id,
          title: 'Issue Reported',
          message: `Your issue "${newIssue.title}" has been created and is now Open.`,
          type: 'info',
          read: false
        });
        await notificationService.notifyUser(
          user.id,
          'Issue Reported',
          `Your issue "${newIssue.title}" has been created and is now Open.`,
          'info'
        );

        const recipients = await userService.getByRoles(['admin', 'department_officer']);
        const departments = await departmentService.getAll();
        const itDeptIds = new Set(
          departments.filter(d => (d.name || '').toLowerCase().includes('it')).map(d => d.id)
        );
        const targetUsers = recipients.filter(r => r.role === 'admin' || (r.role === 'department_officer' && r.department_id && itDeptIds.has(r.department_id)));
        await Promise.all(
          targetUsers
            .filter(u => u.id !== user.id)
            .map(u => notificationService.notifyUser(
              u.id,
              'New Issue Reported',
              `${user.name} reported an issue: "${newIssue.title}"`,
              'warning'
            ))
        );
      } catch (notifyErr) {
        console.warn('Failed to send creation notifications', notifyErr);
      }

      // Reset form and close modal
      setNewIssue({
        title: '',
        description: '',
        type: 'Hardware Failure',
        priority: 'Medium'
      });
      setShowIssueForm(false);
      setSelectedAsset(null);

      // Show success notification
      addNotification({
        title: 'Issue Created',
        message: `New issue created for ${selectedAsset.name}`,
        type: 'success'
      });
      addToast({
        title: 'Issue Created',
        message: `New issue created for ${selectedAsset.name}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to report issue. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to report issue. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Open issue form for a specific asset
  const openIssueForm = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowIssueForm(true);
  };

  // Handle asset request form submission
  const handleAssetRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newAssetRequest.type || !newAssetRequest.urgency || !newAssetRequest.reason) {
      console.error('Missing required fields:', newAssetRequest);
      addNotification({
        title: 'Error',
        message: 'Please fill in all required fields.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Please fill in all required fields.',
        type: 'error'
      });
      return;
    }
    setIsSubmittingRequest(true);
    try {
      console.log('User ID:', user.id);
      console.log('Insert payload:', {
        user_id: user.id,
        title: `Request for ${newAssetRequest.type}`,
        description: newAssetRequest.reason,
        type: newAssetRequest.type,
        priority: newAssetRequest.urgency,
        department_id: null
      });
      await assetRequestsService.create({
        user_id: user.id,
        title: `Request for ${newAssetRequest.type}`,
        description: newAssetRequest.reason,
        type: newAssetRequest.type,
        priority: newAssetRequest.urgency,
        department_id: null
      });

      // Notify admins/managers
      try {
        const recipients = await userService.getByRoles(['admin', 'department_officer']);
        await Promise.all(
          recipients.map(u => notificationService.notifyUser(
            u.id,
            'New Asset Request',
            `${user.name} requested a new asset: "${newAssetRequest.type}".`,
            'warning'
          ))
        );
        await notificationService.notifyUser(
          user.id,
          'Asset Request Submitted',
          `Your asset request for "${newAssetRequest.type}" has been submitted for review.`,
          'info'
        );
      } catch (e) {
        console.warn('Failed to send asset request notifications', e);
      }

      addNotification({
        title: 'Request Submitted',
        message: 'Your request for a new asset has been submitted successfully',
        type: 'success'
      });
      addToast({
        title: 'Request Submitted',
        message: 'Your request for a new asset has been submitted successfully',
        type: 'success'
      });

      setNewAssetRequest({
        type: '',
        reason: '',
        urgency: 'Medium'
      });
      setShowRequestForm(false);
    } catch (error) {
      console.error('Error submitting asset request:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to submit asset request. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to submit asset request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Add Asset submit handler
  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newAsset.name || !newAsset.type || !newAsset.serial_number) {
      addNotification({ title: 'Error', message: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    setIsSubmittingAsset(true);
    try {
      const assetToAdd = {
        ...newAsset,
        assigned_to: user.id,
        department_id: employeeDeptId || null,
        status: 'Assigned' // Will be overridden by service, but required for type
      };
      await assetService.create(assetToAdd);
      addNotification({ title: 'Asset Added', message: 'Your asset has been added.', type: 'success' });
      addToast({ title: 'Asset Added', message: `${newAsset.name} has been added and assigned to you.`, type: 'success' });
      try {
        await notificationService.create({
          user_id: user.id,
          title: 'Asset Added',
          message: `Your asset "${newAsset.name}" has been added and assigned to you.`,
          type: 'success',
          read: false
        });
        const recipients = await userService.getByRoles(['admin', 'department_officer']);
        await Promise.all(
          recipients
            .filter(u => u.id !== user.id)
            .map(u => notificationService.notifyUser(
              u.id,
              'User Added Own Asset',
              `${user.name} added an asset they own: "${newAsset.name}" (SN: ${newAsset.serial_number || 'N/A'}).`,
              'info'
            ))
        );
      } catch {}
      setShowAddAssetForm(false);
      setNewAsset({
        name: '',
        type: 'Laptop',
        category: 'Electronics',
        manufacturer: 'Dell',
        model: '',
        serial_number: '',
        condition: 'New',
        location: 'Turnkey Africa',
        department_id: '',
        last_maintenance: null,
        notes: '',
        purchase_date: '',
        purchase_price: 0,
        current_value: 0,
        warranty_expiry: null
      });
      // Refresh assets
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });
      setAssets(data as Asset[]);
      setFilteredAssets(data as Asset[]);
    } catch (error) {
      addNotification({ title: 'Error', message: 'Failed to add asset.', type: 'error' });
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const handleEditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingAsset) return;
    // Only allow editing of specific fields
    const updates: any = {
      name: editingAsset.name,
      type: editingAsset.type,
      manufacturer: editingAsset.manufacturer,
      model: editingAsset.model || '',
      serial_number: editingAsset.serial_number,
      category: editingAsset.category,
      location: editingAsset.location,
      condition: editingAsset.condition,
      notes: editingAsset.notes || '',
      updated_at: new Date().toISOString()
    };
    try {
      await assetService.update(editingAsset.id, updates);
      try { await auditService.write({ user_id: user.id, action: 'asset.update_user', entity_type: 'asset', entity_id: editingAsset.id, details: { updates } }); } catch {}
      addNotification({ title: 'Asset Updated', message: 'Your asset details have been updated.', type: 'success' });
      addToast({ title: 'Asset Updated', message: `${editingAsset.name} has been updated.`, type: 'success' });
      try {
        await notificationService.create({
          user_id: user.id,
          title: 'Asset Updated',
          message: `Your asset "${editingAsset.name}" was updated successfully.`,
          type: 'success',
          read: false
        });
      } catch {}
      // Refresh list
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });
      setAssets((data as Asset[]) || []);
      setFilteredAssets((data as Asset[]) || []);
      setShowEditAssetForm(false);
      setEditingAsset(null);
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to update asset.', type: 'error' });
    }
  };

  useEffect(() => {
    // Filter assets based on search term and filters
    let result = assets;
    if (searchTerm) {
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== 'All') {
      result = result.filter(asset => asset.type === filterType);
    }
    if (filterStatus !== 'All') {
      result = result.filter(asset => asset.status === filterStatus);
    }
    setFilteredAssets(result);
  }, [assets, searchTerm, filterType, filterStatus]);
  // Extract unique asset types from assets
  const safeAssetTypes = assets.length > 0 ? assetTypes : ['All'];
  const safeAssetStatuses = assets.length > 0 ? assetStatuses : ['All'];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Assigned':
        return 'bg-lightgreen text-primary';
      case 'In Maintenance':
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'Disposed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading assets...</p>
      </div>
    </div>;
  }

  // Check if user is not authenticated
  if (!user) {
    return <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <AlertCircleIcon className="w-16 h-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-700">Authentication Required</h3>
        <p className="mt-2 text-sm text-gray-500">Please log in to view your assets</p>
        <Link to="/login" className="px-4 py-2 mt-4 text-sm font-medium text-white bg-primary rounded-full shadow-button hover:opacity-90">
          Go to Login
        </Link>
      </div>
    </div>;
  }
  return (
    <div className="space-y-6">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <WifiOffIcon className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Database Connection Lost
              </p>
              <p className="text-xs text-red-600">
                {lastError || 'Unable to connect to the database. Some features may be unavailable.'}
              </p>
            </div>
            {isConnecting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h1 className="text-3xl font-bold text-primary">My Assets</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">View and manage your assigned assets, {user.name}.</p>
      </div>
      {/* Quick Actions */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/user/issues" className="button-primary flex items-center justify-center"> <AlertCircleIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">View My Issues</span> </Link>
          <button 
            onClick={() => setShowRequestForm(true)} 
            className="button-primary flex items-center justify-center"
          > 
            <MonitorIcon className="w-6 h-6 mr-3 text-white" /> 
            <span className="font-medium text-white">Request New Asset</span> 
          </button>
          <Link to="/" className="button-primary flex items-center justify-center"> <ArrowRightIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Back to Dashboard</span> </Link>
        </div>
        {/* User self-add disabled: Only admins can add assets */}
      </div>
      {/* Add Asset modal removed for users */}
      {/* Search and Filter */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                placeholder="Search by name, serial number, or type..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterType} onChange={e => setFilterType(e.target.value)}>
                {safeAssetTypes.map(type => <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>)}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
              <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {safeAssetStatuses.map(status => <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Assets List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">{user.name}'s Assigned Assets</h2>
            <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">{filteredAssets.length} assets</span>
          </div>
        </div>
        {filteredAssets.length > 0 ? <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3">Asset</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Serial Number</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Location</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => <tr key={asset.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                  <Link to={`/assets/${asset.id}`} className="flex items-center">
                    <img src={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"} alt={asset.name} className="w-10 h-10 mr-3 rounded-xl" />
                    <span>{asset.name}</span>
                  </Link>
                </td>
                <td className="px-6 py-4">{asset.type}</td>
                <td className="px-6 py-4">{asset.serial_number}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span>
                </td>
                <td className="px-6 py-4">{asset.location}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Link to={`/assets/${asset.id}`} className="button-primary px-3 py-1 text-xs font-medium">View Details</Link>
                    {/* Edit disabled for users; admins manage assets */}
                    <button 
                      onClick={() => openIssueForm(asset)} 
                      className="button-primary flex items-center"
                    >
                      <AlertCircleIcon className="w-4 h-4 mr-2" /> Report Issue
                    </button>
                  </div>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div> : <div className="flex flex-col items-center justify-center py-12">
          {searchTerm || filterType !== 'All' || filterStatus !== 'All' ? <>
            <AlertCircleIcon className="w-16 h-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-700">No matching assets found</h3>
            <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            <button onClick={() => { setSearchTerm(''); setFilterType('All'); setFilterStatus('All'); }} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Clear Filters</button>
          </> : <>
            <CheckCircleIcon className="w-16 h-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-700">No assets assigned yet</h3>
            <p className="mt-2 text-sm text-gray-500">You don't have any assets assigned to you yet, {user.name}</p>
          </>}
        </div>}
      </div>
      
      {/* Issue Form Modal */}
      {showIssueForm && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-lightgreen dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertCircleIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  Report an Issue
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowIssueForm(false);
                  setSelectedAsset(null);
                }} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Connection Warning */}
            {!isConnected && (
              <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <WifiOffIcon className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700">
                    You're currently offline. Please check your connection before submitting.
                  </p>
                </div>
              </div>
            )}

            {/* Asset Info Section */}
            <div className="p-6 bg-lightgreen/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Asset:</span> {selectedAsset.name}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Type:</span> {selectedAsset.type}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <form ref={issueFormRef} onSubmit={handleIssueSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Issue Title *
                    </label>
                    <input 
                      type="text" 
                      className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" 
                      placeholder="Brief description of the issue" 
                      value={newIssue.title} 
                      onChange={e => setNewIssue({
                        ...newIssue,
                        title: e.target.value
                      })} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Issue Type
                    </label>
                    <select 
                      className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" 
                      value={newIssue.type} 
                      onChange={e => setNewIssue({
                        ...newIssue,
                        type: e.target.value
                      })}
                    >
                      <option value="Hardware Failure">Hardware Failure</option>
                      <option value="Software Issue">Software Issue</option>
                      <option value="Connectivity Problem">Connectivity Problem</option>
                      <option value="Upgrade Request">Upgrade Request</option>
                      <option value="Replacement Request">Replacement Request</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select 
                    className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" 
                    value={newIssue.priority} 
                    onChange={e => setNewIssue({
                      ...newIssue,
                      priority: e.target.value
                    })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea 
                    className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all resize-none" 
                    rows={5} 
                    placeholder="Detailed description of the issue..." 
                    value={newIssue.description} 
                    onChange={e => setNewIssue({
                      ...newIssue,
                      description: e.target.value
                    })} 
                    required
                  />
                </div>

                {/* Modal Footer inside form to enable native submit */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 -mx-6 px-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowIssueForm(false);
                      setSelectedAsset(null);
                    }} 
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingIssue || !isConnected}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-lg"
                  >
                    {isSubmittingIssue ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : !isConnected ? (
                      'Offline'
                    ) : (
                      'Submit Issue'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Asset Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-lightgreen dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MonitorIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  Request New Asset
                </h3>
              </div>
              <button 
                onClick={() => setShowRequestForm(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Form Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <form onSubmit={handleAssetRequestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Asset Type *
                    </label>
                    <select 
                      className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" 
                      value={newAssetRequest.type} 
                      onChange={e => setNewAssetRequest({
                        ...newAssetRequest,
                        type: e.target.value
                      })}
                      required
                    >
                      <option value="">Select Asset Type</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Keyboard">Keyboard</option>
                      <option value="Mouse">Mouse</option>
                      <option value="Phone">Phone</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Printer">Printer</option>
                      <option value="Server">Server</option>
                      <option value="Router">Router</option>
                      <option value="Switch">Switch</option>
                      <option value="Projector">Projector</option>
                      <option value="Camera">Camera</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Urgency Level
                    </label>
                    <select 
                      className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" 
                      value={newAssetRequest.urgency} 
                      onChange={e => setNewAssetRequest({
                        ...newAssetRequest,
                        urgency: e.target.value
                      })}
                    >
                      <option value="Low">Low - Can wait a few weeks</option>
                      <option value="Medium">Medium - Needed within 1-2 weeks</option>
                      <option value="High">High - Needed within a few days</option>
                      <option value="Critical">Critical - Needed immediately</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason for Request *
                  </label>
                  <textarea 
                    className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all resize-none" 
                    rows={6} 
                    placeholder="Please explain why you need this asset, how it will improve your work, and any specific requirements or preferences..." 
                    value={newAssetRequest.reason} 
                    onChange={e => setNewAssetRequest({
                      ...newAssetRequest,
                      reason: e.target.value
                    })} 
                    required
                  />
                </div>
                
                {/* Additional Information Section */}
                <div className="p-4 bg-lightgreen/30 dark:bg-gray-800/50 rounded-xl border border-lightgreen/50 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💡 Tips for a better request:
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Be specific about the asset type and specifications needed</li>
                    <li>• Explain how this asset will improve your productivity</li>
                    <li>• Mention any urgent deadlines or business impact</li>
                    <li>• Include any specific brand or model preferences</li>
                  </ul>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <button 
                type="button" 
                onClick={() => setShowRequestForm(false)} 
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                onClick={handleAssetRequestSubmit}
                disabled={isSubmittingRequest}
                className="px-6 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isSubmittingRequest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset modal removed for users */}
    </div>
  );
};
export default UserAssets;