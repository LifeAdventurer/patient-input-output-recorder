import qrcode


def generate_qr_code(data, filename):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)


if __name__ == "__main__":

    account = input("Enter the account: ")
    password = input("Enter the password:　")
    url = f"https://lifeadventurer.github.io/patient-diet-recorder/patient/?acct={account}&pw={password}"
    filename = f"./account_qr_codes/qr_code_acct_{account}_pw_{password}.png"
    generate_qr_code(url, filename)
    print(f"QR code saved as {filename}")
