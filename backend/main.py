import json

import db
from constants import (
    ACCT_ALREADY_EXISTS,
    ACCT_CREATED,
    ACCT_REL_JSON_PATH,
    ADD_PATIENT,
    AUTH_SUCCESS,
    CONFIG_JSON_PATH,
    DATA_JSON_PATH,
    DELETE_PATIENT,
    FETCH_MONITORING_PATIENTS,
    FETCH_MONITORING_PATIENTS_SUCCESS,
    FETCH_RECORD,
    FETCH_RECORD_SUCCESS,
    FETCH_UNMONITORED_PATIENTS,
    FETCH_UNMONITORED_PATIENTS_SUCCESS,
    FRONTEND_PORT,
    INVALID_ACCT_TYPE,
    INVALID_EVENT,
    MISSING_PARAMETER,
    REMOVE_PATIENT,
    SET_RESTRICTS,
    SIGN_UP_MONITOR,
    SIGN_UP_PATIENT,
    UPDATE_RECORD,
    UPDATE_RECORD_SUCCESS,
)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", f"http://localhost:{FRONTEND_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_json_file(file_path):
    try:
        with open(file_path) as file:
            data = json.load(file)
    except FileNotFoundError:
        data = {}
        if file_path == ACCT_REL_JSON_PATH:
            data.setdefault("monitor_accounts", {})
        with open(file_path, "w") as file:
            json.dump(data, file, indent=4)

    return data


def write_json_file(file_path, data):
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)


def sign_up_account(account_type: str, account: str, password: str) -> dict:
    if account_type not in [
        db.AccountType.PATIENT,
        db.AccountType.MONITOR,
    ]:
        return {"message": INVALID_ACCT_TYPE}

    err = db.add_account(
        account,
        password,
        account_type,
    )
    if err is not None:
        return {"message": ACCT_ALREADY_EXISTS}

    if account_type == db.AccountType.PATIENT:
        data = load_json_file(DATA_JSON_PATH)
        data[account] = {}
        write_json_file(DATA_JSON_PATH, data)

    return {"message": ACCT_CREATED}


# TODO: Return messages
def authenticate(post_request: dict):
    return (
        has_parameters(post_request, ["account", "password"])
        and db.authenticate(post_request["account"], post_request["password"])
        == AUTH_SUCCESS
    )


def has_parameters(post_request: dict, required_parameters: list[str]) -> bool:
    return not any(
        parameter not in post_request for parameter in required_parameters
    )


