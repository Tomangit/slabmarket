// Edge Function to send email notifications
// This function handles email templates for various notification types

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getEmailTemplate(
  type: string,
  data: Record<string, any>
): EmailTemplate {
  const baseUrl = Deno.env.get("SITE_URL") || "https://slabmarket.com";
  
  switch (type) {
    case "transaction_created":
      return {
        subject: `New Transaction: ${data.itemName || "Item"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Transaction Created</h1>
              </div>
              <div class="content">
                <p>Hello ${data.userName || "User"},</p>
                <p>Your transaction for <strong>${data.itemName || "item"}</strong> has been created successfully.</p>
                <p><strong>Transaction Details:</strong></p>
                <ul>
                  <li>Item: ${data.itemName || "N/A"}</li>
                  <li>Price: $${data.price?.toLocaleString() || "0"}</li>
                  <li>Transaction ID: ${data.transactionId || "N/A"}</li>
                </ul>
                <a href="${baseUrl}/transaction/${data.transactionId}" class="button">View Transaction</a>
                <p>Thank you for using Slab Market!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from Slab Market. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Transaction Created\n\nHello ${data.userName || "User"},\n\nYour transaction for ${data.itemName || "item"} has been created successfully.\n\nTransaction Details:\n- Item: ${data.itemName || "N/A"}\n- Price: $${data.price?.toLocaleString() || "0"}\n- Transaction ID: ${data.transactionId || "N/A"}\n\nView transaction: ${baseUrl}/transaction/${data.transactionId}\n\nThank you for using Slab Market!`,
      };

    case "transaction_shipped":
      return {
        subject: `Your Order Has Been Shipped`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .tracking { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚚 Order Shipped</h1>
              </div>
              <div class="content">
                <p>Hello ${data.userName || "User"},</p>
                <p>Great news! Your order for <strong>${data.itemName || "item"}</strong> has been shipped.</p>
                ${data.trackingNumber ? `
                  <div class="tracking">
                    <p><strong>Tracking Number:</strong></p>
                    <p style="font-family: monospace; font-size: 18px; margin: 10px 0;">${data.trackingNumber}</p>
                    <a href="${data.trackingUrl || "#"}" class="button">Track Package</a>
                  </div>
                ` : ""}
                <a href="${baseUrl}/transaction/${data.transactionId}" class="button">View Transaction</a>
                <p>Thank you for your purchase!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from Slab Market. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Order Shipped\n\nHello ${data.userName || "User"},\n\nGreat news! Your order for ${data.itemName || "item"} has been shipped.\n\n${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}\nTrack Package: ${data.trackingUrl || "#"}\n\n` : ""}View transaction: ${baseUrl}/transaction/${data.transactionId}\n\nThank you for your purchase!`,
      };

    case "dispute_opened":
      return {
        subject: `Dispute Opened for Transaction #${data.transactionId?.slice(0, 8) || "N/A"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Dispute Opened</h1>
              </div>
              <div class="content">
                <p>Hello ${data.userName || "User"},</p>
                <div class="alert">
                  <p><strong>A dispute has been opened</strong> for transaction #${data.transactionId?.slice(0, 8) || "N/A"}.</p>
                </div>
                <p><strong>Dispute Details:</strong></p>
                <ul>
                  <li>Type: ${data.disputeType || "N/A"}</li>
                  <li>Priority: ${data.priority || "Normal"}</li>
                  <li>Description: ${data.description?.substring(0, 200) || "N/A"}${data.description?.length > 200 ? "..." : ""}</li>
                </ul>
                <a href="${baseUrl}/transaction/${data.transactionId}/dispute" class="button">View Dispute</a>
                <p>Our support team will review this dispute and contact you shortly.</p>
              </div>
              <div class="footer">
                <p>This is an automated email from Slab Market. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Dispute Opened\n\nHello ${data.userName || "User"},\n\nA dispute has been opened for transaction #${data.transactionId?.slice(0, 8) || "N/A"}.\n\nDispute Details:\n- Type: ${data.disputeType || "N/A"}\n- Priority: ${data.priority || "Normal"}\n- Description: ${data.description?.substring(0, 200) || "N/A"}${data.description?.length > 200 ? "..." : ""}\n\nView dispute: ${baseUrl}/transaction/${data.transactionId}/dispute\n\nOur support team will review this dispute and contact you shortly.`,
      };

    case "price_alert":
      return {
        subject: `Price Alert: ${data.itemName || "Item"} Reached Your Target Price!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .price-box { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; text-align: center; border: 2px solid #f5576c; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Price Alert Triggered!</h1>
              </div>
              <div class="content">
                <p>Hello ${data.userName || "User"},</p>
                <p>Great news! <strong>${data.itemName || "An item"}</strong> has reached your target price!</p>
                <div class="price-box">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Target Price</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #f5576c;">$${data.targetPrice?.toLocaleString() || "0"}</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Current Price</p>
                  <p style="margin: 5px 0; font-size: 32px; font-weight: bold; color: #28a745;">$${data.currentPrice?.toLocaleString() || "0"}</p>
                </div>
                <a href="${baseUrl}/slab/${data.slabId}" class="button">View Item</a>
                <p>Don't miss out on this great deal!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from Slab Market. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Price Alert Triggered!\n\nHello ${data.userName || "User"},\n\nGreat news! ${data.itemName || "An item"} has reached your target price!\n\nYour Target Price: $${data.targetPrice?.toLocaleString() || "0"}\nCurrent Price: $${data.currentPrice?.toLocaleString() || "0"}\n\nView item: ${baseUrl}/slab/${data.slabId}\n\nDon't miss out on this great deal!`,
      };

    default:
      return {
        subject: "Notification from Slab Market",
        html: `<p>${data.message || "You have a new notification."}</p>`,
        text: data.message || "You have a new notification.",
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, userId, email, data } = await req.json();

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get email template
    const template = getEmailTemplate(type, data || {});

    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    // - Supabase Email (if available)
    
    // For now, this is a stub that logs the email
    console.log("Email would be sent:", {
      to: email,
      subject: template.subject,
      type,
    });

    // TODO: Integrate with actual email service
    // Example with Resend:
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // await resend.emails.send({
    //   from: "noreply@slabmarket.com",
    //   to: email,
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text,
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification queued",
        type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send email notification",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

