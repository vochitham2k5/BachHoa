import React from 'react';

const ShipperBottomBar = () => {
  return (
    <div className="d-md-none position-fixed bottom-0 start-0 end-0 bg-white border-top p-2 d-flex justify-content-around" style={{ zIndex: 1030 }}>
      <button className="btn btn-primary">Nhận</button>
      <button className="btn btn-outline-secondary">Điều hướng</button>
      <button className="btn btn-outline-secondary">Gọi KH</button>
    </div>
  );
};

export default ShipperBottomBar;
