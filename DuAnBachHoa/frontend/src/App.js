/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Tab, Card, ListGroup, Table, Badge, Stack } from 'react-bootstrap';
import './App.css';
// import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BuyerLayout from './layouts/BuyerLayout';
import FilterPanel from './components/buyer/FilterPanel';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Auth/Profile';
import MyApplications from './pages/Auth/MyApplications';
import Home from './pages/Buyer/Home';
import ProductDetail from './pages/Buyer/ProductDetail';
import Shop from './pages/Buyer/Shop';
import BuyerChat from './pages/Buyer/Chat';
import Cart from './pages/Buyer/Cart';
import Checkout from './pages/Buyer/Checkout';
import OrdersBuyer from './pages/Buyer/Orders';
import SellerDashboard from './pages/Seller/Dashboard';
import SellerProducts from './pages/Seller/Products';
import SellerOrders from './pages/Seller/Orders';
import SellerApply from './pages/Seller/Apply';
import SellerVouchers from './pages/Seller/Vouchers';
import SellerProfile from './pages/Seller/Profile';
import SellerFinance from './pages/Seller/Finance';
import SellerLayout from './layouts/SellerLayout';
import SellerChat from './pages/Seller/Chat';
import AdminApplications from './pages/Admin/Applications';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminProducts from './pages/Admin/Products';
import AdminOrders from './pages/Admin/Orders';
import AdminReports from './pages/Admin/Reports';
import AdminSettings from './pages/Admin/Settings';
import AdminLayout from './layouts/AdminLayout';
import AuditLogs from './pages/Admin/AuditLogs';
import AdminSearch from './pages/Admin/Search';
// import ShipperTasks from './pages/Shipper/Tasks';
import ShipperDashboard from './pages/Shipper/Dashboard';
import ShipperNewOrders from './pages/Shipper/NewOrders';
import ShipperActiveOrders from './pages/Shipper/ActiveOrders';
import ShipperHistory from './pages/Shipper/History';
import ShipperProfile from './pages/Shipper/Profile';
import ShipperApply from './pages/Shipper/Apply';
import ShipperLayout from './layouts/ShipperLayout';

const overviewMatrix = [
  { entity: 'Buyer', role: 'Mua hàng, thanh toán, đánh giá', interface: 'React + React-Bootstrap', integration: 'API REST' },
  { entity: 'Seller', role: 'Quản lý gian hàng, sản phẩm, đơn', interface: 'React + React-Bootstrap', integration: 'API REST' },
  { entity: 'Admin', role: 'Quản trị, duyệt seller, sản phẩm, đơn', interface: 'React + React-Bootstrap', integration: 'API REST' },
  { entity: 'Shipper / Picker', role: 'Nhận, lấy, giao hàng', interface: 'React + React-Bootstrap (mobile-friendly)', integration: 'API REST' }
];

