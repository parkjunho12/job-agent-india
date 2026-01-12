"""
OAuth Service for Google and GitHub
backend/app/services/oauth_service.py
"""

import httpx
import os
from typing import Dict, Optional

from app.utils.config import settings

class OAuthService:
    """OAuth authentication service"""
    
    def __init__(self):
        # Google OAuth
        self.google_client_id = settings.GOOGLE_CLIENT_ID 
        self.google_client_secret = settings.GOOGLE_CLIENT_SECRET 
        self.google_token_url = "https://oauth2.googleapis.com/token"
        self.google_userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        # GitHub OAuth
        self.github_client_id = settings.GITHUB_CLIENT_ID
        self.github_client_secret = settings.GITHUB_CLIENT_SECRET 
        self.github_token_url = "https://github.com/login/oauth/access_token"
        self.github_userinfo_url = "https://api.github.com/user"
        self.github_email_url = "https://api.github.com/user/emails"
    
    async def get_google_user_info(self, code: str, redirect_uri: str) -> Optional[Dict]:
        """
        Exchange Google OAuth code for user info
        Returns: {id, email, name, picture, verified_email}
        """
        try:
            async with httpx.AsyncClient() as client:
                # Exchange code for access token
                token_response = await client.post(
                    self.google_token_url,
                    data={
                        "code": code,
                        "client_id": self.google_client_id,
                        "client_secret": self.google_client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code"
                    }
                )
                
                if token_response.status_code != 200:
                    print(f"Google token error: {token_response.text}")
                    return None
                
                token_data = token_response.json()
                access_token = token_data.get("access_token")
                
                if not access_token:
                    return None
                
                # Get user info
                user_response = await client.get(
                    self.google_userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if user_response.status_code != 200:
                    print(f"Google userinfo error: {user_response.text}")
                    return None
                
                user_data = user_response.json()
                
                return {
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "name": user_data.get("name"),
                    "picture": user_data.get("picture"),
                    "verified_email": user_data.get("verified_email", False)
                }
                
        except Exception as e:
            print(f"Google OAuth error: {e}")
            return None
    
    async def get_github_user_info(self, code: str, redirect_uri: str) -> Optional[Dict]:
        """
        Exchange GitHub OAuth code for user info
        Returns: {id, email, name, avatar_url, login}
        """
        try:
            async with httpx.AsyncClient() as client:
                # Exchange code for access token
                token_response = await client.post(
                    self.github_token_url,
                    data={
                        "code": code,
                        "client_id": self.github_client_id,
                        "client_secret": self.github_client_secret,
                        "redirect_uri": redirect_uri
                    },
                    headers={"Accept": "application/json"}
                )
                
                if token_response.status_code != 200:
                    print(f"GitHub token error: {token_response.text}")
                    return None
                
                token_data = token_response.json()
                access_token = token_data.get("access_token")
                
                if not access_token:
                    return None
                
                # Get user info
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                
                user_response = await client.get(
                    self.github_userinfo_url,
                    headers=headers
                )
                
                if user_response.status_code != 200:
                    print(f"GitHub userinfo error: {user_response.text}")
                    return None
                
                user_data = user_response.json()
                
                # Get email (if not public)
                email = user_data.get("email")
                if not email:
                    email_response = await client.get(
                        self.github_email_url,
                        headers=headers
                    )
                    
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        # Get primary verified email
                        for email_data in emails:
                            if email_data.get("primary") and email_data.get("verified"):
                                email = email_data.get("email")
                                break
                        
                        # Fallback to first verified email
                        if not email:
                            for email_data in emails:
                                if email_data.get("verified"):
                                    email = email_data.get("email")
                                    break
                
                return {
                    "id": str(user_data.get("id")),
                    "email": email,
                    "name": user_data.get("name") or user_data.get("login"),
                    "avatar_url": user_data.get("avatar_url"),
                    "login": user_data.get("login")
                }
                
        except Exception as e:
            print(f"GitHub OAuth error: {e}")
            return None
    
    def get_google_auth_url(self, redirect_uri: str) -> str:
        """Get Google OAuth authorization URL"""
        params = {
            "client_id": self.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    def get_github_auth_url(self, redirect_uri: str) -> str:
        """Get GitHub OAuth authorization URL"""
        params = {
            "client_id": self.github_client_id,
            "redirect_uri": redirect_uri,
            "scope": "user:email",
            "state": "random_state_string"  # Should be random in production
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://github.com/login/oauth/authorize?{query_string}"


# Singleton instance
oauth_service = OAuthService()