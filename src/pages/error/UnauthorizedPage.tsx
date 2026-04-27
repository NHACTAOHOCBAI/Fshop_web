import React from "react";

const UnauthorizedPage = () => (
  <div style={{ textAlign: "center", marginTop: 80 }}>
    <h1 style={{ fontSize: 64, color: "#ff4d4f" }}>401</h1>
    <h2>Bạn không có quyền truy cập trang này.</h2>
    <p>Vui lòng liên hệ quản trị viên hoặc đăng nhập bằng tài khoản phù hợp.</p>
  </div>
);

export default UnauthorizedPage;
