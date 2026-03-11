#!/usr/bin/env python3
"""
Backend API Testing for Casero Stars Rental Rating App
Tests all backend endpoints with realistic Spanish data
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://casero-stars.preview.emergentagent.com/api"

class CaseroStarsAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.piso_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
        
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        print("\n=== Testing User Registration ===")
        
        url = f"{self.base_url}/auth/register"
        payload = {
            "email": "maria.garcia@gmail.com",
            "password": "MiCasa123!",
            "name": "María García",
            "user_type": "inquilino"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_data = data["user"]
                    self.log_test("User Registration", True, 
                                f"User registered successfully. ID: {data['user']['id']}", data)
                else:
                    self.log_test("User Registration", False, 
                                "Missing access_token or user in response", data)
            else:
                self.log_test("User Registration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        print("\n=== Testing User Login ===")
        
        url = f"{self.base_url}/auth/login"
        payload = {
            "email": "maria.garcia@gmail.com",
            "password": "MiCasa123!"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    # Update token in case registration failed but login works
                    self.auth_token = data["access_token"]
                    self.user_data = data["user"]
                    self.log_test("User Login", True, 
                                f"Login successful. User: {data['user']['name']}", data)
                else:
                    self.log_test("User Login", False, 
                                "Missing access_token or user in response", data)
            else:
                self.log_test("User Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        print("\n=== Testing Get Current User ===")
        
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return
            
        url = f"{self.base_url}/auth/me"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test("Get Current User", True, 
                                f"User info retrieved: {data['name']} ({data['email']})", data)
                else:
                    self.log_test("Get Current User", False, 
                                "Missing required fields in user data", data)
            else:
                self.log_test("Get Current User", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
    
    def test_create_piso(self):
        """Test POST /api/pisos"""
        print("\n=== Testing Create Piso ===")
        
        if not self.auth_token:
            self.log_test("Create Piso", False, "No auth token available")
            return
            
        url = f"{self.base_url}/pisos"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "direccion": "Calle Gran Vía 45, 3º B",
            "zona": "Centro",
            "precio_mensual": 850.0,
            "descripcion": "Piso luminoso en el centro de Madrid, completamente reformado. Cerca del metro y comercios.",
            "fotos": []
        }
        
        try:
            response = self.session.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "direccion" in data:
                    self.piso_id = data["id"]
                    self.log_test("Create Piso", True, 
                                f"Piso created successfully. ID: {data['id']}", data)
                else:
                    self.log_test("Create Piso", False, 
                                "Missing required fields in piso data", data)
            else:
                self.log_test("Create Piso", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Piso", False, f"Exception: {str(e)}")
    
    def test_list_pisos(self):
        """Test GET /api/pisos"""
        print("\n=== Testing List Pisos ===")
        
        url = f"{self.base_url}/pisos"
        
        try:
            # Test without filter
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("List Pisos (All)", True, 
                                f"Retrieved {len(data)} pisos", {"count": len(data)})
                    
                    # Test with zona filter if we have pisos
                    if len(data) > 0:
                        zona_filter_url = f"{url}?zona=Centro"
                        zona_response = self.session.get(zona_filter_url)
                        
                        if zona_response.status_code == 200:
                            zona_data = zona_response.json()
                            self.log_test("List Pisos (Zona Filter)", True, 
                                        f"Retrieved {len(zona_data)} pisos for Centro", 
                                        {"count": len(zona_data)})
                        else:
                            self.log_test("List Pisos (Zona Filter)", False, 
                                        f"HTTP {zona_response.status_code}: {zona_response.text}")
                else:
                    self.log_test("List Pisos (All)", False, 
                                "Response is not a list", data)
            else:
                self.log_test("List Pisos (All)", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("List Pisos (All)", False, f"Exception: {str(e)}")
    
    def test_get_piso_detail(self):
        """Test GET /api/pisos/{id}"""
        print("\n=== Testing Get Piso Detail ===")
        
        if not self.piso_id:
            self.log_test("Get Piso Detail", False, "No piso ID available")
            return
            
        url = f"{self.base_url}/pisos/{self.piso_id}"
        
        try:
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "valoraciones" in data:
                    self.log_test("Get Piso Detail", True, 
                                f"Piso detail retrieved. Valoraciones: {len(data['valoraciones'])}", data)
                else:
                    self.log_test("Get Piso Detail", False, 
                                "Missing required fields in piso detail", data)
            else:
                self.log_test("Get Piso Detail", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Piso Detail", False, f"Exception: {str(e)}")
    
    def test_create_valoracion(self):
        """Test POST /api/pisos/{id}/valoraciones"""
        print("\n=== Testing Create Valoracion ===")
        
        if not self.auth_token:
            self.log_test("Create Valoracion", False, "No auth token available")
            return
            
        if not self.piso_id:
            self.log_test("Create Valoracion", False, "No piso ID available")
            return
            
        url = f"{self.base_url}/pisos/{self.piso_id}/valoraciones"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "estado_piso": 4,
            "calidad_precio": 3,
            "comportamiento_casero": 5,
            "ubicacion": 4,
            "fotos_reales": 3,
            "comentario": "Muy buen piso, el casero es muy atento y la ubicación es excelente. Solo el precio es un poco alto para la zona."
        }
        
        try:
            response = self.session.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "promedio" in data:
                    self.log_test("Create Valoracion", True, 
                                f"Valoracion created. Average: {data['promedio']}/5", data)
                else:
                    self.log_test("Create Valoracion", False, 
                                "Missing required fields in valoracion data", data)
            else:
                self.log_test("Create Valoracion", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Valoracion", False, f"Exception: {str(e)}")
    
    def test_get_zonas(self):
        """Test GET /api/zonas"""
        print("\n=== Testing Get Zonas ===")
        
        url = f"{self.base_url}/zonas"
        
        try:
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if "zonas" in data and isinstance(data["zonas"], list):
                    self.log_test("Get Zonas", True, 
                                f"Retrieved {len(data['zonas'])} unique zones", data)
                else:
                    self.log_test("Get Zonas", False, 
                                "Missing or invalid zonas field", data)
            else:
                self.log_test("Get Zonas", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Zonas", False, f"Exception: {str(e)}")
    
    def test_complete_flow(self):
        """Test the complete flow: register -> login -> create piso -> list -> detail -> rate"""
        print("\n=== Testing Complete Flow ===")
        
        # Verify we have a piso with rating
        if self.piso_id:
            url = f"{self.base_url}/pisos/{self.piso_id}"
            try:
                response = self.session.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if len(data.get("valoraciones", [])) > 0:
                        self.log_test("Complete Flow Verification", True, 
                                    f"Piso has {len(data['valoraciones'])} valoracion(s) with average {data['promedio_general']}/5")
                    else:
                        self.log_test("Complete Flow Verification", False, 
                                    "Piso exists but has no valoraciones")
                else:
                    self.log_test("Complete Flow Verification", False, 
                                f"Cannot verify piso: HTTP {response.status_code}")
            except Exception as e:
                self.log_test("Complete Flow Verification", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print(f"🚀 Starting Casero Stars API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test authentication flow
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # Test piso management
        self.test_create_piso()
        self.test_list_pisos()
        self.test_get_piso_detail()
        
        # Test valoraciones
        self.test_create_valoracion()
        
        # Test utility endpoints
        self.test_get_zonas()
        
        # Test complete flow
        self.test_complete_flow()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['message']}")
        
        print("\n" + "=" * 60)
        
        # Return success status
        return passed == total

def main():
    """Main test execution"""
    tester = CaseroStarsAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()