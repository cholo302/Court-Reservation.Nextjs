import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OLOPSC Court Reservation <noreply@courtreserve.site>'
const APP_URL = process.env.NEXTAUTH_URL || 'https://courtreserve.site'

export async function sendWelcomeEmail(to: string, firstName: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to OLOPSC Court Reservation!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Welcome to OLOPSC Court Reservation</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            Thank you for registering at OLOPSC Court Reservation! Your account has been created successfully.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            To start booking courts, please log in and verify your identity by uploading your valid ID and a selfie.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/login" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Log In Now
            </a>
          </div>
          <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">Next Steps:</p>
            <ol style="color: #374151; font-size: 14px; margin: 8px 0 0; padding-left: 20px; line-height: 1.8;">
              <li>Log in to your account</li>
              <li>Upload your valid government ID</li>
              <li>Take a selfie for verification</li>
              <li>Wait for admin approval</li>
              <li>Start booking courts!</li>
            </ol>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} OLOPSC Court Reservation. All rights reserved.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password - OLOPSC Court Reservation',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Password Reset Request</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            We received a request to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ This link expires in 30 minutes.</strong> If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} OLOPSC Court Reservation. All rights reserved.
          </p>
        </div>
      </div>
    `,
  })
}
