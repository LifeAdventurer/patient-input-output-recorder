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
DATA_FILE_PATH = './data.json'


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

            return {"message": "Account created successfully"}
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'del account':
        if post_request['token'] == token:
            err = db.delete_account(post_request['account'])
            if err is not None:
                return {"message": "Account does not exists"}

            return {"message": "Account deleted successfully"}
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'fetch account list':
        if post_request['token'] == token:
            account_list = db.get_all_accounts()
            return {"message": "Fetch Success", "account_list": account_list}
        else:
            return {"message": "Incorrect token"}

    elif post_request['type'] == 'update record':
        record = post_request
        if not db.authenticate(record['account'], record['password']):
            return {"message": "Unauthorized"}

        with open(DATA_FILE_PATH, 'r') as f:
            account_records = json.load(f)

        account_records[record['account']] = record['data']
        with open(DATA_FILE_PATH, 'w') as f:
            json.dump(account_records, f)

        return {"message": "Update Success"}

    elif post_request['type'] == 'fetch patient records':
        if not db.authenticate(
            post_request['account'], post_request['password']
        ):
            return {"message": "Unauthorized"}

        patient_account = post_request['account']
        if db.get_account_type(patient_account) == db.AccountType.PATIENT:
            with open(DATA_FILE_PATH, 'r') as f:
                data = json.load(f)
                if patient_account in data:
                    return {
                        "message": "Read Success",
                        "account_records": data[patient_account],
                    }
                else:
                    return {"message": "Read Success", "account_records": {}}
        else:
            return {"message": "Incorrect account type."}

    elif post_request['type'] == 'fetch monitoring account records':
        if not db.authenticate(
            post_request['account'], post_request['password']
        ):
            return {"message": "Unauthorized"}

        monitoring_account = post_request['account']
        if db.get_account_type(monitoring_account) == db.AccountType.MONITOR:
            with open('./account_relations.json', 'r') as f:
                account_relations = json.load(f)
                if monitoring_account in account_relations['monitor_accounts']:
                    patient_accounts = account_relations['monitor_accounts'][
                        monitoring_account
                    ]
                    with open(DATA_FILE_PATH, 'r') as f:
                        data = json.load(f)
                    patient_records = {}
                    for patient_account in patient_accounts:
                        patient_records[patient_account] = data[patient_account]

                    return {
                        "message": "Fetch Success",
                        "patient_accounts": patient_accounts,
                        "patient_records": patient_records,
                    }
                else:
                    return {"message": "No associated patient accounts"}
        else:
            return {"message": "Incorrect account type"}


if __name__ == '__main__':
    db.create_table()
