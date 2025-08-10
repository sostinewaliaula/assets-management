import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, DownloadIcon, UploadIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { generateMockAssets, assetTypes, departments, locations, assetStatuses, manufacturers } from '../../utils/mockData';
const AssetManagement: React.FC = () => {
  const {
    addNotification
  } = useNotifications();
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Laptop',
    manufacturer: 'Dell',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyEndDate: '',
    department: 'IT',
    location: 'Headquarters - Floor 1',
    status: 'Available',
    condition: 'New',
    notes: ''
  });
  useEffect(() => {
    // Fetch assets
    const fetchAssets = async () => {
      try {
        // In a real app, this would be an API call
        const mockAssets = generateMockAssets(50);
        setAssets(mockAssets);
        setFilteredAssets(mockAssets);
      } catch (error) {
        console.error('Error fetching assets:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load assets',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [addNotification]);
  useEffect(() => {
    // Filter assets based on search term and filters
    let result = assets;
    if (searchTerm) {
      result = result.filter(asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || asset.type.toLowerCase().includes(searchTerm.toLowerCase()) || asset.assignedUser && asset.assignedUser.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterType !== 'All') {
      result = result.filter(asset => asset.type === filterType);
    }
    if (filterStatus !== 'All') {
      result = result.filter(asset => asset.status === filterStatus);
    }
    if (filterDepartment !== 'All') {
      result = result.filter(asset => asset.department === filterDepartment);
    }
    setFilteredAssets(result);
  }, [assets, searchTerm, filterType, filterStatus, filterDepartment]);
  const handleAddAsset = e => {
    e.preventDefault();
    // Generate a unique ID
    const newId = `A-${Date.now()}`;
    // Generate a random serial number if not provided
    const serialNumber = newAsset.serialNumber || `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    // Get a default image based on the asset type
    const assetImages = {
      Laptop: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      Desktop: ['https://images.unsplash.com/photo-1593640495253-23196b27a87f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80'],
      Monitor: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      Phone: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80']
    };
    const defaultImage = 'https://images.unsplash.com/photo-1563770660941-20978e870e26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';
    const imageArray = assetImages[newAsset.type] || [defaultImage];
    const image = imageArray[Math.floor(Math.random() * imageArray.length)];
    // Create the new asset object
    const assetToAdd = {
      id: newId,
      ...newAsset,
      serialNumber,
      image,
      purchaseDate: newAsset.purchaseDate || new Date().toISOString(),
      warrantyEndDate: newAsset.warrantyEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString()
    };
    // Add the new asset to the list
    setAssets([assetToAdd, ...assets]);
    // Close the modal and reset the form
    setShowAddAssetModal(false);
    setNewAsset({
      name: '',
      type: 'Laptop',
      manufacturer: 'Dell',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      warrantyEndDate: '',
      department: 'IT',
      location: 'Headquarters - Floor 1',
      status: 'Available',
      condition: 'New',
      notes: ''
    });
    // Show a notification
    addNotification({
      title: 'Asset Added',
      message: `New asset "${assetToAdd.name}" has been added successfully`,
      type: 'success'
    });
  };
  const handleDeleteAsset = () => {
    if (!selectedAsset) return;
    // Filter out the selected asset
    const updatedAssets = assets.filter(asset => asset.id !== selectedAsset.id);
    setAssets(updatedAssets);
    // Show a notification
    addNotification({
      title: 'Asset Deleted',
      message: `Asset "${selectedAsset.name}" has been deleted`,
      type: 'info'
    });
    // Close the modal and reset the selected asset
    setShowDeleteModal(false);
    setSelectedAsset(null);
  };
  const getStatusColor = status => {
    switch (status) {
      case 'Available':
        return 'bg-lightgreen text-primary';
      case 'Assigned':
        return 'bg-lightpurple text-secondary';
      case 'In Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reserved':
        return 'bg-lightpurple text-secondary';
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
  return <div className="space-y-6">
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Asset Management</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">View, add, edit, and manage all company assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddAssetModal(true)} className="button-primary flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" /> Add New Asset
          </button>
          <button onClick={() => { addNotification({ title: 'Export Started', message: 'Asset data is being exported to CSV', type: 'info' }); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">
            <DownloadIcon className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={() => { addNotification({ title: 'Import', message: 'Please select a CSV file to import asset data', type: 'info' }); }} className="px-4 py-2 text-sm font-medium text-secondary bg-lightpurple rounded-full shadow-button hover:opacity-90">
            <UploadIcon className="w-4 h-4 mr-2" /> Import
          </button>
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
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search by name, serial number, or type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              {assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              {assetStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FilterIcon className="w-5 h-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
              <option value="All">All Departments</option>
              {departments.map(department => <option key={department} value={department}>{department}</option>)}
            </select>
          </div>
          <button onClick={() => { setSearchTerm(''); setFilterType('All'); setFilterStatus('All'); setFilterDepartment('All'); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center">
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
          </button>
        </div>
      </div>
    </div>
    {/* Assets List */}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Assets</h2>
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
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Assigned To</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
           <tbody>
            {filteredAssets.map(asset => <tr key={asset.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                <Link to={`/assets/${asset.id}`} className="flex items-center">
                  <img src={asset.image} alt={asset.name} className="w-10 h-10 mr-3 rounded-xl" />
                  <span>{asset.name}</span>
                </Link>
              </td>
               <td className="px-6 py-4">{asset.type}</td>
               <td className="px-6 py-4">{asset.serialNumber}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span>
              </td>
               <td className="px-6 py-4">{asset.department}</td>
               <td className="px-6 py-4">{asset.assignedUser ? <div className="flex items-center"><div className="p-1 mr-2 text-gray-400 bg-lightgreen rounded-full dark:bg-gray-800"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg></div><span>{asset.assignedUser.name}</span></div> : <span className="text-gray-400">Unassigned</span>}</td>
               <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <Link to={`/assets/${asset.id}`} className="p-1 text-secondary rounded hover:bg-lightpurple dark:hover:bg-gray-800" title="View Details"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></Link>
                  <button onClick={() => { addNotification({ title: 'Edit Asset', message: `Editing ${asset.name}`, type: 'info' }); }} className="p-1 text-yellow-600 rounded hover:bg-yellow-100 dark:hover:bg-gray-800" title="Edit Asset"><EditIcon className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedAsset(asset); setShowDeleteModal(true); }} className="p-1 text-red-600 rounded hover:bg-red-100 dark:hover:bg-gray-800" title="Delete Asset"><TrashIcon className="w-5 h-5" /></button>
                </div>
               </td>
            </tr>)}
          </tbody>
        </table>
      </div> : <div className="flex flex-col items-center justify-center py-12">
        {searchTerm || filterType !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' ? <>
          <AlertCircleIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No matching assets found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          <button onClick={() => { setSearchTerm(''); setFilterType('All'); setFilterStatus('All'); setFilterDepartment('All'); }} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Clear Filters</button>
        </> : <>
          <CheckCircleIcon className="w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No assets found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first asset</p>
          <button onClick={() => setShowAddAssetModal(true)} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Add New Asset</button>
        </>}
      </div>}
    </div>
    {/* Add Asset Modal */}
    {showAddAssetModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-4xl p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Add New Asset</h3>
          <button onClick={() => setShowAddAssetModal(false)} className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleAddAsset}>
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Asset Name</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Dell XPS 15 Laptop" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Asset Type</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.type} onChange={e => setNewAsset({ ...newAsset, type: e.target.value })} required>
                {assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Manufacturer</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.manufacturer} onChange={e => setNewAsset({ ...newAsset, manufacturer: e.target.value })} required>
                {manufacturers.map(manufacturer => <option key={manufacturer} value={manufacturer}>{manufacturer}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Model</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="XPS 15 9500" value={newAsset.model} onChange={e => setNewAsset({ ...newAsset, model: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Serial Number</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="SN-1234567890" value={newAsset.serialNumber} onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Warranty End Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.warrantyEndDate} onChange={e => setNewAsset({ ...newAsset, warrantyEndDate: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Department</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.department} onChange={e => setNewAsset({ ...newAsset, department: e.target.value })} required>
                {departments.map(department => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Location</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.location} onChange={e => setNewAsset({ ...newAsset, location: e.target.value })} required>
                {locations.map(location => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Status</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.status} onChange={e => setNewAsset({ ...newAsset, status: e.target.value })} required>
                {assetStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Condition</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.condition} onChange={e => setNewAsset({ ...newAsset, condition: e.target.value })} required>
                <option value="New">New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Defective">Defective</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Notes</label>
            <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows={3} placeholder="Additional notes about this asset" value={newAsset.notes} onChange={e => setNewAsset({ ...newAsset, notes: e.target.value })}></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowAddAssetModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2 text-sm font-medium">Add Asset</button>
          </div>
        </form>
      </div>
    </div>}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && selectedAsset && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Confirm Deletion
          </h3>
          <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedAsset(null);
          }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the asset "{selectedAsset.name}
            "? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={() => {
            setShowDeleteModal(false);
            setSelectedAsset(null);
          }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleDeleteAsset} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
            Delete Asset
          </button>
        </div>
      </div>
    </div>}
  </div>;
};
export default AssetManagement;