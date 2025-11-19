/**
 * Simple script to generate a secure random secret for CRON_SECRET
 * You can use this secret to authenticate cron job requests to Edge Functions
 */

// Generate a random 32-character secret
function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  
  // Generate 32 random characters
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return secret;
}

const secret = generateSecret();
console.log('');
console.log('🔐 Generated CRON_SECRET:');
console.log('');
console.log(secret);
console.log('');
console.log('📋 Use this secret:');
console.log('   1. Add it as a secret in Supabase Dashboard → Edge Functions → Settings → Secrets');
console.log('   2. Use it in cron job SQL when calling Edge Functions');
console.log('   3. Keep it secret - don\'t share it publicly!');
console.log('');