const buyerSections = [
  {
    title: '1️⃣ Đăng ký / Đăng nhập / Quên mật khẩu',
    items: [
      'Form đăng ký gồm tên, email, mật khẩu, số điện thoại',
      'Xác thực email bằng OTP hoặc token',
      'Đăng nhập với JWT và lưu token localStorage',
      'Đăng xuất làm sạch token',
      'Quên mật khẩu gửi email và reset password'
    ]
  },
  {
    title: '2️⃣ Trang chủ',
    items: [
      'Danh mục nổi bật và sản phẩm bán chạy',
      'Banner khuyến mãi từ backend',
      'Tìm kiếm sản phẩm toàn hệ thống'
    ]
  },
  {
    title: '3️⃣ Danh mục và tìm kiếm',
    items: [
      'Duyệt danh mục sản phẩm',
      'Lọc theo giá, thương hiệu, đánh giá',
      'Sắp xếp theo mới nhất, giá tăng giảm, phổ biến',
      'Gợi ý sản phẩm liên quan'
    ]
  },
  {
    title: '4️⃣ Chi tiết sản phẩm',
    items: [
      'Hiển thị carousel hình ảnh',
      'Giá gốc, giá khuyến mãi và tồn kho',
      'Mô tả chi tiết và đánh giá',
      'Nút thêm vào giỏ và gợi ý sản phẩm tương tự'
    ]
  },
  {
    title: '5️⃣ Giỏ hàng',
    items: [
      'Thêm hoặc xóa sản phẩm',
      'Cập nhật số lượng theo thời gian thực',
      'Chọn sản phẩm để thanh toán',
      'Áp dụng voucher và mã giảm giá'
    ]
  },
  {
    title: '6️⃣ Thanh toán',
    items: [
      'Chọn hoặc nhập địa chỉ giao hàng',
      'Chọn phương thức COD, Momo, ZaloPay, VNPay',
      'Hiển thị tóm tắt đơn hàng',
      'Đặt hàng với POST /orders và nhận thông báo xác nhận'
    ]
  },
  {
    title: '7️⃣ Đơn hàng',
    items: [
      'Danh sách đơn hàng và chi tiết gồm sản phẩm, shipper, thanh toán',
      'Theo dõi trạng thái Đã xác nhận, Đang giao, Đã giao',
      'Hủy đơn khi chưa giao',
      'Đánh giá sản phẩm sau khi hoàn tất'
    ]
  },
  {
    title: '8️⃣ Tài khoản',
    items: [
      'Cập nhật thông tin cá nhân và quản lý địa chỉ',
      'Xem lịch sử mua hàng',
      'Đổi mật khẩu',
      'Nút đăng ký bán hàng chuyển sang Seller Application'
    ]
  },
  {
    title: '9️⃣ Thông báo',
    items: [
      'Thông báo trạng thái đơn hàng',
      'Thông báo khuyến mãi',
      'Push notification qua web hoặc email'
    ]
  }
];

const sellerSections = [
  {
    title: '1️⃣ Đăng ký bán hàng',
    items: [
      'Buyer gửi yêu cầu trở thành Seller',
      'Form KYC gồm tên cửa hàng, giấy phép, địa chỉ, tài khoản ngân hàng',
      'Upload giấy phép kinh doanh',
      'POST /seller/apply tạo yêu cầu chờ duyệt',
      'Thông báo trạng thái đang chờ duyệt và chuyển role sau khi được approve'
    ]
  },
  {
    title: '2️⃣ Dashboard',
    items: [
      'Tổng quan doanh thu, đơn hàng và sản phẩm đang bán',
      'Đơn hàng trong ngày và doanh số theo tháng',
      'Biểu đồ doanh thu dạng bar hoặc line'
    ]
  },
  {
    title: '3️⃣ Quản lý sản phẩm',
    items: [
      'Thêm sản phẩm với tên, mô tả, hình ảnh, giá, tồn kho, danh mục',
      'Chỉnh sửa và xóa sản phẩm',
      'Theo dõi trạng thái phê duyệt pending, approved, rejected',
      'Tìm kiếm, lọc sản phẩm và quản lý tồn kho'
    ]
  },
  {
    title: '4️⃣ Quản lý đơn hàng',
    items: [
      'Danh sách đơn theo trạng thái',
      'Chi tiết đơn gồm thông tin Buyer và địa chỉ',
      'Cập nhật xác nhận, từ chối, hoàn tất',
      'Giao đơn cho shipper nội bộ hoặc hệ thống',
      'In hóa đơn PDF'
    ]
  },
  {
    title: '5️⃣ Quản lý khuyến mãi',
    items: [
      'Tạo mã giảm giá riêng cho cửa hàng',
      'Thiết lập giới hạn thời gian và số lượng',
      'Tạm ngưng hoặc xóa voucher'
    ]
  },
  {
    title: '6️⃣ Quản lý doanh thu',
    items: [
      'Xem doanh thu theo ngày hoặc tháng',
      'Chi tiết từng giao dịch',
      'Rút tiền về tài khoản ngân hàng',
      'Xuất báo cáo Excel hoặc PDF'
    ]
  },
  {
    title: '7️⃣ Chat với khách hàng',
    items: [
      'Tích hợp chat realtime bằng WebSocket hoặc Socket.io',
      'Trao đổi về sản phẩm và đơn hàng'
    ]
  },
  {
    title: '8️⃣ Quản lý đánh giá',
    items: [
      'Xem feedback của khách',
      'Trả lời hoặc khiếu nại đánh giá sai lệch'
    ]
  }
];

