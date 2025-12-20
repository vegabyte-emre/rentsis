#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FranchiseAPITester:
    def __init__(self, base_url="https://carfleet-hub-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.superadmin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.superadmin_token:
            test_headers['Authorization'] = f'Bearer {self.superadmin_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
                if success:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                else:
                    print(f"   Error Response: {json.dumps(response_data, indent=2)}")
            except:
                response_data = response.text[:200] if response.text else "No response body"
                if not success:
                    print(f"   Error Text: {response_data}")
                
            self.log_test(name, success, 
                         f"Expected {expected_status}, got {response.status_code}" if not success else "",
                         response_data)
            
            return success, response_data

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_superadmin_login(self):
        """Test SuperAdmin login"""
        success, response = self.run_test(
            "SuperAdmin Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "superadmin@example.com",
                "password": "superadmin123"
            }
        )
        
        if success and response and 'access_token' in response:
            self.superadmin_token = response['access_token']
            print(f"   ✅ SuperAdmin token obtained")
            return True
        else:
            print(f"   ❌ Failed to get SuperAdmin token")
            return False

    def test_franchise_application(self):
        """Test franchise application submission"""
        franchise_data = {
            "full_name": "Test Franchise Owner",
            "email": "test.franchise@example.com",
            "phone": "+90 555 123 4567",
            "city": "İstanbul",
            "district": "Kadıköy",
            "address": "Test Address 123",
            "experience_years": 5,
            "current_vehicle_count": 10,
            "has_office": True,
            "investment_budget": "250000-500000",
            "message": "Test franchise application message"
        }
        
        success, response = self.run_test(
            "Franchise Application Submission",
            "POST",
            "api/franchise/apply",
            200,
            data=franchise_data
        )
        
        if success and response:
            application_number = response.get('application_number')
            if application_number:
                print(f"   ✅ Application number: {application_number}")
                return application_number
        
        return None

    def test_get_franchises_list(self):
        """Test getting franchises list (SuperAdmin)"""
        success, response = self.run_test(
            "Get Franchises List",
            "GET",
            "api/superadmin/franchises?limit=100",
            200
        )
        
        if success and response:
            franchises = response.get('franchises', [])
            stats = response.get('stats', {})
            print(f"   ✅ Found {len(franchises)} franchises")
            print(f"   ✅ Stats: {stats}")
            return franchises
        
        return []

    def test_franchise_status_update(self, franchise_id):
        """Test updating franchise status"""
        success, response = self.run_test(
            "Update Franchise Status",
            "PATCH",
            f"api/superadmin/franchises/{franchise_id}/status?status=under_review",
            200
        )
        
        return success

    def test_franchise_detail_view(self, franchise_id):
        """Test getting franchise details"""
        success, response = self.run_test(
            "Get Franchise Details",
            "GET",
            f"api/superadmin/franchises/{franchise_id}",
            200
        )
        
        return success, response

    def run_all_tests(self):
        """Run all franchise-related tests"""
        print("🚀 Starting Franchise Management System Tests")
        print("=" * 60)
        
        # Step 1: Login as SuperAdmin
        if not self.test_superadmin_login():
            print("❌ Cannot proceed without SuperAdmin access")
            return False
        
        # Step 2: Test franchise application
        application_number = self.test_franchise_application()
        if not application_number:
            print("❌ Franchise application failed")
            return False
        
        # Step 3: Get franchises list
        franchises = self.test_get_franchises_list()
        if not franchises:
            print("⚠️  No franchises found or API failed")
        
        # Step 4: Find our test franchise and test status update
        test_franchise = None
        for franchise in franchises:
            if franchise.get('application_number') == application_number:
                test_franchise = franchise
                break
        
        if test_franchise:
            franchise_id = test_franchise.get('id')
            print(f"   ✅ Found test franchise: {franchise_id}")
            
            # Test status update
            self.test_franchise_status_update(franchise_id)
            
            # Test detail view
            self.test_franchise_detail_view(franchise_id)
        else:
            print("⚠️  Could not find test franchise for status update tests")
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Save results to file
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%",
            "test_results": self.test_results
        }
        
        with open('/app/test_reports/franchise_backend_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Results saved to: /app/test_reports/franchise_backend_test_results.json")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FranchiseAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        tester.print_summary()
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        tester.print_summary()
        return 1

if __name__ == "__main__":
    sys.exit(main())