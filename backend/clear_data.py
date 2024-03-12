import json

import requests

url = 'https://tobiichi3227.eu.org/'
# url = 'http://localhost:8000/'

ACCOUNT = input('Enter the account you want to clear data: ')
PASSWORD = input('Enter the password: ')

payload = {
    'type': 'update record',
    'account': ACCOUNT,
    'password': PASSWORD,
    'data': {},
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
    print('Data posted successfully')
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
