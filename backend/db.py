import sqlite3


def create_table():
    conn = sqlite3.connect('accounts.db')
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        )
        '''
    )
    conn.commit()
    cursor.close()
    conn.close()


def add_account(username: str, password: str):
    conn = sqlite3.connect('accounts.db')
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO accounts (username, password) VALUES (?, ?)',
            (username, password),
        )
        conn.commit()
        cursor.close()
        conn.close()
        print("Account created successfully.")
        return None
    except sqlite3.IntegrityError:
        cursor.close()
        conn.close()
        print("Account already exists.")
        return "Account already exists"


def delete_account(username: str):
    conn = sqlite3.connect('accounts.db')
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM accounts WHERE username = ?', (username,))
        conn.commit()
        cursor.close()
        conn.close()
        print("Account deleted successfully.")
        return None
    except sqlite3.IntegrityError:
        cursor.close()
        conn.close()
        print("Account does not exist.")
        return "Account does not exist"


def authenticate(username: str, password: str) -> bool:
    conn = sqlite3.connect('accounts.db')
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM accounts WHERE username = ? AND password = ?',
        (username, password),
    )
    account = cursor.fetchone()
    cursor.close()
    conn.close()
    if account:
        print("Authentication successful.")
        return True
    else:
        print("Invalid username or password.")
        return False


def get_all_accounts():
    conn = sqlite3.connect('accounts.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM accounts')
    accounts = cursor.fetchall()
    cursor.close()
    conn.close()
    return accounts
