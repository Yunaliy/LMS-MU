import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { server } from '../../config';
import { FaCheckCircle, FaDownload, FaPrint } from 'react-icons/fa';
import './receipt.css';

const ReceiptPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const { data } = await axios.get(`${server}/api/payment/receipt/${transactionId}`, {
          headers: {
            token: localStorage.getItem('token')
          }
        });
        setReceipt(data.receipt);
      } catch (err) {
        setError('Failed to load receipt details');
        console.error('Error fetching receipt:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable PDF or text file
    const content = `
      Course Enrollment Receipt
      Transaction ID: ${receipt.transactionId}
      Date: ${new Date(receipt.createdAt).toLocaleDateString()}
      Course: ${receipt.course.title}
      Amount: ETB ${receipt.amount}
      Payment Method: ${receipt.paymentMethod}
      Status: ${receipt.status}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="receipt-container">
        <div className="loading">Loading receipt...</div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="receipt-container">
        <div className="error">{error || 'Receipt not found'}</div>
        <button onClick={() => navigate('/')} className="back-btn">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="receipt-container">
      <div className="receipt-card">
        <div className="receipt-header">
          <FaCheckCircle className="success-icon" />
          <h1>Enrollment Confirmed</h1>
          <p className="subtitle">Thank you for enrolling in our course!</p>
        </div>

        <div className="receipt-details">
          <div className="detail-row">
            <span className="label">Transaction ID:</span>
            <span className="value">{receipt.transactionId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{new Date(receipt.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Course:</span>
            <span className="value">{receipt.course.title}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">ETB {receipt.amount}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment Method:</span>
            <span className="value">{receipt.paymentMethod}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className="value status">{receipt.status}</span>
          </div>
        </div>

        <div className="receipt-actions">
          <button onClick={handlePrint} className="action-btn">
            <FaPrint /> Print Receipt
          </button>
          <button onClick={handleDownload} className="action-btn">
            <FaDownload /> Download Receipt
          </button>
          <button onClick={() => navigate(`/course/${receipt.course._id}`)} className="action-btn primary">
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage; 