const adminSections = [
  {
    title: '1️⃣ Đăng nhập quản trị',
    items: [
      'Đăng nhập bằng tài khoản Admin với JWT riêng',
      'Bảo vệ chống truy cập trái phép'
    ]
  },
  {
    title: '2️⃣ Dashboard',
    items: [
      'Tổng số Buyer, Seller, Shipper',
      'Doanh thu toàn sàn',
      'Đơn hàng trong ngày và tháng',
      'Biểu đồ doanh số, Top Seller, Top Buyer'
    ]
  },
  {
    title: '3️⃣ Quản lý Seller',
    items: [
      'Danh sách yêu cầu đăng ký',
      'Duyệt hoặc từ chối seller',
      'Cập nhật trạng thái active, banned',
      'Xem thông tin chi tiết cửa hàng'
    ]
  },
  {
    title: '4️⃣ Quản lý sản phẩm',
    items: [
      'Duyệt sản phẩm mới',
      'Kiểm tra mô tả và hình ảnh',
      'Gỡ sản phẩm vi phạm',
      'Tìm kiếm theo seller'
    ]
  },
  {
    title: '5️⃣ Quản lý người dùng',
    items: [
      'Danh sách Buyer, Seller, Shipper',
      'Khóa tài khoản vi phạm',
      'Cấp quyền admin phụ',
      'Xem hoạt động gần đây'
    ]
  },
  {
    title: '6️⃣ Quản lý đơn hàng',
    items: [
      'Theo dõi toàn bộ đơn hàng',
      'Tìm kiếm theo trạng thái, seller, buyer',
      'Hỗ trợ hoàn tiền và xử lý khiếu nại'
    ]
  },
  {
    title: '7️⃣ Quản lý thanh toán',
    items: [
      'Theo dõi giao dịch Momo, VNPay',
      'Duyệt yêu cầu rút tiền',
      'Thống kê tổng giao dịch'
    ]
  },
  {
    title: '8️⃣ Quản lý banner và khuyến mãi',
    items: [
      'Tạo và chỉnh sửa banner',
      'Quản lý chương trình giảm giá chung',
      'Lên lịch hiển thị banner'
    ]
  },
  {
    title: '9️⃣ Báo cáo và thống kê',
    items: [
      'Doanh thu toàn sàn và theo danh mục',
      'Tỷ lệ đơn thành công và hủy',
      'Báo cáo Seller hoặc Buyer vi phạm',
      'Xuất Excel hoặc PDF'
    ]
  },
  {
    title: '🔟 Hệ thống và log',
    items: [
      'Ghi log hoạt động duyệt, xóa, sửa',
      'Sao lưu dữ liệu',
      'Quản lý cấu hình hệ thống'
    ]
  }
];

const shipperSections = [
  {
    title: '1️⃣ Đăng nhập và nhận đơn',
    items: [
      'Đăng nhập bằng tài khoản shipper',
      'Xem danh sách đơn chờ giao',
      'Nhận đơn và assign cho shipper'
    ]
  },
  {
    title: '2️⃣ Xác nhận lấy hàng',
    items: [
      'Quét barcode cho picker',
      'Xác nhận lấy đủ hàng',
      'Báo cáo thiếu hoặc hư hỏng'
    ]
  },
  {
    title: '3️⃣ Giao hàng',
    items: [
      'Cập nhật trạng thái Đang lấy, Đang giao, Giao thành công hoặc thất bại',
      'Ghi chú lý do giao thất bại',
      'Xem bản đồ định vị GPS'
    ]
  },
  {
    title: '4️⃣ Lịch sử giao hàng',
    items: [
      'Danh sách đơn đã giao',
      'Thống kê tổng đơn và thu nhập',
      'Xuất báo cáo ngày hoặc tuần'
    ]
  }
];

