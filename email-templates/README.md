# Email Templates

This directory contains email templates for the Slab Market application.

## Supabase Authentication Templates

The templates in `supabase-auth/` are designed for use with Supabase's authentication email system. These templates use Supabase's template variables.

### Available Templates

1. **confirm-signup.html** - Email sent when a user signs up and needs to confirm their email address
2. **magic-link.html** - Email sent for passwordless authentication (magic link login)
3. **reset-password.html** - Email sent when a user requests to reset their password
4. **change-email.html** - Email sent to confirm an email address change
5. **invite-user.html** - Email sent when inviting a new user to the platform
6. **reauthentication.html** - Email sent when reauthentication is required for sensitive actions

### Supabase Template Variables

These templates use Supabase's standard template variables:

- `{{ .ConfirmationURL }}` - URL for confirming the action
- `{{ .Token }}` - Authentication token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Base URL of your site
- `{{ .Email }}` - User's email address
- `{{ .Data }}` - Additional data object
- `{{ .RedirectTo }}` - URL to redirect to after confirmation

### Configuration in Supabase

To use these templates in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template you want to customize (e.g., "Confirm sign up")
4. Copy the HTML content from the corresponding template file
5. Paste it into the template editor
6. Update the **Subject** field with an appropriate subject line
7. Click **Save changes**

### Subject Lines

Recommended subject lines for each template:

- **Confirm sign up**: "Confirm Your Signup - Slab Market"
- **Magic link**: "Sign In to Slab Market"
- **Reset password**: "Reset Your Password - Slab Market"
- **Change email address**: "Confirm Email Change - Slab Market"
- **Invite user**: "You're Invited to Join Slab Market"
- **Reauthentication**: "Security Verification Required - Slab Market"

### Customization

All templates share a consistent design with:

- Responsive layout that works on mobile and desktop
- Brand colors matching Slab Market (purple gradient theme)
- Clear call-to-action buttons
- Security notices where applicable
- Professional footer with branding

To customize colors, update the gradient values in the `background` CSS properties within each template.

### Testing

After configuring templates in Supabase:

1. Use Supabase's email testing feature to send test emails
2. Verify that all template variables are properly rendered
3. Check email rendering in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
4. Test on mobile devices to ensure responsive design works correctly

### Notes

- These templates use inline CSS for maximum email client compatibility
- All templates include both HTML and fallback text links
- Security notices are included where applicable (magic link, password reset, etc.)
- Templates follow email best practices for deliverability and accessibility
