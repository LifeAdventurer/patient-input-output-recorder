import json

import db
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class PatientDietRecord(BaseModel):
    password: str
    account: str
    data: str


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*', 'http://localhost:5500'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Constants
DATA_JSON_PATH = './data.json'
ACCT_REL_JSON_PATH = './account_relations.json'


@app.post("/")
async def write_data(post_request: Request):
    post_request = await post_request.json()

    with open('./config.json', 'r') as f:
        token = json.load(f)['token']

    if post_request['type'] == 'sign up':
        if post_request['token'] == token:
            if post_request['account_type'] not in [
                db.AccountType.ADMIN,
                db.AccountType.PATIENT,
                db.AccountType.MONITOR,
            ]:
                return {"message": "Incorrect account type"}

            err = db.add_account(
                post_request['account'],
                post_request['password'],
                post_request['account_type'],
            )
            if err is not None:
                return {"message": "Account already exists"}

            with open(DATA_JSON_PATH, 'r') as f:
                data = json.load(f)

            data[post_request['account']] = {}

            with open(DATA_JSON_PATH, 'w') as f:
                json.dump(data, f, indent=4)

            return {"message": "Account created successfully"}
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'del account':
        if post_request['token'] == token:
            err = db.authenticate(
                post_request['account'], post_request['password']
            )
            account_type = db.get_account_type(post_request['account'])
            if err != "Authentication successful":
                return {"message": err}

            err = db.delete_account(post_request['account'])
            if err is not None:
                return {"message": "Account does not exists"}

            # Remove deleted account data in JSON files
            if account_type in [
                db.AccountType.PATIENT,
                db.AccountType.ADMIN,
            ]:
                # account_relations.json
                with open(ACCT_REL_JSON_PATH, 'r') as f:
                    account_relations = json.load(f)

                for monitor_account, patient_accounts in account_relations[
                    'monitor_accounts'
                ].items():
                    if post_request['account'] in patient_accounts:
                        del account_relations['monitor_accounts'][
                            monitor_account
                        ][patient_accounts.index(post_request['account'])]

                with open(ACCT_REL_JSON_PATH, 'w') as f:
                    json.dump(account_relations, f, indent=4)

                # data.json
                with open(DATA_JSON_PATH, 'r') as f:
                    data = json.load(f)

                del data[post_request['account']]

                with open(DATA_JSON_PATH, 'w') as f:
                    json.dump(data, f, indent=4)

            if account_type in [db.AccountType.MONITOR, db.AccountType.ADMIN]:
                with open(ACCT_REL_JSON_PATH, 'r') as f:
                    account_relations = json.load(f)

                if (
                    post_request['account']
                    in account_relations['monitor_accounts'].keys()
                ):
                    del account_relations['monitor_accounts'][monitor_account]

                with open(ACCT_REL_JSON_PATH, 'w') as f:
                    json.dump(account_relations, f, indent=4)

            return {
                "message": "Account deleted successfully",
                "account_type": account_type,
            }
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'change password':
        if post_request['token'] != token:
            return {"message": "Incorrect token"}

        err = db.authenticate(post_request['account'], post_request['password'])

        if err != "Authentication successful":
            return {"message": err}

        db.change_account_password(
            post_request['account'], post_request['changed_password']
        )

        return {
            "message": "Account password changed successfully",
            "account_type": db.get_account_type(post_request['account']),
        }

    elif post_request['type'] == 'fetch account list':
        if post_request['token'] == token:
            account_list = db.get_all_accounts()
            return {"message": "Fetch Success", "account_list": account_list}
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'update record':
        record = post_request
        err = db.authenticate(post_request['account'], post_request['password'])
        if err != "Authentication successful":
            return {"message": err}

        with open(DATA_JSON_PATH, 'r') as f:
            account_records = json.load(f)

        account_records[record['account']] = record['data']
        with open(DATA_JSON_PATH, 'w') as f:
            json.dump(account_records, f, indent=4)

        return {"message": "Update Success"}

    elif post_request['type'] == 'update patient record from monitor':
        err = db.authenticate(post_request['account'], post_request['password'])
        if err != "Authentication successful":
            return {"message": err}

        if (
            db.get_account_type(post_request['account'])
            == db.AccountType.PATIENT
        ):
            return {"message": "Incorrect account type"}

        with open(DATA_JSON_PATH, 'r') as f:
            account_records = json.load(f)

        account_records[post_request['patient_account']] = post_request['data']
        with open(DATA_JSON_PATH, 'w') as f:
            json.dump(account_records, f, indent=4)

        return {"message": "Update Success"}

    elif post_request['type'] == 'fetch patient records':
        err = db.authenticate(post_request['account'], post_request['password'])
        if err != "Authentication successful":
            return {"message": err}

        patient_account = post_request['account']
        if db.get_account_type(patient_account) in [
            db.AccountType.PATIENT,
            db.AccountType.ADMIN,
        ]:
            with open(DATA_JSON_PATH, 'r') as f:
                data = json.load(f)
                return {
                    "message": "Fetch Success",
                    "account_records": data[patient_account],
                }
        else:
            return {"message": "Incorrect account type"}

    elif post_request['type'] == 'fetch monitoring account records':
        err = db.authenticate(post_request['account'], post_request['password'])
        if err != "Authentication successful":
            return {"message": err}

        monitoring_account = post_request['account']
        if db.get_account_type(monitoring_account) in [
            db.AccountType.MONITOR,
            db.AccountType.ADMIN,
        ]:
            with open(ACCT_REL_JSON_PATH, 'r') as f:
                account_relations = json.load(f)
                if monitoring_account in account_relations['monitor_accounts']:
                    patient_accounts = account_relations['monitor_accounts'][
                        monitoring_account
                    ]
                    with open(DATA_JSON_PATH, 'r') as f:
                        data = json.load(f)
                    patient_records = {}
                    for patient_account in patient_accounts:
                        if patient_account not in data:
                            patient_records[patient_account] = {}
                        else:
                            patient_records[patient_account] = data[
                                patient_account
                            ]

                    return {
                        "message": "Fetch Success",
                        "patient_accounts": patient_accounts,
                        "patient_records": patient_records,
                    }
                else:
                    return {"message": "No associated patient accounts"}
        else:
            return {"message": "Incorrect account type"}

    elif post_request['type'] == 'add patient account to monitoring list':
        monitor_account = post_request['account']
        err = db.authenticate(post_request['account'], post_request['password'])
        if err != "Authentication successful":
            return {"message": err}

        if db.get_account_type(monitor_account) == db.AccountType.PATIENT:
            return {"message": "Incorrect account type"}

        with open('./account_relations.json', 'r') as f:
            account_relations = json.load(f)

        if monitor_account not in account_relations['monitor_accounts']:
            account_relations['monitor_accounts'][monitor_account] = []

        patient_account = post_request['patient_account']
        patient_account_type = db.get_account_type(patient_account)
        if patient_account_type is None:
            return {"message": "No such account"}
        elif patient_account_type == db.AccountType.PATIENT:
            if (
                patient_account
                not in account_relations['monitor_accounts'][monitor_account]
            ):
                account_relations['monitor_accounts'][monitor_account].append(
                    patient_account
                )
                account_relations['monitor_accounts'][monitor_account].sort()

                with open('./account_relations.json', 'w') as f:
                    json.dump(account_relations, f, indent=4)
            return {"message": "Added"}
        else:
            return {"message": f"Account: '{patient_account}' is not a PATIENT"}
