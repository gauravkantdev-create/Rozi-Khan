import resend
from fastapi import HTTPException
from app.config import settings

def send_otp_email(email: str, otp: str):
    if not settings.RESEND_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="RESEND_API_KEY is missing. Add it in your environment variables."
        )
    
    subject = "Verify your RoziKhan email"
    text = f"Your RoziKhan verification OTP is {otp}. It expires in 10 minutes."
    
    html = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Verify your RoziKhan email</h2>
      <p>Your verification OTP is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">{otp}</p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
    """
    
    try:
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": email,
            "subject": subject,
            "text": text,
            "html": html
        }
        
        result = resend.Emails.send(params)
        
        # In newer versions of the SDK, result might be an object containing `id`
        # or it could raise an exception if it fails.
        if not result or getattr(result, "error", None):
            error_msg = getattr(result, "error", {}).get("message", "Email rejection error")
            raise Exception(error_msg)
            
        return result
    except Exception as e:
        print("[email] Resend API error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send OTP email: {str(e)}"
        )