const supportModules = [
  {
    title: 'Payment Module',
    items: [
      'Thanh toán Momo, VNPay, ZaloPay',
      'Ghi nhận transaction và trạng thái thanh toán',
      'Hoàn tiền khi cần'
    ]
  },
  {
    title: 'Notification Module',
    items: [
      'Email thông báo seller được duyệt',
      'Push notification khi đơn thay đổi',
      'Hỗ trợ SMS'
    ]
  },
  {
    title: 'Review Module',
    items: [
      'Buyer đánh giá sản phẩm',
      'Seller phản hồi',
      'Admin kiểm duyệt khi có khiếu nại'
    ]
  },
  {
    title: 'Support Module',
    items: [
      'Trung tâm hỗ trợ khách hàng',
      'Ticket và chat với Admin'
    ]
  }
];

const backendStructure = `backend/\n├── src/\n│   ├── modules/\n│   │   ├── auth/\n│   │   │   ├── auth.controller.js\n│   │   │   ├── auth.service.js\n│   │   │   └── auth.routes.js\n│   │   ├── buyer/\n│   │   ├── seller/\n│   │   ├── admin/\n│   │   ├── shipper/\n│   │   ├── product/\n│   │   ├── order/\n│   │   ├── payment/\n│   │   ├── notification/\n│   │   └── review/\n│   ├── middleware/\n│   ├── config/\n│   └── server.js`;

const frontendStructure = `src/\n├── components/\n│   ├── Navbar.jsx\n│   ├── Footer.jsx\n│   ├── ProductCard.jsx\n│   └── Loader.jsx\n├── pages/\n│   ├── Buyer/\n│   ├── Seller/\n│   ├── Admin/\n│   ├── Shipper/\n│   └── Auth/\n├── contexts/\n├── services/\n├── utils/\n└── App.js`;

const summaryTable = [
  { group: 'Buyer', main: '9', sub: '~45' },
  { group: 'Seller', main: '8', sub: '~40' },
  { group: 'Admin', main: '10', sub: '~50' },
  { group: 'Shipper', main: '4', sub: '~20' }
];

