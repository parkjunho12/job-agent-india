"""
Email Service for Verification and Password Reset
backend/app/services/email_service.py
"""

from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from app.utils.config import settings


class EmailService:
    """Email service for sending verification and reset emails"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST 
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.frontend_url = settings.FRONTEND_URL
    
    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Attach HTML
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def send_verification_email(self, to_email: str, token: str, user_name: str) -> bool:
        """Send email verification link"""
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        
        subject = "Verify Your Email - Job Agent"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 40px 30px;
                    border: 1px solid #e0e0e0;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f5f5f5;
                    padding: 20px 30px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-radius: 0 0 10px 10px;
                }}
                .code {{
                    background: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 18px;
                    letter-spacing: 2px;
                    text-align: center;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to Job Agent!</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>Thanks for signing up! To get started, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">
                            ✅ Verify Email
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <code style="word-break: break-all;">{verification_url}</code>
                    </p>
                    
                    <p style="margin-top: 30px; color: #666;">
                        This link will expire in <strong>24 hours</strong>.
                    </p>
                    
                    <p style="margin-top: 30px;">
                        If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>Job Agent - AI-Powered Job Application Assistant</p>
                    <p>© 2026 Job Agent. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)
    
    def send_password_reset_email(self, to_email: str, token: str, user_name: str) -> bool:
        """Send password reset link"""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        
        subject = "Reset Your Password - Job Agent"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 40px 30px;
                    border: 1px solid #e0e0e0;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f5f5f5;
                    padding: 20px 30px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-radius: 0 0 10px 10px;
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">
                            🔑 Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <code style="word-break: break-all;">{reset_url}</code>
                    </p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        This link will expire in <strong>1 hour</strong>.<br>
                        If you didn't request this, please ignore this email and your password will remain unchanged.
                    </div>
                </div>
                <div class="footer">
                    <p>Job Agent - AI-Powered Job Application Assistant</p>
                    <p>© 2026 Job Agent. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)
    
    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email after verification"""
        subject = "Welcome to Job Agent! 🎉"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 40px 30px;
                    border: 1px solid #e0e0e0;
                }}
                .feature {{
                    display: flex;
                    align-items: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 8px;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 You're All Set!</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>Your email has been verified! Welcome to Job Agent - your AI-powered job application assistant.</p>
                    
                    <h3>🚀 What's Next?</h3>
                    
                    <div class="feature">
                        <span style="font-size: 24px; margin-right: 15px;">📝</span>
                        <div>
                            <strong>Add Your Experiences</strong><br>
                            <small>Upload your resume or add experiences manually</small>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <span style="font-size: 24px; margin-right: 15px;">🎯</span>
                        <div>
                            <strong>Save Jobs</strong><br>
                            <small>Use our Chrome extension to save jobs with one click</small>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <span style="font-size: 24px; margin-right: 15px;">✨</span>
                        <div>
                            <strong>Generate Applications</strong><br>
                            <small>AI creates personalized cover letters and answers</small>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{self.frontend_url}/experiences" class="button">
                            Get Started →
                        </a>
                    </div>
                </div>
                <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
                    <p>Need help? Check out our <a href="{self.frontend_url}/help">Help Center</a></p>
                    <p>© 2026 Job Agent. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)


# Singleton instance
email_service = EmailService()