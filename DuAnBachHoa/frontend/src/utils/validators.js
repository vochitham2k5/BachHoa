export const vnPhoneRegex = /^(0|\+84)[1-9]\d{8,9}$/;

export function validateRegistration({ fullName, email, phone, password, confirmPassword, roleChoice, ...rest }) {
  const errors = {};
  if (!fullName || fullName.length < 2) errors.fullName = 'Họ tên tối thiểu 2 ký tự';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) errors.email = 'Email không hợp lệ';
  if (!vnPhoneRegex.test(phone || '')) errors.phone = 'Số điện thoại VN không hợp lệ';
  if (!password || password.length < 8) errors.password = 'Mật khẩu tối thiểu 8 ký tự';
  if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  if (!['BUYER','SELLER','SHIPPER'].includes(roleChoice)) errors.roleChoice = 'Vui lòng chọn vai trò';

  // Role-specific KYC checks (front-end only)
  const maxSize = 5 * 1024 * 1024; // 5MB
  const checkFile = (f) => f && f.size > maxSize ? 'Tệp quá lớn, giới hạn 5MB' : null;
  if (roleChoice === 'SELLER') {
    if (!rest.shopName) errors.shopName = 'Vui lòng nhập tên cửa hàng';
    if (!rest.shopCategory) errors.shopCategory = 'Vui lòng chọn danh mục chính';
    if (!rest.shopAddress) errors.shopAddress = 'Vui lòng nhập địa chỉ kho';
    if (!rest.bankName) errors.bankName = 'Vui lòng nhập tên ngân hàng';
    if (!rest.bankAccount) errors.bankAccount = 'Vui lòng nhập số tài khoản';
    if (!rest.acceptTerms) errors.acceptTerms = 'Cần đồng ý điều khoản';
    const lf = checkFile(rest.licenseImageFile); if (lf) errors.licenseImageFile = lf;
    const idf = checkFile(rest.idCardFrontFile); if (idf) errors.idCardFrontFile = idf;
    const idb = checkFile(rest.idCardBackFile); if (idb) errors.idCardBackFile = idb;
    const logo = rest.logoFile ? checkFile(rest.logoFile) : null; if (logo) errors.logoFile = logo;
  }
  if (roleChoice === 'SHIPPER') {
    if (!rest.vehicleType) errors.vehicleType = 'Vui lòng chọn loại phương tiện';
    if (!rest.plateNumber) errors.plateNumber = 'Vui lòng nhập biển số';
    if (!rest.activeArea) errors.activeArea = 'Vui lòng nhập khu vực hoạt động';
    if (!rest.acceptTerms) errors.acceptTerms = 'Cần đồng ý điều khoản';
    const lf = checkFile(rest.licenseImageFile); if (lf) errors.licenseImageFile = lf;
    const idf = checkFile(rest.idCardFrontFile); if (idf) errors.idCardFrontFile = idf;
    const idb = checkFile(rest.idCardBackFile); if (idb) errors.idCardBackFile = idb;
    const pf = checkFile(rest.profilePhotoFile); if (pf) errors.profilePhotoFile = pf;
    const vf = checkFile(rest.vehiclePhotoFile); if (vf) errors.vehiclePhotoFile = vf;
  }
  return errors;
}
