import React, { useEffect, useState } from 'react';
import { listShipments, transitionShipment, updateShipment } from '../../services/shipmentService';

export default function ShipmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});
  const [gps, setGps] = useState({}); // { [id]: { lat, lng } }

  const load = async () => {
    setLoading(true);
    try {
      const data = await listShipments();
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const move = async (id, status) => {
    await transitionShipment(id, status);
    await load();
  };

  const saveProof = async (id) => {
    const payload = {
      note: notes[id] || '',
      gps_lat: gps[id]?.lat,
      gps_lng: gps[id]?.lng,
      photo: photos[id],
    };
    await updateShipment(id, payload);
    await load();
  };

  const geo = (id) => {
    if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ định vị');
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setGps(prev => ({ ...prev, [id]: { lat: latitude, lng: longitude } }));
    }, () => alert('Không lấy được vị trí.'));
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Danh sách giao nhận</h3>
      <ul>
        {items.map(s => (
          <li key={s.id} style={{ marginBottom: 12 }}>
            <div>
              <b>Đơn #{s.order}</b> - Trạng thái: {s.status}
            </div>
            <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap', marginTop: 6 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e)=>setPhotos(prev=>({ ...prev, [s.id]: e.target.files?.[0] }))}
              />
              <input
                placeholder="Ghi chú"
                value={notes[s.id] || ''}
                onChange={(e)=>setNotes(prev=>({ ...prev, [s.id]: e.target.value }))}
              />
              <button onClick={() => geo(s.id)}>Lấy vị trí hiện tại</button>
              <span style={{ fontSize: 12, color:'#555' }}>
                {gps[s.id]?.lat ? `GPS: ${gps[s.id].lat.toFixed(5)}, ${gps[s.id].lng.toFixed(5)}` : 'GPS: -'}
              </span>
              <button onClick={() => saveProof(s.id)}>Lưu bằng chứng</button>
            </div>
            <div style={{ marginTop: 6, display:'inline-flex', gap: 6 }}>
              <button onClick={() => move(s.id, 'picked')}>Picked</button>
              <button onClick={() => move(s.id, 'in_transit')}>In Transit</button>
              <button onClick={() => move(s.id, 'delivered')}>Delivered</button>
              <button onClick={() => move(s.id, 'failed')}>Failed</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
