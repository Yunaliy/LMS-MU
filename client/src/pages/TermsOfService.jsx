import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container py-5">
      <h1 className="mb-4">Terms of Service</h1>
      <div className="card shadow-sm">
        <div className="card-body">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using this platform, you agree to be bound by these Terms of Service.</p>

          <h2>2. User Accounts</h2>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
          </ul>

          <h2>3. Course Access and Usage</h2>
          <p>Our courses are for personal, non-commercial use only. You agree to:</p>
          <ul>
            <li>Not share your account credentials</li>
            <li>Not redistribute course materials</li>
            <li>Complete assignments honestly</li>
          </ul>

          <h2>4. Payment Terms</h2>
          <p>Payment terms include:</p>
          <ul>
            <li>All fees are non-refundable unless specified</li>
            <li>Prices may change with notice</li>
            <li>Payment is required before course access</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>All content on this platform is protected by copyright and other intellectual property rights.</p>

          <h2>6. Termination</h2>
          <p>We reserve the right to terminate or suspend accounts that violate these terms.</p>

          <h2>7. Limitation of Liability</h2>
          <p>We are not liable for any indirect, incidental, or consequential damages.</p>

          <h2>8. Changes to Terms</h2>
          <p>We may modify these terms at any time. Continued use of the platform constitutes acceptance of changes.</p>

          <h2>9. Contact Information</h2>
          <p>For questions about these terms, contact us at:</p>
          <p>Email: support@medinetululoom.com</p>

          <p className="mt-4 text-muted">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 