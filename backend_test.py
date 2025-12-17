#!/usr/bin/env python3
"""
FleetEase Backend API Test Suite
Tests all API endpoints for the corporate car rental platform
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class FleetEaseAPITester:
    def __init__(self, base_url="https://fleetease-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.superadmin_token = None
        self.firma_admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_company_id = None
        self.test_vehicle_id = None
        self.test_customer_id = None
        self.test_reservation_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, response = self.make_request('GET', '')
        self.log_test("Root Endpoint", success, 
                     "" if success else f"Status: {response.get('status_code', 'Unknown')}")
        
        # Test health endpoint
        success, response = self.make_request('GET', 'health')
        self.log_test("Health Check", success,
                     "" if success else f"Status: {response.get('status_code', 'Unknown')}")

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Test SuperAdmin login
        login_data = {
            "email": "admin@fleetease.com",
            "password": "admin123"
        }
        success, response = self.make_request('POST', 'auth/login', login_data)
        if success and 'access_token' in response:
            self.superadmin_token = response['access_token']
            self.log_test("SuperAdmin Login", True)
        else:
            self.log_test("SuperAdmin Login", False, f"Response: {response}")
        
        # Test FirmaAdmin login
        login_data = {
            "email": "firma@fleetease.com", 
            "password": "firma123"
        }
        success, response = self.make_request('POST', 'auth/login', login_data)
        if success and 'access_token' in response:
            self.firma_admin_token = response['access_token']
            self.log_test("FirmaAdmin Login", True)
        else:
            self.log_test("FirmaAdmin Login", False, f"Response: {response}")
        
        # Test invalid login
        invalid_data = {
            "email": "invalid@test.com",
            "password": "wrongpass"
        }
        success, response = self.make_request('POST', 'auth/login', invalid_data, expected_status=401)
        self.log_test("Invalid Login (Should Fail)", success)
        
        # Test /auth/me endpoint
        if self.superadmin_token:
            success, response = self.make_request('GET', 'auth/me', token=self.superadmin_token)
            self.log_test("Get Current User", success)

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n🔍 Testing Dashboard Stats...")
        
        if not self.superadmin_token:
            self.log_test("Dashboard Stats", False, "No auth token available")
            return
        
        success, response = self.make_request('GET', 'dashboard/stats', token=self.superadmin_token)
        if success:
            required_fields = ['total_vehicles', 'available_vehicles', 'rented_vehicles', 
                             'total_customers', 'active_reservations', 'total_revenue']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Dashboard Stats", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Dashboard Stats", True)
        else:
            self.log_test("Dashboard Stats", False, f"Response: {response}")

    def test_companies_api(self):
        """Test companies API endpoints"""
        print("\n🔍 Testing Companies API...")
        
        if not self.superadmin_token:
            self.log_test("Companies API", False, "No SuperAdmin token available")
            return
        
        # Test list companies
        success, response = self.make_request('GET', 'companies', token=self.superadmin_token)
        self.log_test("List Companies", success)
        
        # Test create company
        company_data = {
            "name": f"Test Company {datetime.now().strftime('%H%M%S')}",
            "code": f"TEST{datetime.now().strftime('%H%M%S')}",
            "address": "Test Address",
            "phone": "+90 555 123 4567",
            "email": "test@company.com",
            "tax_number": "1234567890"
        }
        success, response = self.make_request('POST', 'companies', company_data, token=self.superadmin_token, expected_status=200)
        if success and 'id' in response:
            self.test_company_id = response['id']
            self.log_test("Create Company", True)
        else:
            self.log_test("Create Company", False, f"Response: {response}")

    def test_vehicles_api(self):
        """Test vehicles API endpoints"""
        print("\n🔍 Testing Vehicles API...")
        
        if not self.superadmin_token:
            self.log_test("Vehicles API", False, "No auth token available")
            return
        
        # Test list vehicles
        success, response = self.make_request('GET', 'vehicles', token=self.superadmin_token)
        self.log_test("List Vehicles", success)
        
        # Test create vehicle
        vehicle_data = {
            "plate": f"34TEST{datetime.now().strftime('%H%M')}",
            "brand": "Toyota",
            "model": "Corolla",
            "year": 2023,
            "segment": "Sedan",
            "transmission": "otomatik",
            "fuel_type": "benzin",
            "seat_count": 5,
            "door_count": 4,
            "daily_rate": 250.0,
            "color": "Beyaz",
            "mileage": 15000
        }
        success, response = self.make_request('POST', 'vehicles', vehicle_data, token=self.superadmin_token, expected_status=200)
        if success and 'id' in response:
            self.test_vehicle_id = response['id']
            self.log_test("Create Vehicle", True)
        else:
            self.log_test("Create Vehicle", False, f"Response: {response}")
        
        # Test get vehicle by ID
        if self.test_vehicle_id:
            success, response = self.make_request('GET', f'vehicles/{self.test_vehicle_id}', token=self.superadmin_token)
            self.log_test("Get Vehicle by ID", success)

    def test_customers_api(self):
        """Test customers API endpoints"""
        print("\n🔍 Testing Customers API...")
        
        if not self.superadmin_token:
            self.log_test("Customers API", False, "No auth token available")
            return
        
        # Test list customers
        success, response = self.make_request('GET', 'customers', token=self.superadmin_token)
        self.log_test("List Customers", success)
        
        # Test create customer
        customer_data = {
            "tc_no": f"1234567890{datetime.now().strftime('%S')}",
            "full_name": "Test Müşteri",
            "email": f"test{datetime.now().strftime('%H%M%S')}@customer.com",
            "phone": "+90 555 987 6543",
            "address": "Test Müşteri Adresi",
            "license_no": "TEST123456",
            "license_class": "B"
        }
        success, response = self.make_request('POST', 'customers', customer_data, token=self.superadmin_token, expected_status=200)
        if success and 'id' in response:
            self.test_customer_id = response['id']
            self.log_test("Create Customer", True)
        else:
            self.log_test("Create Customer", False, f"Response: {response}")

    def test_reservations_api(self):
        """Test reservations API endpoints"""
        print("\n🔍 Testing Reservations API...")
        
        if not self.superadmin_token or not self.test_vehicle_id or not self.test_customer_id:
            self.log_test("Reservations API", False, "Missing prerequisites (vehicle/customer)")
            return
        
        # Test list reservations
        success, response = self.make_request('GET', 'reservations', token=self.superadmin_token)
        self.log_test("List Reservations", success)
        
        # Test create reservation
        start_date = datetime.now() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        
        reservation_data = {
            "vehicle_id": self.test_vehicle_id,
            "customer_id": self.test_customer_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "pickup_location": "Test Pickup Location",
            "return_location": "Test Return Location",
            "notes": "Test reservation notes"
        }
        success, response = self.make_request('POST', 'reservations', reservation_data, token=self.superadmin_token, expected_status=200)
        if success and 'id' in response:
            self.test_reservation_id = response['id']
            self.log_test("Create Reservation", True)
        else:
            self.log_test("Create Reservation", False, f"Response: {response}")

    def test_gps_api(self):
        """Test GPS tracking API (mock data)"""
        print("\n🔍 Testing GPS API...")
        
        if not self.superadmin_token:
            self.log_test("GPS API", False, "No auth token available")
            return
        
        success, response = self.make_request('GET', 'gps/vehicles', token=self.superadmin_token)
        self.log_test("GPS Vehicle Locations", success)

    def test_payments_api(self):
        """Test payments API endpoints"""
        print("\n🔍 Testing Payments API...")
        
        if not self.superadmin_token:
            self.log_test("Payments API", False, "No auth token available")
            return
        
        # Test list payments
        success, response = self.make_request('GET', 'payments', token=self.superadmin_token)
        self.log_test("List Payments", success)
        
        # Test create payment (if we have a reservation)
        if self.test_reservation_id:
            payment_data = {
                "reservation_id": self.test_reservation_id,
                "amount": 750.0,
                "payment_type": "card",
                "card_holder": "Test Cardholder"
            }
            success, response = self.make_request('POST', 'payments', payment_data, token=self.superadmin_token, expected_status=200)
            self.log_test("Create Payment", success)

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔍 Testing Role-Based Access...")
        
        if not self.firma_admin_token:
            self.log_test("Role-Based Access", False, "No FirmaAdmin token available")
            return
        
        # FirmaAdmin should NOT be able to access companies endpoint
        success, response = self.make_request('GET', 'companies', token=self.firma_admin_token, expected_status=403)
        self.log_test("FirmaAdmin Companies Access (Should Fail)", success)
        
        # FirmaAdmin should be able to access vehicles
        success, response = self.make_request('GET', 'vehicles', token=self.firma_admin_token)
        self.log_test("FirmaAdmin Vehicles Access", success)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting FleetEase Backend API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        try:
            self.test_health_check()
            self.test_authentication()
            self.test_dashboard_stats()
            self.test_companies_api()
            self.test_vehicles_api()
            self.test_customers_api()
            self.test_reservations_api()
            self.test_gps_api()
            self.test_payments_api()
            self.test_role_based_access()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            return False
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "   Success Rate: 0%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = FleetEaseAPITester()
    
    try:
        success = tester.run_all_tests()
        all_passed = tester.print_summary()
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                'results': tester.test_results
            }, f, indent=2)
        
        return 0 if all_passed else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())