from controller.main import check_fields, check_signed
from flask import Blueprint, Flask, jsonify, request
import sqlite3, random, re, os, bcrypt

auth = Blueprint("auth", __name__)

@auth.route("/status/<int:user_token>", methods=["GET"])
def status(user_token):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	return jsonify({"user_id": signed.get("user_id"), "user_status": signed.get("user_status"), "user_role": signed.get("user_role")}), 200

@auth.route("/auth", methods=["POST"])
def auth_index():
	required_fields = ["user_name", "user_password"]
	error = check_fields(request.form, required_fields)
	if error:
		return jsonify(error), 400
	user_name = (request.form.get("user_name").strip()).lower()
	user_password = request.form.get("user_password")
	with sqlite3.connect("data.db") as db:
		db.row_factory = sqlite3.Row
		cursor = db.cursor()
		cursor.execute("SELECT user_password FROM user WHERE user_name=?", (user_name,))
		row = cursor.fetchone()
		if not row:
			return jsonify({
				"error": "The username is invalid",
				"field": "user_name"
			}), 400
		row = dict(row)
		if not bcrypt.checkpw(
			user_password.encode("utf-8"),
			row.get("user_password").encode("utf-8")
		):
			return jsonify({
				"error": "The password is invalid",
				"field": "user_password"
			}), 400
		while True:
			user_token = random.randint(1000000000, 9999999999)
			cursor.execute("SELECT * FROM user WHERE user_token=?", (user_token,))
			row = cursor.fetchone()
			if not row:
				break
		cursor.execute("UPDATE user SET user_token=? WHERE user_name=?", (user_token, user_name))
		return jsonify({
			"success": 1,
			"user_token": user_token
		}), 200