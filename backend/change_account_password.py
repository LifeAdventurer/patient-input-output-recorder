import json
import os

import gen_qr_code
import requests
from constants import URL

with open("./config.json") as f:
    token = json.load(f)["token"]


ACCOUNT = input("Enter the account you want to change password: ")
PASSWORD = input("Enter the origin password: ")
NEW_PASSWORD = input("Enter the new password: ")

payload = {
    "token": token,
    "event": "change password",
    "account": ACCOUNT,
    "password": PASSWORD,
    "changed_password": NEW_PASSWORD,
}
headers = {"Accept": "application/json", "Content-Type": "application/json"}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response["message"] == "Account password changed successfully":
        print("Account password changed successfully")
        ACCOUNT_TYPE = response["account_type"]
        # Delete the old QR code
        old_QR_code_path = f"./account_qr_codes/{ACCOUNT_TYPE}/qr_code_acct_{ACCOUNT}_pw_{PASSWORD}.png"
        if os.path.exists(old_QR_code_path):
            os.remove(old_QR_code_path)
            print(f"'{old_QR_code_path}' has been successfully deleted.")
        gen_qr_code.generate_qr_code(ACCOUNT, NEW_PASSWORD, ACCOUNT_TYPE)
    else:
        print(response["message"])
except requests.exceptions.RequestException as e:
    print("Failed to post data:", e)
