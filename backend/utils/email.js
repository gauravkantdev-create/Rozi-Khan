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

  if (result?.error) {
    console.error("[email] Resend API error:", result.error);

    const resendMessage =
      result.error.message ||
      "Email provider rejected the request. Please try again later.";

    // onboarding@resend.dev can only email the Resend account owner
    if (/only send testing emails to your own email/i.test(resendMessage)) {
      throw new Error(
        "Test mode: OTP can only be sent to your Resend account email. Use that email, or verify your own domain in Resend."
      );
    }

    throw new Error(resendMessage);
  }

  console.log("[email] Resend email queued:", {
    to: email,
    id: result?.data?.id,
  });

  return result;
};
