import json

import requests
from constants import URL

with open('./config.json', 'r') as f:
    token = json.load(f)['token']


payload = {
    'token': token,
    'event': 'fetch account list',
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Fetch Success':
        print(response['account_list'])
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
