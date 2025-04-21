import React, { useState } from "react";
import "./header.css";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdAccountCircle } from "react-icons/md";
import { UserData } from "../../context/UserContext";
import { server } from "../../config";
import Notification from "../Notification";

const Header = ({ isAuth }) => {
  const { user } = UserData();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = null;
    e.target.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.innerHTML = '<MdAccountCircle size={32} color="#757575" />';
    e.target.parentNode.appendChild(fallback);
  };

  return (
    <header className="main-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/" className="logo-link">
              <img
                src="logo3.png"
                alt="Medinatul Uloom Logo"
                className="img-fluid"
                style={{ maxWidth: "200px" }}
              />
            </Link>
          </div>

          <nav className="main-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            <Link to="/about" className="nav-link">About</Link>
            
            {isAuth ? (
              <Link 
                to="/account" 
                className="nav-link profile-link"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="header-avatar">
                  {user?.image ? (
                    <img 
                      src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`||"https://cdn-icons-png.flaticon.com/128/1077/1077114.png"}
                      alt={user.name}
                      onError={handleImageError}
                    />
                  ) : (
                    <MdAccountCircle 
                      size={32} 
                      color="#757575"
                    />
                  )}
                </div>
                {showTooltip && (
                  <div className="profile-tooltip">
                    {user?.name || "User"}
                    <div className="tooltip-arrow"></div>
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
            {user && <Notification user={user} />}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
// import React, { useState } from "react";
// import "./header.css";
// import { Link } from "react-router-dom";
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { MdAccountCircle } from "react-icons/md";
// import { UserData } from "../../context/UserContext";
// import { server } from "../../config";
// import Notification from "../Notification";


// const Header = ({ isAuth}) => {
//   const { user } = UserData();
//   const [showTooltip, setShowTooltip] = useState(false);

//   return (
//     <header className="main-header">
//       <div className="container">
//         <div className="header-content">
//           <div className="logo">
//             <Link to="/" className="logo-link">
//              <img
//                     src="logo3.png"
//                     alt="Medinatul Uloom Logo"
//                     className="img-fluid"
//                     style={{ maxWidth: "200px" }}
//                   />
//             </Link>
//           </div>


//           <nav className="main-nav">
//             <Link to="/" className="nav-link">Home</Link>
//             <Link to="/courses" className="nav-link">Courses</Link>
//             <Link to="/about" className="nav-link">About</Link>
            
//             {isAuth ? (
//               <Link 
//                 to="/account" 
//                 className="nav-link profile-link"
//                 onMouseEnter={() => setShowTooltip(true)}
//                 onMouseLeave={() => setShowTooltip(false)}
//               >
//                 <div className="header-avatar">
//                   {user?.image ? (
//                     <img 
//                       src={`${server}/uploads/profiles/${user.image}`}
//                       alt={user.name}
//                       onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src = null;
//                         e.target.style.display = 'none';
//                         e.target.parentElement.innerHTML = '<div class="avatar-fallback"><MdAccountCircle size={32} color="#757575" /></div>';
//                       }}
//                     />
//                   ) : (
//                     <MdAccountCircle 
//                       size={32} 
//                       color="#757575"
//                     />
//                   )}
//                 </div>
//                 {showTooltip && (
//                   <div className="profile-tooltip">
//                     {user?.name || "User"}
//                     <div className="tooltip-arrow"></div>
//                   </div>
//                 )}
//               </Link>
//             ) : (
//               <Link to="/login" className="nav-link">Login</Link>
//             )}
//             {user && <Notification user={user} />}
//           </nav>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
