// Enhanced email service for sending appointment confirmations
// import nodemailer from 'nodemailer'

interface AppointmentEmailData {
  patientName: string
  patientEmail: string
  providerName: string
  appointmentDate: string
  appointmentTime: string
  sessionType: string
  reason?: string
  appointmentId?: number
}

interface EmailMetrics {
  sent: number
  failed: number
  retries: number
}

// Email delivery metrics
const emailMetrics: EmailMetrics = {
  sent: 0,
  failed: 0,
  retries: 0
}

// Validate email configuration
export const validateEmailConfig = (): void => {
  console.log('Email config validation disabled')
}

// Validate email address format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Get email metrics
export const getEmailMetrics = (): EmailMetrics => ({ ...emailMetrics })

// Create transporter (using Gmail SMTP as example)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your app password
    },
  })
}

// Generate appointment confirmation email HTML
const generateConfirmationEmailHTML = (data: AppointmentEmailData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation - MindCare Hub</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f8fafc;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .appointment-details {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-label {
          font-weight: bold;
          color: #475569;
        }
        .detail-value {
          color: #1e293b;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .status-badge {
          background-color: #fbbf24;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧠 MindCare Hub</h1>
        <h2>Appointment Confirmation</h2>
      </div>
      
      <div class="content">
        <p>Dear ${data.patientName},</p>
        
        <p>Thank you for booking an appointment with MindCare Hub. Your appointment request has been received and is currently <span class="status-badge">PENDING CONFIRMATION</span>.</p>
        
        <div class="appointment-details">
          <h3>📅 Appointment Details</h3>
          
          <div class="detail-row">
            <span class="detail-label">Patient:</span>
            <span class="detail-value">${data.patientName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Provider:</span>
            <span class="detail-value">${data.providerName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date(data.appointmentDate).toLocaleDateString('en-MY', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${data.appointmentTime}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Session Type:</span>
            <span class="detail-value">${data.sessionType}</span>
          </div>
          
          ${data.reason ? `
          <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${data.reason}</span>
          </div>
          ` : ''}
          
          ${data.appointmentId ? `
          <div class="detail-row">
            <span class="detail-label">Appointment ID:</span>
            <span class="detail-value">#${data.appointmentId}</span>
          </div>
          ` : ''}
        </div>
        
        <h3>📋 What's Next?</h3>
        <ul>
          <li>Your healthcare provider will review and confirm your appointment within 24 hours</li>
          <li>You will receive another email once your appointment is confirmed</li>
          <li>If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
          <li>Please arrive 10 minutes early for your appointment</li>
        </ul>
        
        <h3>📞 Need Help?</h3>
        <p>If you have any questions or need to make changes to your appointment, please contact us:</p>
        <ul>
          <li>📧 Email: support@mindcarehub.my</li>
          <li>📱 Phone: +60 3-2345 6789</li>
          <li>🕒 Office Hours: Monday - Friday, 9:00 AM - 6:00 PM</li>
        </ul>
        
        <div class="footer">
          <p>This is an automated message from MindCare Hub.</p>
          <p>© 2024 MindCare Hub - Comprehensive Mental Health Support for Malaysia</p>
          <p>Please do not reply to this email. For support, contact us at support@mindcarehub.my</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send email with retry mechanism
const sendEmailWithRetry = async (
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  maxRetries: number = 3
): Promise<nodemailer.SentMessageInfo> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail(mailOptions)
      if (attempt > 1) {
        emailMetrics.retries += attempt - 1
      }
      emailMetrics.sent++
      return result
    } catch (error) {
      lastError = error as Error
      emailMetrics.failed++
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff: wait 1s, 2s, 4s...
      const delay = Math.pow(2, attempt - 1) * 1000
      console.warn(`Email attempt ${attempt} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Send appointment confirmation email
export const sendAppointmentConfirmationEmail = async (data: AppointmentEmailData): Promise<boolean> => {
  console.log('Email sending disabled - would send to:', data.patientEmail)
  return true
}

// Send appointment status update email (confirmed, cancelled, etc.)
export const sendAppointmentStatusEmail = async (
  data: AppointmentEmailData & { status: string; message?: string }
): Promise<boolean> => {
  console.log('Status email disabled - would send to:', data.patientEmail, 'Status:', data.status)
  return true
}

// Interface for custom email data
interface CustomEmailData {
  patientEmail: string
  patientName: string
  counselorName: string
  subject: string
  message: string
  appointmentId?: string
}

// Send custom email
export const sendCustomEmail = async (data: CustomEmailData): Promise<boolean> => {
  console.log('Custom email disabled - would send to:', data.patientEmail, 'Subject:', data.subject)
  return true
}

export default {
  sendAppointmentConfirmationEmail,
  sendAppointmentStatusEmail,
  sendCustomEmail
}