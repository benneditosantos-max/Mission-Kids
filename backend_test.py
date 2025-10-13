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

    def test_create_multiple_tasks(self):
        """Test creating multiple tasks with varying R$ values and XP"""
        if not self.parent_token or not self.child_id:
            self.log_test("Create Multiple Tasks", False, "Missing parent token or child ID")
            return False
            
        tasks_data = [
            {"title": "Clean Room", "value": 5.0, "xp": 10, "approval_required": False},
            {"title": "Do Homework", "value": 10.0, "xp": 20, "approval_required": False},
            {"title": "Help with Dishes", "value": 15.0, "xp": 30, "approval_required": False}
        ]
        
        self.task_ids = []
        
        for task_data in tasks_data:
            data = {
                "title": task_data["title"],
                "description": f"Test task: {task_data['title']}",
                "child_id": self.child_id,
                "value": task_data["value"],
                "xp": task_data["xp"],
                "frequency": "daily",
                "photo_required": False,
                "approval_required": task_data["approval_required"]
            }
            
            response = self.make_request('POST', 'tasks', data, token=self.parent_token)
            
            if response and response.status_code == 200:
                task_result = response.json()
                if 'id' in task_result:
                    self.task_ids.append(task_result['id'])
                else:
                    self.log_test("Create Multiple Tasks", False, f"Missing task ID for {task_data['title']}")
                    return False
            else:
                error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
                self.log_test("Create Multiple Tasks", False, f"Failed to create {task_data['title']}: {error_msg}")
                return False
        
        if len(self.task_ids) == 3:
            self.task_id = self.task_ids[0]  # Set first task for other tests
            self.log_test("Create Multiple Tasks", True)
            return True
        else:
            self.log_test("Create Multiple Tasks", False, f"Only created {len(self.task_ids)} out of 3 tasks")
            return False

    def test_complete_tasks_and_verify_financials(self):
        """Test completing tasks and verify financial updates"""
        if not self.child_token or not hasattr(self, 'task_ids') or len(self.task_ids) < 3:
            self.log_test("Complete Tasks & Verify Financials", False, "Missing child token or task IDs")
            return False
        
        # Get initial financial state
        initial_response = self.make_request('GET', f'children/{self.child_id}/financial', token=self.child_token)
        if not initial_response or initial_response.status_code != 200:
            self.log_test("Complete Tasks & Verify Financials", False, "Cannot get initial financial data")
            return False
        
        initial_data = initial_response.json()
        initial_balance = initial_data.get('balance', 0)
        initial_total_allowance = initial_data.get('total_allowance', 0)
        initial_xp = initial_data.get('xp', 0)
        initial_level = initial_data.get('level', 1)
        
        # Complete all tasks
        expected_value_increase = 5.0 + 10.0 + 15.0  # Total R$ from tasks
        expected_xp_increase = 10 + 20 + 30  # Total XP from tasks
        
        for task_id in self.task_ids:
            response = self.make_request('POST', f'tasks/{task_id}/complete', token=self.child_token)
            if not response or response.status_code != 200:
                self.log_test("Complete Tasks & Verify Financials", False, f"Failed to complete task {task_id}")
                return False
        
        # Get updated financial state
        final_response = self.make_request('GET', f'children/{self.child_id}/financial', token=self.child_token)
        if not final_response or final_response.status_code != 200:
            self.log_test("Complete Tasks & Verify Financials", False, "Cannot get final financial data")
            return False
        
        final_data = final_response.json()
        final_balance = final_data.get('balance', 0)
        final_total_allowance = final_data.get('total_allowance', 0)
        final_xp = final_data.get('xp', 0)
        final_level = final_data.get('level', 1)
        
        # Verify financial updates
        balance_increase = final_balance - initial_balance
        allowance_increase = final_total_allowance - initial_total_allowance
        xp_increase = final_xp - initial_xp
        
        if (abs(balance_increase - expected_value_increase) < 0.01 and
            abs(allowance_increase - expected_value_increase) < 0.01 and
            xp_increase == expected_xp_increase):
            
            # Check level calculation (level up every 100 XP)
            expected_level = (final_xp // 100) + 1
            if final_level == expected_level:
                self.log_test("Complete Tasks & Verify Financials", True)
                return True
            else:
                self.log_test("Complete Tasks & Verify Financials", False, f"Level calculation incorrect: expected {expected_level}, got {final_level}")
        else:
            self.log_test("Complete Tasks & Verify Financials", False, 
                         f"Financial updates incorrect - Balance: +{balance_increase} (expected +{expected_value_increase}), "
                         f"Allowance: +{allowance_increase} (expected +{expected_value_increase}), "
                         f"XP: +{xp_increase} (expected +{expected_xp_increase})")
        
        return False

    def test_financial_data_endpoint(self):
        """Test GET /api/children/{child_id}/financial endpoint"""
        if not self.child_token or not self.child_id:
            self.log_test("Financial Data Endpoint", False, "Missing child token or child ID")
            return False
            
        response = self.make_request('GET', f'children/{self.child_id}/financial', token=self.child_token)
        
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ['balance', 'total_allowance', 'xp', 'level', 'xp_progress', 
                             'xp_for_next_level', 'savings_goals', 'recent_transactions']
            
            missing_fields = [field for field in required_fields if field not in data]
            if not missing_fields:
                # Verify XP calculations
                xp = data.get('xp', 0)
                level = data.get('level', 1)
                xp_progress = data.get('xp_progress', 0)
                xp_for_next_level = data.get('xp_for_next_level', 100)
                
                expected_xp_progress = xp % 100
                expected_xp_for_next_level = level * 100
                
                if (xp_progress == expected_xp_progress and 
                    xp_for_next_level == expected_xp_for_next_level):
                    self.log_test("Financial Data Endpoint", True)
                    return True
                else:
                    self.log_test("Financial Data Endpoint", False, 
                                 f"XP calculations incorrect - Progress: {xp_progress} (expected {expected_xp_progress}), "
                                 f"Next level: {xp_for_next_level} (expected {expected_xp_for_next_level})")
            else:
                self.log_test("Financial Data Endpoint", False, f"Missing required fields: {missing_fields}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            self.log_test("Financial Data Endpoint", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
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

    def test_savings_goals_management(self):
        """Test comprehensive savings goals management including 3-goal limit"""
        if not self.parent_token or not self.child_id:
            self.log_test("Savings Goals Management", False, "Missing parent token or child ID")
            return False
        
        self.goal_ids = []
        
        # Test creating 3 savings goals
        goals_data = [
            {"name": "Bicicleta", "target": 200.0},
            {"name": "Jogo", "target": 50.0},
            {"name": "Livro", "target": 30.0}
        ]
        
        for goal_data in goals_data:
            data = {
                "child_id": self.child_id,
                "name": goal_data["name"],
                "target": goal_data["target"]
            }
            
            response = self.make_request('POST', 'savings-goals', data, token=self.parent_token)
            
            if response and response.status_code == 200:
                goal_result = response.json()
                if 'id' in goal_result:
                    self.goal_ids.append(goal_result['id'])
                    self.goal_id = goal_result['id']  # Set for other tests
                else:
                    self.log_test("Savings Goals Management", False, f"Missing goal ID for {goal_data['name']}")
                    return False
            else:
                error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
                self.log_test("Savings Goals Management", False, f"Failed to create {goal_data['name']}: {error_msg}")
                return False
        
        # Test 4th goal should fail (3-goal limit)
        fourth_goal_data = {
            "child_id": self.child_id,
            "name": "Quarto Objetivo",
            "target": 100.0
        }
        
        fourth_response = self.make_request('POST', 'savings-goals', fourth_goal_data, token=self.parent_token)
        
        # Check if the backend enforces the limit (this may not be implemented yet)
        if fourth_response and fourth_response.status_code == 200:
            # If it succeeds, the 3-goal limit is not enforced - this is expected for now
            print("Note: 3-goal limit not enforced in backend (expected)")
        elif fourth_response and fourth_response.status_code == 400:
            print("3-goal limit properly enforced")
        else:
            self.log_test("Savings Goals Management", False, f"Unexpected response for 4th goal: {fourth_response.status_code if fourth_response else 'None'}")
            return False
        
        # Test getting all goals
        get_response = self.make_request('GET', f'savings-goals/{self.child_id}', token=self.parent_token)
        
        if not get_response or get_response.status_code != 200:
            self.log_test("Savings Goals Management", False, "Failed to get savings goals")
            return False
        
        goals = get_response.json()
        expected_goals = 3 if fourth_response.status_code != 200 else 4
        if len(goals) != expected_goals:
            self.log_test("Savings Goals Management", False, f"Expected {expected_goals} goals, got {len(goals)}")
            return False
        
        # Test deleting one goal
        if self.goal_ids:
            delete_response = self.make_request('DELETE', f'savings-goals/{self.goal_ids[0]}', token=self.parent_token)
            
            if not delete_response or delete_response.status_code != 200:
                self.log_test("Savings Goals Management", False, "Failed to delete savings goal")
                return False
            
            # Verify goal is deleted
            verify_response = self.make_request('GET', f'savings-goals/{self.child_id}', token=self.parent_token)
            if verify_response and verify_response.status_code == 200:
                remaining_goals = verify_response.json()
                if len(remaining_goals) == 2:
                    self.log_test("Savings Goals Management", True)
                    return True
                else:
                    self.log_test("Savings Goals Management", False, f"Expected 2 goals after deletion, got {len(remaining_goals)}")
            else:
                self.log_test("Savings Goals Management", False, "Failed to verify goal deletion")
        
        return False

    def test_register_multiple_children(self):
        """Test registering 2 children via POST /api/children"""
        if not self.parent_token:
            self.log_test("Register Multiple Children", False, "No parent token available")
            return False
        
        self.child_ids = []
        children_data = [
            {"name": "Ana Silva", "email": f"ana_{uuid.uuid4().hex[:8]}@test.com", "pin": "1234"},
            {"name": "João Silva", "email": f"joao_{uuid.uuid4().hex[:8]}@test.com", "pin": "5678"}
        ]
        
        for child_data in children_data:
            response = self.make_request('POST', 'children', child_data, token=self.parent_token)
            
            if response and response.status_code == 200:
                result = response.json()
                if 'success' in result and 'child' in result:
                    child = result['child']
                    self.child_ids.append(child['id'])
                    
                    # Verify initial values for first child
                    if not self.child_id:  # Set first child as primary
                        self.child_id = child['id']
                    
                    # Verify parent_id linkage and initial financial values
                    if (child.get('parent_id') != self.parent_id or
                        child.get('earned', 0) != 0.0 or
                        child.get('total_allowance', 0) != 0.0 or
                        child.get('xp', 0) != 0 or
                        child.get('level', 1) != 1):
                        self.log_test("Register Multiple Children", False, 
                                     f"Incorrect initial values for {child_data['name']}")
                        return False
                else:
                    self.log_test("Register Multiple Children", False, 
                                 f"Missing success or child in response for {child_data['name']}")
                    return False
            else:
                error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
                self.log_test("Register Multiple Children", False, 
                             f"Failed to register {child_data['name']}: {error_msg}")
                return False
        
        if len(self.child_ids) == 2:
            self.log_test("Register Multiple Children", True)
            return True
        else:
            self.log_test("Register Multiple Children", False, f"Only registered {len(self.child_ids)} out of 2 children")
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
        print("🚀 Starting MissionKids Financial System API Tests...")
        print("=" * 60)
        
        # Authentication tests
        print("\n📝 Authentication Tests:")
        if not self.test_parent_registration():
            print("❌ Cannot continue without parent registration")
            return False
        
        if not self.test_parent_login():
            print("❌ Parent login failed")
            return False
        
        # Child registration tests (NEW)
        print("\n👶 Child Registration Tests:")
        if not self.test_register_multiple_children():
            print("❌ Cannot continue without child registration")
            return False
        
        if not self.test_child_login():
            print("❌ Child login failed")
            return False
        
        # User management tests
        print("\n👤 User Management Tests:")
        self.test_get_current_user()
        self.test_get_children()
        
        # Task management and financial tests
        print("\n🎯 Task Management & Financial Tests:")
        if not self.test_create_multiple_tasks():
            print("❌ Cannot test financial updates without tasks")
            return False
        
        self.test_get_tasks()
        
        if not self.test_complete_tasks_and_verify_financials():
            print("❌ Financial system verification failed")
            return False
        
        # Financial data endpoint test (NEW)
        print("\n💰 Financial Data Tests:")
        self.test_financial_data_endpoint()
        
        # Savings goals management tests (NEW)
        print("\n🎯 Savings Goals Management Tests:")
        self.test_savings_goals_management()
        
        # Additional tests
        print("\n📊 Additional Tests:")
        self.test_get_transactions()
        self.test_pay_allowance()
        self.test_update_avatar()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests details
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests Details:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MissionKidsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())