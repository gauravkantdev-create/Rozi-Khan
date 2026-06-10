import urllib.request
import json

url = "http://127.0.0.1:8000/api/auth/login"
data = {
    "email": "admin@rozikhan.com",
    "password": "Password123!"
}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req) as response:
        status = response.status
        body = response.read().decode("utf-8")
        print(f"Success! Status: {status}")
        print("Body:", body)
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
    print("Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
