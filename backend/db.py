import sqlite3

conn = sqlite3.connect('accounts.db')
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )
''')

def add_account(username, password):
    try:
        cursor.execute('INSERT INTO accounts (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        print("Account created successfully.")
        return None
    except sqlite3.IntegrityError:
        print("Account already exists.")
        return "Account already exists"

def delete_account(username):
    try:
        cursor.execute('DELETE FROM accounts WHERE username = ?', (username,))
        conn.commit()
        print("Account deleted successfully.")
        return None
    except sqlite3.IntegrityError:
        print("Account does not exist.")
        return "Account does not exist"