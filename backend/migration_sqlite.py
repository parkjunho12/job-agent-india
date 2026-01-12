"""
SQLite-Compatible Migration Script
Add email verification and OAuth support
"""

import sqlite3
import sys
from pathlib import Path

def run_sqlite_migration():
    """Run migration on SQLite database"""
    
    # Get database path
    db_path = Path(__file__).parent.parent  / "database" / "job_agent.db"
    
    if not db_path.exists():
        print(f"❌ Database not found. Please run the app first to create tables. {db_path}")
        return False
    
    print(f"🗄️  Migrating SQLite database: {db_path}")
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add email verification columns
        if 'email_verified' not in columns:
            print("➕ Adding email_verified column...")
            cursor.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL")
        
        if 'verification_token' not in columns:
            print("➕ Adding verification_token column...")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
        
        if 'verification_token_expires' not in columns:
            print("➕ Adding verification_token_expires column...")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token_expires DATETIME")
        
        # Add password reset columns
        if 'reset_token' not in columns:
            print("➕ Adding reset_token column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
        
        if 'reset_token_expires' not in columns:
            print("➕ Adding reset_token_expires column...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
        
        # Add OAuth columns
        if 'oauth_provider' not in columns:
            print("➕ Adding oauth_provider column...")
            cursor.execute("ALTER TABLE users ADD COLUMN oauth_provider TEXT")
        
        if 'oauth_id' not in columns:
            print("➕ Adding oauth_id column...")
            cursor.execute("ALTER TABLE users ADD COLUMN oauth_id TEXT")
        
        if 'oauth_picture' not in columns:
            print("➕ Adding oauth_picture column...")
            cursor.execute("ALTER TABLE users ADD COLUMN oauth_picture TEXT")
        
        # Add security columns
        if 'failed_login_attempts' not in columns:
            print("➕ Adding failed_login_attempts column...")
            cursor.execute("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL")
        
        if 'locked_until' not in columns:
            print("➕ Adding locked_until column...")
            cursor.execute("ALTER TABLE users ADD COLUMN locked_until DATETIME")
        
        if 'last_login' not in columns:
            print("➕ Adding last_login column...")
            cursor.execute("ALTER TABLE users ADD COLUMN last_login DATETIME")
        
        # SQLite doesn't support DROP NOT NULL, so we'll leave hashed_password as is
        # OAuth users can just have an empty or null hashed_password
        
        conn.commit()
        print("✅ Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = run_sqlite_migration()
    sys.exit(0 if success else 1)