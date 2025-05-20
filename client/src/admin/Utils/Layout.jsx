import React from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const Layout = ({ children }) => {
  return (
    <div className="admin-layout" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f5f5f5"
    }}>
      <AdminHeader />
      <div style={{
        display: "flex",
        flex: 1
      }}>
        <AdminSidebar />
        <main style={{
          flex: 1,
          padding: "2rem",
          marginLeft: "250px", // Width of sidebar
          maxWidth: "calc(100% - 250px)",
          width: "100%"
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
