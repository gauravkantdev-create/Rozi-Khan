import { Resend } from "resend";

let resendInstance;

const getResendApiKey = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it to your environment variables before starting the server."
    );
  }
  return apiKey;
};

export const getResend = () => {
  if (!resendInstance) {
    resendInstance = new Resend(getResendApiKey());
  }
  return resendInstance;
};

