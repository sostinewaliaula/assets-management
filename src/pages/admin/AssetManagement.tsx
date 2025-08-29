import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { SearchIcon, FilterIcon, PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, DownloadIcon, UploadIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { assetService, departmentService, userService, notificationService } from '../../services/database';
import Logo from '../../assets/logo.png';
import { Asset, Department, User } from '../../lib/supabase';

// Static data for dropdowns (these could also come from the database)
const assetTypes = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Phone', 'Tablet', 'Printer', 'Server', 'Router', 'Switch', 'Projector', 'Camera', 'Furniture', 'Vehicle'];
const manufacturers = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Samsung', 'Cisco', 'Logitech', 'Canon', 'Epson', 'LG', 'ASUS', 'Acer', 'Sony', 'Brother'];
const locations = ['Headquarters - Floor 1', 'Headquarters - Floor 2', 'Headquarters - Floor 3', 'Branch Office - North', 'Branch Office - South', 'Branch Office - East', 'Branch Office - West', 'Data Center', 'Remote'];
const assetStatuses = ['Available', 'Assigned', 'In Maintenance', 'Reserved', 'Disposed'];
const assetConditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor', 'Defective'];

const AssetManagement: React.FC = () => {
  const { addNotification, addToast } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Laptop',
    category: 'Electronics',
    manufacturer: 'Dell',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: 0,
    current_value: 0,
    status: 'Available',
    condition: 'New',
    location: 'Headquarters - Floor 1',
    assigned_to: null as string | null,
    department_id: '' as string,
    warranty_expiry: '',
    last_maintenance: null as string | null,
    notes: ''
  });

  // Fetch assets, departments, and users from database
  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, departmentsData, usersData] = await Promise.all([
        assetService.getAll(),
        departmentService.getAll(),
        userService.getAll()
      ]);
      setAssets(assetsData);
      setFilteredAssets(assetsData);
      setDepartments(departmentsData);
      setUsers(usersData);
      } catch (error) {
      console.error('Error fetching data:', error);
        addNotification({
          title: 'Error',
        message: 'Failed to load asset data. Please check your database connection.',
          type: 'error'
        });
        addToast({
          title: 'Error',
        message: 'Failed to load asset data. Please check your database connection.',
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
    // Filter assets based on search term and filters
    let result = assets;
    
    if (searchTerm) {
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'All') {
      result = result.filter(asset => asset.type === filterType);
    }
    
    if (filterStatus !== 'All') {
      result = result.filter(asset => asset.status === filterStatus);
    }
    
    if (filterDepartment !== 'All') {
      result = result.filter(asset => asset.department_id === filterDepartment);
    }
    
    setFilteredAssets(result);
  }, [assets, searchTerm, filterType, filterStatus, filterDepartment]);

  // Export/Import helpers
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'txt' | 'excel' | 'pdf'>('csv');

  // Logo is imported at top-level as Vite asset

  const downloadSampleCsv = () => {
    const headers = ['name','type','serial_number','status','location','manufacturer','department_id','assigned_to','purchase_date','warranty_expiry'];
    const sample = [["MacBook Pro 14\"", 'Laptop', 'SN-ABC123', 'Available', 'Headquarters - Floor 1', 'Apple', '', '', '', '']];
    const rows = [headers.join(','), ...sample.map(r => r.map(v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'assets_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildHtmlTable = (items: any[]) => {
    const headers = ['name','type','serial_number','status','location','manufacturer','department_id','assigned_to','purchase_date','warranty_expiry'];
    const escapeHtml = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const thead = `<thead><tr>${headers.map(h => `<th style="text-align:left;border:1px solid #ccc;padding:6px;">${h}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${items.map(a => `<tr>${[
      a.name, a.type, a.serial_number, a.status, a.location || '', (a as any).manufacturer || '', a.department_id || '', a.assigned_to || '', (a as any).purchase_date || '', (a as any).warranty_expiry || ''
    ].map(v => `<td style=\"border:1px solid #ccc;padding:6px;\">${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table style="border-collapse:collapse;font-family:Arial, sans-serif;font-size:12px;">${thead}${tbody}</table>`;
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const data = filteredAssets;
      if (!data || data.length === 0) {
        addNotification({ title: 'No Data', message: 'No assets match the current filters to export.', type: 'warning' });
        setIsExporting(false);
        return;
      }
      if (exportFormat === 'csv') {
        const headers = ['name','type','serial_number','status','location','manufacturer','department_id','assigned_to','purchase_date','warranty_expiry'];
        const csvRows: string[] = [];
        csvRows.push(headers.join(','));
        for (const a of data) {
          const row = [
            a.name,
            a.type,
            a.serial_number,
            a.status,
            a.location || '',
            (a as any).manufacturer || '',
            a.department_id || '',
            a.assigned_to || '',
            (a as any).purchase_date || '',
            (a as any).warranty_expiry || ''
          ].map(v => {
            const s = String(v ?? '');
            return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
          }).join(',');
          csvRows.push(row);
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `assets_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `assets_export_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'txt') {
        const lines = data.map(a => `${a.name}\t${a.type}\t${a.serial_number}\t${a.status}\t${a.location || ''}`);
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `assets_export_${Date.now()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'excel') {
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${buildHtmlTable(data)}</body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `assets_export_${Date.now()}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'pdf') {
        // Lazy-load jsPDF UMD build
        const ensureJsPdf = () => new Promise<void>((resolve, reject) => {
          if ((window as any).jspdf?.jsPDF) return resolve();
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load jsPDF'));
          document.head.appendChild(s);
        });
        await ensureJsPdf();
        const { jsPDF } = (window as any).jspdf;
        // Choose larger page if many rows
        const format = data.length > 25 ? 'A3' : 'A4';
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 36;
        // Header labels removed per request
        // Convert imported logo to data URL via canvas (works for same-origin assets bundled by Vite)
        const logoDataUrl: string = await new Promise(resolve => {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  resolve(canvas.toDataURL('image/png'));
                } else {
                  resolve('');
                }
              } catch { resolve(''); }
            };
            img.onerror = () => resolve('');
            img.src = (Logo as unknown as string);
          } catch { resolve(''); }
        });
        // Header
        let y = margin;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', margin, y, 120, 48); } catch {}
        }
        // Keep space for logo; omit company/app text
        const dateStr = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Exported: ${dateStr}`, pageWidth - margin - 180, y + 16);
        y += 56;
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Assets Export', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total assets: ${data.length}`, margin + 140, y);
        y += 14;
        // Table with dynamic column sizing
        const headers = ['Name','Type','Serial','Status','Location','Manufacturer','Dept','Assigned To','Purchase','Warranty'];
        const weights = [16,12,12,9,15,12,8,10,8,8];
        const totalWeight = weights.reduce((a,b)=>a+b,0);
        const availableWidth = pageWidth - margin * 2;
        const colWidths = weights.map(w => Math.floor((w / totalWeight) * availableWidth));
        const baseLineHeight = 12;
        const cellPadding = 6;
        const measureRowHeight = (cells: string[]) => {
          let maxLines = 1;
          for (let i = 0; i < cells.length; i++) {
            const text = String(cells[i] ?? '');
            const maxWidth = colWidths[i] - cellPadding;
            const lines = doc.splitTextToSize(text, maxWidth) as string[];
            if (lines.length > maxLines) maxLines = lines.length;
          }
          return Math.max(18, maxLines * baseLineHeight + 8);
        };
        const drawRow = (cells: string[], isHeader = false) => {
          let x = margin;
          doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
          doc.setFontSize(isHeader ? 10 : 9);
          // determine row height based on wrapped lines
          const wrapped: string[][] = [];
          for (let i = 0; i < cells.length; i++) {
            const text = String(cells[i] ?? '');
            const maxWidth = colWidths[i] - cellPadding;
            const lines = doc.splitTextToSize(text, maxWidth) as string[];
            wrapped.push(lines);
          }
          const rowHeight = measureRowHeight(cells);
          // draw text and cells
          for (let i = 0; i < cells.length; i++) {
            const lines = wrapped[i];
            doc.text(lines, x + 3, y + 12, { baseline: 'alphabetic' });
            doc.rect(x, y, colWidths[i], rowHeight);
            x += colWidths[i];
          }
          y += rowHeight;
        };
        // Header row
        // Ensure room for header; if not, new page first
        const headerHeight = measureRowHeight(headers);
        if (y + headerHeight > pageHeight - margin) {
          doc.addPage(); y = margin;
        }
        drawRow(headers, true);
        // Data rows with pagination
        // lookup helpers for names
        const deptMap = new Map<string, string>(departments.map(d => [d.id, d.name]));
        const userMap = new Map<string, string>(users.map(u => [u.id, u.name]));
        for (const a of data) {
          const cells = [
            a.name,
            a.type,
            a.serial_number || '',
            a.status,
            a.location || '',
            (a as any).manufacturer || '',
            (a as any).department_id ? (deptMap.get((a as any).department_id) || (a as any).department_id) : '',
            (a as any).assigned_to ? (userMap.get((a as any).assigned_to) || (a as any).assigned_to) : '',
            (a as any).purchase_date || '',
            (a as any).warranty_expiry || ''
          ];
          const nextHeight = measureRowHeight(cells);
          if (y + nextHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
            drawRow(headers, true);
          }
          drawRow(cells);
        }
        const fname = `Assets_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fname);
      }
      addNotification({ title: 'Export', message: `Assets exported as ${exportFormat.toUpperCase()}.`, type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Export Failed', message: e?.message || 'Could not export assets.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    // Create the new asset object
    const assetToAdd = {
        name: newAsset.name,
        type: newAsset.type,
        category: newAsset.category,
        manufacturer: newAsset.manufacturer,
        model: newAsset.model,
        serial_number: newAsset.serial_number,
        purchase_date: newAsset.purchase_date || new Date().toISOString(),
        purchase_price: newAsset.purchase_price,
        current_value: newAsset.current_value,
        status: newAsset.status,
        condition: newAsset.condition,
        location: newAsset.location,
        assigned_to: newAsset.assigned_to,
        department_id: newAsset.department_id || null,
        warranty_expiry: newAsset.warranty_expiry || null,
        last_maintenance: newAsset.last_maintenance,
        notes: newAsset.notes
      };

      const newAssetData = await assetService.create(assetToAdd);
      
    // Add the new asset to the list
      setAssets([newAssetData, ...assets]);
      
      // Notify assigned user if asset is assigned at creation
      try {
        if (newAssetData.assigned_to) {
          await notificationService.notifyUser(
            newAssetData.assigned_to,
            'Asset Assigned',
            `You have been assigned the asset "${newAssetData.name}" (SN: ${newAssetData.serial_number || 'N/A'}).`,
            'info'
          );
        }
      } catch (e) {
        console.warn('Failed to notify assigned user for new asset', e);
      }

    // Close the modal and reset the form
    setShowAddAssetModal(false);
    setNewAsset({
      name: '',
      type: 'Laptop',
        category: 'Electronics',
      manufacturer: 'Dell',
      model: '',
        serial_number: '',
        purchase_date: '',
        purchase_price: 0,
        current_value: 0,
      status: 'Available',
      condition: 'New',
        location: 'Headquarters - Floor 1',
        assigned_to: null,
        department_id: '',
        warranty_expiry: '',
        last_maintenance: null,
      notes: ''
    });
      
    // Show a notification
    addNotification({
      title: 'Asset Added',
        message: `New asset "${newAssetData.name}" has been added successfully`,
        type: 'success'
      });
      addToast({
      title: 'Asset Added',
        message: `New asset "${newAssetData.name}" has been added successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to add asset. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to add asset. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    try {
      // Capture previous assignment
      const previous = assets.find(a => a.id === editingAsset.id);
      const previousAssignedTo = previous?.assigned_to || null;
      // Update the asset in the database
      const updatedAsset = await assetService.update(editingAsset.id, editingAsset);
      
      // Update the asset in the local state
      const updatedAssets = assets.map(asset => 
        asset.id === editingAsset.id ? updatedAsset : asset
      );
      setAssets(updatedAssets);
      
      // If assignment changed and now assigned, notify the new user
      try {
        if (updatedAsset.assigned_to && updatedAsset.assigned_to !== previousAssignedTo) {
          await notificationService.notifyUser(
            updatedAsset.assigned_to,
            'Asset Assigned',
            `You have been assigned the asset "${updatedAsset.name}" (SN: ${updatedAsset.serial_number || 'N/A'}).`,
            'info'
          );
        }
      } catch (e) {
        console.warn('Failed to notify user about asset assignment change', e);
      }

      // Close the modal and reset the editing state
      setShowEditAssetModal(false);
      setEditingAsset(null);
      
      // Show a notification
      addNotification({
        title: 'Asset Updated',
        message: `Asset "${updatedAsset.name}" has been updated successfully`,
      type: 'success'
    });
      addToast({
        title: 'Asset Updated',
        message: `Asset "${updatedAsset.name}" has been updated successfully`,
      type: 'success'
    });
    } catch (error) {
      console.error('Error updating asset:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to update asset. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to update asset. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    
    try {
      // Delete the asset from the database
      await assetService.delete(selectedAsset.id);
      
    // Filter out the selected asset
    const updatedAssets = assets.filter(asset => asset.id !== selectedAsset.id);
    setAssets(updatedAssets);
      
    // Show a notification
    addNotification({
      title: 'Asset Deleted',
      message: `Asset "${selectedAsset.name}" has been deleted`,
      type: 'info'
    });
    addToast({
      title: 'Asset Deleted',
      message: `Asset "${selectedAsset.name}" has been deleted`,
      type: 'success'
    });
      
    // Close the modal and reset the selected asset
    setShowDeleteModal(false);
    setSelectedAsset(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete asset. Please check your database connection.',
        type: 'error'
      });
      addToast({
        title: 'Error',
        message: 'Failed to delete asset. Please check your database connection.',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
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

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Unassigned';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown';
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading assets...</p>
      </div>
      </div>
    );
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
          <Link to="/scan" className="button-primary flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V4a1 1 0 011-1h3M20 7V4a1 1 0 00-1-1h-3M4 17v3a1 1 0 001 1h3M20 17v3a1 1 0 01-1 1h-3M7 12h10M12 7v10" /></svg>
            Scan QR
          </Link>
          <div className="flex items-center gap-2">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="csv">CSV</option>
              <option value="excel">Excel (.xls)</option>
              <option value="json">JSON</option>
              <option value="txt">Text (.txt)</option>
              <option value="pdf">PDF</option>
            </select>
            <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90 disabled:opacity-50" disabled={isExporting}>
              <DownloadIcon className="w-4 h-4 mr-2" /> {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsImporting(true);
            try {
              const text = await file.text();
              const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              if (lines.length <= 1) throw new Error('CSV appears empty.');
              const header = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
              const idx = (k: string) => header.indexOf(k);
              const nameIdx = idx('name');
              const typeIdx = idx('type');
              const serialIdx = idx('serial_number');
              const statusIdx = idx('status');
              const locationIdx = idx('location');
              const manufacturerIdx = idx('manufacturer');
              const deptIdx = idx('department_id');
              const assignedIdx = idx('assigned_to');
              const purchaseIdx = idx('purchase_date');
              const warrantyIdx = idx('warranty_expiry');
              if ([nameIdx,typeIdx,serialIdx,statusIdx].some(i => i === -1)) {
                throw new Error('CSV missing required headers: name,type,serial_number,status');
              }
              const parseCsvRow = (line: string): string[] => {
                const result: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                  const char = line[i];
                  if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                    else { inQuotes = !inQuotes; }
                  } else if (char === ',' && !inQuotes) {
                    result.push(current); current = '';
                  } else { current += char; }
                }
                result.push(current);
                return result.map(s => s.trim());
              };
              const rows = lines.slice(1).map(parseCsvRow);
              let created = 0;
              for (const r of rows) {
                const get = (i: number) => r[i] ? r[i].replace(/^\"|\"$/g, '') : '';
                const payload: any = {
                  name: get(nameIdx),
                  type: get(typeIdx),
                  serial_number: get(serialIdx),
                  status: get(statusIdx) || 'Available',
                  location: locationIdx >= 0 ? get(locationIdx) : null,
                  manufacturer: manufacturerIdx >= 0 ? get(manufacturerIdx) : null,
                  department_id: deptIdx >= 0 ? get(deptIdx) || null : null,
                  assigned_to: assignedIdx >= 0 ? get(assignedIdx) || null : null,
                  purchase_date: purchaseIdx >= 0 ? get(purchaseIdx) || null : null,
                  warranty_expiry: warrantyIdx >= 0 ? get(warrantyIdx) || null : null
                };
                if (!payload.name || !payload.type || !payload.serial_number) continue;
                try {
                  await assetService.create(payload);
                  created++;
                } catch (err) {
                  // continue on error for individual rows
                }
              }
              addNotification({ title: 'Import Complete', message: `Imported ${created} assets from CSV.`, type: 'success' });
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (e: any) {
              addNotification({ title: 'Import Failed', message: e?.message || 'Could not import CSV.', type: 'error' });
            } finally {
              setIsImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }} />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-secondary bg-lightpurple rounded-full shadow-button hover:opacity-90 disabled:opacity-50" disabled={isImporting}>
            <UploadIcon className="w-4 h-4 mr-2" /> {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button onClick={downloadSampleCsv} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full shadow-button hover:opacity-90">
            Sample CSV
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
              {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
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
                  <img src={"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3EIMG%3C/text%3E%3C/svg%3E"} alt={asset.name} className="w-10 h-10 mr-3 rounded-xl" />
                  <span>{asset.name}</span>
                </Link>
              </td>
               <td className="px-6 py-4">{asset.type}</td>
               <td className="px-6 py-4">{asset.serial_number}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>{asset.status}</span>
              </td>
               <td className="px-6 py-4">{getDepartmentName(asset.department_id)}</td>
               <td className="px-6 py-4">{asset.assigned_to ? <div className="flex items-center"><div className="p-1 mr-2 text-gray-400 bg-lightgreen rounded-full dark:bg-gray-800"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg></div><span>{getUserName(asset.assigned_to)}</span></div> : <span className="text-gray-400">Unassigned</span>}</td>
               <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <Link to={`/assets/${asset.id}`} className="p-1 text-secondary rounded hover:bg-lightpurple dark:hover:bg-gray-800" title="View Details"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></Link>
                  <button onClick={() => { setEditingAsset(asset); setShowEditAssetModal(true); }} className="p-1 text-yellow-600 rounded hover:bg-yellow-100 dark:hover:bg-gray-800" title="Edit Asset"><EditIcon className="w-5 h-5" /></button>
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
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Price (KSh)</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0.00" value={newAsset.purchase_price} onChange={e => setNewAsset({ ...newAsset, purchase_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Current Value (KSh)</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0.00" value={newAsset.current_value} onChange={e => setNewAsset({ ...newAsset, current_value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Category</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.category} onChange={e => setNewAsset({ ...newAsset, category: e.target.value })} required>
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
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="SN-1234567890" value={newAsset.serial_number} onChange={e => setNewAsset({ ...newAsset, serial_number: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.purchase_date} onChange={e => setNewAsset({ ...newAsset, purchase_date: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Warranty End Date</label>
              <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.warranty_expiry} onChange={e => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Department</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.department_id || ''} onChange={e => setNewAsset({ ...newAsset, department_id: e.target.value || '' })} required>
                <option value="">Select Department</option>
                {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
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
                {assetConditions.map(condition => <option key={condition} value={condition}>{condition}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Assigned To</label>
            <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={newAsset.assigned_to || ''} onChange={e => setNewAsset({ ...newAsset, assigned_to: e.target.value || null })}>
              <option value="">Select User</option>
              {users.map(user => <option key={user.id} value={user.id}>{getUserName(user.id)}</option>)}
            </select>
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

    {/* Edit Asset Modal */}
    {showEditAssetModal && editingAsset && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Dell XPS 15 Laptop" value={editingAsset.name} onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Asset Type</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.type} onChange={e => setEditingAsset({ ...editingAsset, type: e.target.value })} required>
                {assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Manufacturer</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.manufacturer} onChange={e => setEditingAsset({ ...editingAsset, manufacturer: e.target.value })} required>
                {manufacturers.map(manufacturer => <option key={manufacturer} value={manufacturer}>{manufacturer}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Model</label>
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="XPS 15 9500" value={editingAsset.model} onChange={e => setEditingAsset({ ...editingAsset, model: e.target.value })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Purchase Price (KSh)</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0.00" value={editingAsset.purchase_price} onChange={e => setEditingAsset({ ...editingAsset, purchase_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Current Value (KSh)</label>
              <input type="number" step="0.01" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="0.00" value={editingAsset.current_value} onChange={e => setEditingAsset({ ...editingAsset, current_value: parseFloat(e.target.value) || 0 })} />
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
              <input type="text" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="SN-1234567890" value={editingAsset.serial_number} onChange={e => setEditingAsset({ ...editingAsset, serial_number: e.target.value })} />
            </div>
                         <div>
               <label className="block mb-2 text-sm font-medium text-primary">Purchase Date</label>
               <input type="date" className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.purchase_date || ''} onChange={e => setEditingAsset({ ...editingAsset, purchase_date: e.target.value })} />
             </div>
             <div>
               <label className="block mb-2 text-sm font-medium text-primary">Warranty End Date</label>
               <input type="date" className="block w-full px-2 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.warranty_expiry || ''} onChange={e => setEditingAsset({ ...editingAsset, warranty_expiry: e.target.value })} />
             </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Department</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.department_id || ''} onChange={e => setEditingAsset({ ...editingAsset, department_id: e.target.value || '' })} required>
                <option value="">Select Department</option>
                {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Location</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.location} onChange={e => setEditingAsset({ ...editingAsset, location: e.target.value })} required>
                {locations.map(location => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Status</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.status} onChange={e => setEditingAsset({ ...editingAsset, status: e.target.value })} required>
                {assetStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-primary">Condition</label>
              <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.condition} onChange={e => setEditingAsset({ ...editingAsset, condition: e.target.value })} required>
                {assetConditions.map(condition => <option key={condition} value={condition}>{condition}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Assigned To</label>
            <select className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={editingAsset.assigned_to || ''} onChange={e => setEditingAsset({ ...editingAsset, assigned_to: e.target.value || null })}>
              <option value="">Select User</option>
              {users.map(user => <option key={user.id} value={user.id}>{getUserName(user.id)}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-primary">Notes</label>
            <textarea className="block w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" rows={3} placeholder="Additional notes about this asset" value={editingAsset.notes || ''} onChange={e => setEditingAsset({ ...editingAsset, notes: e.target.value })}></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowEditAssetModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2 text-sm font-medium">Save Changes</button>
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
            Are you sure you want to delete the asset "{selectedAsset?.name}
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
