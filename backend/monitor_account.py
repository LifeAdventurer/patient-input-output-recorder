import json

import db

ACCOUNT = input("Enter the monitor account: ")
PASSWORD = input("Enter the password: ")

err = db.authenticate(ACCOUNT, PASSWORD)
if err == 'Authentication successful':
    if db.get_account_type(ACCOUNT) in [
        db.AccountType.MONITOR,
        db.AccountType.ADMIN,
    ]:
        with open('./account_relations.json', 'r') as f:
            account_relations = json.load(f)

        if ACCOUNT not in account_relations['monitor_accounts']:
            account_relations['monitor_accounts'][ACCOUNT] = []
        print(
            "Start entering the accounts you want to monitor: \n  (enter 'end' to stop task)"
        )
        while True:
            patient_account = input()
            if patient_account == 'end':
                break

            patient_account_type = db.get_account_type(patient_account)
            if patient_account_type is None:
                print("No such account")
            elif patient_account_type == db.AccountType.PATIENT:
                account_relations['monitor_accounts'][ACCOUNT].append(
                    patient_account
                )
            else:
                print(f"Account: '{patient_account}' is not a PATIENT")
        with open('./account_relations.json', 'w') as f:
            json.dump(account_relations, f, indent=4)
        print("Task ended")
    else:
        print("Incorrect account type")
else:
    print(err)
