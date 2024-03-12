import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db

class PatientDietRecord(BaseModel):
    password: str
    account: str
    data: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*', 'http://localhost:5500'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ACCOUNT = ''
PASSWORD = ''

def authenticate(account: str, password: str) -> bool:
     return account == ACCOUNT and password == PASSWORD

@app.get("/")
def read_data(account: str, password: str):
    if not authenticate(account, password):
        return {"message": "unauthorized"}

    with open('./data.json', 'r') as f:
        return {"message": "read success", "record": f.read()}


@app.post("/")
async def write_data(post_request: Request):
    post_request = await post_request.json()

    with open('./config.json', 'r') as f:
        token = json.load(f)['token']

    if post_request['type'] == 'sign up' and post_request['token'] == token:
        err = db.add_account(post_request['account'], post_request['password'])
        if err is not None:
            return {"message": "Account already exists."}

        return {"message": "Account created successfully"}

    elif post_request['type'] == 'del account' and post_request['token'] == token:
        err = db.delete_account(post_request['account'])
        if err is not None:
            return {"message": "Account does not exists."}
        
        return {"message": "Account deleted successfully"}

    elif post_request['type'] == 'update record':
        record = post_request
        if not authenticate(record['account'], record['password']):
            return {"message": "unauthorized"}

        with open('./data.json', 'w') as f:
            f.write(json.dumps(record['data'][record['account']]))
            return {"message": "write success"}