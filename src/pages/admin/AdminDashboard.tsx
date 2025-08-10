import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MonitorIcon, AlertCircleIcon, UserIcon, BuildingIcon, ArrowRightIcon, CheckCircleIcon, ArchiveIcon, ClockIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateMockAssets, generateMockIssues, generateMockUsers, departments, assetTypes } from '../../utils/mockData';
const AdminDashboard: React.FC = () => {
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsByDepartment, setAssetsByDepartment] = useState([]);
  const [assetsByType, setAssetsByType] = useState([]);
  const [assetsByStatus, setAssetsByStatus] = useState([]);
  const [issuesByStatus, setIssuesByStatus] = useState([]);
  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        // In a real app, this would be API calls
        const mockAssets = generateMockAssets(50);
        const mockIssues = generateMockIssues(mockAssets, 30);
        const mockUsers = generateMockUsers(20);
        setAssets(mockAssets);
        setIssues(mockIssues);
        setUsers(mockUsers);
        // Process data for charts
        processChartData(mockAssets, mockIssues);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const processChartData = (assets, issues) => {
    // Assets by department
    const deptCounts = {};
    departments.forEach(dept => {
      deptCounts[dept] = 0;
    });
    assets.forEach(asset => {
      if (asset.department) {
        deptCounts[asset.department] = (deptCounts[asset.department] || 0) + 1;
      }
    });
    const deptData = Object.entries(deptCounts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 departments
    setAssetsByDepartment(deptData);
    // Assets by type
    const typeCounts = {};
    assetTypes.forEach(type => {
      typeCounts[type] = 0;
    });
    assets.forEach(asset => {
      if (asset.type) {
        typeCounts[asset.type] = (typeCounts[asset.type] || 0) + 1;
      }
    });
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    setAssetsByType(typeData);
    // Assets by status
    const statusCounts = {};
    assets.forEach(asset => {
      if (asset.status) {
        statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
      }
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));
    setAssetsByStatus(statusData);
    // Issues by status
    const issueStatusCounts = {};
    issues.forEach(issue => {
      if (issue.status) {
        issueStatusCounts[issue.status] = (issueStatusCounts[issue.status] || 0) + 1;
      }
    });
    const issueStatusData = Object.entries(issueStatusCounts).map(([name, value]) => ({
      name,
      value
    }));
    setIssuesByStatus(issueStatusData);
  };
  const getStatusColor = status => {
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
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>;
  }
  return <div className="space-y-6">
    {/* Admin Dashboard Header */}
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
      <p className="mt-2 text-gray-700 dark:text-gray-300">Overview of all assets, issues, and system status.</p>
    </div>
    {/* Quick Actions */}
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <h2 className="mb-4 text-xl font-bold text-primary">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link to="/admin/assets" className="button-primary flex items-center justify-center"> <MonitorIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Manage Assets</span> </Link>
        <Link to="/admin/issues" className="button-primary flex items-center justify-center"> <AlertCircleIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Manage Issues</span> </Link>
        <Link to="/admin/users" className="button-primary flex items-center justify-center"> <UserIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Manage Users</span> </Link>
        <Link to="/admin/departments" className="button-primary flex items-center justify-center"> <BuildingIcon className="w-6 h-6 mr-3 text-white" /> <span className="font-medium text-white">Manage Departments</span> </Link>
      </div>
    </div>
    {/* Stats Overview */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Assets Card */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightpurple rounded-full">
            <MonitorIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Total Assets</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{assets.length}</p>
          </div>
        </div>
      </div>
      {/* Open Issues Card */}
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
      {/* Total Users Card */}
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
      {/* Departments Card */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center">
          <div className="p-3 mr-4 bg-lightpurple rounded-full">
            <BuildingIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Departments</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{departments.length}</p>
          </div>
        </div>
      </div>
    </div>
    {/* Asset Status Overview */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Assets by Status */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Assets by Status</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={assetsByStatus} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {assetsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={value => [`${value} assets`, null]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Assets by Department */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Assets by Department (Top 5)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assetsByDepartment} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Assets" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    {/* Issue Status and Asset Types */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Issues by Status */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Issues by Status</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={issuesByStatus} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {issuesByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={value => [`${value} issues`, null]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Assets by Type */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="mb-4 text-xl font-bold text-primary">Assets by Type</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={assetsByType.slice(0, 8)} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    {/* Recent Activity */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Recent Issues */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Recent Issues</h2>
          <Link to="/admin/issues" className="button-primary flex items-center text-sm font-medium">View All <ArrowRightIcon className="w-4 h-4 ml-1" /></Link>
        </div>
        <div className="space-y-4">
          {issues.slice(0, 5).map(issue => <div key={issue.id} className="p-4 bg-lightgreen dark:bg-gray-800 rounded-xl">
            <div className="flex items-start">
              <div className={`p-2 mr-4 rounded-full ${issue.status === 'Open' ? 'bg-red-100' : issue.status === 'In Progress' ? 'bg-yellow-100' : issue.status === 'Resolved' || issue.status === 'Closed' ? 'bg-lightgreen' : 'bg-gray-100'}`}>
                {issue.status === 'Open' ? <AlertCircleIcon className="w-5 h-5 text-red-600" /> : issue.status === 'In Progress' ? <ClockIcon className="w-5 h-5 text-yellow-600" /> : issue.status === 'Resolved' || issue.status === 'Closed' ? <CheckCircleIcon className="w-5 h-5 text-primary" /> : <ArchiveIcon className="w-5 h-5 text-gray-600" />}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{issue.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reported by {issue.createdBy.name} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>{issue.status}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{issue.assetName}</span>
                </div>
              </div>
            </div>
          </div>)}
        </div>
      </div>
      {/* Recently Added Assets */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Recently Added Assets</h2>
          <Link to="/admin/assets" className="button-primary flex items-center text-sm font-medium">View All <ArrowRightIcon className="w-4 h-4 ml-1" /></Link>
        </div>
        <div className="space-y-4">
          {assets.slice(0, 5).map(asset => <div key={asset.id} className="flex p-4 bg-lightpurple dark:bg-gray-800 rounded-xl">
            <img src={asset.image} alt={asset.name} className="object-cover w-16 h-16 mr-4 rounded-xl" />
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{asset.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{asset.type} • SN: {asset.serialNumber}</p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{asset.department}</span>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    </div>

  </div>;
};
export default AdminDashboard;