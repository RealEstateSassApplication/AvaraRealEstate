type ProviderResult = {
  ok: true;
  providerMessageId?: string;
  provider: 'meta-whatsapp' | 'twilio-whatsapp' | 'twilio-sms';
};

function requireValue(name: string, value?: string) {
  const normalized = value?.trim();
  if (!normalized || normalized.startsWith('your-') || normalized.startsWith('replace-with-')) {
    throw new Error(`${name} is not configured`);
  }
  return normalized;
}

async function twilioMessage(to: string, from: string, message: string, provider: 'twilio-whatsapp' | 'twilio-sms'): Promise<ProviderResult> {
  const sid = requireValue('TWILIO_SID', process.env.TWILIO_SID);
  const token = requireValue('TWILIO_AUTH_TOKEN', process.env.TWILIO_AUTH_TOKEN);

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Twilio message failed (${response.status}): ${payload?.message || 'Unknown provider error'}`
    );
  }

  return {
    ok: true,
    provider,
    providerMessageId: typeof payload?.sid === 'string' ? payload.sid : undefined,
  };
}

export default class NotificationService {
  static async sendWhatsApp(to: string, message: string): Promise<ProviderResult> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN?.trim() ||
      process.env.WHATSAPP_API_KEY?.trim();

    if (phoneNumberId && accessToken && !accessToken.startsWith('your-')) {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          `WhatsApp message failed (${response.status}): ${payload?.error?.message || 'Unknown provider error'}`
        );
      }

      return {
        ok: true,
        provider: 'meta-whatsapp',
        providerMessageId: payload?.messages?.[0]?.id,
      };
    }

    const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
    if (from) {
      const normalizedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const normalizedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      return twilioMessage(normalizedTo, normalizedFrom, message, 'twilio-whatsapp');
    }

    throw new Error(
      'WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN or TWILIO_WHATSAPP_FROM.'
    );
  }

  static async sendSMS(to: string, message: string): Promise<ProviderResult> {
    const from = requireValue('TWILIO_FROM_NUMBER', process.env.TWILIO_FROM_NUMBER);
    return twilioMessage(to, from, message, 'twilio-sms');
  }
}
