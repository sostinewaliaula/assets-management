import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { SearchIcon, FilterIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon, RefreshCwIcon, XCircleIcon, UserIcon, MessageSquareIcon, TrashIcon, EditIcon, DownloadIcon } from 'lucide-react';
import Logo from '../../assets/logo.png';
import { issueService, assetService, userService, commentService, notificationService, departmentService } from '../../services/database';
import { Issue, Asset, User, IssueComment, Department } from '../../lib/supabase';

// Static data for dropdowns
const issueStatuses = ['Open', 'In Progress', 'Pending User Action', 'Pending Parts', 'Resolved', 'Closed'];
const issuePriorities = ['Low', 'Medium', 'High', 'Critical'];

const IssueManagement: React.FC = () => {
  const {
    addNotification,
    addToast
  } = useNotifications();
  
  const { user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [editingComment, setEditingComment] = useState<IssueComment | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [issueExporting, setIssueExporting] = useState(false);
  const [issueExportFormat, setIssueExportFormat] = useState<'csv' | 'json' | 'txt' | 'excel' | 'pdf'>('csv');

  useEffect(() => {
    // Fetch issues, assets, and users
    const fetchData = async () => {
      try {
        setLoading(true);
        const [issuesData, assetsData, usersData, departmentsData] = await Promise.all([
          issueService.getAll(),
          assetService.getAll(),
          userService.getAll(),
          departmentService.getAll()
        ]);
        
        setIssues(issuesData);
        setFilteredIssues(issuesData);
        setAssets(assetsData);
        setUsers(usersData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
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
    fetchData();
  }, [addNotification]);

  // Debug user object
  useEffect(() => {
    console.log('Current user object:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    
    // Test table structure on load
    commentService.testTableStructure();
  }, [user]);

  useEffect(() => {
    // Filter and sort issues
    let result = [...issues];
    
    // Apply filters
    if (searchTerm) {
      result = result.filter(issue => {
        const asset = assets.find(a => a.id === issue.asset_id);
        const reporter = users.find(u => u.id === issue.reported_by);
        const assetName = asset?.name || '';
        const reporterName = reporter?.name || '';
        
        return issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               issue.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
               assetName.toLowerCase().includes(searchTerm.toLowerCase()) || 
               reporterName.toLowerCase().includes(searchTerm.toLowerCase());
      });
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
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'priority') {
        const priorityValues = {
          'Critical': 3,
          'High': 2,
          'Medium': 1,
          'Low': 0
        };
        comparison = (priorityValues[a.priority as keyof typeof priorityValues] || 0) - (priorityValues[b.priority as keyof typeof priorityValues] || 0);
      } else if (sortBy === 'status') {
        const statusValues = {
          'Open': 0,
          'In Progress': 1,
          'Pending User Action': 2,
          'Pending Parts': 3,
          'Resolved': 4,
          'Closed': 5
        };
        comparison = (statusValues[a.status as keyof typeof statusValues] || 0) - (statusValues[b.status as keyof typeof statusValues] || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredIssues(result);
  }, [issues, assets, users, searchTerm, filterStatus, filterPriority, sortBy, sortDirection]);

  // Fetch comments when an issue is selected
  useEffect(() => {
    if (selectedIssue) {
      fetchComments(selectedIssue.id);
    }
  }, [selectedIssue]);

  const fetchComments = async (issueId: string) => {
    try {
      const commentsData = await commentService.getByIssue(issueId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load comments',
        type: 'error'
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedIssue || !newComment.trim() || !user) {
      console.log('Validation failed:', { selectedIssue: !!selectedIssue, comment: newComment.trim(), user: !!user });
      if (!user) {
        addNotification({
          title: 'Error',
          message: 'User not authenticated',
          type: 'error'
        });
      }
      return;
    }
    
    try {
      console.log('Creating comment with data:', {
        issue_id: selectedIssue.id,
        user_id: user.id,
        user_name: user.name,
        content: newComment.trim()
      });
      
      const newCommentData = await commentService.create({
        issue_id: selectedIssue.id,
        user_id: user.id,
        user_name: user.name,
        content: newComment.trim()
      });
      
      // Add the new comment to the local state
      setComments([...comments, newCommentData]);
      setNewComment('');

      // Backend notifications to issue owner and (optionally) asset owner
      try {
        const commentText = newComment.trim();
        if (selectedIssue.reported_by) {
          await notificationService.notifyUser(
            selectedIssue.reported_by,
            'New Comment on Your Issue',
            `${user.name} commented on your issue "${selectedIssue.title}": "${commentText}"`,
            'info'
          );
        }
        if (selectedIssue.asset_id) {
          const asset = assets.find(a => a.id === selectedIssue.asset_id);
          if (asset?.assigned_to && asset.assigned_to !== selectedIssue.reported_by) {
            await notificationService.notifyUser(
              asset.assigned_to,
              'Comment on Asset Issue',
              `${user.name} commented on issue "${selectedIssue.title}" for your assigned asset: "${commentText}"`,
              'info'
            );
          }
        }
      } catch (e) {
        console.warn('Failed to send comment notifications', e);
      }
      
      addNotification({
        title: 'Comment Added',
        message: `Comment added to issue "${selectedIssue.title}"`,
        type: 'success'
      });
      addToast({
        title: 'Comment Added',
        message: `Comment added to issue "${selectedIssue.title}"`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      let errorMessage = 'Failed to add comment';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      addNotification({
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    
    try {
      console.log('Editing comment:', commentId, 'with content:', editCommentContent.trim());
      
      const updatedComment = await commentService.update(commentId, {
        content: editCommentContent.trim()
      });
      
      console.log('Comment updated successfully:', updatedComment);
      
      // Update the comment in the local state
      setComments(comments.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
      
      setEditingComment(null);
      setEditCommentContent('');
      
      addNotification({
        title: 'Comment Updated',
        message: 'Comment updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update comment',
        type: 'error'
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      console.log('Deleting comment:', commentId);
      
      await commentService.delete(commentId);
      
      console.log('Comment deleted successfully');
      
      // Remove the comment from the local state
      setComments(comments.filter(comment => comment.id !== commentId));
      
      addNotification({
        title: 'Comment Deleted',
        message: 'Comment deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete comment',
        type: 'error'
      });
    }
  };

  const startEditComment = (comment: IssueComment) => {
    setEditingComment(comment);
    setEditCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentContent('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue || !newStatus || newStatus === selectedIssue.status) return;
    
    try {
      setIsUpdatingStatus(true);
      const previousStatus = selectedIssue.status;
      const updatePayload: Partial<Issue> = { status: newStatus };
      if ((newStatus === 'Resolved' || newStatus === 'Closed') && !selectedIssue.actual_resolution_date) {
        (updatePayload as any).actual_resolution_date = new Date().toISOString();
      }
      if ((selectedIssue.status === 'Resolved' || selectedIssue.status === 'Closed') && (newStatus !== 'Resolved' && newStatus !== 'Closed')) {
        (updatePayload as any).actual_resolution_date = null;
      }

      const updatedIssue = await issueService.update(selectedIssue.id, updatePayload);
      
      // Update local state of issues
      const updatedIssues = issues.map(issue => 
        issue.id === selectedIssue.id ? updatedIssue : issue
      );
      setIssues(updatedIssues);
      setSelectedIssue(updatedIssue);
      setNewStatus(updatedIssue.status);
      
      // Create a system comment reflecting the status change (backend + UI)
      if (user) {
        const systemCommentContent = `Status updated from "${previousStatus}" to "${updatedIssue.status}"`;
        try {
          const createdSystemComment = await commentService.create({
            issue_id: updatedIssue.id,
            user_id: user.id,
            user_name: user.name,
            content: systemCommentContent
          });
          setComments(prev => [...prev, createdSystemComment]);
        } catch (commentError) {
          console.error('Failed to create system status comment:', commentError);
        }
      }

      // Send notification to the issue owner (and asset owner if different)
      try {
        if (updatedIssue.reported_by) {
          await notificationService.notifyUser(
            updatedIssue.reported_by,
            'Issue Status Updated',
            `Your issue "${updatedIssue.title}" status changed from ${previousStatus} to ${updatedIssue.status}.`,
            'warning'
          );
        }
        if (updatedIssue.asset_id) {
          const asset = assets.find(a => a.id === updatedIssue.asset_id);
          if (asset?.assigned_to && asset.assigned_to !== updatedIssue.reported_by) {
            await notificationService.notifyUser(
              asset.assigned_to,
              'Issue Status Updated',
              `Issue "${updatedIssue.title}" for your assigned asset changed from ${previousStatus} to ${updatedIssue.status}.`,
              'warning'
            );
          }
        }
      } catch (e) {
        console.warn('Failed to send status update notifications', e);
      }
      
      addNotification({
        title: 'Status Updated',
        message: `Status of issue "${updatedIssue.title}" updated to "${updatedIssue.status}"`,
        type: 'success'
      });
      addToast({
        title: 'Status Updated',
        message: `Status of issue "${updatedIssue.title}" updated to "${updatedIssue.status}"`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      addNotification({
        title: 'Error',
        message: error?.message || 'Failed to update issue status',
        type: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAssetName = (assetId: string | null) => {
    if (!assetId) return 'Unknown Asset';
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getAssetImage = (assetId: string | null) => {
    if (!assetId) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E";
    const asset = assets.find(a => a.id === assetId);
    // You can add an image field to your assets table or use a placeholder
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E";
  };

  const getReporterName = (reporterId: string) => {
    const user = users.find(u => u.id === reporterId);
    return user?.name || 'Unknown User';
  };

  const getAssignedToName = (assignedToId: string | null) => {
    if (!assignedToId) return 'Unassigned';
    const user = users.find(u => u.id === assignedToId);
    return user?.name || 'Unknown User';
  };

  const getCommentAuthorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
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
          <div className="flex items-center gap-2">
            <select value={issueExportFormat} onChange={e => setIssueExportFormat(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl">
              <option value="csv">CSV</option>
              <option value="excel">Excel (.xls)</option>
              <option value="json">JSON</option>
              <option value="txt">Text (.txt)</option>
              <option value="pdf">PDF</option>
            </select>
            <button type="button" onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (issueExporting) return;
              setIssueExporting(true);
              try {
                const data = filteredIssues && filteredIssues.length ? filteredIssues : issues;
                if (!data.length) { addNotification({ title: 'No Data', message: 'No issues match the current filters.', type: 'warning' }); setIssueExporting(false); return; }
                const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '';
                const assetName = (id?: string|null) => { if (!id) return ''; const a = assets.find(a => a.id === id); return a?.name || ''; };
                const deptName = (id?: string|null) => { if (!id) return ''; const d = departments.find(d => d.id === id); return d?.name || ''; };
                const userName = (id?: string|null) => { if (!id) return ''; const u = users.find(u => u.id === id); return u?.name || ''; };
                if (issueExportFormat === 'csv') {
                  const headers = ['title','status','priority','category','reported_by','assigned_to','asset','department','created_at','updated_at'];
                  const csvRows: string[] = [];
                  csvRows.push(headers.join(','));
                  for (const i of data) {
                    const row = [i.title,i.status,i.priority,(i as any).category || '',userName(i.reported_by),userName(i.assigned_to || undefined),assetName(i.asset_id || undefined),deptName(i.department_id || undefined),fmtDate(i.created_at),fmtDate(i.updated_at)]
                      .map(v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
                    csvRows.push(row);
                  }
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a'); link.href = url; link.setAttribute('download', `issues_export_${Date.now()}.csv`);
                  link.style.display='none'; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(()=>URL.revokeObjectURL(url),0);
                } else if (issueExportFormat === 'json') {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a'); link.href = url; link.setAttribute('download', `issues_export_${Date.now()}.json`);
                  link.style.display='none'; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(()=>URL.revokeObjectURL(url),0);
                } else if (issueExportFormat === 'excel') {
                  const buildHtmlTable = (items: any[]) => {
                    const headers = ['title','status','priority','category','reported_by','assigned_to','asset','department','created_at','updated_at'];
                    const escapeHtml = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    const thead = `<thead><tr>${headers.map(h => `<th style=\"text-align:left;border:1px solid #ccc;padding:6px;\">${h}</th>`).join('')}</tr></thead>`;
                    const tbody = `<tbody>${items.map(i => `<tr>${[i.title,i.status,i.priority,(i as any).category || '',userName(i.reported_by),userName(i.assigned_to || undefined),assetName(i.asset_id || undefined),deptName(i.department_id || undefined),fmtDate(i.created_at),fmtDate(i.updated_at)].map(v => `<td style=\"border:1px solid #ccc;padding:6px;\">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody>`;
                    return `<table style=\"border-collapse:collapse;font-family:Arial, sans-serif;font-size:12px;\">${thead}${tbody}</table>`;
                  };
                  const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" /></head><body>${buildHtmlTable(data)}</body></html>`;
                  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a'); link.href = url; link.setAttribute('download', `issues_export_${Date.now()}.xls`);
                  link.style.display='none'; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(()=>URL.revokeObjectURL(url),0);
                } else if (issueExportFormat === 'pdf') {
                  const ensureJsPdf = () => new Promise<void>((resolve, reject) => { if ((window as any).jspdf?.jsPDF) return resolve(); const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'; s.async=true; s.onload=()=>resolve(); s.onerror=()=>reject(new Error('Failed to load jsPDF')); document.head.appendChild(s); });
                  await ensureJsPdf(); const { jsPDF } = (window as any).jspdf;
                  const format = data.length > 25 ? 'A3' : 'A4'; const doc = new jsPDF({ orientation:'landscape', unit:'pt', format });
                  const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 36; let y = margin;
                  const logoDataUrl: string = await new Promise(resolve => { try { const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>{ try{ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d'); if(ctx){ ctx.drawImage(img,0,0); resolve(c.toDataURL('image/png')); } else { resolve(''); } } catch { resolve(''); } }; img.onerror=()=>resolve(''); img.src=(Logo as unknown as string); } catch { resolve(''); } });
                  if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', margin, y, 120, 48); } catch {} }
                  doc.setFont('helvetica','normal'); doc.setFontSize(10);
                  const dateStr = new Date().toLocaleString(); doc.text(`Exported: ${dateStr}`, pageWidth - margin - 180, y + 16); y += 56;
                  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('Issues Export', margin, y); y += 14; doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`Total issues: ${data.length}`, margin + 120, y); y += 14;
                  const headers = ['Title','Status','Priority','Category','Reporter','Assigned','Asset','Department','Created','Updated'];
                  const weights = [20,12,10,12,12,12,10,12,10,10]; const totalWeight = weights.reduce((a,b)=>a+b,0); const availableWidth = pageWidth - margin*2; const colWidths = weights.map(w => Math.floor((w/totalWeight)*availableWidth));
                  const baseLineHeight=12; const cellPadding=6; const measureRowHeight=(cells: string[])=>{ let maxLines=1; for(let i=0;i<cells.length;i++){ const maxW=colWidths[i]-cellPadding; const lines=doc.splitTextToSize(String(cells[i]??''), maxW) as string[]; if(lines.length>maxLines) maxLines=lines.length; } return Math.max(18, maxLines*baseLineHeight+8); };
                  const drawRow=(cells: string[], isHeader=false)=>{ let x=margin; doc.setFont('helvetica', isHeader?'bold':'normal'); doc.setFontSize(isHeader?10:9); const rowH=measureRowHeight(cells); for(let i=0;i<cells.length;i++){ const lines=doc.splitTextToSize(String(cells[i]??''), colWidths[i]-cellPadding) as string[]; doc.text(lines, x+3, y+12, { baseline:'alphabetic' }); doc.rect(x, y, colWidths[i], rowH); x+=colWidths[i]; } y+=rowH; };
                  const headerH = measureRowHeight(headers); if (y + headerH > pageHeight - margin) { doc.addPage(); y = margin; }
                  drawRow(headers, true);
                  const getName = (id?: string|null) => { const u = users.find(u=>u.id===id); return u?.name || ''; };
                  for (const i of data) {
                    const cells = [i.title, i.status, i.priority, (i as any).category || '', getName(i.reported_by), getName(i.assigned_to || undefined), assetName(i.asset_id || undefined), deptName(i.department_id || undefined), fmtDate(i.created_at), fmtDate(i.updated_at)];
                    const nextH = measureRowHeight(cells); if (y + nextH > pageHeight - margin) { doc.addPage(); y = margin; drawRow(headers, true); }
                    drawRow(cells);
                  }
                  const fname = `Issues_${new Date().toISOString().slice(0,10)}.pdf`; doc.save(fname);
                } else {
                  const lines = data.map(i => `${i.title}\t${i.status}\t${i.priority}\t${i.asset_id || ''}`);
                  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a'); link.href = url; link.setAttribute('download', `issues_export_${Date.now()}.txt`);
                  link.style.display='none'; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(()=>URL.revokeObjectURL(url),0);
                }
                addNotification({ title: 'Export Complete', message: 'Issues exported successfully.', type: 'success' });
              } catch (e: any) {
                addNotification({ title: 'Export Failed', message: e?.message || 'Could not export issues.', type: 'error' });
              } finally { setIssueExporting(false); }
            }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 disabled:opacity-50" disabled={issueExporting}>
              <DownloadIcon className="w-4 h-4 mr-2" /> {issueExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
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
              {issuePriorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
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
                <option value="created_at">Date</option>
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
                <Link to={`/assets/${issue.asset_id}`} className="flex items-center">
                  <img src={getAssetImage(issue.asset_id)} alt={getAssetName(issue.asset_id)} className="w-8 h-8 mr-2 rounded-xl" />
                  <span className="truncate max-w-[150px]">{getAssetName(issue.asset_id)}</span>
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
                  <span>{getReporterName(issue.reported_by)}</span>
                </div>
              </td>
              <td className="px-6 py-4">{formatDate(issue.created_at)}</td>
              <td className="px-6 py-4">{formatDate(issue.updated_at)}</td>
              <td className="px-6 py-4">
                <button onClick={() => { 
                  // Ensure comments are scoped to the selected issue
                  setComments([]);
                  setEditingComment(null);
                  setEditCommentContent('');
                  setSelectedIssue(issue); 
                  setNewStatus(issue.status); 
                  setShowIssueDetailModal(true); 
                }} className="button-primary px-3 py-1 text-xs font-medium">Manage</button>
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
            setComments([]);
            setEditingComment(null);
            setEditCommentContent('');
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
                  {selectedIssue.category}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Link to={`/assets/${selectedIssue.asset_id}`} className="flex items-center px-3 py-2 text-sm bg-gray-100 rounded-md">
                <img src={getAssetImage(selectedIssue.asset_id)} alt={getAssetName(selectedIssue.asset_id)} className="w-8 h-8 mr-2 rounded-xl" />
                <span>{getAssetName(selectedIssue.asset_id)}</span>
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center mb-2">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                Reported by {getReporterName(selectedIssue.reported_by)} on{' '}
                {formatDate(selectedIssue.created_at)}
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
                <button onClick={handleUpdateStatus} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUpdatingStatus || newStatus === selectedIssue.status}>
                  {isUpdatingStatus ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Comments section - real implementation */}
          <div className="mt-6">
            <h4 className="mb-4 text-md font-medium text-gray-700">Comments ({comments.length})</h4>
            <div className="p-4 mb-4 space-y-4 bg-gray-50 rounded-lg max-h-[300px] overflow-y-auto">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-white rounded-lg">
                    {editingComment?.id === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditComment}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="p-1 mr-2 text-gray-400 bg-gray-100 rounded-full">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-700">
                              {comment.user_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                            <button
                              onClick={() => startEditComment(comment)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Edit Comment"
                            >
                              <EditIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete Comment"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600">
                          {comment.content}
                        </p>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first to add one!</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Add Comment</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Type your comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                  disabled={!newComment.trim()}
                >
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
            setComments([]);
            setEditingComment(null);
            setEditCommentContent('');
          }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>}
  </div>;
};

export default IssueManagement;