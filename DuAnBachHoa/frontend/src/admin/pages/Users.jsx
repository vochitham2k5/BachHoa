import React, { useEffect, useState } from 'react';
import { listUsers, updateUserRole } from '../../services/adminService';

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError('Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChangeRole = async (id, role) => {
    try {
      await updateUserRole(id, role);
      await load();
    } catch (e) {
      alert('Cập nhật quyền thất bại');
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3>Quản lý người dùng</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select value={u.role} onChange={(e) => onChangeRole(u.id, e.target.value)}>
                  <option value="buyer">buyer</option>
                  <option value="seller">seller</option>
                  <option value="picker">picker</option>
                  <option value="shipper">shipper</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
