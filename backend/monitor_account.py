import requests
from constants import URL

ACCOUNT = input("Enter the monitor account: ")
PASSWORD = input("Enter the password: ")


def add_patient_account_to_monitoring_list(patient_account: str) -> str:
    payload = {
        "event": "add patient account to monitoring list",
        "account": ACCOUNT,
        "password": PASSWORD,
        "patient_account": patient_account,
    }
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    try:
        response = requests.post(URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["message"]
    except requests.exceptions.RequestException as e:
        return f"Failed to post data: {e}"


print(
    "Start entering the patient accounts you want to monitor: (one account per line)"
)
print("  (enter 'end' to stop task)")
while True:
    patient_account = input()
    if patient_account.lower() == "end":
        break

    response_message = add_patient_account_to_monitoring_list(patient_account)
    print(response_message)

print("Task ended")
