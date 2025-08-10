import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon, RefreshCwIcon, XCircleIcon, UserIcon, MessageSquareIcon } from 'lucide-react';
import { generateMockAssets, generateMockIssues, issueStatuses } from '../../utils/mockData';
const IssueManagement: React.FC = () => {
  const {
    addNotification
  } = useNotifications();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  useEffect(() => {
    // Fetch issues
    const fetchIssues = async () => {
      try {
        // In a real app, this would be an API call
        const mockAssets = generateMockAssets(50);
        const mockIssues = generateMockIssues(mockAssets, 40);
        setIssues(mockIssues);
        setFilteredIssues(mockIssues);
      } catch (error) {
        console.error('Error fetching issues:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load issues',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [addNotification]);
  useEffect(() => {
    // Filter and sort issues
    let result = [...issues];
    // Apply filters
    if (searchTerm) {
      result = result.filter(issue => issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || issue.description.toLowerCase().includes(searchTerm.toLowerCase()) || issue.assetName.toLowerCase().includes(searchTerm.toLowerCase()) || issue.createdBy && issue.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus !== 'All') {
      result = result.filter(issue => issue.status === filterStatus);
    }
    if (filterPriority !== 'All') {
      result = result.filter(issue => issue.priority === filterPriority);
    }
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'priority') {
        const priorityValues = {
          Critical: 3,
          High: 2,
          Medium: 1,
          Low: 0
        };
        comparison = priorityValues[a.priority] - priorityValues[b.priority];
      } else if (sortBy === 'status') {
        const statusValues = {
          Open: 0,
          'In Progress': 1,
          'Pending User Action': 2,
          'Pending Parts': 3,
          Resolved: 4,
          Closed: 5
        };
        comparison = statusValues[a.status] - statusValues[b.status];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    setFilteredIssues(result);
  }, [issues, searchTerm, filterStatus, filterPriority, sortBy, sortDirection]);
  const handleAddComment = () => {
    if (!selectedIssue || !newComment.trim()) return;
    // Create a new comment
    const comment = {
      id: `C-${Date.now()}`,
      text: newComment,
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };
    // Add the comment to the selected issue
    const updatedIssue = {
      ...selectedIssue,
      comments: [...selectedIssue.comments, comment],
      updatedAt: new Date().toISOString()
    };
    // Update the issues list
    const updatedIssues = issues.map(issue => issue.id === selectedIssue.id ? updatedIssue : issue);
    setIssues(updatedIssues);
    setSelectedIssue(updatedIssue);
    setNewComment('');
    // Show a notification
    addNotification({
      title: 'Comment Added',
      message: `Comment added to issue "${selectedIssue.title}"`,
      type: 'success'
    });
  };
  const handleUpdateStatus = () => {
    if (!selectedIssue || !newStatus || newStatus === selectedIssue.status) return;
    // Update the status of the selected issue
    const updatedIssue = {
      ...selectedIssue,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      comments: [...selectedIssue.comments, {
        id: `C-${Date.now()}`,
        text: `Status updated from "${selectedIssue.status}" to "${newStatus}"`,
        createdBy: 'Admin',
        createdAt: new Date().toISOString()
      }]
    };
    // Update the issues list
    const updatedIssues = issues.map(issue => issue.id === selectedIssue.id ? updatedIssue : issue);
    setIssues(updatedIssues);
    setSelectedIssue(updatedIssue);
    setNewStatus('');
    // Show a notification
    addNotification({
      title: 'Status Updated',
      message: `Status of issue "${selectedIssue.title}" updated to "${newStatus}"`,
      type: 'success'
    });
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
  const formatDate = dateString => {
    return new Date(dateString).toLocaleString();
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading issues...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
          <h1 className="text-3xl font-bold text-primary">Issue Management</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">View, update, and manage all reported issues.</p>
          </div>
          <div className="flex flex-wrap gap-2">
          <button onClick={() => { addNotification({ title: 'Export Started', message: 'Issue data is being exported to CSV', type: 'info' }); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90">Export Report</button>
        </div>
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
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search issues by title, asset, or reporter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
              {issueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-5 h-5 text-gray-400" />
              </div>
            <select className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          <button onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterPriority('All'); }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center">
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
            </button>
          </div>
        </div>
      </div>
      {/* Issues List */}
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Issues</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="createdAt">Date</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              <button onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} className="p-1 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}>{sortDirection === 'asc' ? '↑' : '↓'}</button>
              </div>
            <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">{filteredIssues.length} issues</span>
            </div>
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
              <th scope="col" className="px-6 py-3">Reported By</th>
              <th scope="col" className="px-6 py-3">Reported On</th>
              <th scope="col" className="px-6 py-3">Last Update</th>
              <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
            {filteredIssues.map(issue => <tr key={issue.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">{issue.title}</td>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                  <div className="p-1 mr-2 text-gray-400 bg-lightgreen rounded-full">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span>{issue.createdBy.name}</span>
                      </div>
                    </td>
              <td className="px-6 py-4">{new Date(issue.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4">{new Date(issue.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                <button onClick={() => { setSelectedIssue(issue); setNewStatus(issue.status); setShowIssueDetailModal(true); }} className="button-primary px-3 py-1 text-xs font-medium">Manage</button>
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
          <p className="mt-2 text-sm text-gray-500">There are no issues reported yet</p>
              </>}
          </div>}
      </div>
      {/* Issue Detail Modal */}
      {showIssueDetailModal && selectedIssue && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-4xl p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Issue Details</h3>
              <button onClick={() => {
            setShowIssueDetailModal(false);
            setSelectedIssue(null);
        }} className="text-gray-500 hover:text-gray-700">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                <h2 className="text-xl font-semibold text-gray-800">
                    {selectedIssue.title}
                  </h2>
                  <div className="flex flex-wrap items-center mt-2 space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedIssue.priority)}`}>
                      {selectedIssue.priority}
                    </span>
                  <span className="text-sm text-gray-500">
                      {selectedIssue.type}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                <Link to={`/assets/${selectedIssue.assetId}`} className="flex items-center px-3 py-2 text-sm bg-gray-100 rounded-md">
                  <img src={selectedIssue.assetImage} alt={selectedIssue.assetName} className="w-8 h-8 mr-2 rounded-xl" />
                    <span>{selectedIssue.assetName}</span>
                  </Link>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center mb-2">
                  <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">
                    Reported by {selectedIssue.createdBy.name} on{' '}
                    {formatDate(selectedIssue.createdAt)}
                  </span>
                </div>
              <div className="p-4 mt-2 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                    {selectedIssue.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 mt-6 md:flex-row">
                <div className="flex-1">
                <label className="block mb-2 text-sm font-medium text-gray-700">Update Status</label>
                  <div className="flex space-x-2">
                  <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {issueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  <button onClick={handleUpdateStatus} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark" disabled={newStatus === selectedIssue.status}>
                      Update
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
              <h4 className="mb-4 text-md font-medium text-gray-700">Comments ({selectedIssue.comments.length})</h4>
              <div className="p-4 mb-4 space-y-4 bg-gray-50 rounded-lg max-h-[300px] overflow-y-auto">
                {selectedIssue.comments.map(comment => <div key={comment.id} className="p-3 bg-white rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                        <div className="p-1 mr-2 text-gray-400 bg-gray-100 rounded-full">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        <span className="font-medium text-gray-700">
                            {comment.createdBy}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    <p className="text-gray-600">
                        {comment.text}
                      </p>
                    </div>)}
                </div>
                <div className="mt-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">Add Comment</label>
                  <div className="flex space-x-2">
                  <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Type your comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button onClick={handleAddComment} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark" disabled={!newComment.trim()}>
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => {
            setShowIssueDetailModal(false);
            setSelectedIssue(null);
        }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>}
    </div>;
};
export default IssueManagement;