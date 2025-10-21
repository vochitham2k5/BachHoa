import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './user/layout/UserLayout';
import AdminLayout from './admin/layout/AdminLayout';
import SellerLayout from './seller/layout/SellerLayout';
import BuyerLayout from './buyer/layout/BuyerLayout';
import PickerLayout from './picker/layout/PickerLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';

// Buyer pages
import BuyerHome from './buyer/pages/Home';
import BuyerProducts from './buyer/pages/Products';
import BuyerProductDetail from './buyer/pages/ProductDetail';
import BuyerCheckout from './buyer/pages/Checkout';
import BuyerOrders from './buyer/pages/Orders';
import BuyerProfile from './buyer/pages/Profile';
import BuyerLogin from './buyer/pages/Login';
import BuyerRegister from './buyer/pages/Register';
import BuyerCart from './buyer/pages/Cart';

// Admin pages
import AdminDashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';

// Seller pages
import SellerDashboard from './seller/pages/Dashboard';
import SellerOrders from './seller/pages/Orders';

export default function App() {
  return (
    <Routes>
      {/* Buyer routes */}
      <Route path="/" element={<BuyerLayout><BuyerHome /></BuyerLayout>} />
      <Route path="/products" element={<BuyerLayout><BuyerProducts /></BuyerLayout>} />
      <Route path="/products/:id" element={<BuyerLayout><BuyerProductDetail /></BuyerLayout>} />
      <Route path="/checkout" element={<BuyerLayout><BuyerCheckout /></BuyerLayout>} />
      <Route path="/orders" element={<BuyerLayout><BuyerOrders /></BuyerLayout>} />
      <Route path="/profile" element={<BuyerLayout><BuyerProfile /></BuyerLayout>} />
      <Route path="/login" element={<BuyerLayout><BuyerLogin /></BuyerLayout>} />
      <Route path="/register" element={<BuyerLayout><BuyerRegister /></BuyerLayout>} />
      <Route path="/cart" element={<BuyerLayout><BuyerCart /></BuyerLayout>} />

      {/* Seller routes */}
      <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerDashboard /></SellerLayout></ProtectedRoute>} />
      <Route path="/seller/orders" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerOrders /></SellerLayout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />

      {/* Picker/Shipper routes */}
      <Route path="/picker" element={<ProtectedRoute roles={['picker','shipper']}><PickerLayout><div>Trang picker</div></PickerLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}