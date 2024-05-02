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
# Paths
DATA_JSON_PATH = './data.json'
ACCT_REL_JSON_PATH = './account_relations.json'
CONFIG_JSON_PATH = './config.json'

# Messages
ERR_ACCT_TYPE = 'Incorrect account type'
FETCH_SUCCESS = 'Fetch Success'
UPDATE_SUCCESS = 'Update Success'


def load_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)


def write_json_file(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)


@app.post("/")
async def handle_request(post_request: Request):
    post_request = await post_request.json()
    event = post_request.get('event')

    if event in [
        'sign up',
        'del account',
        'change password',
        'fetch account list',
    ]:
        return handle_authenticated_request(post_request)

    elif event in [
        'update record',
        'update patient record from monitor',
        'fetch patient records',
        'fetch monitoring account records',
        'add patient account to monitoring list',
    ]:
        return handle_request_without_authentication(post_request)

    else:
        return {"message": "Invalid event"}


def handle_authenticated_request(post_request):
    token = load_json_file(CONFIG_JSON_PATH).get('token')

    if not token or post_request.get('token') != token:
        return {"message": "Incorrect token"}

    return handle_request_without_authentication(post_request)


def handle_request_without_authentication(post_request):
    if post_request['event'] == 'sign up':
        if post_request['account_type'] not in [
            db.AccountType.ADMIN,
            db.AccountType.PATIENT,
            db.AccountType.MONITOR,
        ]:
            return {"message": ERR_ACCT_TYPE}

        err = db.add_account(
            post_request['account'],
            post_request['password'],
            post_request['account_type'],
        )
        if err is not None:
            return {"message": "Account already exists"}

        data = load_json_file(DATA_JSON_PATH)
        data[post_request['account']] = {}
        write_json_file(DATA_JSON_PATH, data)

        return {"message": "Account created successfully"}

    elif post_request['event'] == 'fetch account list':
        account_list = db.get_all_accounts()
        return {"message": FETCH_SUCCESS, "account_list": account_list}

    err = db.authenticate(post_request['account'], post_request['password'])
    if err != "Authentication successful":
        return {"message": err}

    if post_request['event'] == 'del account':
        account_type = db.get_account_type(post_request['account'])
        err = db.delete_account(post_request['account'])
        if err is not None:
            return {"message": "Account does not exists"}

        # Remove deleted account data in JSON files
        if account_type in [
            db.AccountType.PATIENT,
            db.AccountType.ADMIN,
        ]:
            # account_relations.json
            account_relations = load_json_file(ACCT_REL_JSON_PATH)
            for monitor_account, patient_accounts in account_relations[
                'monitor_accounts'
            ].items():
                if post_request['account'] in patient_accounts:
                    del account_relations['monitor_accounts'][monitor_account][
                        patient_accounts.index(post_request['account'])
                    ]
            write_json_file(ACCT_REL_JSON_PATH, account_relations)

            # data.json
            data = load_json_file(DATA_JSON_PATH)
            del data[post_request['account']]
            write_json_file(DATA_JSON_PATH, data)

        if account_type in [db.AccountType.MONITOR, db.AccountType.ADMIN]:
            account_relations = load_json_file(ACCT_REL_JSON_PATH)

            if (
                post_request['account']
                in account_relations['monitor_accounts'].keys()
            ):
                del account_relations['monitor_accounts'][monitor_account]

            write_json_file(ACCT_REL_JSON_PATH, account_relations)

        return {
            "message": "Account deleted successfully",
            "account_type": account_type,
        }

    elif post_request['event'] == 'change password':
        db.change_account_password(
            post_request['account'], post_request['changed_password']
        )

        return {
            "message": "Account password changed successfully",
            "account_type": db.get_account_type(post_request['account']),
        }

    elif post_request['event'] == 'update record':
        data = load_json_file(DATA_JSON_PATH)
        data[post_request['account']] = post_request['data']
        write_json_file(DATA_JSON_PATH, data)

        return {"message": UPDATE_SUCCESS}

    elif post_request['event'] == 'update patient record from monitor':
        if (
            db.get_account_type(post_request['account'])
            == db.AccountType.PATIENT
        ):
            return {"message": ERR_ACCT_TYPE}

        data = load_json_file(DATA_JSON_PATH)
        data[post_request['patient_account']] = post_request['data']
        write_json_file(DATA_JSON_PATH, data)

        return {"message": UPDATE_SUCCESS}

    elif post_request['event'] == 'fetch patient records':
        patient_account = post_request['account']
        if db.get_account_type(patient_account) in [
            db.AccountType.PATIENT,
            db.AccountType.ADMIN,
        ]:
            data = load_json_file(DATA_JSON_PATH)
            return {
                "message": FETCH_SUCCESS,
                "account_records": data[patient_account],
            }
        else:
            return {"message": ERR_ACCT_TYPE}

    elif post_request['event'] == 'fetch monitoring account records':
        monitoring_account = post_request['account']
        if db.get_account_type(monitoring_account) in [
            db.AccountType.MONITOR,
            db.AccountType.ADMIN,
        ]:
            account_relations = load_json_file(ACCT_REL_JSON_PATH)
            if monitoring_account in account_relations['monitor_accounts']:
                patient_accounts = account_relations['monitor_accounts'][
                    monitoring_account
                ]
                data = load_json_file(DATA_JSON_PATH)
                patient_records = {}
                for patient_account in patient_accounts:
                    if patient_account not in data:
                        patient_records[patient_account] = {}
                    else:
                        patient_records[patient_account] = data[patient_account]

                return {
                    "message": FETCH_SUCCESS,
                    "patient_accounts": patient_accounts,
                    "patient_records": patient_records,
                }
            else:
                return {"message": "No associated patient accounts"}
        else:
            return {"message": ERR_ACCT_TYPE}

    elif post_request['event'] == 'add patient account to monitoring list':
        monitor_account = post_request['account']
        if db.get_account_type(monitor_account) == db.AccountType.PATIENT:
            return {"message": ERR_ACCT_TYPE}

        account_relations = load_json_file(ACCT_REL_JSON_PATH)
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

                write_json_file(ACCT_REL_JSON_PATH, account_relations)

            return {"message": "Added"}
        else:
            return {"message": f"Account: '{patient_account}' is not a PATIENT"}
