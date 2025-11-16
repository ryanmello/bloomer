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

