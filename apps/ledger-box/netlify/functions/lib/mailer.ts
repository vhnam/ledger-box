type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult = { ok: true } | { ok: false; error: string };

const MAX_ERROR_MESSAGE_LENGTH = 300;

function truncateError(message: string): string {
  return message.length > MAX_ERROR_MESSAGE_LENGTH ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...` : message;
}

/** Never throws. Callers always get a result they can persist and act on. */
async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_EMAIL_FROM_ADDRESS;

  if (!apiKey || !from) {
    return { ok: false, error: 'Email delivery is not configured' };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return { ok: false, error: truncateError(error.message) };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email delivery error';
    return { ok: false, error: truncateError(message) };
  }
}

export { sendEmail, type SendEmailInput, type SendEmailResult };
