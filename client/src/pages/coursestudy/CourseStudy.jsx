import React, { useEffect, useState } from "react";
import "./courseStudy.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../config";
import axios from "axios";

const CourseStudy = ({ user }) => {
  const params = useParams();
  const { fetchCourse, course } = CourseData();
  const navigate = useNavigate();
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [loading, setLoading] = useState(true);

  if (user && user.role !== "admin" && !user.subscription.includes(params.id))
    return navigate("/");

  useEffect(() => {
    fetchCourse(params.id);
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!course || !course.lectures) return;

      try {
        const { data } = await axios.get(
          `${server}/api/user/progress?course=${params.id}`,
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );

        const total = course.lectures.length;
        setTotalLectures(total);
        
        if (data.message === "null" || !data.progress || !data.progress[0]) {
          setCompletedCount(0);
        } else {
          const completedLectures = data.progress[0].completedLectures || [];
          setCompletedCount(completedLectures.length);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
        setCompletedCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (course && course.lectures) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [course, params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {course && (
        <div className="course-study-page">
          <img src={`${server}/uploads/lectures/${course.image}`} alt="" width={350} />
          <h2>{course.title}</h2>
          <h4>{course.description}</h4>
          <h5>by - {course.createdBy}</h5>
          <h5>Duration - {course.duration} weeks</h5>
          <div className="course-actions">
            {user?.role === "admin" ? (
              <>
                <Link to={`/lectures/${course._id}`} className="common-btn">
                  Manage Lectures
                </Link>
                <Link to={`/course/${course._id}/assessment/create`} className="common-btn">
                  Manage Assessment
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={`/lectures/${course._id}`} 
                  className={`common-btn ${completedCount === totalLectures && totalLectures > 0 ? 'completed' : ''}`}
                >
                  View Lectures
                </Link>
                <Link to={`/course/${course._id}/assessment`} className="common-btn">
                  Take Assessment
                </Link>
                <Link to={`/course/${course._id}/certificate`} className="common-btn">
                  View Certificate
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CourseStudy;
