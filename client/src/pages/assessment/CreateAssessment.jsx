import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";

const CreateAssessment = () => {
  const { courseId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === "options") {
      newQuestions[index].options = value;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${server}/api/assessment/course/${courseId}`,
        {
          title,
          description,
          questions,
          timeLimit,
          passingScore,
        },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        // Reset form
        setTitle("");
        setDescription("");
        setTimeLimit(60);
        setPassingScore(70);
        setQuestions([
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
          },
        ]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create assessment");
    }
  };

  return (
    <div className="create-assessment">
      <h2 className="mb-4">Create Assessment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter assessment title"
          />
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Enter assessment description"
            rows="3"
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Time Limit (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="1"
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Passing Score (%)</label>
              <input
                type="number"
                className="form-control"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                min="0"
                max="100"
                required
              />
            </div>
          </div>
        </div>

        <div className="questions">
          <h3 className="mb-4">Questions</h3>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Question {qIndex + 1}</h4>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <FaTrash /> Remove
                  </button>
                )}
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Question Text</label>
                <input
                  type="text"
                  className="form-control"
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(qIndex, "question", e.target.value)
                  }
                  required
                  placeholder="Enter your question"
                />
              </div>

              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="option-input">
                  <input
                    type="text"
                    className="form-control"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...q.options];
                      newOptions[oIndex] = e.target.value;
                      updateQuestion(qIndex, "options", newOptions);
                    }}
                    required
                    placeholder={`Option ${oIndex + 1}`}
                  />
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name={`correct-${qIndex}`}
                      checked={q.correctAnswer === oIndex}
                      onChange={() =>
                        updateQuestion(qIndex, "correctAnswer", oIndex)
                      }
                    />
                    <label className="form-check-label">Correct Answer</label>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="d-flex gap-3">
          <button
            type="button"
            className="btn btn-primary add-question"
            onClick={addQuestion}
          >
            <FaPlus /> Add Question
          </button>
          <button type="submit" className="btn btn-success submit-assessment">
            <FaSave /> Create Assessment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssessment; 