import { resend } from "./resendClient.js";

const getFromEmail = () => {
  // Resend requires a verified sender domain for production.
  // Use RESEND_FROM_EMAIL like: "RoziKhan <no-reply@yourdomain.com>"
  return process.env.RESEND_FROM_EMAIL || "RoziKhan <onboarding@resend.dev>";
};

export const sendOtpEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing. Add it in Render environment variables.");
  }

  const subject = "Verify your RoziKhan email";
  const text = `Your RoziKhan verification OTP is ${otp}. It expires in 10 minutes.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Verify your RoziKhan email</h2>
      <p>Your verification OTP is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const result = await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject,
    text,
    html,
  });

  return result;
};
