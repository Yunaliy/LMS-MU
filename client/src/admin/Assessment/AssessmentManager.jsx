import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { server } from '../../config';
import toast from 'react-hot-toast';
import CreateAssessment from './CreateAssessment';
import Layout from '../Utils/Layout';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './CreateAssessment.css';

const AssessmentManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, [courseId]);

  const fetchAssessment = async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/assessment/course/${courseId}`,
        {
          headers: {
            token: localStorage.getItem('token'),
          },
        }
      );
      setAssessment(data.assessment);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Error fetching assessment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${server}/api/assessment/course/${courseId}`,
        {
          headers: {
            token: localStorage.getItem('token'),
          },
        }
      );
      toast.success('Assessment deleted successfully');
      setAssessment(null);
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting assessment');
    }
  };

  const handleSuccess = (updatedAssessment) => {
    setAssessment(updatedAssessment);
    setIsEditing(false);
    toast.success(assessment ? 'Assessment updated successfully' : 'Assessment created successfully');
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  if (isEditing || !assessment) {
    return (
      <Layout>
        <div className="assessment-view">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <CreateAssessment
            courseId={courseId}
            assessment={isEditing ? assessment : null}
            onSuccess={handleSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="assessment-view">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        
        <div className="assessment-header">
          <div className="assessment-title-section">
            <h2 className="assessment-title">{assessment.title}</h2>
            <p className="assessment-subtitle">Total Questions: {assessment.questions.length}</p>
          </div>
          <div className="assessment-actions">
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit
            </button>
            <button className="delete-btn" onClick={() => setShowDeleteDialog(true)}>
              <FaTrash /> Delete
            </button>
          </div>
        </div>

        <div className="assessment-info">
          <p><strong>Description:</strong> {assessment.description}</p>
          <p><strong>Time Limit:</strong> {assessment.timeLimit} minutes</p>
          <p><strong>Passing Score:</strong> {assessment.passingScore}%</p>
        </div>

        <h3>Questions</h3>
        <div className="question-list">
          {assessment.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-view">
              <h4>Question {qIndex + 1}</h4>
              <p>{question.question}</p>
              <ul className="options-list">
                {question.options.map((option, oIndex) => (
                  <li 
                    key={oIndex} 
                    className={`option-view ${question.correctAnswer === oIndex ? 'correct-option' : ''}`}
                  >
                    {option}
                    {question.correctAnswer === oIndex && ' (Correct Answer)'}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Assessment"
        message="Are you sure you want to delete this assessment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </Layout>
  );
};

export default AssessmentManager; 