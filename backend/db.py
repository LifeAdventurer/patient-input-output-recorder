import sqlite3

from constants import (
    ACCT_ALREADY_EXISTS,
    ACCT_CREATED,
    ACCT_DELETED,
    ACCT_NOT_EXIST,
    AUTH_FAIL_PASSWORD,
    AUTH_SUCCESS,
)

ACCOUNTS_DB = "accounts.db"


class AccountType:
    PATIENT = "PATIENT"
    MONITOR = "MONITOR"


def create_table():
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                account_type TEXT
            )
            """
        )
        conn.commit()


def add_account(username: str, password: str, account_type: str):
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO accounts (username, password, account_type) VALUES (?, ?, ?)",
                (username, password, account_type),
            )
            conn.commit()
            print(ACCT_CREATED)
            return None
        except sqlite3.IntegrityError:
            print(ACCT_ALREADY_EXISTS)
            return ACCT_ALREADY_EXISTS


def delete_account(username: str):
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "DELETE FROM accounts WHERE username = ?", (username,)
            )
            conn.commit()
            print(ACCT_DELETED)
            return None
        except sqlite3.IntegrityError:
            print(ACCT_NOT_EXIST)
            return ACCT_NOT_EXIST


def authenticate(username: str, password: str) -> str:
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM accounts WHERE username = ?",
            (username,),
        )
        account = cursor.fetchone()
        if not account:
            print(ACCT_NOT_EXIST)
            return ACCT_NOT_EXIST

        cursor.execute(
            "SELECT * FROM accounts WHERE username = ? AND password = ?",
            (username, password),
        )
        account = cursor.fetchone()
        if account:
            print(AUTH_SUCCESS)
            return AUTH_SUCCESS
        else:
            print(AUTH_FAIL_PASSWORD)
            return AUTH_FAIL_PASSWORD


def change_account_password(username: str, password: str):
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE accounts SET password = ? WHERE username = ?",
            (password, username),
        )


def get_account_type(username: str) -> str | None:
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT account_type FROM accounts WHERE username = ?",
            (username,),
        )
        account_type = cursor.fetchone()
        if account_type is None:
            return None
        else:
            return account_type[0]


def get_all_accounts():
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM accounts")
        accounts = cursor.fetchall()
        return accounts


def get_patient_accounts():
    with sqlite3.connect(ACCOUNTS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM accounts WHERE account_type = ?",
            (AccountType.PATIENT,),
        )
        patient_accounts = cursor.fetchall()
        return patient_accounts


create_table()
