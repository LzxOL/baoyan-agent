#!/usr/bin/env python3
"""
Test script to check environment variables and Supabase client initialization
"""
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

print("Environment variables check:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL', 'NOT SET')}")
print(f"SUPABASE_SERVICE_ROLE_KEY exists: {bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))}")
print(f"SUPABASE_ANON_KEY exists: {bool(os.getenv('SUPABASE_ANON_KEY'))}")

# Test Supabase client initialization
try:
    from supabase import create_client, Client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if url and key:
        print("\nTrying to create Supabase client...")
        supabase = create_client(url, key)
        print("✅ Supabase client created successfully!")
    else:
        print("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY not set")

except Exception as e:
    print(f"❌ Supabase client creation failed: {e}")
    print(f"Error type: {type(e)}")
