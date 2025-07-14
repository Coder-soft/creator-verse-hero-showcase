/**
 * Supabase Email Templates Reference
 * 
 * This file contains sample email templates to use with Supabase Auth.
 * To set these up:
 * 1. Go to your Supabase Dashboard
 * 2. Navigate to Authentication > Email Templates
 * 3. Customize the templates according to your brand
 * 
 * Note: This file is for reference only and not used in the application code.
 */

// Confirmation Email Template
const confirmationEmailTemplate = {
  subject: "Confirm Your Email for {{.SiteURL}}",
  content: `
<h2>Confirm Your Email</h2>
<p>Thank you for signing up to {{.SiteURL}}!</p>
<p>Please confirm your email by clicking the link below:</p>
<p><a href="{{.ConfirmationURL}}">Confirm Email Address</a></p>
<p>If you did not sign up for this account, you can ignore this email.</p>
<p>Thanks,<br>The Team at {{.SiteURL}}</p>
  `.trim()
};

// Magic Link Email Template
const magicLinkEmailTemplate = {
  subject: "Your Magic Link for {{.SiteURL}}",
  content: `
<h2>Login to Your Account</h2>
<p>Click the link below to log in to your account at {{.SiteURL}}:</p>
<p><a href="{{.MagicLinkURL}}">Login to Your Account</a></p>
<p>If you did not request this login, you can ignore this email.</p>
<p>Thanks,<br>The Team at {{.SiteURL}}</p>
  `.trim()
};

// Reset Password Email Template
const resetPasswordEmailTemplate = {
  subject: "Reset Your Password for {{.SiteURL}}",
  content: `
<h2>Reset Your Password</h2>
<p>You have requested to reset your password for {{.SiteURL}}.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{.ResetPasswordURL}}">Reset Password</a></p>
<p>If you did not request a password reset, you can ignore this email.</p>
<p>Thanks,<br>The Team at {{.SiteURL}}</p>
  `.trim()
};

// Change Email Template
const changeEmailTemplate = {
  subject: "Confirm Your New Email for {{.SiteURL}}",
  content: `
<h2>Confirm Your New Email</h2>
<p>You have requested to change your email for {{.SiteURL}}.</p>
<p>Click the link below to confirm your new email:</p>
<p><a href="{{.ChangeEmailURL}}">Confirm New Email</a></p>
<p>If you did not request this change, please contact support immediately.</p>
<p>Thanks,<br>The Team at {{.SiteURL}}</p>
  `.trim()
};

module.exports = {
  confirmationEmailTemplate,
  magicLinkEmailTemplate,
  resetPasswordEmailTemplate,
  changeEmailTemplate
}; 