import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './user/layout/UserLayout';
import AdminLayout from './admin/layout/AdminLayout';
import SellerLayout from './seller/layout/SellerLayout';
import BuyerLayout from './buyer/layout/BuyerLayout';
import PickerLayout from './picker/layout/PickerLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import ShipmentsPage from './picker/pages/Shipments';

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
import AdminUsers from './admin/pages/Users';
import AdminAuditLogs from './admin/pages/AuditLogs';

// Seller pages
import SellerDashboard from './seller/pages/Dashboard';
import SellerOrders from './seller/pages/Orders';
import SellerProducts from './seller/pages/Products';
import BuyerAddresses from './buyer/pages/Addresses';
import SellerOnboarding from './buyer/pages/SellerOnboarding';
import AdminSellers from './admin/pages/Sellers';
import SellerReviews from './seller/pages/Reviews';
import AdminShipments from './admin/pages/Shipments';

export default function App() {
  return (
    <Routes>
      {/* Buyer routes */}
      <Route path="/" element={<BuyerLayout><BuyerHome /></BuyerLayout>} />
      <Route path="/products" element={<BuyerLayout><BuyerProducts /></BuyerLayout>} />
      <Route path="/products/:id" element={<BuyerLayout><BuyerProductDetail /></BuyerLayout>} />
  <Route path="/checkout" element={<BuyerLayout><BuyerCheckout /></BuyerLayout>} />
  <Route path="/addresses" element={<ProtectedRoute roles={['buyer','admin','seller']}><BuyerLayout><BuyerAddresses /></BuyerLayout></ProtectedRoute>} />
      <Route path="/orders" element={<BuyerLayout><BuyerOrders /></BuyerLayout>} />
      <Route path="/profile" element={<BuyerLayout><BuyerProfile /></BuyerLayout>} />
  <Route path="/become-seller" element={<ProtectedRoute roles={['buyer','admin']}><BuyerLayout><SellerOnboarding /></BuyerLayout></ProtectedRoute>} />
      <Route path="/login" element={<BuyerLayout><BuyerLogin /></BuyerLayout>} />
      <Route path="/register" element={<BuyerLayout><BuyerRegister /></BuyerLayout>} />
      <Route path="/cart" element={<BuyerLayout><BuyerCart /></BuyerLayout>} />

      {/* Seller routes */}
      <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerDashboard /></SellerLayout></ProtectedRoute>} />
  <Route path="/seller/orders" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerOrders /></SellerLayout></ProtectedRoute>} />
  <Route path="/seller/products" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerProducts /></SellerLayout></ProtectedRoute>} />
  <Route path="/seller/reviews" element={<ProtectedRoute roles={['seller']}><SellerLayout><SellerReviews /></SellerLayout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
  <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
  <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
  <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminAuditLogs /></AdminLayout></ProtectedRoute>} />
  <Route path="/admin/shipments" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminShipments /></AdminLayout></ProtectedRoute>} />
  <Route path="/admin/sellers" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminSellers /></AdminLayout></ProtectedRoute>} />

      {/* Picker/Shipper routes */}
  <Route path="/picker" element={<ProtectedRoute roles={['picker','shipper']}><PickerLayout><div>Trang picker</div></PickerLayout></ProtectedRoute>} />
  <Route path="/picker/shipments" element={<ProtectedRoute roles={['picker','shipper']}><PickerLayout><ShipmentsPage /></PickerLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}