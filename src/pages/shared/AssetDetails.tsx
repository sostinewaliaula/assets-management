import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { AlertCircleIcon, ClockIcon, CalendarIcon, MapPinIcon, UserIcon, TagIcon, BarChart2Icon, AlertTriangleIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { assetService, userService, departmentService, issueService } from '../../services/database';
import { Asset, User, Department, Issue } from '../../lib/supabase';
import QRCode from 'react-qr-code';

const AssetDetails: React.FC = () => {
  const { assetId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    type: 'Hardware Failure',
    priority: 'Medium'
  });
  const [issues, setIssues] = useState<Issue[]>([]);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchAssetDetails = async () => {
      try {
        if (!assetId) return;
        
        // Fetch asset details from database
        const assetData = await assetService.getById(assetId);
        if (assetData) {
          setAsset(assetData);
          
          // Fetch assigned user if asset is assigned
          if (assetData.assigned_to) {
            try {
              const userData = await userService.getById(assetData.assigned_to);
              setAssignedUser(userData);
            } catch (error) {
              console.error('Error fetching assigned user:', error);
            }
          }
          
          // Fetch department if asset has a department
          if (assetData.department_id) {
            try {
              const deptData = await departmentService.getById(assetData.department_id);
              setDepartment(deptData);
            } catch (error) {
              console.error('Error fetching department:', error);
            }
          }
          // Fetch issues for this asset
          try {
            const issuesData = await issueService.getByAsset(assetId);
            setIssues(issuesData);
          } catch (error) {
            console.error('Error fetching issues:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load asset details',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [assetId, addNotification]);
  const handleIssueSubmit = e => {
    e.preventDefault();
    // In a real app, this would be an API call
    const newIssueObj = {
      id: `I-${Date.now()}`,
      title: newIssue.title,
      description: newIssue.description,
      assetId: asset.id,
      assetName: asset.name,
      assetImage: asset.image,
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
    setIssues([newIssueObj, ...issues]);
    issueService.create(newIssueObj); // Persist the new issue
    addNotification({
      title: 'Issue Created',
      message: `New issue created for ${asset.name}`,
      type: 'success'
    });
    setNewIssue({
      title: '',
      description: '',
      type: 'Hardware Failure',
      priority: 'Medium'
    });
    setShowIssueForm(false);
  };
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  const getStatusBadge = status => {
    const statusColors = {
      Available: 'bg-lightgreen text-primary',
      Assigned: 'bg-lightpurple text-secondary',
      'In Maintenance': 'bg-yellow-100 text-yellow-800',
      Reserved: 'bg-lightpurple text-secondary',
      Disposed: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };
  const getConditionBadge = condition => {
    const conditionColors = {
      New: 'bg-lightgreen text-primary',
      Excellent: 'bg-lightgreen text-primary',
      Good: 'bg-lightpurple text-secondary',
      Fair: 'bg-yellow-100 text-yellow-800',
      Poor: 'bg-orange-100 text-orange-800',
      Defective: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${conditionColors[condition] || 'bg-gray-100 text-gray-800'}`}>{condition}</span>;
  };
  const getIssueBadge = status => {
    const statusColors = {
      Open: 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Pending User Action': 'bg-lightpurple text-secondary',
      'Pending Parts': 'bg-lightpurple text-secondary',
      Resolved: 'bg-lightgreen text-primary',
      Closed: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading asset details...</p>
      </div>
    </div>;
  }
  if (!asset) {
    return <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <h1 className="text-3xl font-bold text-primary">Asset Not Found</h1>
      <p className="mt-2 text-gray-700">The asset you're looking for doesn't exist or you don't have permission to view it.</p>
      <Link to="/" className="button-primary inline-block px-4 py-2 mt-4 text-sm font-medium">Go Back to Dashboard</Link>
    </div>;
  }
  return <div className="space-y-6">
    {/* Asset Details Header */}
    <div className="flex flex-col justify-between p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card md:flex-row md:items-center">
      <div className="flex items-center">
        <div className="relative">
          <img src={asset.image || 'https://via.placeholder.com/150'} alt={asset.name} className="object-cover w-24 h-24 rounded-2xl md:w-32 md:h-32" />
          <div className="absolute bottom-0 right-0">{getStatusBadge(asset.status)}</div>
        </div>
        <div className="ml-4">
          <h1 className="text-2xl font-bold text-primary">{asset.name}</h1>
          <div className="flex flex-wrap items-center mt-2 space-x-2">
            <span className="text-sm text-gray-600">{asset.type}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">{asset.manufacturer}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">SN: {asset.serial_number}</span>
          </div>
          <div className="mt-2">{getConditionBadge(asset.condition)}</div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-4 space-y-2 md:mt-0 md:items-end">
        <button onClick={() => setShowIssueForm(true)} className="button-primary flex items-center">
          <AlertCircleIcon className="w-4 h-4 mr-2" /> Report Issue
        </button>
        {isAdmin && <div className="flex space-x-2">
          <Link to={`/admin/assets/edit/${asset.id}`} className="px-4 py-2 text-sm font-medium text-secondary border border-secondary rounded-full hover:bg-lightpurple">Edit Asset</Link>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50">Dispose Asset</button>
        </div>}
      </div>
    </div>
    {/* Asset Details Content */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Details */}
      <div className="lg:col-span-2">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h2 className="mb-4 text-xl font-bold text-primary">Asset Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <TagIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Serial Number</span>
              </div>
              <p className="text-sm text-gray-600">{asset.serial_number}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Purchase Date</span>
              </div>
              <p className="text-sm text-gray-600">{formatDate(asset.purchase_date)}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Warranty End</span>
              </div>
              <p className="text-sm text-gray-600">{formatDate(asset.warranty_expiry)}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Location</span>
              </div>
              <p className="text-sm text-gray-600">{asset.location}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Assigned To</span>
              </div>
              <p className="text-sm text-gray-600">{assignedUser?.name || 'Unassigned'}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <BarChart2Icon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Condition</span>
              </div>
              <p className="text-sm text-gray-600">{asset.condition}</p>
            </div>
            <div className="p-4 bg-lightgreen rounded-xl">
              <div className="flex items-center mb-2">
                <AlertTriangleIcon className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status</span>
              </div>
              <p className="text-sm text-gray-600">{asset.status}</p>
            </div>
          </div>
          {asset.notes && <div className="p-4 mt-4 bg-lightgreen rounded-xl">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Notes</h3>
              <p className="text-sm text-gray-600">{asset.notes}</p>
            </div>}
        </div>
        {/* Asset Issues */}
         <div className="p-6 mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary">Issues History</h2>
            <button onClick={() => setShowIssueForm(true)} className="button-primary flex items-center px-3 py-1 text-sm font-medium"><PlusIcon className="w-4 h-4 mr-1" /> New Issue</button>
          </div>
          {issues.length > 0 ? <div className="space-y-4">
              {issues.map(issue => <div key={issue.id} className="p-4 bg-lightgreen rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-800">{issue.title}</h3>
                      <div className="ml-2">{getIssueBadge(issue.status)}</div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Reported by {issue.createdBy.name} on {formatDate(issue.createdAt)}</p>
                    <p className="mt-2 text-sm text-gray-600">{issue.description}</p>
                  </div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">{issue.priority}</div>
                </div>
                {issue.comments && issue.comments.length > 1 && <div className="mt-3">
                  <div className="flex items-center mb-2"><span className="text-xs font-medium text-gray-700">Latest Update</span></div>
                  <div className="p-3 bg-white rounded-xl"><p className="text-xs text-gray-600">{issue.comments[issue.comments.length - 1].text}</p><p className="mt-1 text-xs text-gray-500">{issue.comments[issue.comments.length - 1].createdBy} - {formatDate(issue.comments[issue.comments.length - 1].createdAt)}</p></div>
                </div>}
              </div>)}
            </div> : <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircleIcon className="w-12 h-12 text-primary" />
              <p className="mt-2 text-gray-600">No issues reported for this asset</p>
            </div>}
        </div>
      </div>
      {/* Side Information */}
      <div>
        {/* QR Code */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h2 className="mb-4 text-xl font-bold text-primary">Asset QR Code</h2>
          <div className="flex flex-col items-center p-4 bg-white rounded-2xl">
            <QRCode value={`https://turnkey-ams.com/assets/${asset.id}`} size={180} level="H" />
            <p className="mt-4 text-sm text-gray-600">Scan to view asset details</p>
            <button className="px-4 py-2 mt-4 text-sm font-medium text-secondary border border-secondary rounded-full hover:bg-lightpurple">Download QR Code</button>
          </div>
        </div>
        {/* Assigned User */}
        {assignedUser && <div className="p-6 mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h2 className="mb-4 text-xl font-bold text-primary">Assigned User</h2>
          <div className="flex items-center p-4 bg-lightgreen dark:bg-gray-800 rounded-xl">
            <div className="p-2 mr-4 text-gray-400 bg-lightgreen dark:bg-gray-800 rounded-full">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800">{assignedUser.name}</h3>
              <p className="text-xs text-gray-600">{assignedUser.email}</p>
              <p className="mt-1 text-xs text-gray-500">{department?.name}</p>
            </div>
          </div>
        </div>}
        {/* Warranty Information */}
        <div className="p-6 mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h2 className="mb-4 text-xl font-bold text-primary">Warranty Information</h2>
          <div className="p-4 bg-lightgreen rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              {new Date(asset.warranty_expiry) > new Date() ? <span className="px-2 py-1 text-xs font-medium text-primary bg-lightgreen rounded-full">Active</span> : <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Expired</span>}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-gray-600">Purchase Date</span><span className="text-xs font-medium text-gray-700">{formatDate(asset.purchase_date)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-600">Warranty End</span><span className="text-xs font-medium text-gray-700">{formatDate(asset.warranty_expiry)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-600">Days Remaining</span><span className="text-xs font-medium text-gray-700">{new Date(asset.warranty_expiry) > new Date() ? Math.ceil((new Date(asset.warranty_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 'Expired'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Issue Form Modal remains, update classes to match the new theme. */}
    {showIssueForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Report an Issue
              </h3>
              <button onClick={() => setShowIssueForm(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Issue Title
                </label>
                <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" placeholder="Brief description of the issue" value={newIssue.title} onChange={e => setNewIssue({
              ...newIssue,
              title: e.target.value
            })} required />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Issue Type
                </label>
                <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" value={newIssue.type} onChange={e => setNewIssue({
              ...newIssue,
              type: e.target.value
            })}>
                  <option value="Hardware Failure">Hardware Failure</option>
                  <option value="Software Issue">Software Issue</option>
                  <option value="Connectivity Problem">
                    Connectivity Problem
                  </option>
                  <option value="Upgrade Request">Upgrade Request</option>
                  <option value="Replacement Request">
                    Replacement Request
                  </option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" value={newIssue.priority} onChange={e => setNewIssue({
              ...newIssue,
              priority: e.target.value
            })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" rows={4} placeholder="Detailed description of the issue" value={newIssue.description} onChange={e => setNewIssue({
              ...newIssue,
              description: e.target.value
            })} required></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowIssueForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>}
  </div>;
};
export default AssetDetails;