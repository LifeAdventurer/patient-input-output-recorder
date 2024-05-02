import json
import os

import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']


ACCOUNT = input('Enter the account you want to delete: ')
PASSWORD = input('Enter the password: ')

payload = {
    'token': token,
    'event': 'del account',
    'account': ACCOUNT,
    'password': PASSWORD,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    print(response['message'])
    if (
        response['message'] == 'Account deleted successfully'
        or response['message'] == 'Account does not exists'
    ):
        ACCOUNT_TYPE = response['account_type']
        QR_code_path = f"./account_qr_codes/{ACCOUNT_TYPE}/qr_code_acct_{ACCOUNT}_pw_{PASSWORD}.png"
        if os.path.exists(QR_code_path):
            os.remove(QR_code_path)
            print(f"'{QR_code_path}' has been successfully deleted.")

except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
