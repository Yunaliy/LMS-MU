import React from "react";
import { Navigate } from "react-router-dom";
import { UserData } from "../context/UserContext";

const ProtectedRoute = ({ children }) => {
  const { isAuth, user } = UserData();

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute; 