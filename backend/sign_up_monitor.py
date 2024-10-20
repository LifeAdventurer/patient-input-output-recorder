import json

import requests
from constants import SIGN_UP_MONITOR, URL

with open("./config.json") as f:
    token = json.load(f)["token"]


ACCOUNT = input("Enter the monitor account you want to sign up: ")
PASSWORD = input("Enter the password: ")


payload = {
    "token": token,
    "event": SIGN_UP_MONITOR,
    "account": ACCOUNT,
    "password": PASSWORD,
}
headers = {"Accept": "application/json", "Content-Type": "application/json"}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    print(response["message"])
except requests.exceptions.RequestException as e:
    print("Failed to post data:", e)
