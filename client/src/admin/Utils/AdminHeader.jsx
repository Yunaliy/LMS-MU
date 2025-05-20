import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAccountCircle, MdLogout } from "react-icons/md";
import { UserData } from "../../context/UserContext";
import { server } from "../../config";

const AdminHeader = () => {
  const { user, setIsAuth, setUser } = UserData();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="admin-header" style={{
      backgroundColor: "var(--secondary-color)",
      padding: "1rem",
      color: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 1rem"
      }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Medinetul Uloom</h1>

        <div style={{ position: "relative" }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {user?.image ? (
              <img 
                src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`}
                alt={user.name}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : (
              <MdAccountCircle size={32} color="white" />
            )}
            <span>{user?.name}</span>
          </div>

          {showDropdown && (
            <div style={{
              position: "absolute",
              top: "100%",
              right: 0,
              backgroundColor: "white",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "0.5rem",
              minWidth: "200px",
              zIndex: 1000
            }}>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "none",
                  background: "none",
                  color: "#dc3545",
                  cursor: "pointer"
                }}
              >
                <MdLogout />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; 