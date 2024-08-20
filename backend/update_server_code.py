import json

import requests
from constants import URL

with open("./config.json") as f:
    token = json.load(f)["token"]

payload = {"token": token, "event": "update server code"}
headers = {"Accept": "application/json", "Content-Type": "application/json"}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    print(response["message"])
except requests.exceptions.RequestException as e:
    print("Failed to post data:", e)
