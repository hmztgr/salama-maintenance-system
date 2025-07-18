// Email Service for sending real invitations
// Uses EmailJS for client-side email sending (production-ready alternative)

export interface EmailTemplate {
  to_email: string;
  to_name?: string;
  from_name: string;
  subject: string;
  message: string;
  invitation_link: string;
  role: string;
  company_name: string;
  expiry_date: string;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig;
  private isEmailJSLoaded = false;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  // Load EmailJS dynamically
  private async loadEmailJS(): Promise<void> {
    if (this.isEmailJSLoaded || typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        this.isEmailJSLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        if (window.emailjs) {
          window.emailjs.init(this.config.publicKey);
          this.isEmailJSLoaded = true;
          resolve();
        } else {
          reject(new Error('EmailJS failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load EmailJS script'));
      document.head.appendChild(script);
    });
  }

  // Send invitation email
  async sendInvitationEmail(template: EmailTemplate): Promise<EmailResult> {
    try {
      console.log('📧 Sending invitation email to:', template.to_email);

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Email service not available in server environment'
        };
      }

      // Load EmailJS if not already loaded
      await this.loadEmailJS();

      if (!window.emailjs) {
        throw new Error('EmailJS not available');
      }

      // Send email using EmailJS
      const response = await window.emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        {
          to_email: template.to_email,
          to_name: template.to_name || template.to_email,
          from_name: template.from_name,
          subject: template.subject,
          message: template.message,
          invitation_link: template.invitation_link,
          user_role: template.role,
          company_name: template.company_name,
          expiry_date: template.expiry_date,
          current_year: new Date().getFullYear().toString()
        }
      );

      console.log('✅ Email sent successfully:', response);

      return {
        success: true,
        messageId: response.text
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إرسال البريد الإلكتروني'
      };
    }
  }

  // Send welcome email after user accepts invitation
  async sendWelcomeEmail(template: Omit<EmailTemplate, 'invitation_link'>): Promise<EmailResult> {
    try {
      console.log('👋 Sending welcome email to:', template.to_email);

      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Email service not available in server environment'
        };
      }

      await this.loadEmailJS();

      if (!window.emailjs) {
        throw new Error('EmailJS not available');
      }

      // Use a different template for welcome emails
      const welcomeTemplateId = this.config.templateId.replace('invitation', 'welcome');

      const response = await window.emailjs.send(
        this.config.serviceId,
        welcomeTemplateId,
        {
          to_email: template.to_email,
          to_name: template.to_name || template.to_email,
          from_name: template.from_name,
          subject: 'مرحباً بك في نظام سلامة للصيانة',
          message: template.message,
          user_role: template.role,
          company_name: template.company_name,
          current_year: new Date().getFullYear().toString()
        }
      );

      console.log('✅ Welcome email sent successfully:', response);

      return {
        success: true,
        messageId: response.text
      };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إرسال بريد الترحيب'
      };
    }
  }

  // Generate invitation email content
  static generateInvitationContent(
    inviteeEmail: string,
    inviterName: string,
    role: string,
    invitationLink: string,
    expiryDate: string,
    customMessage?: string
  ): EmailTemplate {
    const roleNames = {
      admin: 'مدير النظام',
      supervisor: 'مشرف',
      viewer: 'مستخدم'
    };

    const roleName = roleNames[role as keyof typeof roleNames] || 'مستخدم';

    const defaultMessage = `
تم دعوتك للانضمام إلى نظام سلامة للصيانة كـ ${roleName}.

للقبول والانضمام، يرجى النقر على الرابط أدناه:
${invitationLink}

هذه الدعوة صالحة حتى: ${expiryDate}

إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.
    `.trim();

    return {
      to_email: inviteeEmail,
      from_name: inviterName,
      subject: `دعوة للانضمام إلى نظام سلامة للصيانة - ${roleName}`,
      message: customMessage || defaultMessage,
      invitation_link: invitationLink,
      role: roleName,
      company_name: 'شركة سلامة للصيانة',
      expiry_date: expiryDate
    };
  }

  // Validate email configuration
  static validateConfig(config: Partial<EmailConfig>): boolean {
    return !!(config.serviceId && config.templateId && config.publicKey);
  }
}

// Default email configuration (these should be set in environment variables)
const defaultEmailConfig: EmailConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ''
};

// Singleton instance
export const emailService = new EmailService(defaultEmailConfig);

// Type declarations for EmailJS
declare global {
  interface Window {
    emailjs: {
      init: (publicKey: string) => void;
      send: (serviceId: string, templateId: string, templateParams: any) => Promise<{ text: string }>;
    };
  }
}

export { EmailService };
export default emailService; 