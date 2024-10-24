API_PORT = 8000
FRONTEND_PORT = 5500
URL = "https://lifeadventurer.tfcis.org/"

# Paths
DATA_JSON_PATH = "./data.json"  # Patient data
ACCT_REL_JSON_PATH = "./account_relations.json"  # Monitor <-> Patients
CONFIG_JSON_PATH = "./config.json"  # Token

# Events
SIGN_UP_MONITOR = "sign_up_monitor"
SIGN_UP_PATIENT = "sign_up_patient"
ADD_PATIENT = "add_patient"
REMOVE_PATIENT = "remove_patient"
DELETE_PATIENT = "delete_patient"
SET_RESTRICTS = "set_restricts"
UPDATE_RECORD = "update_record"
FETCH_RECORD = "fetch_record"
FETCH_MONITORING_PATIENTS = "fetch_monitoring_patients"
FETCH_UNMONITORED_PATIENTS = "fetch_unmonitored_patients"

# Messages
ACCT_CREATED = "Account created."
ACCT_DELETED = "Account deleted."
ACCT_ALREADY_EXISTS = "Account already exists."
ACCT_NOT_EXIST = "Nonexistent account."
INVALID_ACCT_TYPE = "Invalid account type."

AUTH_SUCCESS = "Authentication successful."
AUTH_FAIL_PASSWORD = "Incorrect password."

ADD_PATIENT_SUCCESS = "Patient added to monitor list."
REMOVE_PATIENT_SUCCESS = "Patient removed from monitor list."
DELETE_PATIENT_SUCCESS = "Patient account deleted."
SET_RESTRICTS_SUCCESS = "Restrictions set."
UPDATE_RECORD_SUCCESS = "Update successful."
FETCH_RECORD_SUCCESS = "Fetch successful."
FETCH_MONITORING_PATIENTS_SUCCESS = "Fetched monitoring patients successfully."
FETCH_UNMONITORED_PATIENTS_SUCCESS = (
    "Fetched all unmonitored patients successfully."
)

MISSING_PARAMETER = "Missing parameter."
INVALID_EVENT = "Invalid event."
