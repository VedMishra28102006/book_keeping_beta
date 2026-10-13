from flask import Blueprint
import sqlite3

main = Blueprint("main", __name__)

def check_fields(form, required_fields):
	for i in required_fields:
		if i not in form.keys():
			return {
				"error": "This field was not submitted",
				"field": i
			}
	for i in required_fields:
		if not form.get(i):
			return {
				"error": "This field is empty",
				"field": i
			}
	return False

def check_signed(user_token):
	if not user_token:
		return False
	with sqlite3.connect("data.db") as db:
		db.row_factory = sqlite3.Row
		cursor = db.cursor()
		cursor.execute("SELECT * FROM user WHERE user_token=?", (user_token,))
		row = cursor.fetchone()
		if not row:
			return False
		return dict(row)