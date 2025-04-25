import React from "react";
import { UserData } from "../../context/UserContext";
import { Navigate } from "react-router-dom";
import UserLecture from "./UserLecture";

const Lecture = () => {
  const { user } = UserData();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect admin users to the new lecture management page
  if (user.role === "admin") {
    return <Navigate to={`/admin/lectures/${window.location.pathname.split('/').pop()}`} />;
  }

  return <UserLecture />;
};

export default Lecture;