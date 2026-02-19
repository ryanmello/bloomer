import { Resend } from "resend";
import db from "@/lib/prisma";

// Helper to get Resend client with validation
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  return new Resend(apiKey);
}

// Helper function to send campaign emails
export async function sendCampaignEmails(
  campaignId: string,
  customers: Array<{ id: string; email: string; firstName: string; lastName: string }>,
  subject: string,
  emailBody: string,
  shopName: string,
  shopEmail: string
) {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables');
      throw new Error('RESEND_API_KEY is missing');
    }

    console.log(`Starting to send emails for campaign ${campaignId} to ${customers.length} customers`);
    
    // Validate that we have customers to send to
    if (customers.length === 0) {
      console.warn('WARNING: No customers found for this campaign. Cannot send emails.');
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: 'Failed' }
      });
      return;
    }

    // Send emails in batches to respect rate limits
    const batchSize = 50;
    
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (customer) => {
          try {
            // Personalize email body
            const personalizedBody = emailBody
              .replace(/\{\{firstName\}\}/g, customer.firstName || 'Customer')
              .replace(/\{\{lastName\}\}/g, customer.lastName || '')
              .replace(/\{\{email\}\}/g, customer.email);

            // Get Resend client (validates API key)
            const resend = getResendClient();
            
            // Validate customer email
            if (!customer.email || !customer.email.includes('@')) {
              console.error(`Invalid email address for customer ${customer.id}: ${customer.email}`);
              throw new Error(`Invalid email address: ${customer.email}`);
            }

            // Determine the "from" email address
            // Priority: 1. RESEND_FROM_EMAIL env var, 2. Shop email (if from verified domain), 3. onboarding@resend.dev (test only)
            let fromEmail = process.env.RESEND_FROM_EMAIL;
            
            if (!fromEmail) {
              // Check if shop email is from a verified domain (not a common email provider)
              // For now, we'll use shop email if it exists, otherwise fall back to test domain
              if (shopEmail && shopEmail.includes('@') && !shopEmail.includes('@gmail.com') && !shopEmail.includes('@yahoo.com') && !shopEmail.includes('@hotmail.com')) {
                fromEmail = shopEmail;
                console.log(`Using shop email as from address: ${fromEmail}`);
              } else {
                fromEmail = 'onboarding@resend.dev';
                console.warn(`⚠️ Using test domain (onboarding@resend.dev). This only works for your account email.`);
                console.warn(`   To send to other recipients, set RESEND_FROM_EMAIL env var with a verified domain email.`);
              }
            }

            // Send email via Resend
            console.log(`📤 Attempting to send email via Resend...`);
            console.log(`   From: ${shopName} <${fromEmail}>`);
            console.log(`   To: ${customer.email}`);
            console.log(`   Subject: ${subject}`);
            console.log(`   API Key present: ${!!process.env.RESEND_API_KEY}`);
            console.log(`   API Key starts with 're_': ${process.env.RESEND_API_KEY?.startsWith('re_')}`);
            
            const { data, error } = await resend.emails.send({
              from: `${shopName} <${fromEmail}>`,
              to: [customer.email],
              subject: subject,
              html: personalizedBody,
            });
            
            console.log(`📬 Resend API response received:`);
            console.log(`   Data:`, JSON.stringify(data, null, 2));
            console.log(`   Error:`, error ? JSON.stringify(error, null, 2) : 'null');
            
            if (data?.id) {
              console.log(`✅ Email sent successfully! Resend Email ID: ${data.id}`);
              console.log(`   Check your Resend dashboard: https://resend.com/emails/${data.id}`);
            }

            if (error) {
              console.error(`❌ Failed to send to ${customer.email}:`, JSON.stringify(error, null, 2));
              console.error('Error details:', {
                message: error.message,
                name: error.name,
                statusCode: error.statusCode
              });
              
              // Check if it's a domain verification error
              if (error.statusCode === 403 && error.message?.includes('verify a domain')) {
                console.error('\n🔴 DOMAIN VERIFICATION REQUIRED:');
                console.error('   Resend requires a verified domain to send emails to recipients other than your account email.');
                console.error('   Steps to fix:');
                console.error('   1. Go to https://resend.com/domains');
                console.error('   2. Add and verify your domain');
                console.error('   3. Set RESEND_FROM_EMAIL environment variable to an email from your verified domain');
                console.error('      Example: RESEND_FROM_EMAIL=noreply@yourdomain.com');
              }
              
              // Update recipient status to Failed
              await db.campaignRecipient.updateMany({
                where: {
                  campaignId: campaignId,
                  customerId: customer.id
                },
                data: {
                  status: 'Failed',
                  sentAt: new Date()
                }
              });
            } else {
              console.log(`✅ Successfully sent email to ${customer.email}, Resend ID: ${data?.id}`);
              console.log(`📧 Email should appear in Resend dashboard with ID: ${data?.id}`);
              
              // Update recipient status to Sent
              await db.campaignRecipient.updateMany({
                where: {
                  campaignId: campaignId,
                  customerId: customer.id
                },
                data: {
                  status: 'Sent',
                  sentAt: new Date()
                }
              });
            }
          } catch (error: any) {
            console.error(`Error sending to ${customer.email}:`, error);
            console.error('Error stack:', error?.stack);
            console.error('Error message:', error?.message);
            
            // Mark as failed
            await db.campaignRecipient.updateMany({
              where: {
                campaignId: campaignId,
                customerId: customer.id
              },
              data: {
                status: 'Failed',
                sentAt: new Date()
              }
            });
          }
        })
      );

      // Add delay between batches to respect rate limits
      if (i + batchSize < customers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign status to Sent after all emails are processed
    await db.campaign.update({
      where: { id: campaignId },
      data: { 
        status: 'Sent',
        sentAt: new Date()
      }
    });

    console.log(`Campaign ${campaignId} completed`);
  } catch (error) {
    console.error('Error in sendCampaignEmails:', error);
    
    // Update campaign to Failed status
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: 'Failed' }
    });
  }
}


