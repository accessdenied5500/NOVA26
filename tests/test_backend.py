import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import backend.app as backend_app


class BackendTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = Path(self.temp_dir) / "nova26.sqlite3"
        backend_app.DB_PATH = self.db_path
        backend_app.init_db()
        self.client = backend_app.app.test_client()

    def test_register_login_and_profile_persistence(self):
        register_resp = self.client.post(
            "/api/register",
            json={"name": "Test Student", "username": "teststudent", "password": "secret123"},
        )
        self.assertEqual(register_resp.status_code, 200)

        login_resp = self.client.post(
            "/api/login",
            json={"username": "teststudent", "password": "secret123"},
        )
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.get_json()["user"]["token"]

        save_resp = self.client.post(
            "/api/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"data": {"notes": [{"id": 1, "title": "Test", "subject": "Math", "content": "Do revision"}], "schedule": ["Study"], "tasks": [{"title": "Practice", "checked": False}] }},
        )
        self.assertEqual(save_resp.status_code, 200)

        profile_resp = self.client.get(
            "/api/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(profile_resp.status_code, 200)
        profile_data = profile_resp.get_json()["data"]
        self.assertEqual(profile_data["notes"][0]["title"], "Test")
        self.assertEqual(profile_data["schedule"][0], "Study")
        self.assertEqual(profile_data["tasks"][0]["title"], "Practice")


if __name__ == "__main__":
    unittest.main()
