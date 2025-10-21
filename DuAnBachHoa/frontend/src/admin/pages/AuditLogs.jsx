import React, { useEffect, useState } from 'react';
import { listAuditLogs } from '../../services/adminService';

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({ method: '', status: '', path: '' });
  const [count, setCount] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (filters.method) params.method = filters.method;
      if (filters.status) params.status = filters.status;
      if (filters.path) params.path = filters.path;
      const data = await listAuditLogs(params);
      // If DRF pagination is enabled, expect { results, count }
      if (Array.isArray(data)) {
        setItems(data);
        setCount(data.length);
      } else {
        setItems(data.results || []);
        setCount(data.count || 0);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, filters.method, filters.status, filters.path]);

  const downloadCsv = () => {
    const qs = new URLSearchParams({ ...filters, csv: 1 }).toString();
    window.open(`/api/audit-logs/?${qs}`, '_blank');
  };

  return (
    <div>
      <h3>Audit Logs</h3>
      <div style={{ display:'flex', gap: 8, marginBottom: 8 }}>
        <label>
          Method:
          <select value={filters.method} onChange={e=>setFilters(f=>({ ...f, method: e.target.value }))} style={{ marginLeft: 6 }}>
            <option value="">All</option>
            {['GET','POST','PATCH','PUT','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Status:
          <input value={filters.status} onChange={e=>setFilters(f=>({ ...f, status: e.target.value }))} style={{ width: 80, marginLeft: 6 }} />
        </label>
        <label>
          Path contains:
          <input value={filters.path} onChange={e=>setFilters(f=>({ ...f, path: e.target.value }))} style={{ marginLeft: 6 }} />
        </label>
        <button onClick={downloadCsv}>Tải CSV</button>
      </div>

      {loading ? <div>Đang tải...</div> : (
        <>
          <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>User</th>
                <th>Method</th>
                <th>Đường dẫn</th>
                <th>Status</th>
                <th>ms</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.user?.username || '-'}</td>
                  <td>{log.method}</td>
                  <td>{log.path}</td>
                  <td>{log.status_code}</td>
                  <td>{log.duration_ms}</td>
                  <td>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, display:'flex', gap: 8, alignItems:'center' }}>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Trước</button>
            <span>Trang {page}</span>
            <button disabled={(page*pageSize)>=count && count>0} onClick={()=>setPage(p=>p+1)}>Sau</button>
          </div>
        </>
      )}
    </div>
  );
}
