import React, { useState, useEffect } from "react";
import { Users, TrendingUp, Wallet, RefreshCw, ChevronLeft, ChevronRight, Download, Printer, Search, ArrowUpDown } from "lucide-react";
import Layout from "../Utils/Layout";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import CourseRevenueChart from "./CourseRevenueChart";
import RevenueOverviewChart from "./RevenueOverviewChart";
import "./paymentReports.css";

export default function PaymentReports() {
  const [activeTab, setActiveTab] = useState("courseRevenue");
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    averagePayment: 0,
    payments: []
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items to show per page

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("highestValue");
  const [filteredPayments, setFilteredPayments] = useState([]);

  const fetchPaymentReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to view payment reports");
        return;
      }

      const response = await axios.get(`${server}/api/admin/revenue`, {
        headers: {
          token: token
        }
      });

      if (response.data.success) {
        setPaymentData({
          totalRevenue: response.data.totalRevenue || 0,
          totalPayments: response.data.totalPayments || 0,
          averagePayment: response.data.averagePayment || 0,
          payments: response.data.payments || []
        });
      } else {
        toast.error(response.data.message || "Failed to fetch payment reports");
      }
    } catch (error) {
      console.error("Error fetching payment reports:", error);
      toast.error(error.response?.data?.message || "Failed to fetch payment reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentReports();
  }, []);

  // Search and sort effect
  useEffect(() => {
    let result = [...paymentData.payments];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(payment => 
        payment.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "highestValue":
        result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case "lowestValue":
        result.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      case "mostEnrollments":
        result.sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0));
        break;
      case "newest":
        result.sort((a, b) => {
          // Get the dates, defaulting to 0 if not available
          const dateA = a.course?.createdAt ? new Date(a.course.createdAt).getTime() : 0;
          const dateB = b.course?.createdAt ? new Date(b.course.createdAt).getTime() : 0;
          return dateB - dateA; // Sort in descending order (newest first)
        });
        break;
      default:
        break;
    }

    setFilteredPayments(result);
    setCurrentPage(1); // Reset to first page when search/sort changes
  }, [searchQuery, sortBy, paymentData.payments]);

  // Update pagination to use filteredPayments
  const totalPages = Math.ceil((filteredPayments?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calculate percentage change (mock data for now)
  const percentageChange = {
    revenue: "+20.1%",
    enrollments: "+10.1%",
    averageRevenue: "+5.4%"
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ["Course Name", "Category", "Ustaz", "Enrollments", "Revenue"];
      const csvContent = [
        headers.join(","),
        ...paymentData.payments.map(payment => [
          payment.course?.title || "N/A",
          payment.course?.category || "N/A",
          payment.course?.createdBy || "N/A",
          payment.enrollments || 0,
          `ETB ${payment.amount?.toLocaleString() || 0}`
        ].join(","))
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `payment-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Create the print content
      const printContent = `
        <html>
          <head>
            <title>Payment Reports</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { color: #333; }
              .print-date { color: #666; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8f9fa; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; }
              .summary-item { margin: 10px 0; }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>Payment Reports</h1>
              <div class="print-date">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary">
              <div class="summary-item">Total Revenue: ETB ${paymentData.totalRevenue.toLocaleString()}</div>
              <div class="summary-item">Total Transactions: ${paymentData.totalPayments}</div>
              <div class="summary-item">Average Payment: ETB ${paymentData.averagePayment.toLocaleString()}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Category</th>
                  <th>Ustaz</th>
                  <th>Enrollments</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${paymentData.payments.map(payment => `
                  <tr>
                    <td>${payment.course?.title || "N/A"}</td>
                    <td>${payment.course?.category || "N/A"}</td>
                    <td>${payment.course?.createdBy || "N/A"}</td>
                    <td>${payment.enrollments || 0}</td>
                    <td>ETB ${payment.amount?.toLocaleString() || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()">Print Report</button>
        </div>
          </body>
        </html>
      `;

      // Write the content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = function() {
        printWindow.print();
        // Close the window after printing (optional)
        // printWindow.close();
      };
    } catch (error) {
      console.error("Error printing report:", error);
      toast.error("Failed to print report");
    }
  };

  // Prepare chart data
  const chartData = paymentData.payments
    .map(payment => ({
      name: payment.course?.title || "Unknown Course",
      value: payment.amount || 0
    }))
    .sort((a, b) => b.value - a.value) // Sort by value in descending order
    .slice(0, 7); // Take top 7 courses

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>
            <Wallet className="icon-primary" />
            Payment Reports
          </h2>
          <div className="header-actions">
            <button 
              onClick={handlePrint} 
              className="print-btn"
              disabled={loading || !paymentData.payments.length}
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={handleExport}
              className="export-btn"
              disabled={loading || !paymentData.payments.length}
            >
              <Download size={20} />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading payment data...</p>
          </div>
        ) : (
          <>
            <div className="horizontal-cards-container">
              {/* Total Revenue Card */}
              <div className="stat-card primary">
                <div className="card-content">
                  <div className="stat-icon">
                    <Wallet />
              </div>
                  <div className="stat-text">
                    <p className="stat-label">Total Revenue</p>
                    <p className="stat-value">ETB {paymentData.totalRevenue.toLocaleString()}</p>
                    <p className="stat-change">{percentageChange.revenue} from last month</p>
              </div>
            </div>
          </div>

              {/* Course Enrollments Card */}
              <div className="stat-card success">
                <div className="card-content">
                  <div className="stat-icon">
                    <Users />
              </div>
                  <div className="stat-text">
                    <p className="stat-label">Total Transactions</p>
                    <p className="stat-value">{paymentData.totalPayments}</p>
                    <p className="stat-change">{percentageChange.enrollments} from last month</p>
              </div>
            </div>
              </div>

              {/* Average Revenue Per Course Card */}
              <div className="stat-card info">
                <div className="card-content">
                  <div className="stat-icon">
                    <TrendingUp />
                  </div>
                  <div className="stat-text">
                    <p className="stat-label">Average Payment</p>
                    <p className="stat-value">ETB {paymentData.averagePayment.toLocaleString()}</p>
                    <p className="stat-change">{percentageChange.averageRevenue} from last month</p>
            </div>
          </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <button
                onClick={() => setActiveTab("courseRevenue")}
                className={`tab-button ${activeTab === "courseRevenue" ? "active" : ""}`}
              >
                Course Revenue
              </button>
              <button
                onClick={() => setActiveTab("revenueOverview")}
                className={`tab-button ${activeTab === "revenueOverview" ? "active" : ""}`}
              >
                Revenue Overview
              </button>
            </div>

            {/* Course Revenue Tab Content */}
            {activeTab === "courseRevenue" && (
              <>
                {/* Course Revenue Chart */}
                <CourseRevenueChart data={chartData} />

                {/* Course Revenue Table */}
                <div className="table-container">
                  {/* Search and Sort Controls */}
                  <div className="table-controls">
                    <div className="search-box">
                      <Search size={20} />
                  <input
                    type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                    <div className="sort-controls">
                      <ArrowUpDown size={20} />
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                      >
                        <option value="highestValue">Highest Value</option>
                        <option value="lowestValue">Lowest Value</option>
                        <option value="mostEnrollments">Most Enrollments</option>
                        <option value="newest">Newest</option>
                      </select>
              </div>
            </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course Name</th>
                        <th>Category</th>
                        <th>Ustaz</th>
                        <th>Enrollments</th>
                        <th>Revenue</th>
                </tr>
              </thead>
                    <tbody>
                      {currentPayments.length > 0 ? (
                        currentPayments.map((payment, index) => (
                          <tr key={index}>
                            <td>{payment.course?.title || "N/A"}</td>
                            <td>{payment.course?.category || "N/A"}</td>
                            <td>{payment.course?.createdBy || "N/A"}</td>
                            <td>{payment.enrollments || 0}</td>
                            <td>ETB {payment.amount?.toLocaleString() || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data">No payment data available</td>
                  </tr>
                      )}
              </tbody>
            </table>
                  
                  {/* Pagination Controls */}
                  <div className="pagination-controls">
                    <button 
                      onClick={handlePrevPage} 
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <ChevronLeft size={20} />
                      Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Revenue Overview Tab Content */}
            {activeTab === "revenueOverview" && (
              <div className="overview-container">
                <div className="overview-grid">
                  <div className="overview-card">
                    <h3>Total Transactions</h3>
                    <p className="overview-value">{paymentData.totalPayments}</p>
                  </div>
                  <div className="overview-card">
                    <h3>Average Payment</h3>
                    <p className="overview-value">ETB {paymentData.averagePayment.toLocaleString()}</p>
          </div>
        </div>
                <RevenueOverviewChart />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 