import json

import gen_qr_code
import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']

ACCOUNT_TYPES = ['ADMIN', 'MONITOR', 'PATIENT']

ACCOUNT = input('Enter the account you want to sign up: ')
PASSWORD = input('Enter the password: ')
ACCOUNT_TYPE = ''

while ACCOUNT_TYPE not in ACCOUNT_TYPES:
    ACCOUNT_TYPE = input('Enter the account type: ')


payload = {
    'token': token,
    'event': 'sign up',
    'account': ACCOUNT,
    'password': PASSWORD,
    'account_type': ACCOUNT_TYPE,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Account created successfully':
        print('Account created successfully')
        gen_qr_code.generate_qr_code(ACCOUNT, PASSWORD, ACCOUNT_TYPE)
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
