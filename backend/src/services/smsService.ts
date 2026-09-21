export class SmsService {
  /**
   * Generates a random 6-digit OTP
   */
  public static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sends an OTP using Fast2SMS API.
   * If FAST2SMS_API_KEY is not set, it simulates the SMS in the console (useful for dev/testing).
   */
  public static async sendOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.FAST2SMS_API_KEY;

    // Dev Simulation Fallback
    if (!apiKey) {
      console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.info('📱  [FAST2SMS DEV SIMULATOR] SMS Dispatched');
      console.info(`  To:      ${phone}`);
      console.info(`  Message: Your OTP is ${otp}. It is valid for 5 minutes.`);
      console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true };
    }

    try {
      const url = 'https://www.fast2sms.com/dev/otp/send';
      
      const options = {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: phone
        })
      };

      const response = await fetch(url, options);
      const data: Record<string, unknown> = await (response.json() as Promise<Record<string, unknown>>);

      if (!response.ok || (data.return === false)) {
        console.error('❌ Fast2SMS API error response:', data);
        return { success: false, error: String(data.message || 'Failed to send SMS via Fast2SMS') };
      }

      console.info(`📱 SMS dispatched via Fast2SMS to ${phone}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Fast2SMS send error:', err);
      return { success: false, error: err.message || 'Unknown error occurred while sending SMS' };
    }
  }
}
