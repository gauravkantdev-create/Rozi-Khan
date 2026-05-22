import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    console.log("=================================");
    console.log(` RoziKhan OTP for ${email}: ${otp}`);
    console.log(" Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to send real emails.");
    console.log("=================================");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"RoziKhan" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your RoziKhan email",
    text: `Your RoziKhan verification OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Verify your RoziKhan email</h2>
        <p>Your verification OTP is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });
};
