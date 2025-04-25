import React, { useState, useEffect } from "react";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import { FaPlus, FaSave, FaTrash, FaTimes } from "react-icons/fa";
import './CreateAssessment.css';

const CreateAssessment = ({ courseId, assessment, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimit: 60,
    passingScore: 70,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  useEffect(() => {
    if (assessment) {
      setFormData({
        title: assessment.title || "",
        description: assessment.description || "",
        timeLimit: assessment.timeLimit || 60,
        passingScore: assessment.passingScore || 70,
        questions: assessment.questions || [{
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        }],
      });
    }
  }, [assessment]);

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      if (field === "options") {
        newQuestions[index].options = value;
      } else {
        newQuestions[index][field] = value;
      }
      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Always use the same endpoint, the backend will handle create/update based on if assessment exists
      const endpoint = `${server}/api/assessment/course/${courseId}`;
      
      const method = assessment ? 'put' : 'post';

      const { data } = await axios[method](
        endpoint,
        formData,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        onSuccess(data.assessment);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${assessment ? 'update' : 'create'} assessment`);
    }
  };

  return (
    <div className="create-assessment-form">
      <div className="form-header">
        <h3>{assessment ? 'Edit Assessment' : 'Create New Assessment'}</h3>
        <button className="close-btn" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="Enter assessment title"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            placeholder="Enter assessment description"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Time Limit (minutes)</label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label>Passing Score (%)</label>
            <input
              type="number"
              value={formData.passingScore}
              onChange={(e) => setFormData(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
              min="0"
              max="100"
              required
            />
          </div>
        </div>

        <div className="questions-section">
          <h4>Questions</h4>
          {formData.questions.map((q, qIndex) => (
            <div key={qIndex} className="question-item">
              <div className="question-header">
                <h5>Question {qIndex + 1}</h5>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    className="remove-question-btn"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <div className="form-group">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  required
                  placeholder="Enter your question"
                />
              </div>

              <div className="options-grid">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-item">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...q.options];
                        newOptions[oIndex] = e.target.value;
                        updateQuestion(qIndex, "options", newOptions);
                      }}
                      required
                      placeholder={`Option ${oIndex + 1}`}
                    />
                    <div className="correct-answer">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                      />
                      <label>Correct</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="add-question-btn"
            onClick={addQuestion}
          >
            <FaPlus /> Add Question
          </button>
          <div className="right-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              <FaSave /> {assessment ? 'Update' : 'Create'} Assessment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAssessment; 