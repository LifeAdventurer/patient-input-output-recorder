# Contributing

## Language

If you would like to add support for a new language, please follow the format provided below:

```json
"{language_code}": {
  "app_title": "{Translate 'Patient Diet Recorder' here}",
  "username": "{Translate 'Username' here}",
  "password": "{Translate 'Password' here}",
  "login": "{Translate 'Login' here}",
  "limit_food_and_water_to_no_more_than": "{Translate 'Limit food and water to no more than ' here",
  "limit_food_to_no_more_than": "{Translate 'Limit food to no more than ' here",
  "limit_water_to_no_more_than": "{Translate 'Limit water to no more than ' here",
  "grams": "{Translate ' grams' here",
  "food_intake": "{Translate 'Food' here}",
  "water_consumption": "{Translate 'Water' here}",
  "urination": "{Translate 'Urination' here}",
  "defecation": "{Translate 'Defecation' here}",
  "custom": "{Translate 'custom' here}",
  "please_enter_a_positive_integer": "{Translate 'Please enter a positive integer' here}",
  "unit": "{Translate 'unit' here}",
  "times": "{Translate 'times' here}",
  "create_new_record": "{Translate 'Add' here}",
  "data_added_successfully": "{Translate 'Data added successfully' here}",
  "no_records_yet_for_today": "{Translate 'No records yet for today' here}",
  "weight": "{Translate 'Weight' here}",
  "record_count": "{Translate 'records' here}",
  "timestamp": "{Translate 'Timestamp' here}",
  "sum": "{Translate 'Sum' here}",
  "logout": "{Translate 'Logout' here}",
  "not_measured": "{Translate 'None' here}",
  "nonexistent_account": "{Translate 'Account does not exist' here}",
  "incorrect_password": "{Translate 'Incorrect password' here}",
  "account_without_permission": "{Translate 'This account does not have permission to use this page' here}",
  "confirm_logout": "{Translate 'Please confirm whether you want to log out' here}",
  "weight_abnormal": "{Translate 'The weight you entered is abnormal' here}",
  "day_of_week": ["{Translate 'Sun.' here}", "{Translate 'Mon.' here}", "{Translate 'Tue.' here}", "{Translate 'Wed.' here}", "{Translate 'Thu.' here}", "{Translate 'Fri.' here}", "{Translate 'Sat.' here}"]
}
```

- Replace `{language_code}` with the IETF BCP 47 language tag.
- Replace `{Translate '...'' here}` with the corresponding translation in the new language.
- Add the language code and name to [supported_languages.json](./supported_languagues.json)
- Add the JSON format you filled in above to the end of [lang_texts.json](./lang_texts.json)
