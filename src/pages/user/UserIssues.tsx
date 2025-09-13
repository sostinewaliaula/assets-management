import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, PlusIcon, XCircleIcon, InfoIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../hooks/useSupabase';
import { notificationService, userService, departmentService, auditService } from '../../services/database';
import ConnectionStatus from '../../components/ui/ConnectionStatus';

const UserIssues: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, addToast } = useNotifications();
  const { isConnected, isConnecting, lastError, query } = useSupabase();
  const [assets, setAssets] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [reportIssue, setReportIssue] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Other',
    asset_id: ''
  });

  useEffect(() => {
    // Fetch user's issues and assets from Supabase
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch assets assigned to the user
        const { data: assetData, error: assetError } = await query(async () => {
          return await supabase
            .from('assets')
            .select('*')
            .eq('assigned_to', user.id);
        });
        if (assetError) throw assetError;
        setAssets(assetData || []);
        // Fetch issues reported by or assigned to the user
        const { data: issueData, error: issueError } = await query(async () => {
          return await supabase
            .from('issues')
            .select('*')
            .or(`reported_by.eq.${user.id},assigned_to.eq.${user.id}`)
            .order('created_at', { ascending: false });
        });
        if (issueError) throw issueError;
        // Enrich with asset names
        const assetIds = Array.from(new Set((issueData || []).map((i: any) => i.asset_id).filter(Boolean)));
        let idToAssetName = new Map<string, string>();
        if (assetIds.length > 0) {
          const { data: assetsForIssues } = await supabase
            .from('assets')
            .select('id,name')
            .in('id', assetIds as any);
          (assetsForIssues || []).forEach((a: any) => idToAssetName.set(a.id, a.name));
        }
        const enriched = (issueData || []).map((i: any) => ({
          ...i,
          assetName: i.asset_id ? (idToAssetName.get(i.asset_id) || i.asset_id) : 'No Asset',
          assetId: i.asset_id,
          assetImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"
        }));
        setIssues(enriched);
        setFilteredIssues(enriched);
      } catch (error) {
        addNotification({
          title: 'Error',
          message: 'Failed to load issues',
          type: 'error'
        });
        addToast({
          title: 'Error',
          message: 'Failed to load issues',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [addNotification, user?.id, query]);
  useEffect(() => {
    // Filter issues based on search term and filters
    let result = issues;
    if (searchTerm) {
      result = result.filter(issue => issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || issue.description.toLowerCase().includes(searchTerm.toLowerCase()) || (issue.assetName || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus !== 'All') {
      result = result.filter(issue => issue.status === filterStatus);
    }
    if (filterPriority !== 'All') {
      result = result.filter(issue => issue.priority === filterPriority);
    }
    setFilteredIssues(result);
  }, [issues, searchTerm, filterStatus, filterPriority]);
  // Extract unique issue statuses from issues
  const issueStatuses = ['All', ...new Set(issues.map(issue => issue.status))];
  // Extract unique priorities from issues
  const issuePriorities = ['All', 'Low', 'Medium', 'High', 'Critical'];
  const canManageIssue = (issue: any) => issue.assigned_to === user?.id;
  const handleReportIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!reportIssue.title.trim() || !reportIssue.description.trim()) return;

    setIsSubmittingIssue(true);
    try {
      const selectedAsset = assets.find(a => a.id === reportIssue.asset_id);
      const newIssuePayload = {
        title: reportIssue.title,
        description: reportIssue.description,
        status: 'Open',
        priority: reportIssue.priority,
        category: reportIssue.category,
        reported_by: user.id,
        assigned_to: null as string | null,
        asset_id: reportIssue.asset_id || null,
        department_id: selectedAsset?.department_id || null,
        estimated_resolution_date: null as string | null,
        actual_resolution_date: null as string | null
      };

      const { data: created, error } = await query(async () => {
        return await supabase
          .from('issues')
          .insert(newIssuePayload as any)
          .select()
          .single();
      });
      if (error) throw error;
      setIssues(prev => [created, ...prev]);
      try { await auditService.write({ user_id: user.id, action: 'issue.create', entity_type: 'issue', entity_id: created.id, details: { after: created } }); } catch {}

      try {
        await notificationService.create({
          user_id: user.id,
          title: 'Issue Reported',
          message: `Your issue "${reportIssue.title}" has been created and is now Open.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
        await notificationService.notifyUser(
          user.id,
          'Issue Reported',
          `Your issue "${reportIssue.title}" has been created and is now Open.`,
          'info'
        );
        try {
          const recipients = await userService.getByRoles(['admin', 'department_officer']);
          await Promise.all(
            recipients
              .filter(u => u.id !== user.id)
              .map(u => notificationService.notifyUser(
                u.id,
                'New Issue Reported',
                `${user.name} reported an issue: "${reportIssue.title}"`,
                'warning'
              ))
          );
        } catch (e) {
        }
      } catch (e) {
      }

      addNotification({
        title: 'Issue Created',
        message: `New issue created${selectedAsset ? ` for ${selectedAsset.name}` : ''}.`,
        type: 'success'
      });
      addToast({
        title: 'Issue Created',
        message: 'Your issue has been submitted successfully.',
        type: 'success'
      });

      setReportIssue({ title: '', description: '', priority: 'Medium', category: 'Other', asset_id: '' });
      setShowReportIssueModal(false);
    } catch (err) {
      addNotification({ title: 'Error', message: 'Failed to submit issue.', type: 'error' });
      addToast({ title: 'Error', message: 'Failed to submit issue.', type: 'error' });
    } finally {
      setIsSubmittingIssue(false);
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
      case 'Pending User Action':
      case 'Pending Parts':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
      case 'Closed':
        return 'bg-lightgreen text-primary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getPriorityColor = priority => {
    switch (priority) {
      case 'Low':
        return 'bg-lightgreen text-primary';
      case 'Medium':
        return 'bg-lightpurple text-secondary';
      case 'High':
        return 'bg-yellow-100 text-yellow-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading issues...</p>
        </div>
      </div>;
  }
  return (
    <>
      <ConnectionStatus showOnlyWhenOffline={true} className="mb-4" />
      <div className="space-y-6">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">My Issues</h1>
              <p className="mt-2 text-gray-700 dark:text-gray-300">View and manage your reported issues.</p>
            </div>
            <button onClick={() => setShowReportIssueModal(true)} className="button-primary flex items-center"><PlusIcon className="w-4 h-4 mr-2" /> Report New Issue</button>
          </div>
        </div>
        {/* Issue Status Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-red-100 rounded-full">
                <AlertCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Open Issues</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(issue => issue.status === 'Open').length}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-yellow-100 rounded-full">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(issue => issue.status === 'In Progress').length}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-lightpurple rounded-full">
                <ClockIcon className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(issue => issue.status === 'Pending User Action' || issue.status === 'Pending Parts').length}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-lightgreen rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Resolved</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(issue => issue.status === 'Resolved' || issue.status === 'Closed').length}</p>
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
                <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search issues..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
                <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  {issueStatuses.map(status => <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>)}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
                <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  {issuePriorities.map(priority => <option key={priority} value={priority}>{priority === 'All' ? 'All Priorities' : priority}</option>)}
              </select>
              </div>
            </div>
          </div>
        </div>
      {/* Issues List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Your Reported Issues</h2>
              <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">{filteredIssues.length} issues</span>
            </div>
        </div>
        {filteredIssues.length > 0 ? <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3">Issue</th>
                  <th scope="col" className="px-6 py-3">Asset</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Priority</th>
                  <th scope="col" className="px-6 py-3">Reported</th>
                  <th scope="col" className="px-6 py-3">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => <tr key={issue.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                      <div className="flex items-center">
                      <div className={`p-1 mr-3 rounded-full ${issue.priority === 'Critical' ? 'bg-red-100 text-red-600' : issue.priority === 'High' ? 'bg-orange-100 text-orange-600' : issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-lightgreen text-primary'}`}><InfoIcon className="w-4 h-4" /></div>
                        <span>{issue.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/assets/${issue.assetId}`} className="flex items-center">
                      <img src={issue.assetImage} alt={issue.assetName} className="w-8 h-8 mr-2 rounded-xl" />
                      <span className="truncate max-w-[150px]">{issue.assetName}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>{issue.status}</span>
                    </td>
                    <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                    </td>
                  <td className="px-6 py-4">{new Date(issue.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
                      {canManageIssue(issue) && (
                        <Link to={`/user/issues/${issue.id}`} className="px-2 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-dark">Manage</Link>
                      )}
                    </div>
                  </td>
                  </tr>)}
              </tbody>
            </table>
          </div> : <div className="flex flex-col items-center justify-center py-12">
            {searchTerm || filterStatus !== 'All' || filterPriority !== 'All' ? <>
                <AlertCircleIcon className="w-16 h-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-700">No matching issues found</h3>
              <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
              <button onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterPriority('All'); }} className="px-4 py-2 mt-4 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Clear Filters</button>
              </> : <>
                <CheckCircleIcon className="w-16 h-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-700">No issues reported</h3>
              <p className="mt-2 text-sm text-gray-500">You haven't reported any issues yet</p>
              <button onClick={() => setShowReportIssueModal(true)} className="button-primary px-4 py-2 mt-4 text-sm font-medium">Report New Issue</button>
              </>}
          </div>}
        </div>
        {/* Report Issue Modal */}
      {showReportIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-lightgreen dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertCircleIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary dark:text-white">Report an Issue</h3>
              </div>
              <button onClick={() => setShowReportIssueModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleReportIssueSubmit} className="overflow-y-auto max-h-[60vh] p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Issue Title *</label>
                  <input type="text" className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" value={reportIssue.title} onChange={e => setReportIssue({ ...reportIssue, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" value={reportIssue.priority} onChange={e => setReportIssue({ ...reportIssue, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Issue Category</label>
                  <select className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" value={reportIssue.category} onChange={e => setReportIssue({ ...reportIssue, category: e.target.value })}>
                    <option value="Hardware Failure">Hardware Failure</option>
                    <option value="Software Issue">Software Issue</option>
                    <option value="Connectivity Problem">Connectivity Problem</option>
                    <option value="Upgrade Request">Upgrade Request</option>
                    <option value="Replacement Request">Replacement Request</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Asset (optional)</label>
                  <select className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all" value={reportIssue.asset_id} onChange={e => setReportIssue({ ...reportIssue, asset_id: e.target.value })}>
                    <option value="">No Specific Asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                <textarea className="block w-full px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 transition-all resize-none" rows={5} value={reportIssue.description} onChange={e => setReportIssue({ ...reportIssue, description: e.target.value })} required />
              </div>
              <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                <button type="button" onClick={() => setShowReportIssueModal(false)} className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingIssue} className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmittingIssue ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
export default UserIssues;