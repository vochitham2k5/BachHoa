import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [range, setRange] = useState({ start: '', end: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let url = `/admin/stats/?days=${days}`;
        if (range.start && range.end) {
          url = `/admin/stats/?start=${range.start}&end=${range.end}`;
        }
        const { data } = await api.get(url);
        setStats(data);
      } finally {
        setLoading(false);
      }
    })();

  }, [days, range.start, range.end]);

  if (loading || !stats) return <div>Đang tải...</div>;

  const maxRevenue = useMemo(() => Math.max(1, ...(stats.series || []).map(x => x.revenue || 0)), [stats]);
  const maxOrders = useMemo(() => Math.max(1, ...(stats.series || []).map(x => x.orders || 0)), [stats]);

  return (
    <div>
      <h3>Dashboard</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems:'center' }}>
        <div><b>Tổng đơn hàng:</b> {stats.total_orders}</div>
        <div><b>Doanh thu {days} ngày:</b> {Number(stats.revenue_7d).toLocaleString()} đ</div>
        <div><b>Sản phẩm active:</b> {stats.active_products}</div>
        <div style={{ marginLeft: 'auto', display:'flex', gap: 12, alignItems:'center' }}>
          <label>
            Khoảng thời gian:
            <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
          </label>
          <label>
            Từ:
            <input type="date" value={range.start} onChange={(e)=>setRange(r=>({ ...r, start: e.target.value }))} style={{ marginLeft: 6 }} />
          </label>
          <label>
            Đến:
            <input type="date" value={range.end} onChange={(e)=>setRange(r=>({ ...r, end: e.target.value }))} style={{ marginLeft: 6 }} />
          </label>
          <button onClick={()=>setRange({ start:'', end:'' })}>Xoá ngày tùy chọn</button>
          <div style={{ display:'flex', gap: 6 }}>
            <button onClick={()=>window.open((range.start && range.end)? `/api/admin/stats/?start=${range.start}&end=${range.end}&csv=series` : `/api/admin/stats/?days=${days}&csv=series`, '_blank')}>Tải CSV series</button>
            <button onClick={()=>window.open((range.start && range.end)? `/api/admin/stats/?start=${range.start}&end=${range.end}&csv=top_products` : `/api/admin/stats/?days=${days}&csv=top_products`, '_blank')}>CSV top sản phẩm</button>
            <button onClick={()=>window.open((range.start && range.end)? `/api/admin/stats/?start=${range.start}&end=${range.end}&csv=top_sellers` : `/api/admin/stats/?days=${days}&csv=top_sellers`, '_blank')}>CSV top seller</button>
            <button onClick={()=>window.open((range.start && range.end)? `/api/admin/stats/?start=${range.start}&end=${range.end}&csv=top_categories` : `/api/admin/stats/?days=${days}&csv=top_categories`, '_blank')}>CSV danh mục</button>
          </div>
        </div>
      </div>

      <div>
        <h4>Doanh thu</h4>
        <div style={{ display:'flex', alignItems:'flex-end', gap: 6, height: 120, borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc', padding: '8px 4px' }}>
          {(stats.series || []).map(pt => (
            <div key={pt.date} title={`${pt.date}: ${Number(pt.revenue||0).toLocaleString()} đ`} style={{ width: 24, background:'#4e79a7', height: `${((pt.revenue||0)/maxRevenue)*100}%` }} />
          ))}
        </div>
        <div style={{ display:'flex', gap: 6, fontSize: 12, marginTop: 4 }}>
          {(stats.series || []).map(pt => (
            <div key={pt.date} style={{ width: 24, textAlign:'center' }}>{pt.date.slice(5)}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Số đơn</h4>
        <div style={{ display:'flex', alignItems:'flex-end', gap: 6, height: 100, borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc', padding: '8px 4px' }}>
          {(stats.series || []).map(pt => (
            <div key={pt.date} title={`${pt.date}: ${pt.orders}`} style={{ width: 18, background:'#f28e2c', height: `${((pt.orders||0)/maxOrders)*100}%` }} />
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap: 24, marginTop: 16, flexWrap:'wrap' }}>
        <div>
          <h4>Top sản phẩm</h4>
          <ol>
            {(stats.top_products || []).map(p => (
              <li key={p.product_id}>{p.name} - {p.revenue.toLocaleString()} đ</li>
            ))}
          </ol>
        </div>
        <div>
          <h4>Top seller</h4>
          <ol>
            {(stats.top_sellers || []).map(s => (
              <li key={s.seller_id}>{s.username || ('User#'+s.seller_id)} - {s.revenue.toLocaleString()} đ</li>
            ))}
          </ol>
        </div>
        <div>
          <h4>Top danh mục</h4>
          <ol>
            {(stats.top_categories || []).map(c => (
              <li key={c.category}>{c.category} - {c.revenue.toLocaleString()} đ</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
