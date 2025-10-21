import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProduct } from '../../services/productService';
import { listReviews, createReview, updateReview, deleteReview } from '../../services/reviewService';
import api from '../../services/api';

export default function BuyerProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState({}); // reviewId -> { rating, comment }

  const load = async () => {
    try {
      const prod = await fetchProduct(id);
      setP(prod);
      const rs = await listReviews(id);
      setReviews(rs);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/me/');
        setMe(data);
      } catch {}
    })();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await createReview(Number(id), Number(rating), comment);
      setComment('');
      await load();
    } catch (e) { alert('Gửi đánh giá thất bại'); }
  };
  if (!p) return <div>Đang tải...</div>;
  const canEdit = (r) => {
    if (!me) return false;
    if (r.user !== me.id) return false;
    const created = new Date(r.created_at);
    return (Date.now() - created.getTime()) <= 24*3600*1000;
  };
  const saveEdit = async (r) => {
    const vals = editing[r.id];
    if (!vals) return;
    await updateReview(r.id, { rating: Number(vals.rating), comment: vals.comment });
    setEditing(prev => ({ ...prev, [r.id]: undefined }));
    await load();
  };
  const removeReview = async (r) => {
    if (!window.confirm('Xoá đánh giá này?')) return;
    await deleteReview(r.id);
    await load();
  };
  return (
    <div>
      <h3>{p.name}</h3>
      <p>{p.description}</p>
      <p>Giá: {Number(p.price)?.toLocaleString()}đ</p>
      <p>Đánh giá trung bình: {p.avg_rating} ({p.review_count} đánh giá)</p>
      <button>Thêm vào giỏ</button>

      <hr />
      <h4>Đánh giá</h4>
      {reviews.length ? (
        <ul>
          {reviews.map(r => (
            <li key={r.id} style={{ marginBottom: 10 }}>
              {editing[r.id] ? (
                <div style={{ display:'flex', gap: 6 }}>
                  <select value={editing[r.id].rating} onChange={e=>setEditing(prev=>({ ...prev, [r.id]: { ...prev[r.id], rating: e.target.value } }))}>
                    {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <input value={editing[r.id].comment} onChange={e=>setEditing(prev=>({ ...prev, [r.id]: { ...prev[r.id], comment: e.target.value } }))} />
                  <button onClick={()=>saveEdit(r)}>Lưu</button>
                  <button onClick={()=>setEditing(prev=>({ ...prev, [r.id]: undefined }))}>Huỷ</button>
                </div>
              ) : (
                <>
                  {r.rating}/5 - {r.comment || '(không có bình luận)'} - {new Date(r.created_at).toLocaleString()}
                  {canEdit(r) && (
                    <span style={{ marginLeft: 6 }}>
                      <button onClick={()=>setEditing(prev=>({ ...prev, [r.id]: { rating: r.rating, comment: r.comment || '' } }))}>Sửa</button>
                      <button onClick={()=>removeReview(r)} style={{ marginLeft: 4 }}>Xoá</button>
                    </span>
                  )}
                </>
              )}
              {!!r.seller_reply && !r.seller_reply_hidden && (
                <div style={{ fontStyle: 'italic', marginLeft: 8 }}>Shop phản hồi: {r.seller_reply}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>Chưa có đánh giá</div>
      )}

      <form onSubmit={submitReview} style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 480 }}>
        <label>
          Đánh giá:
          <select value={rating} onChange={(e)=>setRating(e.target.value)}>
            {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Nhận xét:
          <textarea value={comment} onChange={(e)=>setComment(e.target.value)} />
        </label>
        <button type="submit">Gửi đánh giá</button>
      </form>
    </div>
  );
}
