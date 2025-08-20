import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { MonitorIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, InfoIcon, ArrowRightIcon, BellIcon } from 'lucide-react';
import { assetService, issueService } from '../../services/database';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, addToast } = useNotifications();

  const [assets, setAssets] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) {
          setAssets([]);
          setIssues([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        // Fetch assets assigned to the current user
        const assignedAssets = await assetService.getByAssignedUser(user.id, 5);
        setAssets(assignedAssets);

        // Fetch issues reported by the current user (latest 5)
        const reportedIssues = await issueService.getByReporter(user.id, 5);
        setIssues(reportedIssues);

        // Keep UX toast but don't include it in dependencies to avoid loops
        addToast({
          title: 'Dashboard Loaded',
          message: 'Your dashboard has been loaded successfully.',
          type: 'success',
          duration: 2000
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addNotification({
          title: 'Error',
          message: 'Failed to load dashboard data',
          type: 'error'
        });
        addToast({
          title: 'Error',
          message: 'Failed to load dashboard data.',
          type: 'error',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Assigned':
      case 'Resolved':
      case 'Closed':
        return 'bg-lightgreen text-primary';
      case 'In Maintenance':
      case 'In Progress':
      case 'Pending User Action':
      case 'Pending Parts':
        return 'bg-yellow-100 text-yellow-800';
      case 'Disposed':
      case 'Open':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h1 className="text-3xl font-bold text-primary">Welcome back, {user?.name}</h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">Here's an overview of your assigned assets and recent issues.</p>
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/my-assets" className="button-primary flex items-center justify-center">
            <MonitorIcon className="w-6 h-6 mr-3 text-white" />
            <span className="font-medium text-white">View All Assets</span>
          </Link>
          <Link to="/my-issues" className="button-primary flex items-center justify-center">
            <AlertCircleIcon className="w-6 h-6 mr-3 text-white" />
            <span className="font-medium text-white">Report an Issue</span>
          </Link>
          <Link to="/notifications" className="button-primary flex items-center justify-center">
            <BellIcon className="w-6 h-6 mr-3 text-white" />
            <span className="font-medium text-white">Notifications</span>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-lightpurple rounded-full">
              <MonitorIcon className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Assigned Assets</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{assets.length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-red-100 rounded-full">
              <AlertCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Open Issues</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(i => i.status === 'Open').length}</p>
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
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(i => i.status === 'In Progress').length}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-lightgreen rounded-full">
              <CheckCircleIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Resolved Issues</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Assets */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Your Assets</h2>
          <Link to="/my-assets" className="button-primary flex items-center text-sm font-medium">
            View All <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3">Asset</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Serial Number</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                    <Link to={`/assets/${asset.id}`} className="flex items-center">
                      <img src={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"} alt={asset.name} className="w-8 h-8 mr-3 rounded-xl" />
                      <span>{asset.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">{asset.type}</td>
                  <td className="px-6 py-4">{asset.serial_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span>
                  </td>
                  <td className="px-6 py-4">{asset.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Recent Issues</h2>
          <Link to="/my-issues" className="button-primary flex items-center text-sm font-medium">
            View All <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightpurple dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3">Issue</th>
                <th scope="col" className="px-6 py-3">Asset</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Created</th>
                <th scope="col" className="px-6 py-3">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(issue => (
                <tr key={issue.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightpurple/50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1 mr-3 rounded-full ${issue.priority === 'Critical' ? 'bg-red-100 text-red-600' : issue.priority === 'High' ? 'bg-orange-100 text-orange-600' : issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-lightgreen text-primary'}`}>
                        <InfoIcon className="w-4 h-4" />
                      </div>
                      <span>{issue.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/assets/${issue.asset_id}`} className="flex items-center">
                      <img src={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"} alt={issue.asset_id} className="w-8 h-8 mr-2 rounded-xl" />
                      <span className="truncate max-w-[150px]">{issue.asset_id}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>{issue.status}</span>
                  </td>
                  <td className="px-6 py-4">{new Date(issue.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(issue.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;