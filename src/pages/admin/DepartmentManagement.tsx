import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, XCircleIcon, BuildingIcon, RefreshCwIcon, DownloadIcon, UploadIcon } from 'lucide-react';
import Logo from '../../assets/logo.png';
import { departmentService } from '../../services/database';
import { Department } from '../../lib/supabase';

const DepartmentManagement: React.FC = () => {
  const { addNotification, addToast } = useNotifications();
  const [departmentData, setDepartmentData] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterUserCount, setFilterUserCount] = useState('All');
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    location: '',
    manager: '',
    parent_id: '' as string | ''
  });
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'txt' | 'excel' | 'pdf'>('csv');
  const importInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fetch departments from database
    const fetchData = async () => {
      try {
      setLoading(true);
      const departments = await departmentService.getAll();
      setDepartmentData(departments);
      setFilteredDepartments(departments);
      // Ensure primary roots exist
      const primaryNames = ['Turnkey','Agencify','Caava AI'];
      const existingRoots = new Set(
        departments
          .filter(d => !(d as any).parent_id)
          .map(d => (d.name || '').trim().toLowerCase())
      );
      const toCreate = primaryNames.filter(n => !existingRoots.has(n.toLowerCase()));
      if (toCreate.length > 0) {
        for (const name of toCreate) {
          try {
            await departmentService.create({
              name,
              description: `Root department: ${name}`,
              location: name === 'Turnkey' ? 'Turnkey' : '',
              manager: 'Unassigned'
            } as any);
          } catch (_) { /* ignore individual failures */ }
        }
      }
      // Promote any matching primaries that accidentally have a parent
      const all = await departmentService.getAll();
      const toPromote = all.filter(d => primaryNames.map(n => n.toLowerCase()).includes((d.name || '').trim().toLowerCase()) && (d as any).parent_id);
      for (const dept of toPromote) {
        try { await departmentService.update(dept.id, { parent_id: null } as any); } catch (_) {}
      }
      if (toCreate.length > 0 || toPromote.length > 0) {
        const refreshed = await departmentService.getAll();
        setDepartmentData(refreshed);
        setFilteredDepartments(refreshed);
      }
      } catch (error) {
        console.error('Error fetching department data:', error);
        addNotification({
          title: 'Error',
        message: 'Failed to load department data. Please check your database connection.',
          type: 'error'
        });
        addToast({
          title: 'Error',
        message: 'Failed to load department data. Please check your database connection.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, [addNotification]);

  useEffect(() => {
    // Filter departments based on search term and filters
    let result = departmentData;
    
    if (searchTerm) {
      result = result.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dept.manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterLocation !== 'All') {
      result = result.filter(dept => dept.location === filterLocation);
    }
    
    if (filterUserCount !== 'All') {
      result = result.filter(dept => {
        const userCount = dept.user_count;
        switch (filterUserCount) {
          case '0-5':
            return userCount >= 0 && userCount <= 5;
          case '6-10':
            return userCount >= 6 && userCount <= 10;
          case '11-20':
            return userCount >= 11 && userCount <= 20;
          case '20+':
            return userCount > 20;
          default:
            return true;
        }
      });
    }
    
    setFilteredDepartments(result);
  }, [departmentData, searchTerm, filterLocation, filterUserCount]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    // Create the new department object
    const departmentToAdd = {
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
        user_count: 0,
        asset_count: 0,
        asset_value: '$0',
      manager: newDepartment.manager || 'Unassigned',
        manager_id: null,
      parent_id: newDepartment.parent_id || null
    };

      const newDepartmentData = await departmentService.create(departmentToAdd);
      
    // Add the new department to the list
      setDepartmentData([...departmentData, newDepartmentData]);
      
    // Close the modal and reset the form
    setShowAddDepartmentModal(false);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      manager: '',
      parent_id: ''
    });
      
    // Show a notification
    addNotification({
      title: 'Department Added',
        message: `New department "${newDepartmentData.name}" has been added successfully`,
      type: 'success'
    });
    addToast({
      title: 'Department Added',
        message: `New department "${newDepartmentData.name}" has been added successfully`,
      type: 'success'
    });
    } catch (error) {
      console.error('Error adding department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to add department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to add department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    
    try {
      // Update the department in the database
      const updatedDepartment = await departmentService.update(selectedDepartment.id, ({
      name: newDepartment.name,
      description: newDepartment.description,
      location: newDepartment.location,
      manager: newDepartment.manager || selectedDepartment.manager,
      parent_id: newDepartment.parent_id || null
      } as any));

      // Update the department in the list
      const updatedDepartments = departmentData.map(dept => 
        dept.id === selectedDepartment.id ? updatedDepartment : dept
      );
    setDepartmentData(updatedDepartments);
      setFilteredDepartments(updatedDepartments);
      
    // Close the modal and reset the form
    setShowEditDepartmentModal(false);
    setSelectedDepartment(null);
    setNewDepartment({
      name: '',
      description: '',
      location: '',
      manager: '',
      parent_id: ''
    });
      
    // Show a notification
    addNotification({
      title: 'Department Updated',
        message: `Department "${updatedDepartment.name}" has been updated successfully`,
      type: 'success'
    });
    addToast({
      title: 'Department Updated',
        message: `Department "${updatedDepartment.name}" has been updated successfully`,
      type: 'success'
    });
    } catch (error) {
      console.error('Error updating department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to update department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      // Delete the department from the database
      await departmentService.delete(selectedDepartment.id);
      
    // Filter out the selected department
    const updatedDepartments = departmentData.filter(dept => dept.id !== selectedDepartment.id);
    setDepartmentData(updatedDepartments);
      setFilteredDepartments(updatedDepartments);
      
    // Show a notification
    addNotification({
      title: 'Department Deleted',
      message: `Department "${selectedDepartment.name}" has been deleted`,
      type: 'info'
    });
    addToast({
      title: 'Department Deleted',
      message: `Department "${selectedDepartment.name}" has been deleted`,
      type: 'success'
    });
      
    // Close the modal and reset the selected department
    setShowDeleteModal(false);
    setSelectedDepartment(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete department. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to delete department. Please check your database connection.',
        type: 'error'
      });
    }
  };

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(departmentData.map(dept => dept.location))).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Department Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization's departments and their resources</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddDepartmentModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl shadow-button hover:opacity-90 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Department
          </button>
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-300 rounded-xl">
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="json">JSON</option>
            <option value="txt">Text (.txt)</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={async () => {
            if (exporting) return; setExporting(true);
            try {
              const data = filteredDepartments;
              if (!data.length) { addNotification({ title: 'No Data', message: 'No departments match the current filters.', type: 'warning' }); setExporting(false); return; }
              const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '';
              if (exportFormat === 'csv') {
                const headers = ['name','description','location','manager','user_count','asset_count','asset_value','created_at'];
                const rows: string[] = [headers.join(',')];
                for (const d of data) {
                  const row = [d.name,d.description,d.location,d.manager,String((d as any).user_count ?? ''),String((d as any).asset_count ?? ''),(d as any).asset_value ?? '', fmtDate(d.created_at)]
                    .map(v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
                  rows.push(row);
                }
                const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.setAttribute('download', `departments_export_${Date.now()}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              } else if (exportFormat === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.setAttribute('download', `departments_export_${Date.now()}.json`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              } else if (exportFormat === 'excel') {
                const buildHtmlTable = (items: any[]) => {
                  const headers = ['name','description','location','manager','user_count','asset_count','asset_value','created_at'];
                  const escapeHtml = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                  const thead = `<thead><tr>${headers.map(h => `<th style=\"text-align:left;border:1px solid #ccc;padding:6px;\">${h}</th>`).join('')}</tr></thead>`;
                  const tbody = `<tbody>${items.map(d => `<tr>${[d.name,d.description,d.location,d.manager,String((d as any).user_count ?? ''),String((d as any).asset_count ?? ''),(d as any).asset_value ?? '', fmtDate(d.created_at)].map(v => `<td style=\"border:1px solid #ccc;padding:6px;\">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody>`;
                  return `<table style=\"border-collapse:collapse;font-family:Arial, sans-serif;font-size:12px;\">${thead}${tbody}</table>`;
                };
                const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" /></head><body>${buildHtmlTable(data)}</body></html>`;
                const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.setAttribute('download', `departments_export_${Date.now()}.xls`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              } else if (exportFormat === 'pdf') {
                const ensureJsPdf = () => new Promise<void>((resolve, reject) => {
                  if ((window as any).jspdf?.jsPDF) return resolve();
                  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'; s.async = true; s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load jsPDF')); document.head.appendChild(s);
                });
                await ensureJsPdf(); const { jsPDF } = (window as any).jspdf;
                const format = data.length > 25 ? 'A3' : 'A4';
                const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format });
                const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 36; let y = margin;
                // Logo like assets
                const logoDataUrl: string = await new Promise(resolve => { try { const img = new Image(); img.crossOrigin='anonymous'; img.onload=()=>{ try{ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d'); if(ctx){ ctx.drawImage(img,0,0); resolve(c.toDataURL('image/png')); } else { resolve(''); } } catch { resolve(''); } }; img.onerror=()=>resolve(''); img.src=(Logo as unknown as string); } catch { resolve(''); } });
                if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', margin, y, 120, 48); } catch {} }
                doc.setFont('helvetica','normal'); doc.setFontSize(10);
                const dateStr = new Date().toLocaleString(); doc.text(`Exported: ${dateStr}`, pageWidth - margin - 180, y + 16); y += 56;
                doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('Departments Export', margin, y); y += 14; doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`Total departments: ${data.length}`, margin + 170, y); y += 14;
                const headers = ['Name','Description','Location','Manager','Users','Assets','Value','Created'];
                const weights = [14,22,12,12,7,7,8,10]; const totalWeight = weights.reduce((a,b)=>a+b,0); const availableWidth = pageWidth - margin*2; const colWidths = weights.map(w => Math.floor((w/totalWeight)*availableWidth));
                const baseLineHeight = 12; const cellPadding = 6; const measureRowHeight = (cells: string[]) => { let maxLines=1; for (let i=0;i<cells.length;i++){ const maxW = colWidths[i]-cellPadding; const lines = doc.splitTextToSize(String(cells[i]??''), maxW) as string[]; if (lines.length>maxLines) maxLines=lines.length; } return Math.max(18, maxLines*baseLineHeight+8); };
                const drawRow = (cells: string[], isHeader=false) => { let x=margin; doc.setFont('helvetica', isHeader?'bold':'normal'); doc.setFontSize(isHeader?10:9); const rowH = measureRowHeight(cells); for (let i=0;i<cells.length;i++){ const lines = doc.splitTextToSize(String(cells[i]??''), colWidths[i]-cellPadding) as string[]; doc.text(lines, x+3, y+12, { baseline: 'alphabetic' }); doc.rect(x, y, colWidths[i], rowH); x+=colWidths[i]; } y+=rowH; };
                const headerH = measureRowHeight(headers); if (y + headerH > pageHeight - margin) { doc.addPage(); y = margin; }
                drawRow(headers, true);
                for (const d of data) {
                  const cells = [d.name, d.description, d.location, d.manager, String((d as any).user_count ?? ''), String((d as any).asset_count ?? ''), (d as any).asset_value ?? '', d.created_at || ''];
                  const nextH = measureRowHeight(cells); if (y + nextH > pageHeight - margin) { doc.addPage(); y = margin; drawRow(headers, true); }
                  drawRow(cells);
                }
                const fname = `Departments_${new Date().toISOString().slice(0,10)}.pdf`; doc.save(fname);
              } else {
                const lines = data.map(d => `${d.name}\t${d.location}\t${d.manager}`);
                const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.setAttribute('download', `departments_export_${Date.now()}.txt`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              }
              addNotification({ title: 'Export Complete', message: 'Departments exported successfully.', type: 'success' });
            } catch (e: any) { addNotification({ title: 'Export Failed', message: e?.message || 'Could not export departments.', type: 'error' }); }
            finally { setExporting(false); }
          }} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 disabled:opacity-50" disabled={exporting}>
            <DownloadIcon className="w-4 h-4 mr-2" /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            try {
              const text = await file.text();
              const lines = text.split(/\r?\n/).filter(l => l.trim());
              if (lines.length <= 1) { addNotification({ title: 'Import Failed', message: 'CSV appears empty.', type: 'error' }); return; }
              const header = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
              const idx = (k: string) => header.indexOf(k);
              const nameIdx = idx('name'); const descIdx = idx('description'); const locIdx = idx('location'); const mgrIdx = idx('manager');
              if ([nameIdx,descIdx,locIdx].some(i => i === -1)) { addNotification({ title: 'Import Failed', message: 'CSV missing required headers: name,description,location', type: 'error' }); return; }
              const parse = (line: string) => { const res: string[] = []; let cur=''; let q=false; for (let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ if(q && line[i+1]==='"'){ cur+='"'; i++; } else { q=!q; } } else if(ch===',' && !q){ res.push(cur); cur=''; } else { cur+=ch; } } res.push(cur); return res.map(s=>s.trim()); };
              const rows = lines.slice(1).map(parse);
              let created = 0;
              for (const r of rows) {
                const get = (i: number) => r[i] ? r[i].replace(/^\"|\"$/g, '') : '';
                const payload: any = { name: get(nameIdx), description: get(descIdx), location: get(locIdx), manager: mgrIdx>=0 ? get(mgrIdx) : '' };
                if (!payload.name || !payload.description || !payload.location) continue;
                try { await departmentService.create({ ...payload }); created++; } catch {}
              }
              addNotification({ title: 'Import Complete', message: `Imported ${created} departments from CSV.`, type: 'success' });
            } catch (e: any) { addNotification({ title: 'Import Failed', message: e?.message || 'Could not import CSV.', type: 'error' }); }
            finally { if (importInputRef.current) importInputRef.current.value=''; }
          }} />
          <button onClick={() => importInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-secondary bg-lightpurple rounded-full shadow-button hover:opacity-90">
            <UploadIcon className="w-4 h-4 mr-2" /> Import
          </button>
        </div>
        </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
          </div>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <select
              value={filterUserCount}
              onChange={(e) => setFilterUserCount(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Sizes</option>
              <option value="0-5">0-5 Users</option>
              <option value="6-10">6-10 Users</option>
              <option value="11-20">11-20 Users</option>
              <option value="20+">20+ Users</option>
            </select>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setFilterLocation('All'); setFilterUserCount('All'); }} 
            className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 flex items-center"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Departments List (Grouped by primary roots) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">All Departments</h2>
            <span className="px-3 py-1 text-sm font-medium text-primary bg-lightgreen rounded-full">
              {filteredDepartments.length} departments
            </span>
          </div>
        </div>

        {['Turnkey','Agencify','Caava AI'].map(rootName => {
          const roots = departmentData.filter(d => !(d as any).parent_id && (d.name || '').trim().toLowerCase() === rootName.toLowerCase());
          const anyMatch = departmentData.find(d => (d.name || '').trim().toLowerCase() === rootName.toLowerCase());
          const root = roots[0] || anyMatch || null;
          const children = root ? departmentData.filter(d => (d as any).parent_id && ((d as any).parent_id === (root as any).id)) : [];
          return (
            <div key={rootName} className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 mr-3 text-secondary bg-lightpurple rounded-full"><BuildingIcon className="w-5 h-5" /></div>
                  <div>
                    <div className="font-semibold text-primary">{rootName}</div>
                    <div className="text-xs text-gray-500">{root && root.created_at ? new Date(root.created_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (root) {
                        setSelectedDepartment(root as any);
                        setNewDepartment({ name: (root as any).name, description: (root as any).description, location: (root as any).location, manager: (root as any).manager !== 'Unassigned' ? (root as any).manager : '', parent_id: '' });
                        setShowEditDepartmentModal(true);
                      }
                    }}
                    className="p-1 text-yellow-600 rounded hover:bg-yellow-100"
                    title="Edit Root Department"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {children.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-lightgreen dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Sub-Department</th>
                        <th className="px-6 py-3">Manager</th>
                        <th className="px-6 py-3">Users</th>
                        <th className="px-6 py-3">Assets</th>
                        <th className="px-6 py-3">Location</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map(dept => (
                        <tr key={dept.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-lightgreen/50 dark:hover:bg-gray-800/60">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">{dept.name}</td>
                          <td className="px-6 py-4">{dept.manager}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium text-primary bg-lightgreen rounded-full">{dept.user_count}</span></td>
                          <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium text-secondary bg-lightpurple rounded-full">{dept.asset_count}</span> <span className="ml-2 text-xs text-gray-500">{dept.asset_value}</span></td>
                          <td className="px-6 py-4">{dept.location}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDepartment(dept);
                                  setNewDepartment({ name: dept.name, description: dept.description, location: dept.location, manager: dept.manager !== 'Unassigned' ? dept.manager : '', parent_id: (dept as any).parent_id || '' });
                                  setShowEditDepartmentModal(true);
                                }}
                                className="p-1 text-yellow-600 rounded hover:bg-yellow-100"
                                title="Edit Department"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => { setSelectedDepartment(dept); setShowDeleteModal(true); }}
                                className="p-1 text-red-600 rounded hover:bg-red-100"
                                title="Delete Department"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-600">No sub-departments yet.</div>
              )}
            </div>
          );
        })}

        {/* Non-primary roots or ungrouped items (optional) can be handled here if needed */}
      </div>

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">Add New Department</h3>
              <button
                onClick={() => setShowAddDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Department Name</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Marketing"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Description</label>
                <textarea
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brief description of the department"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Location</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Floor 2, Building A"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Parent Department (optional)</label>
                <select
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.parent_id}
                  onChange={(e) => setNewDepartment({ ...newDepartment, parent_id: e.target.value })}
                >
                  <option value="">None (Root)</option>
                  {departmentData
                    .filter(d => !(d as any).parent_id)
                    .filter(d => ['Turnkey','Agencify','Caava AI'].includes(d.name))
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-primary">Manager</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. John Doe"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({ ...newDepartment, manager: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90"
                >
                  Add Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDepartmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">Edit Department</h3>
              <button
                onClick={() => setShowEditDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditDepartment}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Department Name</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Description</label>
                <textarea
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Location</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-primary">Parent Department (optional)</label>
                <select
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.parent_id}
                  onChange={(e) => setNewDepartment({ ...newDepartment, parent_id: e.target.value })}
                >
                  <option value="">None (Root)</option>
                  {departmentData
                    .filter(d => !(d as any).parent_id)
                    .filter(d => ['Turnkey','Agencify','Caava AI'].includes(d.name))
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-primary">Manager</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newDepartment.manager}
                  onChange={(e) => setNewDepartment({ ...newDepartment, manager: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90"
                >
                  Update Department
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditDepartmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Delete Department</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete "{selectedDepartment.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleDeleteDepartment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default DepartmentManagement;