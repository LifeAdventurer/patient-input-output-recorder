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
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_data(account: str, password: str):
    if not db.authenticate(account, password):
        return {"message": "unauthorized"}

    with open('./data.json', 'r') as f:
        data = json.load(f)
        if account in data:
            return {"message": "read success", "record": json.load(f)[account]}
        else:
            return {"message": "read success", "record": {}}

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

    elif (
        post_request['type'] == 'del account' and post_request['token'] == token
    ):
        err = db.delete_account(post_request['account'])
        if err is not None:
            return {"message": "Account does not exists."}

        return {"message": "Account deleted successfully"}

    elif post_request['type'] == 'update record':
        record = post_request
        if not db.authenticate(record['account'], record['password']):
            return {"message": "unauthorized"}

        with open('./data.json', 'r') as f:
            data = json.load(f)
            data[record['account']] = record['data']
            json.dumps(data, f)
            return {"message": "write success"}
