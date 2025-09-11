import React, { useEffect, useMemo, useState } from 'react';
import { auditService, userService } from '../../services/database';
import { AuditLog, User } from '../../lib/supabase';
import { DownloadIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'txt' | 'pdf'>('csv');

  const load = async () => {
    setLoading(true);
    try { setLogs(await auditService.list(1000)); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const users = await userService.getAll();
        const map = new Map<string, string>();
        (users as User[]).forEach(u => map.set(u.id, u.name || u.email));
        setUserMap(map);
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(l =>
      (l.action || '').toLowerCase().includes(s) ||
      (l.entity_type || '').toLowerCase().includes(s) ||
      (l.entity_id || '').toLowerCase().includes(s) ||
      (l.user_id || '').toLowerCase().includes(s) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(s)
    );
  }, [logs, search]);

  const exportCsv = () => {
    const rows = [
      ['created_at','user_id','action','entity_type','entity_id','details_json']
    ];
    for (const l of filtered) {
      rows.push([
        l.created_at,
        l.user_id || '',
        l.action,
        l.entity_type,
        l.entity_id || '',
        JSON.stringify(l.details || {})
      ]);
    }
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', `audit_logs_${Date.now()}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = filtered.map(l => ({
      created_at: l.created_at,
      user: l.user_id ? (userMap.get(l.user_id) || l.user_id) : 'System',
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      details: l.details || {}
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', `audit_logs_${Date.now()}.json`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportTxt = () => {
    const lines = filtered.map(l => {
      const user = l.user_id ? (userMap.get(l.user_id) || l.user_id) : 'System';
      return `${new Date(l.created_at).toISOString()}\t${user}\t${l.action}\t${l.entity_type}\t${l.entity_id || ''}\t${JSON.stringify(l.details || {})}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', `audit_logs_${Date.now()}.txt`); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const ensureJsPdf = () => new Promise<void>((resolve, reject) => {
      if ((window as any).jspdf?.jsPDF) return resolve();
      const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'; s.async = true; s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load jsPDF')); document.head.appendChild(s);
    });
    await ensureJsPdf();
    const { jsPDF } = (window as any).jspdf;
    const data = filtered;
    const format = data.length > 25 ? 'A3' : 'A4';
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format });
    const margin = 36; let y = margin;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Audit Logs', margin, y); y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y); y += 14;
    const headers = ['Time','User','Action','Entity','Entity ID','Details'];
    const weights = [16,12,16,12,14,30];
    const pageWidth = doc.internal.pageSize.getWidth();
    const availableWidth = pageWidth - margin*2;
    const colWidths = weights.map(w => Math.floor((w/weights.reduce((a,b)=>a+b,0))*availableWidth));
    const baseLineHeight = 12; const cellPadding = 6;
    const measureRowHeight = (cells: string[]) => {
      let maxLines = 1;
      for (let i=0;i<cells.length;i++){
        const lines = doc.splitTextToSize(String(cells[i]??''), colWidths[i]-cellPadding) as string[];
        if (lines.length>maxLines) maxLines = lines.length;
      }
      return Math.max(18, maxLines*baseLineHeight+8);
    };
    const drawRow = (cells: string[], isHeader=false) => {
      let x = margin; const rowH = measureRowHeight(cells);
      doc.setFont('helvetica', isHeader?'bold':'normal'); doc.setFontSize(isHeader?10:9);
      for (let i=0;i<cells.length;i++){
        const lines = doc.splitTextToSize(String(cells[i]??''), colWidths[i]-cellPadding) as string[];
        doc.text(lines, x+3, y+12, { baseline: 'alphabetic' });
        doc.rect(x, y, colWidths[i], rowH);
        x += colWidths[i];
      }
      y += rowH;
    };
    // Header
    drawRow(headers, true);
    for (const l of data) {
      const user = l.user_id ? (userMap.get(l.user_id) || l.user_id) : 'System';
      const row = [new Date(l.created_at).toLocaleString(), user, l.action, l.entity_type, l.entity_id || '', JSON.stringify(l.details || {})];
      if (y + measureRowHeight(row) > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage(); y = margin; drawRow(headers, true);
      }
      drawRow(row);
    }
    doc.save(`audit_logs_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center"><div className="w-12 h-12 border-t-2 border-b-2 border-primary rounded-full animate-spin" /><p className="mt-4 text-gray-600">Loading audit logs...</p></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Audit Logs</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className="pl-9 pr-3 py-2 border rounded-xl" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button onClick={load} className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-full shadow-button hover:opacity-90"><RefreshCwIcon className="w-4 h-4 mr-1 inline" /> Refresh</button>
          <select value={exportFormat} onChange={e=>setExportFormat(e.target.value as any)} className="px-3 py-2 text-sm border rounded-xl">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="txt">Text (.txt)</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={() => {
            if (exportFormat === 'csv') exportCsv();
            else if (exportFormat === 'json') exportJson();
            else if (exportFormat === 'txt') exportTxt();
            else exportPdf();
          }} className="px-4 py-2 text-sm font-medium text-secondary bg-lightpurple rounded-full shadow-button hover:opacity-90"><DownloadIcon className="w-4 h-4 mr-1 inline" /> Export</button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs uppercase bg-lightgreen dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Entity ID</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
                <td className="px-6 py-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-6 py-3">{l.user_id ? (userMap.get(l.user_id) || l.user_id) : 'System'}</td>
                <td className="px-6 py-3">{l.action}</td>
                <td className="px-6 py-3">{l.entity_type}</td>
                <td className="px-6 py-3 truncate max-w-[200px]">{l.entity_id || ''}</td>
                <td className="px-6 py-3 text-xs truncate max-w-[420px]">{JSON.stringify(l.details || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;


