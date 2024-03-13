import json

import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']


ACCOUNT = input('Enter the account you want to delete: ')
PASSWORD = input('Enter the password: ')

payload = {
    'token': token,
    'type': 'del account',
    'account': ACCOUNT,
    'password': PASSWORD,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Account deleted successfully':
        print('Account deleted successfully')
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
