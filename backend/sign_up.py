import json

import gen_qr_code
import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']


account = input('Enter the account you want to sign up: ')
password = input('Enter the password: ')

payload = {
    'token': token,
    'type': 'sign up',
    'account': account,
    'password': password,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Account created successfully':
        print('Account created successfully')
        gen_qr_code.generate_qr_code(account, password)
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
