import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, MonitorIcon, ArrowRightIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { supabase, Asset } from '../../lib/supabase';

const UserAssets: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    addNotification,
    addToast
  } = useNotifications();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  useEffect(() => {
    // Fetch user's assets
    const fetchAssets = async () => {
      try {
        // Check if user is authenticated
        if (!user?.id) {
          setAssets([]);
          setFilteredAssets([]);
          setLoading(false);
          return;
        }
        
        // In a real app, this would be an API call
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false });

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
        addToast({
          title: 'Error',
          message: 'Failed to load assets',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [addNotification, user?.id]);
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
  const assetTypes = ['All', ...new Set(assets.map(asset => asset.type))];
  // Extract unique asset statuses from assets
  const assetStatuses = ['All', ...new Set(assets.map(asset => asset.status))];
  
  // Ensure we have assets before trying to extract types and statuses
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
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h1 className="text-3xl font-bold text-primary">My Assets</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">View and manage your assigned assets, {user.name}.</p>
      </div>
      {/* Quick Actions */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/my-issues" className="button-primary flex items-center justify-center"> <AlertCircleIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">View My Issues</span> </Link>
          <button onClick={() => { 
            addNotification({ title: 'Request Submitted', message: 'Your request for a new asset has been submitted', type: 'success' }); 
            addToast({ title: 'Request Submitted', message: 'Your request for a new asset has been submitted', type: 'success' }); 
          }} className="button-primary flex items-center justify-center"> <MonitorIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Request New Asset</span> </button>
          <Link to="/" className="button-primary flex items-center justify-center"> <ArrowRightIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Back to Dashboard</span> </Link>
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
                    <img src="https://via.placeholder.com/50" alt={asset.name} className="w-10 h-10 mr-3 rounded-xl" />
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
                    <button onClick={() => { 
                      addNotification({ title: 'Issue Reported', message: `Issue reported for ${asset.name}`, type: 'info' }); 
                      addToast({ title: 'Issue Reported', message: `Issue reported for ${asset.name}`, type: 'info' }); 
                    }} className="px-3 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded-full hover:bg-yellow-200">Report Issue</button>
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
    </div>
  );
};
export default UserAssets;