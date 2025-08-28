import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSupabase } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { XCircleIcon } from 'lucide-react';

const UserIssueDetail: React.FC = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { query } = useSupabase();

  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data: issueData, error: issueError } = await query(async () => {
          return await supabase
            .from('issues')
            .select('*')
            .eq('id', issueId)
            .single();
        });
        if (issueError) throw issueError;
        setIssue(issueData);
        setNewStatus(issueData.status);
        const { data: commentsData, error: commentsError } = await query(async () => {
          return await supabase
            .from('issue_comments')
            .select('*')
            .eq('issue_id', issueId)
            .order('created_at', { ascending: true });
        });
        if (commentsError) throw commentsError;
        setComments(commentsData || []);
      } catch (e: any) {
        addNotification({ title: 'Error', message: e?.message || 'Failed to load issue', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (issueId) fetchAll();
  }, [issueId, addNotification, query]);

  const canManage = !!issue && (issue.assigned_to === user?.id);

  const handleUpdateStatus = async () => {
    if (!issue || !newStatus || newStatus === issue.status) return;
    try {
      setUpdating(true);
      const { data, error } = await query(async () => {
        return await supabase
          .from('issues')
          .update({ status: newStatus, actual_resolution_date: ['Resolved','Closed'].includes(newStatus) ? new Date().toISOString() : null })
          .eq('id', issue.id)
          .select()
          .single();
      });
      if (error) throw error;
      setIssue(data);
      addNotification({ title: 'Status Updated', message: `Status changed to ${newStatus}`, type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Error', message: e?.message || 'Failed to update status', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!issue || !newComment.trim()) return;
    try {
      const content = newComment.trim();
      const { data, error } = await query(async () => {
        return await supabase
          .from('issue_comments')
          .insert({ issue_id: issue.id, user_id: user!.id, user_name: user!.name, content })
          .select()
          .single();
      });
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setNewComment('');
      addNotification({ title: 'Comment Added', message: 'Your comment was posted.', type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Error', message: e?.message || 'Failed to add comment', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <p className="text-gray-700 dark:text-gray-300">Issue not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-xl">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Issue: {issue.title}</h1>
          <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
            <XCircleIcon className="inline w-4 h-4 mr-1" /> Close
          </button>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Status: <span className="font-medium">{issue.status}</span></p>
        <p className="mt-1 text-gray-600 dark:text-gray-300">Priority: <span className="font-medium">{issue.priority}</span></p>
      </div>

      {canManage && (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card space-y-3">
          <h2 className="text-lg font-semibold text-primary">Update Status</h2>
          <div className="flex space-x-2">
            <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {['Open','In Progress','Pending User Action','Pending Parts','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={handleUpdateStatus} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50" disabled={updating || newStatus === issue.status}>
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      )}

      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <h2 className="text-lg font-semibold text-primary mb-3">Comments</h2>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.length ? comments.map(c => (
            <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">{c.user_name}</div>
              <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
              <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{c.content}</div>
            </div>
          )) : <div className="text-sm text-gray-500">No comments yet.</div>}
        </div>
        {canManage && (
          <div className="mt-4 flex space-x-2">
            <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Type your comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
            <button onClick={handleAddComment} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark" disabled={!newComment.trim()}>Comment</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserIssueDetail;


