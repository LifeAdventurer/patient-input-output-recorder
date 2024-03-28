import json

import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']


ACCOUNT = input('Enter the account you want to change password: ')
PASSWORD = input('Enter the origin password: ')
NEW_PASSWORD = input('Enter the new password: ')

payload = {
    'token': token,
    'type': 'change password',
    'account': ACCOUNT,
    'password': PASSWORD,
    'changed_password': NEW_PASSWORD,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Account password changed successfully':
        print('Account password changed successfully')
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
