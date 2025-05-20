import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container py-5">
      <h1 className="mb-4">Privacy Policy</h1>
      <div className="card shadow-sm">
        <div className="card-body">
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name and email address when you register</li>
            <li>Profile information you choose to provide</li>
            <li>Course progress and completion data</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process your course enrollments</li>
            <li>Send you important updates about your courses</li>
            <li>Improve our services</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We do not sell or share your personal information with third parties except:</p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information.</p>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>Email: support@medinetululoom.com</p>

          <p className="mt-4 text-muted">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 