@app.post("/")
async def handle_request(request: Request):
    try:
        post_request = await request.json()
    except Exception as e:
        return {"message": e}

    token = load_json_file(CONFIG_JSON_PATH).get("token")
    post_request_token = post_request.get("token")
    if not token or (post_request_token and post_request_token != token):
        return {"message": "Incorrect token"}

    event = post_request.get("event")
    if event == SIGN_UP_MONITOR and post_request_token:
        if not has_parameters(
            post_request, ["account_type", "account", "password"]
        ):
            return {"message": MISSING_PARAMETER}

        response = sign_up_account(
            post_request["account_type"],
            post_request["account"],
            post_request["password"],
        )

        if response["message"] == ACCT_CREATED:
            account_relations = load_json_file(ACCT_REL_JSON_PATH)
            account_relations["monitor_accounts"][post_request["account"]] = []
            write_json_file(ACCT_REL_JSON_PATH, account_relations)

        return response

    if event in [
        FETCH_MONITORING_PATIENTS,  # 1
        FETCH_UNMONITORED_PATIENTS,  # 2
        ADD_PATIENT,
        REMOVE_PATIENT,
        DELETE_PATIENT,
        SET_RESTRICTS,
        SIGN_UP_PATIENT,  # 7
    ] and (
        post_request_token
        or (
            authenticate(post_request)
            and db.get_account_type(post_request["account"])
            == db.AccountType.MONITOR
        )
    ):
        if event == FETCH_MONITORING_PATIENTS:
            account_relations = load_json_file(ACCT_REL_JSON_PATH)
            patient_accounts = []
            for patient_account in account_relations["monitor_accounts"][
                post_request["account"]
            ]:
                patient_password = db.get_password(patient_account)
                if patient_password:
                    patient_accounts.append(
                        (patient_account, db.get_password(patient_account))
                    )

            data = load_json_file(DATA_JSON_PATH)
            patient_records = {}
            for patient_account in patient_accounts:
                if patient_account not in data:
                    patient_records[patient_account] = {}
                else:
                    patient_records[patient_account] = data[patient_account]

            return {
                "message": FETCH_MONITORING_PATIENTS_SUCCESS,
                "patient_accounts": patient_accounts,
                "patient_records": patient_records,
            }

        if event == FETCH_UNMONITORED_PATIENTS:
            account_list = db.get_patient_accounts()
            account_relations = load_json_file(ACCT_REL_JSON_PATH)
            monitored_patients = set()
            for patients in account_relations["monitor_accounts"].values():
                for patient in patients:
                    monitored_patients.update(patient)

            patient_accounts = [
                account
                for account in account_list
                if account[1]
                not in monitored_patients  # account[1] -> account name
            ]

            return {
                "message": FETCH_UNMONITORED_PATIENTS_SUCCESS,
                "unmonitored_patients": patient_accounts,
            }

        if not has_parameters(post_request, ["patient", "patient_password"]):
            return {"message": MISSING_PARAMETER}

        # The events below requires `patient` and `patient_password`
        # The account must be a `PATIENT`
        patient = post_request["patient"]
        patient_password = post_request["patient_password"]
        err = db.authenticate(patient, patient_password)
        if err != AUTH_SUCCESS:
            return {"message": err}
        if db.get_account_type(patient) != db.AccountType.PATIENT:
            return {"message": INVALID_ACCT_TYPE}

        if event == ADD_PATIENT:
            return {"message": "WIP"}

        if event == REMOVE_PATIENT:
            return {"message": "WIP"}

        if event == DELETE_PATIENT:
            return {"message": "WIP"}

        if event == SET_RESTRICTS:
            return {"message": "WIP"}

        if event == SIGN_UP_PATIENT:
            return {"message": "WIP"}

    elif event in [UPDATE_RECORD, FETCH_RECORD] and authenticate(post_request):
        # Both event needs `patient` as a parameter
        if not has_parameters(post_request, ["patient"]):
            return {"message": MISSING_PARAMETER}

        if event == UPDATE_RECORD:
            patient_account = post_request["patient"]
            if db.get_account_type(patient_account) == db.AccountType.PATIENT:
                data = load_json_file(DATA_JSON_PATH)
                data[patient_account] = post_request["data"]
                write_json_file(DATA_JSON_PATH, data)

                return {"message": UPDATE_RECORD_SUCCESS}
            else:
                return {"message": INVALID_ACCT_TYPE}

        if event == FETCH_RECORD:
            patient_account = post_request["patient"]
            if db.get_account_type(patient_account) == db.AccountType.PATIENT:
                data = load_json_file(DATA_JSON_PATH)
                return {
                    "message": FETCH_RECORD_SUCCESS,
                    "account_records": data[patient_account],
                }
            else:
                return {"message": INVALID_ACCT_TYPE}

    else:
        return {"message": INVALID_EVENT}


