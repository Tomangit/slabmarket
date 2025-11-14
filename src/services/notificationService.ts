
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

interface EmailNotificationData {
  userName?: string;
  itemName?: string;
  price?: number;
  transactionId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  disputeType?: string;
  priority?: string;
  description?: string;
  targetPrice?: number;
  currentPrice?: number;
  slabId?: string;
  [key: string]: any;
}

export const notificationService = {
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  },

  async createNotification(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return true;
  },

  /**
   * Send email notification using Edge Function
   * @param type - Type of notification (transaction_created, transaction_shipped, dispute_opened, price_alert)
   * @param userId - User ID to send notification to
   * @param data - Data for email template
   */
  async sendEmailNotification(
    type: "transaction_created" | "transaction_shipped" | "dispute_opened" | "price_alert",
    userId: string,
    data: EmailNotificationData
  ) {
    try {
      // Get user email from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (profileError || !profile?.email) {
        console.error("Error fetching user email:", profileError);
        return;
      }

      // Call Edge Function to send email
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables");
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-notification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            type,
            email: profile.email,
            data: {
              ...data,
              userName: data.userName || profile.full_name || "User",
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Error sending email notification:", error);
      }
    } catch (error) {
      console.error("Error in sendEmailNotification:", error);
      // Don't throw - email sending is non-critical
    }
  },

  /**
   * Create notification and optionally send email
   * @param notification - Notification data
   * @param sendEmail - Whether to send email (default: false)
   * @param emailType - Type of email to send
   * @param emailData - Data for email template
   */
  async createNotificationWithEmail(
    notification: NotificationInsert,
    sendEmail: boolean = false,
    emailType?: "transaction_created" | "transaction_shipped" | "dispute_opened" | "price_alert",
    emailData?: EmailNotificationData
  ) {
    // Create in-app notification
    const notif = await this.createNotification(notification);

    // Send email if requested
    if (sendEmail && emailType && notification.user_id) {
      await this.sendEmailNotification(emailType, notification.user_id, emailData || {});
    }

    return notif;
  }
};
