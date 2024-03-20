import sqlite3


class AccountType:
    ADMIN = 'ADMIN'
    PATIENT = 'PATIENT'
    MONITOR = 'MONITOR'


def create_table():
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                account_type TEXT
            )
            '''
        )
        conn.commit()


def add_account(username: str, password: str, account_type: str):
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO accounts (username, password, account_type) VALUES (?, ?, ?)',
                (username, password, account_type),
            )
            conn.commit()
            print("Account created successfully.")
            return None
        except sqlite3.IntegrityError:
            print("Account already exists.")
            return "Account already exists"


def delete_account(username: str):
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                'DELETE FROM accounts WHERE username = ?', (username,)
            )
            conn.commit()
            print("Account deleted successfully.")
            return None
        except sqlite3.IntegrityError:
            print("Account does not exist.")
            return "Account does not exist"


def authenticate(username: str, password: str) -> bool:
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM accounts WHERE username = ? AND password = ?',
            (username, password),
        )
        account = cursor.fetchone()
        if account:
            print("Authentication successful.")
            return True
        else:
            print("Invalid username or password.")
            return False


def get_account_type(username: str) -> str:
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT account_type FROM accounts WHERE username = ?',
            (username,),
        )
        account_type = cursor.fetchone()
        return account_type


def get_all_accounts():
    with sqlite3.connect('accounts.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM accounts')
        accounts = cursor.fetchall()
        return accounts