# def handle_request_without_authentication(post_request):
#     if post_request["event"] == "fetch unmonitored patients":
#         account_list = db.get_all_accounts()
#         account_relations = load_json_file(ACCT_REL_JSON_PATH)
#         monitored_patients = set()
#         for account in account_relations["monitor_accounts"].values():
#             monitored_patients.update(account)
#         patient_accounts = [
#             account
#             for account in account_list
#             if account[3] == db.AccountType.PATIENT
#             and account[1] not in monitored_patients
#         ]
#
#         return {
#             "message": FETCH_RECORD_SUCCESS,
#             "account_list": patient_accounts,
#         }
#
#     elif post_request["event"] == "fetch account list":
#         account_list = db.get_all_accounts()
#         return {"message": FETCH_RECORD_SUCCESS, "account_list": account_list}
#
#
#     err = db.authenticate(post_request["account"], post_request["password"])
#     if err != "Authentication successful":
#         return {"message": err}
#
#     if post_request["event"] == "del account":
#         account_type = db.get_account_type(post_request["account"])
#         err = db.delete_account(post_request["account"])
#         if err is not None:
#             return {"message": "Account does not exists"}
#
#         # Remove deleted account data in JSON files
#         if account_type == db.AccountType.PATIENT:
#             # account_relations.json
#             account_relations = load_json_file(ACCT_REL_JSON_PATH)
#             for monitor_account, patient_accounts in account_relations[
#                 "monitor_accounts"
#             ].items():
#                 if post_request["account"] in patient_accounts:
#                     del account_relations["monitor_accounts"][monitor_account][
#                         patient_accounts.index(post_request["account"])
#                     ]
#             write_json_file(ACCT_REL_JSON_PATH, account_relations)
#
#             # data.json
#             data = load_json_file(DATA_JSON_PATH)
#             del data[post_request["account"]]
#             write_json_file(DATA_JSON_PATH, data)
#
#         if account_type == db.AccountType.MONITOR:
#             account_relations = load_json_file(ACCT_REL_JSON_PATH)
#
#             if (
#                 post_request["account"]
#                 in account_relations["monitor_accounts"].keys()
#             ):
#                 del account_relations["monitor_accounts"][monitor_account]
#
#             write_json_file(ACCT_REL_JSON_PATH, account_relations)
#
#         return {
#             "message": "Account deleted successfully",
#             "account_type": account_type,
#         }
#
#
#     elif post_request["event"] == "update patient record from monitor":
#         if (
#             db.get_account_type(post_request["account"])
#             == db.AccountType.PATIENT
#         ):
#             return {"message": INVALID_ACCT_TYPE}
#
#         data = load_json_file(DATA_JSON_PATH)
#         data[post_request["patient_account"]] = post_request["data"]
#         write_json_file(DATA_JSON_PATH, data)
#
#         return {"message": UPDATE_RECORD_SUCCESS}
#
#     elif post_request["event"] == "fetch patient records":
#         patient_account = post_request["account"]
#         if db.get_account_type(patient_account) == db.AccountType.PATIENT:
#             data = load_json_file(DATA_JSON_PATH)
#             return {
#                 "message": FETCH_RECORD_SUCCESS,
#                 "account_records": data[patient_account],
#             }
#         else:
#             return {"message": INVALID_ACCT_TYPE}
#
#     elif post_request["event"] == "add patient account to monitoring list":
#         monitor_account = post_request["account"]
#         if db.get_account_type(monitor_account) == db.AccountType.PATIENT:
#             return {"message": INVALID_ACCT_TYPE}
#
#         account_relations = load_json_file(ACCT_REL_JSON_PATH)
#         if monitor_account not in account_relations["monitor_accounts"]:
#             account_relations["monitor_accounts"][monitor_account] = []
#
#         patient_account = post_request["patient_account"]
#         patient_account_type = db.get_account_type(patient_account)
#         if patient_account_type is None:
#             return {"message": "No such account"}
#
#         elif patient_account_type == db.AccountType.PATIENT:
#             if (
#                 patient_account
#                 not in account_relations["monitor_accounts"][monitor_account]
#             ):
#                 account_relations["monitor_accounts"][monitor_account].append(
#                     patient_account
#                 )
#                 account_relations["monitor_accounts"][monitor_account].sort()
#
#                 write_json_file(ACCT_REL_JSON_PATH, account_relations)
#
#             return {"message": "Added"}
#         else:
#             return {"message": f"Account: '{patient_account}' is not a PATIENT"}
