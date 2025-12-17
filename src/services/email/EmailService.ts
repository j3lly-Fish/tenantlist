import sgMail, { MailDataRequired } from '@sendgrid/mail';

/**
 * Email types for tracking and preferences
 */
export enum EmailType {
  VERIFICATION = 'verification',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  NEW_MATCH = 'new_match',
  NEW_MESSAGE = 'new_message',
  BUSINESS_INVITE = 'business_invite',
  TOUR_REMINDER = 'tour_reminder',
  ACCOUNT_UPDATE = 'account_update',
  WEEKLY_DIGEST = 'weekly_digest',
}

/**
 * Email service for sending transactional emails via SendGrid
 */
export class EmailService {
  private readonly frontendUrl: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isConfigured: boolean;
  private readonly isDevelopment: boolean;
  private readonly skipEmailService: boolean;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@demandcre.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'DemandCRE';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.skipEmailService = process.env.SKIP_EMAIL_SERVICE === 'true';

    // Configure SendGrid if API key is available
    const apiKey = process.env.SENDGRID_API_KEY;
    this.isConfigured = !!apiKey && apiKey !== 'your-sendgrid-api-key';

    if (this.isConfigured && apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${this.frontendUrl}/verify-email?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your DemandCRE Account',
      html: this.generateVerificationEmailHtml(verificationLink),
      text: this.generateVerificationEmailText(verificationLink),
      emailType: EmailType.VERIFICATION,
    });
  }

  /**
   * Send welcome email after email verification
   */
  async sendWelcomeEmail(email: string, recipientName: string): Promise<void> {
    const dashboardLink = `${this.frontendUrl}/dashboard`;
    const profileLink = `${this.frontendUrl}/profile`;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to DemandCRE - Let\'s Get Started!',
      html: this.generateWelcomeEmailHtml(recipientName, dashboardLink, profileLink),
      text: this.generateWelcomeEmailText(recipientName, dashboardLink, profileLink),
      emailType: EmailType.WELCOME,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your DemandCRE Password',
      html: this.generatePasswordResetEmailHtml(resetLink),
      text: this.generatePasswordResetEmailText(resetLink),
      emailType: EmailType.PASSWORD_RESET,
    });
  }

  /**
   * Send new property match notification
   */
  async sendNewMatchEmail(
    email: string,
    recipientName: string,
    matchCount: number,
    topMatchTitle: string,
    topMatchScore: number,
    topMatchLocation: string
  ): Promise<void> {
    const dashboardLink = `${this.frontendUrl}/dashboard`;

    await this.sendEmail({
      to: email,
      subject: `${matchCount} New Property Match${matchCount > 1 ? 'es' : ''} Found!`,
      html: this.generateNewMatchEmailHtml(
        recipientName,
        matchCount,
        topMatchTitle,
        topMatchScore,
        topMatchLocation,
        dashboardLink
      ),
      text: this.generateNewMatchEmailText(
        recipientName,
        matchCount,
        topMatchTitle,
        topMatchScore,
        topMatchLocation,
        dashboardLink
      ),
      emailType: EmailType.NEW_MATCH,
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageEmail(
    email: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
  ): Promise<void> {
    const messageLink = `${this.frontendUrl}/messages/${conversationId}`;

    await this.sendEmail({
      to: email,
      subject: `New message from ${senderName}`,
      html: this.generateNewMessageEmailHtml(
        recipientName,
        senderName,
        messagePreview,
        messageLink
      ),
      text: this.generateNewMessageEmailText(
        recipientName,
        senderName,
        messagePreview,
        messageLink
      ),
      emailType: EmailType.NEW_MESSAGE,
    });
  }

  /**
   * Send business invite email
   */
  async sendBusinessInviteEmail(
    email: string,
    inviterName: string,
    businessName: string,
    role: string,
    inviteToken: string
  ): Promise<void> {
    const inviteLink = `${this.frontendUrl}/invite/accept?token=${inviteToken}`;

    await this.sendEmail({
      to: email,
      subject: `${inviterName} invited you to join ${businessName} on DemandCRE`,
      html: this.generateBusinessInviteEmailHtml(
        inviterName,
        businessName,
        role,
        inviteLink
      ),
      text: this.generateBusinessInviteEmailText(
        inviterName,
        businessName,
        role,
        inviteLink
      ),
      emailType: EmailType.BUSINESS_INVITE,
    });
  }

  /**
   * Send tour reminder email
   */
  async sendTourReminderEmail(
    email: string,
    recipientName: string,
    propertyTitle: string,
    propertyAddress: string,
    tourDate: Date,
    contactName: string
  ): Promise<void> {
    const propertyLink = `${this.frontendUrl}/dashboard`;
    const formattedDate = tourDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    await this.sendEmail({
      to: email,
      subject: `Reminder: Property Tour Tomorrow - ${propertyTitle}`,
      html: this.generateTourReminderEmailHtml(
        recipientName,
        propertyTitle,
        propertyAddress,
        formattedDate,
        contactName,
        propertyLink
      ),
      text: this.generateTourReminderEmailText(
        recipientName,
        propertyTitle,
        propertyAddress,
        formattedDate,
        contactName,
        propertyLink
      ),
      emailType: EmailType.TOUR_REMINDER,
    });
  }

  /**
   * Send account update notification
   */
  async sendAccountUpdateEmail(
    email: string,
    recipientName: string,
    updateType: string,
    details: string
  ): Promise<void> {
    const settingsLink = `${this.frontendUrl}/settings`;

    await this.sendEmail({
      to: email,
      subject: `Account Update: ${updateType}`,
      html: this.generateAccountUpdateEmailHtml(
        recipientName,
        updateType,
        details,
        settingsLink
      ),
      text: this.generateAccountUpdateEmailText(
        recipientName,
        updateType,
        details,
        settingsLink
      ),
      emailType: EmailType.ACCOUNT_UPDATE,
    });
  }

  /**
   * Core email sending method
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    emailType: EmailType;
  }): Promise<void> {
    // Development mode or skip flag - log to console
    if (this.isDevelopment || this.skipEmailService) {
      console.log('\n=== EMAIL SENT (DEV MODE) ===');
      console.log(`Type: ${params.emailType}`);
      console.log(`To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text Preview: ${params.text.substring(0, 200)}...`);
      console.log('============================\n');
      return;
    }

    // Production mode - check if SendGrid is configured
    if (!this.isConfigured) {
      console.error('SendGrid not configured. Email not sent:', params.subject);
      throw new Error(
        'Email service not configured. Please set SENDGRID_API_KEY environment variable.'
      );
    }

    // Send via SendGrid
    const msg: MailDataRequired = {
      to: params.to,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: params.subject,
      html: params.html,
      text: params.text,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      categories: [params.emailType],
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully: ${params.emailType} to ${params.to}`);
    } catch (error: any) {
      console.error('SendGrid email error:', error?.response?.body || error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // ===== HTML Templates =====

  private getEmailWrapper(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DemandCRE</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #000; margin: 0; font-size: 24px; font-weight: 600;">DemandCRE</h2>
            </div>
            ${content}
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;">
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              DemandCRE - Demand-first Commercial Real Estate<br>
              <a href="${this.frontendUrl}/settings/notifications" style="color: #007AFF;">Manage notification preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getButton(text: string, link: string): string {
    return `
      <div style="margin: 24px 0; text-align: center;">
        <a href="${link}"
           style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          ${text}
        </a>
      </div>
    `;
  }

  private generateVerificationEmailHtml(verificationLink: string): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">Welcome to DemandCRE!</h1>
      <p>Thank you for signing up. Please verify your email address to complete your account setup and start finding your perfect commercial space.</p>
      ${this.getButton('Verify Email Address', verificationLink)}
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #007AFF; font-size: 14px; word-break: break-all;">${verificationLink}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This link will expire in 24 hours. If you didn't sign up for DemandCRE, please ignore this email.</p>
    `);
  }

  private generateVerificationEmailText(verificationLink: string): string {
    return `
Welcome to DemandCRE!

Thank you for signing up. Please verify your email address to complete your account setup.

Click the link below to verify your email:
${verificationLink}

This link will expire in 24 hours. If you didn't sign up for DemandCRE, please ignore this email.
    `.trim();
  }

  private generateWelcomeEmailHtml(
    recipientName: string,
    dashboardLink: string,
    profileLink: string
  ): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">Welcome to DemandCRE, ${recipientName}!</h1>
      <p>Your email has been verified and your account is ready to go. You're now part of the demand-first commercial real estate marketplace.</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #000;">Here's how to get started:</p>
        <ol style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8;">
          <li><strong>Complete your profile</strong> - Add your business details and preferences</li>
          <li><strong>Create a QFP</strong> - Submit your Qualified Facility Profile to start receiving property matches</li>
          <li><strong>Browse properties</strong> - Explore available listings that match your needs</li>
          <li><strong>Connect with landlords</strong> - Message property owners directly through the platform</li>
        </ol>
      </div>

      ${this.getButton('Go to Dashboard', dashboardLink)}

      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 16px;">
        Need to update your profile? <a href="${profileLink}" style="color: #007AFF;">Edit profile settings</a>
      </p>
    `);
  }

  private generateWelcomeEmailText(
    recipientName: string,
    dashboardLink: string,
    profileLink: string
  ): string {
    return `
Welcome to DemandCRE, ${recipientName}!

Your email has been verified and your account is ready to go. You're now part of the demand-first commercial real estate marketplace.

Here's how to get started:

1. Complete your profile - Add your business details and preferences
2. Create a QFP - Submit your Qualified Facility Profile to start receiving property matches
3. Browse properties - Explore available listings that match your needs
4. Connect with landlords - Message property owners directly through the platform

Go to your dashboard: ${dashboardLink}

Need to update your profile? ${profileLink}

We're excited to have you on board!

- The DemandCRE Team
    `.trim();
  }

  private generatePasswordResetEmailHtml(resetLink: string): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">Reset Your Password</h1>
      <p>We received a request to reset your password for your DemandCRE account. Click the button below to create a new password.</p>
      ${this.getButton('Reset Password', resetLink)}
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #007AFF; font-size: 14px; word-break: break-all;">${resetLink}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    `);
  }

  private generatePasswordResetEmailText(resetLink: string): string {
    return `
Reset Your Password

We received a request to reset your password for your DemandCRE account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    `.trim();
  }

  private generateNewMatchEmailHtml(
    recipientName: string,
    matchCount: number,
    topMatchTitle: string,
    topMatchScore: number,
    topMatchLocation: string,
    dashboardLink: string
  ): string {
    const scoreColor = topMatchScore >= 80 ? '#10b981' : topMatchScore >= 60 ? '#3b82f6' : '#f59e0b';

    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">New Property Matches Found!</h1>
      <p>Hi ${recipientName},</p>
      <p>Great news! We found <strong>${matchCount} new property match${matchCount > 1 ? 'es' : ''}</strong> that align with your requirements.</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #000;">Top Match:</p>
        <p style="margin: 0 0 4px; font-size: 16px; color: #000;">${topMatchTitle}</p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #666;">${topMatchLocation}</p>
        <span style="background-color: ${scoreColor}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
          ${topMatchScore}% Match
        </span>
      </div>

      ${this.getButton('View All Matches', dashboardLink)}
      <p style="color: #666; font-size: 14px; text-align: center;">Don't miss out - properties go fast!</p>
    `);
  }

  private generateNewMatchEmailText(
    recipientName: string,
    matchCount: number,
    topMatchTitle: string,
    topMatchScore: number,
    topMatchLocation: string,
    dashboardLink: string
  ): string {
    return `
New Property Matches Found!

Hi ${recipientName},

Great news! We found ${matchCount} new property match${matchCount > 1 ? 'es' : ''} that align with your requirements.

Top Match:
${topMatchTitle}
${topMatchLocation}
${topMatchScore}% Match

View all matches: ${dashboardLink}

Don't miss out - properties go fast!
    `.trim();
  }

  private generateNewMessageEmailHtml(
    recipientName: string,
    senderName: string,
    messagePreview: string,
    messageLink: string
  ): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">New Message from ${senderName}</h1>
      <p>Hi ${recipientName},</p>
      <p>You have a new message on DemandCRE:</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #000;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #000;">${senderName}</p>
        <p style="margin: 0; color: #666; font-style: italic;">"${messagePreview}"</p>
      </div>

      ${this.getButton('Reply to Message', messageLink)}
    `);
  }

  private generateNewMessageEmailText(
    recipientName: string,
    senderName: string,
    messagePreview: string,
    messageLink: string
  ): string {
    return `
New Message from ${senderName}

Hi ${recipientName},

You have a new message on DemandCRE:

${senderName} wrote:
"${messagePreview}"

Reply to message: ${messageLink}
    `.trim();
  }

  private generateBusinessInviteEmailHtml(
    inviterName: string,
    businessName: string,
    role: string,
    inviteLink: string
  ): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">You're Invited to Join ${businessName}</h1>
      <p>${inviterName} has invited you to join <strong>${businessName}</strong> on DemandCRE as a <strong>${role}</strong>.</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #666;">You'll be able to:</p>
        <ul style="margin: 0; padding-left: 20px; color: #000;">
          <li>View and manage business listings</li>
          <li>Access property matches</li>
          <li>Communicate with landlords and brokers</li>
        </ul>
      </div>

      ${this.getButton('Accept Invitation', inviteLink)}
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This invitation will expire in 7 days. If you don't recognize this invitation, you can safely ignore this email.</p>
    `);
  }

  private generateBusinessInviteEmailText(
    inviterName: string,
    businessName: string,
    role: string,
    inviteLink: string
  ): string {
    return `
You're Invited to Join ${businessName}

${inviterName} has invited you to join ${businessName} on DemandCRE as a ${role}.

You'll be able to:
- View and manage business listings
- Access property matches
- Communicate with landlords and brokers

Accept invitation: ${inviteLink}

This invitation will expire in 7 days.
    `.trim();
  }

  private generateTourReminderEmailHtml(
    recipientName: string,
    propertyTitle: string,
    propertyAddress: string,
    tourDate: string,
    contactName: string,
    propertyLink: string
  ): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">Property Tour Reminder</h1>
      <p>Hi ${recipientName},</p>
      <p>This is a friendly reminder about your upcoming property tour:</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px; font-weight: 600; font-size: 16px; color: #000;">${propertyTitle}</p>
        <p style="margin: 0 0 12px; color: #666;">${propertyAddress}</p>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
          <p style="margin: 0 0 4px; font-size: 14px;"><strong>When:</strong> ${tourDate}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Contact:</strong> ${contactName}</p>
        </div>
      </div>

      ${this.getButton('View Property Details', propertyLink)}
      <p style="color: #666; font-size: 14px; text-align: center;">Need to reschedule? Contact your representative directly.</p>
    `);
  }

  private generateTourReminderEmailText(
    recipientName: string,
    propertyTitle: string,
    propertyAddress: string,
    tourDate: string,
    contactName: string,
    propertyLink: string
  ): string {
    return `
Property Tour Reminder

Hi ${recipientName},

This is a friendly reminder about your upcoming property tour:

Property: ${propertyTitle}
Address: ${propertyAddress}
When: ${tourDate}
Contact: ${contactName}

View property details: ${propertyLink}

Need to reschedule? Contact your representative directly.
    `.trim();
  }

  private generateAccountUpdateEmailHtml(
    recipientName: string,
    updateType: string,
    details: string,
    settingsLink: string
  ): string {
    return this.getEmailWrapper(`
      <h1 style="color: #000; margin-bottom: 16px; font-size: 20px;">Account Update: ${updateType}</h1>
      <p>Hi ${recipientName},</p>
      <p>The following change was made to your DemandCRE account:</p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #000;">${details}</p>
      </div>

      <p>If you made this change, no further action is needed.</p>
      ${this.getButton('Review Account Settings', settingsLink)}
      <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't make this change, please secure your account immediately by changing your password and contacting support.</p>
    `);
  }

  private generateAccountUpdateEmailText(
    recipientName: string,
    updateType: string,
    details: string,
    settingsLink: string
  ): string {
    return `
Account Update: ${updateType}

Hi ${recipientName},

The following change was made to your DemandCRE account:

${details}

If you made this change, no further action is needed.

Review account settings: ${settingsLink}

If you didn't make this change, please secure your account immediately.
    `.trim();
  }
}
