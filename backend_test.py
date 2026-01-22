#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class ZenCycleAPITester:
    def __init__(self, base_url="https://focus-cycles-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
        # Test user credentials
        self.test_email = "testuser@zencycle.com"
        self.test_password = "testpass123"

    def log_result(self, test_name, success, response_data=None, error_msg=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
        else:
            self.failed_tests.append({
                "test": test_name,
                "error": error_msg,
                "response": response_data
            })
            print(f"❌ {test_name} - FAILED")
            if error_msg:
                print(f"   Error: {error_msg}")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_data = response.json() if response.content else {}
            success = response.status_code == expected_status
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test API health check"""
        success, data, status = self.make_request('GET', '', expected_status=200)
        self.log_result("Health Check", success, data, 
                       f"Status: {status}" if not success else None)
        return success

    def test_register(self):
        """Test user registration"""
        # Use unique email to avoid conflicts
        unique_email = f"test_{int(time.time())}@zencycle.com"
        
        register_data = {
            "email": unique_email,
            "password": self.test_password,
            "first_name": "Test",
            "last_name": "User"
        }
        
        success, data, status = self.make_request('POST', 'auth/register', register_data, 200)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.user_id = data['user']['id']
            self.test_email = unique_email  # Update for subsequent tests
            
        self.log_result("User Registration", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, data, status = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.user_id = data['user']['id']
            
        self.log_result("User Login", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_auth_me(self):
        """Test auth token validation"""
        if not self.token:
            self.log_result("Auth Token Validation", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('GET', 'auth/me', expected_status=200)
        self.log_result("Auth Token Validation", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_mood_checkin(self):
        """Test mood check-in"""
        if not self.token:
            self.log_result("Mood Check-in", False, None, "No token available")
            return False
            
        mood_data = {"mood": "energized"}
        success, data, status = self.make_request('POST', 'mood', mood_data, 200)
        self.log_result("Mood Check-in", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_get_today_mood(self):
        """Test get today's mood"""
        if not self.token:
            self.log_result("Get Today Mood", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('GET', 'mood/today', expected_status=200)
        self.log_result("Get Today Mood", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_affirmation_generation(self):
        """Test AI affirmation generation"""
        if not self.token:
            self.log_result("Affirmation Generation", False, None, "No token available")
            return False
            
        affirmation_data = {
            "mood": "energized",
            "career_goal": "become a better developer"
        }
        
        success, data, status = self.make_request('POST', 'affirmation/generate', affirmation_data, 200)
        
        # Check if affirmation text is present
        if success and 'text' in data and data['text']:
            print(f"   Generated affirmation: {data['text']}")
        
        self.log_result("Affirmation Generation", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_get_today_affirmation(self):
        """Test get today's affirmation"""
        if not self.token:
            self.log_result("Get Today Affirmation", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('GET', 'affirmation/today', expected_status=200)
        self.log_result("Get Today Affirmation", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_water_logging(self):
        """Test water intake logging"""
        if not self.token:
            self.log_result("Water Logging", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('POST', 'water', expected_status=200)
        self.log_result("Water Logging", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_get_water_count(self):
        """Test get today's water count"""
        if not self.token:
            self.log_result("Get Water Count", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('GET', 'water/today', expected_status=200)
        self.log_result("Get Water Count", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_profile_update(self):
        """Test profile update"""
        if not self.token:
            self.log_result("Profile Update", False, None, "No token available")
            return False
            
        profile_data = {
            "first_name": "Updated",
            "last_name": "User",
            "office_start_time": "08:00",
            "office_end_time": "18:00",
            "career_goal": "Master full-stack development"
        }
        
        success, data, status = self.make_request('PATCH', 'user/profile', profile_data, 200)
        self.log_result("Profile Update", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_session_creation(self):
        """Test session creation"""
        if not self.token:
            self.log_result("Session Creation", False, None, "No token available")
            return False
            
        session_data = {"session_type": "work"}
        success, data, status = self.make_request('POST', 'session', session_data, 200)
        
        if success and 'id' in data:
            self.session_id = data['id']
            
        self.log_result("Session Creation", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_get_today_sessions(self):
        """Test get today's sessions"""
        if not self.token:
            self.log_result("Get Today Sessions", False, None, "No token available")
            return False
            
        success, data, status = self.make_request('GET', 'session/today', expected_status=200)
        self.log_result("Get Today Sessions", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def test_progress_stats(self):
        """Test progress statistics for different periods"""
        if not self.token:
            self.log_result("Progress Stats", False, None, "No token available")
            return False
            
        periods = ['weekly', 'monthly', 'quarterly']
        all_success = True
        
        for period in periods:
            success, data, status = self.make_request('GET', f'progress/{period}', expected_status=200)
            test_name = f"Progress Stats ({period})"
            self.log_result(test_name, success, data,
                           f"Status: {status}" if not success else None)
            if not success:
                all_success = False
                
        return all_success

    def test_reflection_creation(self):
        """Test reflection creation"""
        if not self.token:
            self.log_result("Reflection Creation", False, None, "No token available")
            return False
            
        reflection_data = {
            "reflection_text": "Today was productive. I completed 3 focus sessions.",
            "hydration_count": 5,
            "break_count": 3
        }
        
        success, data, status = self.make_request('POST', 'reflection', reflection_data, 200)
        self.log_result("Reflection Creation", success, data,
                       f"Status: {status}" if not success else None)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ZenCycle API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register),
            ("User Login", self.test_login),
            ("Auth Token Validation", self.test_auth_me),
            ("Mood Check-in", self.test_mood_checkin),
            ("Get Today Mood", self.test_get_today_mood),
            ("Affirmation Generation", self.test_affirmation_generation),
            ("Get Today Affirmation", self.test_get_today_affirmation),
            ("Water Logging", self.test_water_logging),
            ("Get Water Count", self.test_get_water_count),
            ("Profile Update", self.test_profile_update),
            ("Session Creation", self.test_session_creation),
            ("Get Today Sessions", self.test_get_today_sessions),
            ("Progress Statistics", self.test_progress_stats),
            ("Reflection Creation", self.test_reflection_creation),
        ]
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                self.log_result(test_name, False, None, f"Exception: {str(e)}")
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}")
                if failure['error']:
                    print(f"   Error: {failure['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ZenCycleAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())