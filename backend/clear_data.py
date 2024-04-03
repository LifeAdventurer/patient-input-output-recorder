import json

import requests
from constants import URL

ACCOUNT = input('Enter the account you want to clear data: ')
PASSWORD = input('Enter the password: ')

payload = {
    'event': 'update record',
    'account': ACCOUNT,
    'password': PASSWORD,
    'data': {},
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Update success':
        print('Cleared data')
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
