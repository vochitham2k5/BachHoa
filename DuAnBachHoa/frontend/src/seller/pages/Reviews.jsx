import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { replyReview, setReplyVisibility, updateReview } from '../../services/reviewService';

export default function SellerReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState({}); // reviewId -> text

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews/?mine=1');
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (id) => {
    const text = replying[id];
    if (!text) return;
    await replyReview(id, text);
    setReplying(prev => ({ ...prev, [id]: '' }));
    await load();
  };

  const toggleHide = async (r) => {
    await setReplyVisibility(r.id, !r.seller_reply_hidden);
    await load();
  };

  const editReply = async (r) => {
    const val = window.prompt('Sửa phản hồi', r.seller_reply || '');
    if (val == null) return;
    await updateReview(r.id, { seller_reply: val });
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Đánh giá sản phẩm (shop)</h3>
      <ul>
        {items.map(r => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <div>
              <b>SP #{r.product}:</b> {r.rating}/5 - {r.comment || '(không có bình luận)'}
            </div>
            {r.seller_reply ? (
              <div style={{ fontStyle: 'italic' }}>
                Phản hồi: {r.seller_reply}
                <span style={{ marginLeft: 8 }}>
                  <button onClick={()=>editReply(r)}>Sửa</button>
                  <button onClick={()=>toggleHide(r)} style={{ marginLeft: 6 }}>{r.seller_reply_hidden ? 'Hiện' : 'Ẩn'}</button>
                </span>
              </div>
            ) : (
              <div style={{ display:'flex', gap: 6, marginTop: 4 }}>
                <input placeholder="Trả lời..." value={replying[r.id] || ''} onChange={(e)=>setReplying(prev=>({ ...prev, [r.id]: e.target.value }))} />
                <button onClick={() => submit(r.id)}>Gửi</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