const SectionList = ({ sections }) => (
  <Stack gap={3}>
    {sections.map(section => (
      <Card className="shadow-sm" key={section.title}>
        <Card.Body>
          <Card.Title>{section.title}</Card.Title>
          <ListGroup variant="flush">
            {section.items.map(item => (
              <ListGroup.Item key={item}>{item}</ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    ))}
  </Stack>
);

const OverviewSection = () => (
  <Stack gap={3}>
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>⚙️ Tổng quan hệ thống</Card.Title>
        <Table striped bordered hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Thành phần</th>
              <th>Vai trò</th>
              <th>Giao diện</th>
              <th>Kết nối</th>
            </tr>
          </thead>
          <tbody>
            {overviewMatrix.map(item => (
              <tr key={item.entity}>
                <td><Badge bg="primary">{item.entity}</Badge></td>
                <td>{item.role}</td>
                <td>{item.interface}</td>
                <td>{item.integration}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>🧮 Thống kê tổng quan</Card.Title>
        <ListGroup variant="flush">
          <ListGroup.Item>Buyer, Seller, Admin, Shipper có dashboard độc lập</ListGroup.Item>
          <ListGroup.Item>Một form đăng ký dùng chung với phân nhánh role</ListGroup.Item>
          <ListGroup.Item>Seller và Shipper chờ Admin duyệt trước khi active</ListGroup.Item>
          <ListGroup.Item>Kết nối backend qua API REST cho toàn bộ module</ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  </Stack>
);

const ArchitectureSection = () => (
  <Stack gap={3}>
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>🧰 Backend structure</Card.Title>
        <pre className="code-block">{backendStructure}</pre>
      </Card.Body>
    </Card>
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>🧩 Frontend structure</Card.Title>
        <pre className="code-block">{frontendStructure}</pre>
      </Card.Body>
    </Card>
  </Stack>
);

const SupportSection = () => (
  <SectionList sections={supportModules} />
);

const SummarySection = () => (
  <Stack gap={3}>
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>✅ Tổng kết</Card.Title>
        <Table striped bordered hover responsive className="mb-3">
          <thead>
            <tr>
              <th>Nhóm</th>
              <th>Số lượng chức năng chính</th>
              <th>Số lượng chức năng con</th>
            </tr>
          </thead>
          <tbody>
            {summaryTable.map(row => (
              <tr key={row.group}>
                <td>{row.group}</td>
                <td>{row.main}</td>
                <td>{row.sub}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <ListGroup variant="flush">
          <ListGroup.Item>Buyer sử dụng app khách hàng để mua sắm và thanh toán</ListGroup.Item>
          <ListGroup.Item>Seller quản lý gian hàng, đơn, khuyến mãi và tài chính</ListGroup.Item>
          <ListGroup.Item>Admin kiểm soát toàn bộ hệ thống, báo cáo và cấu hình</ListGroup.Item>
          <ListGroup.Item>Shipper đảm nhận luồng nhận, lấy và giao hàng</ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  </Stack>
);

function AppShell() {
  const location = useLocation();
  const isBuyerRoute = location.pathname === '/' || location.pathname.startsWith('/buyer') || location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout') || location.pathname.startsWith('/shop') || location.pathname.startsWith('/chat');
  const isAdminRoute = location.pathname.startsWith('/admin');
  return (
    <>
      {/* Removed global Navbar to avoid empty top bar */}
      <Routes>
          <Route index element={<BuyerLayout><Home /></BuyerLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/applications/status" element={<MyApplications />} />

          {/* Buyer */}
          <Route path="/buyer/products" element={<BuyerLayout sidebar={<FilterPanel />}><Home /></BuyerLayout>} />
          <Route path="/buyer/products/:id" element={<BuyerLayout><ProductDetail /></BuyerLayout>} />
          <Route path="/shop/:sellerId" element={<BuyerLayout><Shop /></BuyerLayout>} />
          <Route path="/chat/:sellerId" element={<BuyerLayout><BuyerChat /></BuyerLayout>} />
          <Route path="/cart" element={<BuyerLayout><Cart /></BuyerLayout>} />
          <Route path="/checkout" element={<BuyerLayout><Checkout /></BuyerLayout>} />
          <Route path="/buyer/orders" element={<BuyerLayout><OrdersBuyer /></BuyerLayout>} />

          {/* Seller */}
          <Route path="/seller" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerDashboard /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/products" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerProducts /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerOrders /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/vouchers" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerVouchers /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/finance" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerFinance /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/profile" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerProfile /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/chat" element={<ProtectedRoute roles={["SELLER"]}><SellerLayout><SellerChat /></SellerLayout></ProtectedRoute>} />
          <Route path="/seller/apply" element={<SellerApply />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute admin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute admin><AdminLayout><AdminApplications /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute admin><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute admin><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute admin><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute admin><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute admin><AdminLayout><AuditLogs /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/search" element={<ProtectedRoute admin><AdminLayout><AdminSearch /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute admin><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

          {/* Shipper */}
          <Route path="/shipper" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperDashboard /></ShipperLayout></ProtectedRoute>} />
          <Route path="/shipper/apply" element={<ShipperApply />} />
          <Route path="/shipper/new" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperNewOrders /></ShipperLayout></ProtectedRoute>} />
          <Route path="/shipper/active" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperActiveOrders /></ShipperLayout></ProtectedRoute>} />
          <Route path="/shipper/history" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperHistory /></ShipperLayout></ProtectedRoute>} />
          <Route path="/shipper/profile" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperProfile /></ShipperLayout></ProtectedRoute>} />
          {/* Legacy */}
          <Route path="/shipper/tasks" element={<ProtectedRoute roles={["SHIPPER"]}><ShipperLayout><ShipperActiveOrders /></ShipperLayout></ProtectedRoute>} />
      </Routes>
      {!isBuyerRoute && !isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
