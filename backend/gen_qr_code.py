import db
import qrcode
from PIL import ImageDraw, ImageFont


def generate_qr_code(account, password, account_type):
    if account_type in [db.AccountType.ADMIN, db.AccountType.PATIENT]:
        url = f"https://lifeadventurer.github.io/patient-diet-recorder/patient/?acct={account}&pw={password}"
    elif account_type == db.AccountType.MONITOR:
        url = f"https://lifeadventurer.github.io/patient-diet-recorder/monitor/?acct={account}&pw={password}"
    else:
        return

    filename = f"./account_qr_codes/{account_type}/qr_code_acct_{account}_pw_{password}.png"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    image = ImageDraw.Draw(img)
    position = (200, 10)
    font = ImageFont.truetype("arial.ttf", 20)
    image.text(position, f"{account}", fill=("#000000"), font=font)
    img.save(filename)
    print(f"QR code saved as '{filename}'")


if __name__ == "__main__":
    ACCOUNT_TYPES = ["ADMIN", "MONITOR", "PATIENT"]

    ACCOUNT = input("Enter the account: ")
    PASSWORD = input("Enter the password: ")
    ACCOUNT_TYPE = ""

    while ACCOUNT_TYPE not in ACCOUNT_TYPES:
        ACCOUNT_TYPE = input("Enter the account type: ")

    generate_qr_code(ACCOUNT, PASSWORD, ACCOUNT_TYPE)
