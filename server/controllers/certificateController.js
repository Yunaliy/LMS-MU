import Certificate from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Courses } from "../models/Courses.js";
import Assessment from "../models/Assessment.js";
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate certificate for a student
export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Get user and course details
    const user = await User.findById(userId);
    const course = await Courses.findById(courseId);
    const assessment = await Assessment.findOne({ courseId });

    if (!user || !course || !assessment) {
      return res.status(404).json({
        success: false,
        message: "User, course, or assessment not found",
      });
    }

    // Check if user has passed the assessment
    const result = assessment.results.find(
      (r) => r.userId.toString() === userId.toString() && r.passed
    );

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Assessment not passed",
      });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create PDF document
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=certificate-${certificateId}.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add certificate content
    doc.font('Helvetica')
       .fontSize(30)
       .text('Certificate of Completion', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(20)
       .text('This is to certify that', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(25)
       .fillColor('#2980b9')
       .text(user.name, { align: 'center' })
       .moveDown(0.5);

    doc.fillColor('#000')
       .fontSize(20)
       .text('has successfully completed the course', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(25)
       .fillColor('#2980b9')
       .text(course.title, { align: 'center' })
       .moveDown(0.5);

    doc.fillColor('#000')
       .fontSize(20)
       .text(`with a score of ${result.score}%`, { align: 'center' })
       .moveDown(1);

    // Add date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(15)
       .text(`Issued on ${date}`, { align: 'center' })
       .moveDown(0.5);

    // Add certificate ID
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Certificate ID: ${certificateId}`, { align: 'center' });

    // Add decorative elements
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .stroke('#2980b9');

    // Finalize the PDF
    doc.end();

    // Save certificate record in database
    await Certificate.create({
      userId,
      courseId,
      studentName: user.name,
      courseName: course.title,
      certificateId,
      assessmentScore: result.score,
      completionDate: new Date(),
      status: 'issued'
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get student's certificate
export const getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Get user and course details
    const user = await User.findById(userId);
    const course = await Courses.findById(courseId);
    const assessment = await Assessment.findOne({ courseId });

    if (!user || !course || !assessment) {
      return res.status(404).json({
        success: false,
        message: "User, course, or assessment not found",
      });
    }

    // Check if user has passed the assessment
    const result = assessment.results.find(
      (r) => r.userId.toString() === userId.toString() && r.passed
    );

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Assessment not passed",
      });
    }

    // Find existing certificate or generate a new one
    let certificate = await Certificate.findOne({
      userId,
      courseId,
      status: 'issued'
    });

    if (!certificate) {
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      certificate = await Certificate.create({
        userId,
        courseId,
        studentName: user.name,
        courseName: course.title,
        certificateId,
        assessmentScore: result.score,
        completionDate: new Date(),
        status: 'issued'
      });
    }

    // Create PDF document with A4 landscape
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50,
      info: {
        Title: `${course.title} - Certificate of Completion`,
        Author: 'Madinetul Uloom',
        Subject: 'Course Completion Certificate',
      }
    });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${course.title.replace(/\s+/g, '_')}_certificate.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add decorative border with rounded corners
    doc.roundedRect(20, 20, doc.page.width - 40, doc.page.height - 40, 10)
       .lineWidth(3)
       .strokeColor('#D4AF37') // Golden color
       .stroke();

    // Add inner border with rounded corners
    doc.roundedRect(30, 30, doc.page.width - 60, doc.page.height - 60, 8)
       .lineWidth(1)
       .strokeColor('#D4AF37')
       .stroke();

    // Calculate center positions and start higher since we removed the top logo
    const centerX = doc.page.width / 2;
    const startY = 80;

    // Add certificate title with better spacing
    doc.font('Helvetica-Bold')
       .fontSize(48)
       .fillColor('#2c3e50')
       .text('Certificate of Completion', {
         align: 'center'
       })
       .moveDown(0.7);

    // Add "This is to certify that" text
    doc.font('Helvetica')
       .fontSize(20)
       .fillColor('#2c3e50')
       .text('This is to certify that', {
         align: 'center'
       })
       .moveDown(0.4);

    // Add student name with larger font
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('#2c3e50')
       .text(user.name, {
         align: 'center'
       })
       .moveDown(0.4);

    // Add course completion text
    doc.font('Helvetica')
       .fontSize(20)
       .fillColor('#2c3e50')
       .text('has successfully completed the course', {
         align: 'center'
       })
       .moveDown(0.3);

    // Add course name in quotes with emphasis
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor('#2c3e50')
       .text(`"${course.title}"`, {
         align: 'center'
       })
       .moveDown(0.4);

    // Add score if available
    if (result.score) {
      doc.font('Helvetica')
         .fontSize(18)
         .fillColor('#2c3e50')
         .text(`with a score of ${result.score}%`, {
           align: 'center'
         })
         .moveDown(0.8);
    }

    // Add bottom section with reduced spacing
    const bottomY = doc.page.height - 140;

    // Create a row for the bottom content
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#2c3e50');

    // Add date on the left
    const date = new Date(certificate.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Add three columns in the bottom section
    doc.text(date, 50, bottomY, {
      width: 200,
      align: 'left'
    });

    // Add larger logo in center with certificate ID below it
    try {
      const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo3.png');
      if (fs.existsSync(logoPath)) {
        // Draw the logo
        doc.image(logoPath, centerX - 35, bottomY - 35, {
          width: 70,
          height: 70,
          align: 'center'
        });

        // Add certificate ID directly below the logo
        doc.fontSize(12)
           .fillColor('#666666')
           .text(`Certificate ID: ${certificate.certificateId}`, centerX - 100, bottomY + 40, {
             width: 200,
             align: 'center'
           });
      }
    } catch (error) {
      console.error('Error loading logo:', error);
      // If logo fails to load, still add the certificate ID in the center
      doc.fontSize(12)
         .fillColor('#666666')
         .text(`Certificate ID: ${certificate.certificateId}`, centerX - 100, bottomY + 40, {
           width: 200,
           align: 'center'
         });
    }

    // Add institution name on the right
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#2c3e50')
       .text('Medinetul Uloom', doc.page.width - 250, bottomY, {
         width: 200,
         align: 'right'
       });

    // End the document
    doc.end();

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message,
    });
  }
};

// Verify certificate
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      certificateId,
      status: "issued",
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Invalid or revoked certificate",
      });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; 