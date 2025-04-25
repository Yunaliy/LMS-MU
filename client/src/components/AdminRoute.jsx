import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserData } from "../context/UserContext";

const AdminRoute = ({ children }) => {
  const { isAuth, user } = UserData();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  // If not admin, redirect to home
  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  // If admin tries to access home page or non-admin routes, redirect to admin dashboard
  if (location.pathname === "/" || !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

export default AdminRoute; 