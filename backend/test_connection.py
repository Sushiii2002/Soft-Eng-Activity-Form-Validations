# test_connection.py
print("=" * 50)
print("Testing DR3 Hardware Database Connection")
print("=" * 50)

try:
    print("\n1. Loading configuration...")
    from app_config import Config
    print(f"   ✅ Config loaded")
    print(f"   Database: {Config.DB_NAME}")
    print(f"   Host: {Config.DB_HOST}")
    print(f"   User: {Config.DB_USER}")
    
    print("\n2. Testing database connection...")
    from backend.database import Database
    
    print("\n3. Checking MySQL version...")
    result = Database.execute_query("SELECT VERSION() as version", fetch=True)
    if result:
        print(f"   ✅ MySQL Version: {result[0]['version']}")
    
    print("\n4. Checking tables...")
    result = Database.execute_query("SHOW TABLES", fetch=True)
    print(f"   ✅ Found {len(result)} tables:")
    for row in result:
        table_name = list(row.values())[0]
        print(f"      - {table_name}")
    
    print("\n5. Checking users table...")
    result = Database.execute_query("SELECT COUNT(*) as count FROM users", fetch=True)
    print(f"   ✅ Users table exists with {result[0]['count']} records")
    
    print("\n6. Testing password hashing...")
    from backend.auth import AuthManager
    test_password = "Test@123456"
    hashed = AuthManager.hash_password(test_password)
    print(f"   ✅ Password hashing works")
    print(f"   Hash: {hashed[:50]}...")
    
    is_valid, _ = AuthManager.verify_password(hashed, test_password)
    print(f"   ✅ Password verification: {is_valid}")
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("=" * 50)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nTroubleshooting:")
    print("1. Check if MySQL is running")
    print("2. Verify password in .env file")
    print("3. Make sure database 'dr3_hardware_db' exists")
    print("4. Check if tables are created")