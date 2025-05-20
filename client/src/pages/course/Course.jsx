import { Link } from "react-router-dom";

// Inside the JSX, add these buttons where appropriate
{user && user.role === "admin" && (
  <Link to={`/course/${course._id}/assessment/create`} className="common-btn">
    Create Assessment
  </Link>
)}

{user && user.role !== "admin" && (
  <Link to={`/course/${course._id}/assessment`} className="common-btn">
    Take Assessment
  </Link>
)} 