/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName?: string
) {
  try {
    // Get the base URL from environment or use a default
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Dev-friendly fallback: if email provider isn't configured, log the reset link
    // so password reset is still operable locally.
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not set. Skipping email send.");
      console.warn(`🔗 Password reset link for ${email}: ${resetUrl}`);
      return { success: true, devResetUrl: resetUrl as string };
    }

    const resend = getResendClient();

    // Determine the "from" email address
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const appName = process.env.APP_NAME || 'Bloomer';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hello ${firstName || 'there'},</p>
            <p>We received a request to reset your password for your ${appName} account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: [email],
      subject: `Reset Your ${appName} Password`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }

    console.log(`Password reset email sent to ${email}, Resend ID: ${data?.id}`);
    return { success: true, messageId: data?.id, devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Supported merge tags for emails
 */
export const MERGE_TAGS = ['{{firstName}}', '{{lastName}}', '{{email}}', '{{shopName}}'] as const;

/**
 * Replace merge tags in content with actual values
 */
export function replaceMergeTags(
  content: string,
  data: { firstName?: string; lastName?: string; email?: string; shopName?: string }
): string {
  return content
    .replace(/\{\{firstName\}\}/g, data.firstName || 'Customer')
    .replace(/\{\{lastName\}\}/g, data.lastName || '')
    .replace(/\{\{email\}\}/g, data.email || '')
    .replace(/\{\{shopName\}\}/g, data.shopName || 'Our Shop');
}

/**
 * Send automation email to a customer and increment sent count
 */
export async function sendAutomationEmail(
  automationId: string,
  customer: { id: string; email: string; firstName: string; lastName: string },
  subject: string,
  emailBody: string,
  shopName: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!customer.email?.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn(`⚠️ RESEND_API_KEY not set. Would send to ${customer.email}`);
      return { success: true, emailId: 'dev-mode' };
    }

    const resend = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const personalizedSubject = replaceMergeTags(subject, { ...customer, shopName });
    const personalizedBody = replaceMergeTags(emailBody, { ...customer, shopName });

    const { data, error } = await resend.emails.send({
      from: `${shopName} <${fromEmail}>`,
      to: [customer.email],
      subject: personalizedSubject,
      html: personalizedBody,
    });

    if (error) {
      console.error(`❌ Automation email failed for ${customer.email}:`, error);
      return { success: false, error: error.message };
    }

    // Increment sent count
    await db.automation.update({
      where: { id: automationId },
      data: { sentCount: { increment: 1 } },
    });

    console.log(`✅ Automation email sent to ${customer.email}, ID: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
