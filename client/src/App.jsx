import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import Home from "./pages/home/Home";
import Header from "./components/header/Header";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import Footer from "./components/footer/Footer";
import About from "./pages/about/About";
import Account from "./pages/account/Account";
import { UserData } from "./context/UserContext";
import Loading from "./components/Loading";
import Courses from "./pages/courses/Courses";
import CourseDescription from "./pages/coursedescription/CourseDescription";
import PaymentSuccess from "./pages/paymentsuccess/PaymentSuccess";
import Dashbord from "./pages/dashbord/Dashbord";
import CourseStudy from "./pages/coursestudy/CourseStudy";
import Lecture from "./pages/lecture/Lecture";
import AdminDashbord from "./admin/Dashboard/AdminDashbord";
import AdminCourses from "./admin/Courses/AdminCourses";
import AdminUsers from "./admin/Users/AdminUsers";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CourseForm from "./admin/Courses/AddCourse";
import CreateAssessment from "./admin/Assessment/CreateAssessment";
import AssessmentManager from "./admin/Assessment/AssessmentManager";
import TakeAssessment from "./pages/assessment/TakeAssessment";
import ProtectedRoute from "./components/ProtectedRoute";
import Certificate from "./pages/certificate/Certificate";
import AdminRoute from "./components/AdminRoute";
import AdminProfile from './admin/Profile/AdminProfile';
import AdminLectureManager from './admin/Lectures/AdminLectureManager';
import CourseDetailedDescription from "./pages/coursedescription/CourseDetailedDescription";

// Wrapper component to conditionally render Header and Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLecturePage = location.pathname.startsWith('/lectures/');

  return (
    <>
      {!isAdminRoute && !isLecturePage && <Header isAuth={true} />}
      {children}
      {!isAdminRoute && <Footer />}
    </>
  );
};

// Create a wrapper component for the course study route
const CourseStudyWrapper = ({ user }) => {
  const params = useParams();
  
  if (!user) return <Navigate to="/login" />;
  
  if (user.role === "admin") {
    return <Navigate to={`/admin/course/study/${params.id}`} />;
  }
  
  return <CourseStudy user={user} />;
};

// Create a wrapper component for the lecture route
const LectureRouteWrapper = ({ user }) => {
  const params = useParams();
  
  if (!user) return <Navigate to="/login" />;
  
  if (user.role === "admin") {
    return <Navigate to={`/admin/lectures/${params.id}`} />;
  }
  
  return <Lecture user={user} />;
};

const App = () => {
  const { isAuth, user, loading } = UserData();

  if (loading) {
    return <Loading />;
  }

  // Redirect admin to admin dashboard if trying to access non-admin routes
  if (isAuth && user?.role === "admin" && !window.location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Home route with admin protection */}
          <Route 
            path="/" 
            element={
              isAuth && user?.role === "admin" ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Home />
              )
            } 
          />

          {/* Other public routes */}
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={isAuth ? <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/"} /> : <Login />} />
          <Route path="/register" element={isAuth ? <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/"} /> : <Register />} />
          <Route path="/verify" element={isAuth ? <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/"} /> : <Verify />} />
            <Route
              path="/account"
              element={isAuth ? <Account user={user} /> : <Login />}
            />
            <Route
              path="/course/:id/details"
              element={<CourseDetailedDescription />}
            />
            <Route
              path="/course/:id"
              element={<Navigate to="/course/:id/details" replace />}
            />
            <Route
              path="/payment-success"
              element={<PaymentSuccess user={user} />}
            />
            <Route
              path="/dashboard"
              element={isAuth ? <Dashbord user={user} /> : <Login />}
            />
            <Route
              path="/course/study/:id"
            element={isAuth ? <CourseStudyWrapper user={user} /> : <Login />}
          />
          <Route
            path="/admin/course/study/:id"
            element={
              <AdminRoute>
                <CourseStudy user={user} isAdminView={true} />
              </AdminRoute>
            }
            />
            <Route
              path="/lectures/:id"
            element={isAuth ? <LectureRouteWrapper user={user} /> : <Login />}
          />
          <Route
            path="/admin/lectures/:id"
            element={
              <AdminRoute>
                <AdminLectureManager />
              </AdminRoute>
            }
            />
            <Route
              path="/admin/dashboard"
              element={
              <AdminRoute>
                <AdminDashbord user={user} />
              </AdminRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
              <AdminRoute>
                <AdminCourses user={user} />
              </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
              <AdminRoute>
                <AdminUsers user={user} />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
              }
            />
          <Route
            path="/admin/course/new"
            element={
              <AdminRoute>
                <CourseForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/course/edit/:id"
            element={
              <AdminRoute>
                <CourseForm />
              </AdminRoute>
            }
          />
          <Route
            path="/forgot"
            element={isAuth ? <Home /> : <ForgotPassword />}
          />
          <Route
            path="/reset"
            element={isAuth ? <Home /> : <ResetPassword />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/course/:courseId/assessment"
            element={
              <ProtectedRoute>
                <TakeAssessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/course/:courseId/assessment"
            element={
              <AdminRoute>
                <AssessmentManager />
              </AdminRoute>
            }
          />
          <Route path="/course/:courseId/certificate" element={<Certificate />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
