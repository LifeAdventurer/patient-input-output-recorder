import requests
from constants import URL

ACCOUNT = input('Enter the account: ')
PASSWORD = input('Enter the password: ')

payload = {
    'event': 'fetch monitoring account records',
    'account': ACCOUNT,
    'password': PASSWORD,
}
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

try:
    response = requests.post(URL, json=payload, headers=headers)
    response.raise_for_status()
    response = response.json()
    if response['message'] == 'Fetch Success':
        print(response['patient_records'], response['patient_accounts'])
    else:
        print(response['message'])
except requests.exceptions.RequestException as e:
    print('Failed to post data:', e)
