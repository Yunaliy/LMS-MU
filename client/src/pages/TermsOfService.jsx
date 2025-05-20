import React from 'react';
import Layout from '../admin/Utils/Layout';
import './TermsOfService.css';

const TermsOfService = () => {
  return (
    <Layout>
      <div className="terms-container">
        <h1>Terms of Service</h1>
        <div className="terms-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using Medinetul Uloom's learning management system, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </section>

          <section>
            <h2>2. User Accounts</h2>
            <p>To access certain features of the platform, you must register for an account. You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2>3. Course Enrollment and Access</h2>
            <p>When enrolling in courses, you agree to:</p>
            <ul>
              <li>Pay all applicable fees</li>
              <li>Use course materials for personal learning only</li>
              <li>Not share or distribute course content</li>
              <li>Complete assessments honestly and independently</li>
            </ul>
          </section>

          <section>
            <h2>4. Intellectual Property</h2>
            <p>All content on the platform, including but not limited to:</p>
            <ul>
              <li>Course materials</li>
              <li>Videos and lectures</li>
              <li>Assessments and quizzes</li>
              <li>Platform design and functionality</li>
            </ul>
            <p>is the property of Medinetul Uloom and is protected by intellectual property laws.</p>
          </section>

          <section>
            <h2>5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the platform's operation</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Engage in any form of academic dishonesty</li>
            </ul>
          </section>

          <section>
            <h2>6. Payment Terms</h2>
            <p>Payment terms include:</p>
            <ul>
              <li>All fees are non-refundable unless otherwise stated</li>
              <li>Prices are subject to change with notice</li>
              <li>Payment must be made in full before course access</li>
            </ul>
          </section>

          <section>
            <h2>7. Termination</h2>
            <p>We reserve the right to:</p>
            <ul>
              <li>Suspend or terminate accounts for violations</li>
              <li>Modify or discontinue services</li>
              <li>Refuse service to anyone</li>
            </ul>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>Medinetul Uloom is not liable for:</p>
            <ul>
              <li>Indirect or consequential damages</li>
              <li>Service interruptions</li>
              <li>Loss of data or content</li>
              <li>Third-party actions</li>
            </ul>
          </section>

          <section>
            <h2>9. Changes to Terms</h2>
            <p>We may modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>
          </section>

          <section>
            <h2>10. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at:</p>
            <p>Email: terms@medinetululoom.com</p>
          </section>

          <section className="last-updated">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService; 