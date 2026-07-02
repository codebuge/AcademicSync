import urllib.request
import json
import sys
import os

# Ensure stdout uses utf-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Load credentials from environment variables — NEVER hardcode secrets here
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.")
    print("  Example:")
    print("    $env:SUPABASE_URL='https://your-project.supabase.co'")
    print("    $env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
    sys.exit(1)

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Check tables via information_schema
print("=" * 60)
print("CHECKING DATABASE TABLES")
print("=" * 60)

tables = ["users", "marks", "gpa_history", "transcripts", "grading_scale_rows"]

for table in tables:
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=0"
        req = urllib.request.Request(url, headers=headers)
        res = urllib.request.urlopen(req)
        status = res.getcode()
        print(f"  [OK] {table:25s} - exists (HTTP {status})")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  [ERROR] {table:25s} - HTTP {e.code}: {body}")
    except Exception as e:
        print(f"  [ERROR] {table:25s} - {e}")

# 2. Check storage buckets
print("\n" + "=" * 60)
print("CHECKING STORAGE BUCKETS")
print("=" * 60)

try:
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    req = urllib.request.Request(url, headers=headers)
    res = urllib.request.urlopen(req)
    buckets = json.loads(res.read().decode())
    for b in buckets:
        size_mb = (b.get("file_size_limit", 0) or 0) / (1024 * 1024)
        public = "Public" if b.get("public") else "Private"
        mimes = b.get("allowed_mime_types", [])
        print(f"  [OK] {b['name']:25s} - {public}, {size_mb:.0f}MB, types: {mimes}")
    if not buckets:
        print("  [INFO] No storage buckets found")
except Exception as e:
    print(f"  [ERROR] Checking buckets: {e}")

# 3. Check RLS status (anon key)
print("\n" + "=" * 60)
print("CHECKING RLS POLICIES (via Anon query)")
print("=" * 60)

if ANON_KEY:
    anon_headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
    }
    for table in tables:
        try:
            url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1"
            req = urllib.request.Request(url, headers=anon_headers)
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode())
            print(f"  [INFO] {table:25s} - Anon accessible (got {len(data)} rows)")
        except urllib.error.HTTPError as e:
            print(f"  [OK] {table:25s} - RLS active / blocked anon (HTTP {e.code})")
        except Exception as e:
            print(f"  [INFO] {table:25s} - {e}")
else:
    print("  [SKIP] Set NEXT_PUBLIC_SUPABASE_ANON_KEY to test RLS.")

print("\n" + "=" * 60)
print("DATABASE CHECK COMPLETE")
print("=" * 60)
