import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSupabase } from '../../hooks/useSupabase';
import { AlertCircleIcon, ClockIcon, CalendarIcon, MapPinIcon, UserIcon, TagIcon, BarChart2Icon, AlertTriangleIcon, PlusIcon, CheckCircleIcon, XCircleIcon, WifiIcon, WifiOffIcon } from 'lucide-react';
import { assetService, userService, departmentService, issueService, notificationService } from '../../services/database';
import { Asset, User, Department, Issue, supabase } from '../../lib/supabase';
import QRCode from 'react-qr-code';
import { formatKES } from '../../utils/formatCurrency';

const AssetDetails: React.FC = () => {
  const { assetId } = useParams();
  const { user } = useAuth();
  const { addNotification, addToast } = useNotifications();
  const { isConnected, isConnecting, lastError, query } = useSupabase();
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
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [isDisposing, setIsDisposing] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const qrRef = useRef<HTMLDivElement | null>(null);

  const recomputeDepartmentStats = async (departmentId: string | null) => {
    try {
      if (!departmentId) return;
      const assetsInDept = await assetService.getByDepartment(departmentId);
      const asset_count = assetsInDept.length;
      const totalValue = assetsInDept.reduce((sum, a) => sum + (Number((a as any).current_value) || 0), 0);
      await departmentService.update(departmentId, { asset_count, asset_value: formatKES(totalValue) } as any);
    } catch (e) {
      console.warn('Failed to recompute department stats', e);
    }
  };

  useEffect(() => {
    const fetchAssetDetails = async () => {
      try {
        if (!assetId) return;
        
        // Fetch asset details from database
        const assetData = await assetService.getById(assetId);
        if (assetData) {
          // Check if user has permission to view this asset
          if (user?.role !== 'admin' && assetData.assigned_to !== user?.id) {
            addNotification({
              title: 'Access Denied',
              message: 'You can only view assets assigned to you',
              type: 'error'
            });
            addToast({
              title: 'Access Denied',
              message: 'You can only view assets assigned to you',
              type: 'error'
            });
            setLoading(false);
            return;
          }
          
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
            const { data: issuesData, error: issuesError } = await supabase
              .from('issues')
              .select('*')
              .eq('asset_id', assetId)
              .order('created_at', { ascending: false });
            
            if (issuesError) {
              console.error('Error fetching issues:', issuesError);
            } else {
              setIssues(issuesData || []);
            }
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
        addToast({
          title: 'Error',
          message: 'Failed to load asset details',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [assetId, addNotification, user]);

  useEffect(() => {
    // Fetch departments and users for dropdowns
    const fetchDropdowns = async () => {
      try {
        const [departments, users] = await Promise.all([
          departmentService.getAll(),
          userService.getAll(),
        ]);
        setDepartmentsList(departments);
        setUsersList(users);
      } catch (error) {
        // ignore for now
      }
    };
    if (isAdmin) fetchDropdowns();
  }, [isAdmin]);

  // Build a real, shareable URL for the QR code based on current origin
  useEffect(() => {
    if (asset?.id) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://turnkey-ams.com';
      setQrUrl(`${origin}/assets/${asset.id}`);
    }
  }, [asset?.id]);

  const handleDownloadQr = async (format: 'png' | 'jpg' = 'png') => {
    try {
      const wrapper = qrRef.current;
      if (!wrapper) return;
      const svg = wrapper.querySelector('svg');
      if (!svg) return;

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      const size = 1024; // high-res export
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await new Promise(resolve => {
        img.onload = () => resolve(null);
        img.src = url;
      });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const pngUrl = canvas.toDataURL(mime, 0.92);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `asset-${asset?.id}-qrcode.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast({ title: 'QR Code Downloaded', message: `Saved as ${format.toUpperCase()}.`, type: 'success' });
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to download QR code.', type: 'error' });
    }
  };

  const handleCopyLink = async () => {
    try {
      if (!qrUrl) return;
      await navigator.clipboard.writeText(qrUrl);
      addToast({ title: 'Link Copied', message: 'Asset link copied to clipboard.', type: 'success' });
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to copy link.', type: 'error' });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && qrUrl) {
        await navigator.share({ title: 'Asset Details', text: 'View this asset in Assets Management', url: qrUrl });
      } else {
        await handleCopyLink();
      }
    } catch (_e) {
      // user may dismiss share sheet
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !user) return;
    
    setIsSubmittingIssue(true);
    
    try {
      // Create issue object that matches Supabase schema
      const newIssueObj = {
        title: newIssue.title,
        description: newIssue.description,
        status: 'Open',
        priority: newIssue.priority,
        category: newIssue.type, // Map type to category
        reported_by: user.id,
        assigned_to: null, // Will be assigned by admin later
        asset_id: asset.id,
        department_id: asset.department_id,
        estimated_resolution_date: null,
        actual_resolution_date: null
      };
      
      // Create the issue using enhanced query function with automatic reconnection
      const { data, error } = await query(async () => {
        return await supabase
          .from('issues')
          .insert([newIssueObj])
          .select();
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        // Add the new issue to the local state
        setIssues([data[0], ...issues]);
        
        // Show success notifications
        addNotification({
          title: 'Issue Created',
          message: `New issue created for ${asset.name}`,
          type: 'success'
        });
        addToast({
          title: 'Issue Created',
          message: `New issue created for ${asset.name}`,
          type: 'success'
        });

        // Dispatch backend notifications and emails
        try {
          // Notify reporter
          await notificationService.notifyUser(
            user.id,
            'Issue Reported',
            `Your issue "${newIssue.title}" has been created and is now Open.`,
            'info'
          );

          // Notify admins and IT officers only
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
      }
    } catch (error) {
      console.error('Error creating issue:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to create issue. Please try again.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to create issue. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Dispose asset handler
  const handleDisposeAsset = async () => {
    if (!asset) return;
    setIsDisposing(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'Disposed' })
        .eq('id', asset.id);
      if (error) throw error;
      setAsset({ ...asset, status: 'Disposed' });
      addNotification({
        title: 'Asset Disposed',
        message: `${asset.name} has been marked as Disposed.`,
        type: 'success',
      });
      setShowDisposeModal(false);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to dispose asset. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDisposing(false);
    }
  };

  // Edit asset logic
  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setIsUpdating(true);
    try {
      const previousDeptId = asset?.department_id || null;
      const updated = await assetService.update(editingAsset.id, editingAsset);
      setAsset(updated);
      const newDeptId = updated.department_id || null;
      if (previousDeptId !== newDeptId) {
        await Promise.all([
          recomputeDepartmentStats(previousDeptId),
          recomputeDepartmentStats(newDeptId)
        ]);
      } else {
        await recomputeDepartmentStats(newDeptId);
      }
      setShowEditAssetModal(false);
      setEditingAsset(null);
      addNotification({
        title: 'Asset Updated',
        message: `Asset "${updated.name}" has been updated successfully`,
        type: 'success',
      });
      addToast({
        title: 'Asset Updated',
        message: `Asset "${updated.name}" has been updated successfully`,
        type: 'success',
      });
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to update asset. Please try again.',
        type: 'error',
      });
      addToast({
        title: 'Error',
        message: 'Failed to update asset. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Available: 'bg-lightgreen text-primary',
      Assigned: 'bg-lightpurple text-secondary',
      'In Maintenance': 'bg-yellow-100 text-yellow-800',
      Reserved: 'bg-lightpurple text-secondary',
      Disposed: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };
  const getConditionBadge = (condition: string) => {
    const conditionColors: Record<string, string> = {
      New: 'bg-lightgreen text-primary',
      Excellent: 'bg-lightgreen text-primary',
      Good: 'bg-lightpurple text-secondary',
      Fair: 'bg-yellow-100 text-yellow-800',
      Poor: 'bg-orange-100 text-orange-800',
      Defective: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${conditionColors[condition] || 'bg-gray-100 text-gray-800'}`}>{condition}</span>;
  };
  const getIssueBadge = (status: string) => {
    const statusColors: Record<string, string> = {
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
      <p className="mt-2 text-gray-700 dark:text-gray-300">The asset you're looking for doesn't exist or you don't have permission to view it.</p>
      <div className="mt-4 space-y-2">
        <Link to="/" className="button-primary inline-block px-4 py-2 text-sm font-medium">Go Back to Dashboard</Link>
        {user?.role !== 'admin' && (
          <Link to="/user/assets" className="inline-block px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors ml-2">
            View My Assets
          </Link>
        )}
      </div>
    </div>;
  }
  return <div className="space-y-6">
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
    
    {/* Asset Details Header */}
    <div className="flex flex-col justify-between p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card md:flex-row md:items-center">
      <div className="flex items-center">
        <div className="relative">
          <img src={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"} alt={asset.name} className="object-cover w-24 h-24 rounded-2xl md:w-32 md:h-32" />
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
        {isAdmin && (
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 text-sm font-medium text-secondary border border-secondary rounded-full hover:bg-lightpurple"
              onClick={() => {
                setEditingAsset(asset);
                setShowEditAssetModal(true);
              }}
            >
              Edit Asset
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50"
              onClick={() => setShowDisposeModal(true)}
              disabled={asset.status === 'Disposed'}
            >
              Dispose Asset
            </button>
          </div>
        )}
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
                    <p className="mt-1 text-xs text-gray-500">Reported on {formatDate(issue.created_at)}</p>
                    <p className="mt-2 text-sm text-gray-600">{issue.description}</p>
                  </div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">{issue.priority}</div>
                </div>
                {issue.category && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Category: {issue.category}</span>
                  </div>
                )}
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
          <div className="flex flex-col items-center p-4 bg-white rounded-2xl" ref={qrRef}>
            <QRCode 
              value={qrUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://turnkey-ams.com'}/assets/${asset.id}`}
              size={180}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <p className="mt-4 text-sm text-gray-600">Scan to view asset details</p>
            <div className="flex space-x-2 mt-4">
              <button onClick={handleCopyLink} className="button-primary px-3 py-1 text-xs font-medium">Copy Link</button>
              <button onClick={() => handleDownloadQr('png')} className="button-primary px-3 py-1 text-xs font-medium">Download PNG</button>
              <button onClick={handleShare} className="button-primary px-3 py-1 text-xs font-medium">Share</button>
            </div>
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
              {new Date(asset.warranty_expiry || '').getTime() > new Date().getTime() ? <span className="px-2 py-1 text-xs font-medium text-primary bg-lightgreen rounded-full">Active</span> : <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Expired</span>}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-gray-600">Purchase Date</span><span className="text-xs font-medium text-gray-700">{formatDate(asset.purchase_date)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-600">Warranty End</span><span className="text-xs font-medium text-gray-700">{formatDate(asset.warranty_expiry)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-600">Days Remaining</span><span className="text-xs font-medium text-gray-700">{new Date(asset.warranty_expiry || '').getTime() > new Date().getTime() ? Math.ceil((new Date(asset.warranty_expiry || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'Expired'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Issue Form Modal */}
    {showIssueForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
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
              <button onClick={() => setShowIssueForm(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
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
            {asset && (
              <div className="p-6 bg-lightgreen/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Asset:</span> {asset.name}
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Type:</span> {asset.type}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scrollable Form Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <form onSubmit={handleIssueSubmit} className="space-y-6">
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
                
                {/* Hidden submit button for form submission */}
                <button type="submit" className="hidden">Submit</button>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <button 
                type="button" 
                onClick={() => setShowIssueForm(false)} 
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
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
          </div>
        </div>}
  {/* Dispose Confirmation Modal */}
  {showDisposeModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-700">Dispose Asset</h3>
          <button onClick={() => setShowDisposeModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to mark <span className="font-bold">{asset.name}</span> as <span className="text-red-700">Disposed</span>? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowDisposeModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            disabled={isDisposing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDisposeAsset}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-400 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisposing}
          >
            {isDisposing ? 'Disposing...' : 'Confirm Dispose'}
          </button>
        </div>
      </div>
    </div>
  )}
  {/* Edit Asset Modal */}
  {showEditAssetModal && editingAsset && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Edit Asset: {editingAsset.name}</h3>
          <button onClick={() => setShowEditAssetModal(false)} className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleEditAsset}>
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Asset Name</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.name} onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Asset Type</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.type} onChange={e => setEditingAsset({ ...editingAsset, type: e.target.value })} required>
                {['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Phone', 'Tablet', 'Printer', 'Server', 'Router', 'Switch', 'Projector', 'Camera', 'Furniture', 'Vehicle'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Manufacturer</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.manufacturer} onChange={e => setEditingAsset({ ...editingAsset, manufacturer: e.target.value })} required>
                {['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Samsung', 'Cisco', 'Logitech', 'Canon', 'Epson', 'LG', 'ASUS', 'Acer', 'Sony', 'Brother'].map(manufacturer => <option key={manufacturer} value={manufacturer}>{manufacturer}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Model</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.model} onChange={e => setEditingAsset({ ...editingAsset, model: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Price</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.purchase_price} onChange={e => setEditingAsset({ ...editingAsset, purchase_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Current Value</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.current_value} onChange={e => setEditingAsset({ ...editingAsset, current_value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Category</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.category} onChange={e => setEditingAsset({ ...editingAsset, category: e.target.value })} required>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Office Equipment">Office Equipment</option>
                <option value="Software">Software</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Serial Number</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.serial_number} onChange={e => setEditingAsset({ ...editingAsset, serial_number: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.purchase_date || ''} onChange={e => setEditingAsset({ ...editingAsset, purchase_date: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Warranty End Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.warranty_expiry || ''} onChange={e => setEditingAsset({ ...editingAsset, warranty_expiry: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Department</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.department_id || ''} onChange={e => setEditingAsset({ ...editingAsset, department_id: e.target.value || '' })} required>
                <option value="">Select Department</option>
                {departmentsList.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Location</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.location} onChange={e => setEditingAsset({ ...editingAsset, location: e.target.value })} required>
                {['Headquarters - Floor 1', 'Headquarters - Floor 2', 'Headquarters - Floor 3', 'Branch Office - North', 'Branch Office - South', 'Branch Office - East', 'Branch Office - West', 'Data Center', 'Remote'].map(location => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Status</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.status} onChange={e => setEditingAsset({ ...editingAsset, status: e.target.value })} required>
                {['Available', 'Assigned', 'In Maintenance', 'Reserved', 'Disposed'].map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Condition</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.condition} onChange={e => setEditingAsset({ ...editingAsset, condition: e.target.value })} required>
                {['New', 'Excellent', 'Good', 'Fair', 'Poor', 'Defective'].map(condition => <option key={condition} value={condition}>{condition}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Assigned To</label>
            <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.assigned_to || ''} onChange={e => setEditingAsset({ ...editingAsset, assigned_to: e.target.value || null })}>
              <option value="">Select User</option>
              {usersList.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Notes</label>
            <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows={3} value={editingAsset.notes || ''} onChange={e => setEditingAsset({ ...editingAsset, notes: e.target.value })}></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowEditAssetModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2 text-sm font-medium" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )}
  </div>;
};
export default AssetDetails;