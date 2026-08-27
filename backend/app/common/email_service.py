import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from itsdangerous import URLSafeTimedSerializer

def get_serializer():
    """Generates a cryptographic serializer using the app secret key."""
    secret_key = os.getenv("SECRET_KEY", "adflow-dev-secret-key-change-in-production")
    return URLSafeTimedSerializer(secret_key)

def generate_verification_token(email):
    """Generates a secure, signed token containing the user's email."""
    s = get_serializer()
    return s.dumps(email, salt="email-verification-salt")

def verify_token(token, max_age_seconds=86400): # 24 hours
    """Validates the signed token and returns the email if valid."""
    s = get_serializer()
    try:
        email = s.loads(token, salt="email-verification-salt", max_age=max_age_seconds)
        return email
    except Exception:
        return None

def send_verification_email(to_email, user_name, verification_token):
    """
    Dispatches a styled HTML email with an activation link.
    If SMTP credentials are not set, it prints the link to the console for easy testing.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify-email?token={verification_token}"

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    sender = os.getenv("MAIL_DEFAULT_SENDER", f"AdFlow <{smtp_user}>")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome to AdFlow!</h2>
        <p style="color: #475569; font-size: 15px;">Hi {user_name},</p>
        <p style="color: #475569; font-size: 15px;">Thank you for registering. Please click the button below to verify your email address and activate your workspace:</p>
        <div style="text-align: center;">
          <a href="{verify_url}" class="btn">Verify My Email Address</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
      <div class="footer">&copy; 2026 AdFlow Enterprise OOH Network. All rights reserved.</div>
    </body>
    </html>
    """

    # If no SMTP credentials, log to console (Development Mode)
    if not smtp_user or not smtp_pass:
        print("\n" + "="*70)
        print("📨 [EMAIL DISPATCHER (DEV CONSOLE FALLBACK)]")
        print(f"To: {to_email}")
        print(f"Subject: Verify your AdFlow Account")
        print(f"Activation Link: {verify_url}")
        print("="*70 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your AdFlow Account"
        msg["From"] = sender
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Failed to dispatch verification email via SMTP: {e}")
        return False


def generate_password_reset_token(email):
    """Generates a secure, signed token for password resets (1 hour expiration)."""
    s = get_serializer()
    return s.dumps(email, salt="password-reset-salt")


def verify_password_reset_token(token, max_age_seconds=3600): # 1 hour
    """Validates the signed password reset token and returns the email if valid."""
    s = get_serializer()
    try:
        email = s.loads(token, salt="password-reset-salt", max_age=max_age_seconds)
        return email
    except Exception:
        return None


def send_password_reset_email(to_email, user_name, reset_token):
    """
    Dispatches a styled HTML email with a password reset link.
    If SMTP credentials are not set, it prints the link to the console for easy testing.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    sender = os.getenv("MAIL_DEFAULT_SENDER", f"AdFlow Security <{smtp_user}>")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 15px;">Hi {user_name},</p>
        <p style="color: #475569; font-size: 15px;">We received a request to reset your AdFlow account password. Click the button below to choose a new password:</p>
        <div style="text-align: center;">
          <a href="{reset_url}" class="btn">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
      <div class="footer">&copy; 2026 AdFlow Enterprise OOH Network. All rights reserved.</div>
    </body>
    </html>
    """

    # If no SMTP credentials, log to console (Development Mode)
    if not smtp_user or not smtp_pass:
        print("\n" + "="*70)
        print("🔐 [PASSWORD RESET DISPATCHER (DEV CONSOLE FALLBACK)]")
        print(f"To: {to_email}")
        print(f"Subject: Reset your AdFlow Password")
        print(f"Reset Link: {reset_url}")
        print("="*70 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset your AdFlow Password"
        msg["From"] = sender
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Failed to dispatch reset email via SMTP: {e}")
        return False