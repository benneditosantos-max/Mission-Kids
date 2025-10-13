#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class MissionKidsAPITester:
    def __init__(self, base_url="https://kidquest.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.parent_token = None
        self.child_token = None
        self.parent_id = None
        self.child_id = None
        self.task_id = None
        self.goal_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, token=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            headers.pop('Content-Type', None)  # Let requests set it for multipart
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=data if not data else None)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def test_parent_registration(self):
        """Test parent user registration"""
        test_email = f"parent_{uuid.uuid4().hex[:8]}@test.com"
        data = {
            "email": test_email,
            "name": "Test Parent",
            "password": "TestPass123!",
            "role": "parent",
            "allowance_goal": 100.0
        }
        
        response = self.make_request('POST', 'auth/register', data)
        
        if response and response.status_code == 200:
            result = response.json()
            if 'token' in result and 'user' in result:
                self.parent_token = result['token']
                self.parent_id = result['user']['id']
                self.log_test("Parent Registration", True)
                return True
            else:
                self.log_test("Parent Registration", False, "Missing token or user in response")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Parent Registration", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_child_registration(self):
        """Test child user registration via POST /api/children"""
        if not self.parent_token:
            self.log_test("Child Registration", False, "No parent token available")
            return False
            
        test_email = f"child_{uuid.uuid4().hex[:8]}@test.com"
        data = {
            "email": test_email,
            "name": "Test Child",
            "pin": "1234",
            "avatar": "hero1",
            "allowance_goal": 50.0
        }
        
        response = self.make_request('POST', 'children', data, token=self.parent_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if 'success' in result and 'child' in result:
                child_data = result['child']
                self.child_id = child_data['id']
                # Verify initial financial values
                if (child_data.get('earned', 0) == 0.0 and 
                    child_data.get('total_allowance', 0) == 0.0 and
                    child_data.get('xp', 0) == 0 and
                    child_data.get('level', 1) == 1):
                    self.log_test("Child Registration", True)
                    return True
                else:
                    self.log_test("Child Registration", False, "Initial financial values incorrect")
            else:
                self.log_test("Child Registration", False, "Missing success or child in response")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Child Registration", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_parent_login(self):
        """Test parent login"""
        data = {
            "email": f"parent_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!"
        }
        
        # First register a parent for login test
        reg_response = self.make_request('POST', 'auth/register', {
            **data,
            "name": "Login Test Parent",
            "role": "parent"
        })
        
        if not reg_response or reg_response.status_code != 200:
            self.log_test("Parent Login", False, "Failed to create test parent")
            return False
        
        # Now test login
        login_response = self.make_request('POST', 'auth/login', data)
        
        if login_response and login_response.status_code == 200:
            result = login_response.json()
            if 'token' in result and 'user' in result:
                self.log_test("Parent Login", True)
                return True
            else:
                self.log_test("Parent Login", False, "Missing token or user in response")
        else:
            error_msg = login_response.json().get('detail', 'Unknown error') if login_response else 'No response'
            self.log_test("Parent Login", False, f"Status: {login_response.status_code if login_response else 'None'}, Error: {error_msg}")
        
        return False

    def test_child_login(self):
        """Test child login with PIN"""
        if not self.child_id:
            self.log_test("Child Login", False, "No child registered for login test")
            return False
            
        # Get child email from parent's children list
        children_response = self.make_request('GET', 'users/children', token=self.parent_token)
        if not children_response or children_response.status_code != 200:
            self.log_test("Child Login", False, "Cannot get children list")
            return False
            
        children = children_response.json()
        child_data = next((child for child in children if child['id'] == self.child_id), None)
        if not child_data:
            self.log_test("Child Login", False, "Child not found in children list")
            return False
            
        data = {
            "email": child_data['email'],
            "pin": "1234"
        }
        
        login_response = self.make_request('POST', 'auth/login', data)
        
        if login_response and login_response.status_code == 200:
            result = login_response.json()
            if 'token' in result and 'user' in result:
                self.child_token = result['token']
                self.log_test("Child Login", True)
                return True
            else:
                self.log_test("Child Login", False, "Missing token or user in response")
        else:
            error_msg = login_response.json().get('detail', 'Unknown error') if login_response else 'No response'
            self.log_test("Child Login", False, f"Status: {login_response.status_code if login_response else 'None'}, Error: {error_msg}")
        
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.parent_token:
            self.log_test("Get Current User", False, "No parent token available")
            return False
            
        response = self.make_request('GET', 'users/me', token=self.parent_token)
        
        if response and response.status_code == 200:
            user_data = response.json()
            if 'id' in user_data and 'email' in user_data and 'role' in user_data:
                self.log_test("Get Current User", True)
                return True
            else:
                self.log_test("Get Current User", False, "Missing required user fields")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Current User", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_get_children(self):
        """Test getting children list"""
        if not self.parent_token:
            self.log_test("Get Children", False, "No parent token available")
            return False
            
        response = self.make_request('GET', 'users/children', token=self.parent_token)
        
        if response and response.status_code == 200:
            children = response.json()
            if isinstance(children, list):
                self.log_test("Get Children", True)
                return True
            else:
                self.log_test("Get Children", False, "Response is not a list")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Children", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_create_task(self):
        """Test creating a task"""
        if not self.parent_token or not self.child_id:
            self.log_test("Create Task", False, "Missing parent token or child ID")
            return False
            
        data = {
            "title": "Test Task",
            "description": "This is a test task",
            "child_id": self.child_id,
            "value": 5.0,
            "xp": 10,
            "frequency": "daily",
            "photo_required": False,
            "approval_required": True
        }
        
        response = self.make_request('POST', 'tasks', data, token=self.parent_token)
        
        if response and response.status_code == 200:
            task_data = response.json()
            if 'id' in task_data:
                self.task_id = task_data['id']
                self.log_test("Create Task", True)
                return True
            else:
                self.log_test("Create Task", False, "Missing task ID in response")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Create Task", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_get_tasks(self):
        """Test getting tasks"""
        if not self.parent_token:
            self.log_test("Get Tasks", False, "No parent token available")
            return False
            
        response = self.make_request('GET', 'tasks', token=self.parent_token)
        
        if response and response.status_code == 200:
            tasks = response.json()
            if isinstance(tasks, list):
                self.log_test("Get Tasks", True)
                return True
            else:
                self.log_test("Get Tasks", False, "Response is not a list")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Tasks", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_complete_task(self):
        """Test completing a task"""
        if not self.child_token or not self.task_id:
            self.log_test("Complete Task", False, "Missing child token or task ID")
            return False
            
        response = self.make_request('POST', f'tasks/{self.task_id}/complete', token=self.child_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get('success'):
                self.log_test("Complete Task", True)
                return True
            else:
                self.log_test("Complete Task", False, "Success field is False")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Complete Task", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_approve_task(self):
        """Test approving a task"""
        if not self.parent_token or not self.task_id:
            self.log_test("Approve Task", False, "Missing parent token or task ID")
            return False
            
        response = self.make_request('POST', f'tasks/{self.task_id}/approve', token=self.parent_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get('success'):
                self.log_test("Approve Task", True)
                return True
            else:
                self.log_test("Approve Task", False, "Success field is False")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Approve Task", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_create_savings_goal(self):
        """Test creating a savings goal"""
        if not self.parent_token or not self.child_id:
            self.log_test("Create Savings Goal", False, "Missing parent token or child ID")
            return False
            
        data = {
            "child_id": self.child_id,
            "name": "Test Goal",
            "target": 50.0
        }
        
        response = self.make_request('POST', 'savings-goals', data, token=self.parent_token)
        
        if response and response.status_code == 200:
            goal_data = response.json()
            if 'id' in goal_data:
                self.goal_id = goal_data['id']
                self.log_test("Create Savings Goal", True)
                return True
            else:
                self.log_test("Create Savings Goal", False, "Missing goal ID in response")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Create Savings Goal", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_get_savings_goals(self):
        """Test getting savings goals"""
        if not self.child_token or not self.child_id:
            self.log_test("Get Savings Goals", False, "Missing child token or child ID")
            return False
            
        response = self.make_request('GET', f'savings-goals/{self.child_id}', token=self.child_token)
        
        if response and response.status_code == 200:
            goals = response.json()
            if isinstance(goals, list):
                self.log_test("Get Savings Goals", True)
                return True
            else:
                self.log_test("Get Savings Goals", False, "Response is not a list")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Savings Goals", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_get_transactions(self):
        """Test getting transactions"""
        if not self.child_token or not self.child_id:
            self.log_test("Get Transactions", False, "Missing child token or child ID")
            return False
            
        response = self.make_request('GET', f'transactions/{self.child_id}', token=self.child_token)
        
        if response and response.status_code == 200:
            transactions = response.json()
            if isinstance(transactions, list):
                self.log_test("Get Transactions", True)
                return True
            else:
                self.log_test("Get Transactions", False, "Response is not a list")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Get Transactions", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_pay_allowance(self):
        """Test paying allowance"""
        if not self.parent_token or not self.child_id:
            self.log_test("Pay Allowance", False, "Missing parent token or child ID")
            return False
            
        response = self.make_request('POST', 'allowance/pay', data={"child_id": self.child_id}, token=self.parent_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get('success') and 'amount_paid' in result:
                self.log_test("Pay Allowance", True)
                return True
            else:
                self.log_test("Pay Allowance", False, "Missing success or amount_paid in response")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Pay Allowance", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def test_update_avatar(self):
        """Test updating avatar"""
        if not self.child_token:
            self.log_test("Update Avatar", False, "No child token available")
            return False
            
        response = self.make_request('PUT', 'users/avatar', data={"avatar": "wizard"}, token=self.child_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get('success'):
                self.log_test("Update Avatar", True)
                return True
            else:
                self.log_test("Update Avatar", False, "Success field is False")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Update Avatar", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting MissionKids API Tests...")
        print("=" * 50)
        
        # Authentication tests
        print("\n📝 Authentication Tests:")
        self.test_parent_registration()
        self.test_child_registration()
        self.test_parent_login()
        self.test_child_login()
        
        # User management tests
        print("\n👤 User Management Tests:")
        self.test_get_current_user()
        self.test_get_children()
        self.test_update_avatar()
        
        # Task management tests
        print("\n🎯 Task Management Tests:")
        self.test_create_task()
        self.test_get_tasks()
        self.test_complete_task()
        self.test_approve_task()
        
        # Financial tests
        print("\n💰 Financial Tests:")
        self.test_create_savings_goal()
        self.test_get_savings_goals()
        self.test_get_transactions()
        self.test_pay_allowance()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary:")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MissionKidsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())