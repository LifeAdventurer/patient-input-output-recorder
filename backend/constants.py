API_PORT = 8000
FRONTEND_PORT = 5500
URL = "https://lifeadventurer.tfcis.org/"
URL = f"http://localhost:{API_PORT}"  # For developing

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

# Messages
ACCT_CREATED = "Account created."
ACCT_ALREADY_EXISTS = "Account already exists."
INVALID_ACCT_TYPE = "Invalid account type."
ADD_PATIENT_SUCCESS = "Patient added to monitor list."
REMOVE_PATIENT_SUCCESS = "Patient removed from monitor list."
DELETE_PATIENT_SUCCESS = "Patient account deleted."
SET_RESTRICTS_SUCCESS = "Restrictions set."
UPDATE_RECORD_SUCCESS = "Update successful."
FETCH_RECORD_SUCCESS = "Fetch successful."
