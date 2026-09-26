from controller.main import check_fields, check_signed
import bcrypt, os, random, re, sqlite3
from flask import Blueprint, current_app, jsonify, request, send_file

with sqlite3.connect("data.db") as db:
	cursor = db.cursor()
	cursor.row_factory = sqlite3.Row
	cursor.execute("SELECT * FROM user WHERE user_name=?", (os.getenv("ADMIN_USERNAME"),))
	row = cursor.fetchone()
	if not row:
		while True:
			user_token = random.randint(1000000000, 9999999999)
			cursor.execute("SELECT * FROM user WHERE user_token=?", (user_token,))
			row = cursor.fetchone()
			if not row:
				break
		admin_password = bcrypt.hashpw(os.getenv("ADMIN_PASSWORD").encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
		cursor.execute("INSERT INTO user (user_name, user_password, user_token, user_role, user_department) VALUES(?, ?, ?, ?, ?)",
			(os.getenv("ADMIN_USERNAME").strip().lower(), admin_password, user_token, "admin", "executive"))

admin = Blueprint("admin", __name__)

@admin.route("/user/<int:user_token>", methods=["GET", "DELETE", "POST"])
def user_create(user_token):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		if request.method == "GET":
			if not signed.get("user_role") in ["admin", "manager", "auditor"]:
				return jsonify({"error": "Insufficient privileges"}), 403
			if signed.get("user_role") == "admin":
				cursor.execute("SELECT user_id, user_name, user_role, user_department, user_status FROM user WHERE user_role!='admin'")
			elif signed.get("user_role") == "manager":
				cursor.execute("SELECT user_id, user_name, user_role, user_department, user_status FROM user WHERE user_role='accountant' AND user_department=?", (signed.get("user_department"),))
			elif signed.get("user_role") == "auditor":
				cursor.execute("SELECT user_id, user_name, user_role, user_department, user_status FROM user WHERE user_role IN ('accountant', 'manager') AND user_department=?", (signed.get("user_department"),))
			rows = cursor.fetchall()
			rows = [dict(row) for row in rows]
			return jsonify(rows), 200
		elif request.method == "DELETE":
			if not signed.get("user_role") in ["admin", "manager"]:
				return jsonify({"error": "Insufficient privileges"}), 403
			required_fields = ["user_id"]
			error = check_fields(request.form, required_fields)
			if error:
				return error
			user_id = request.form.get("user_id").strip()	
			if signed.get("user_role") == "admin":
				cursor.execute("SELECT * FROM user WHERE user_id=? AND user_role!='admin'", (user_id,))
			elif signed.get("user_role") == "user_manager":
				cursor.execute("SELECT * FROM user WHERE user_id=? AND user_role NOT IN ('admin', 'auditor', 'manager') AND user_department=?", (user_id, row.get("user_department")))
			row = cursor.fetchone()
			if not row:
				return jsonify({"error": "Invalid id"}), 400
			row = dict(row)
			cursor.execute("DELETE FROM user WHERE user_id=?", (row.get("user_id"),))
			return jsonify({"success": 1}), 200
		elif request.method == "POST":
			if not signed.get("user_role") in ["admin", "manager"]:
				return jsonify({"error": "Insufficient privileges"}), 403
			required_fields = ["user_id", "user_name", "user_password", "user_role", "user_department", "user_status"]
			error = check_fields(request.form, required_fields)
			if error:
				return error
			user_id = request.form.get("user_id").strip()
			user_name = request.form.get("user_name").lower().strip()
			if re.search(r"[^a-z0-9_]", user_name):
				return jsonify({
					"error": "Only alphanums and _ allowed",
					"field": "user_name"
				}), 400
			cursor.execute("SELECT 1 FROM user WHERE user_name=? AND user_id!=?", (user_name, user_id))
			row = cursor.fetchone()
			if row:
				return jsonify({
					"error": "The username is taken",
					"field": "user_name"
				}), 400
			user_password = request.form.get("user_password").strip()
			if not re.match(r"(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}", user_password):
				return jsonify({
					"error": "The password is weak",
					"field": "user_password"
				}), 400
			user_role = "accountant" if signed.get("user_role") == "manager" or not request.form.get("user_role") else (request.form.get("user_role").strip()).lower()
			if user_role not in ["accountant", "auditor", "manager"]:
				return jsonify({
					"error": "Invalid role",
					"field": "role"
				}), 400
			user_department = signed.get("user_department") if signed.get("user_role") == "manager" or not request.form.get("user_department") else (request.form.get("user_department").strip()).lower()
			user_status = request.form.get("user_status").strip()
			if user_status not in ["locked", "unlocked"]:
				return jsonify({
					"error": "The user status is invalid",
					"field": "user_status"
				}), 400
			while True:
				user_token = random.randint(1000000000, 9999999999)
				cursor.execute("SELECT * FROM user WHERE user_token=?", (user_token,))
				row = cursor.fetchone()
				if not row:
					break
			user_password = bcrypt.hashpw(user_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
			olddep = None
			if int(user_id) != 0:
				cursor.execute("SELECT * FROM user WHERE user_id=?", (user_id,))
				row = cursor.fetchone()
				row = dict(row)
				if not row:
					return jsonify({
						"error": "Invalid user id",
						"field": "user_id"
					}), 400
				if signed.get("user_role") == "manager" and (row.get("user_role") != "accountant" or row.get("user_department") != signed.get("user_department")):
					return jsonify({
						"error": "Inaccessible username",
						"field": "user_name"
					}), 400
				cursor.execute("SELECT user_department FROM user WHERE user_id=?", (user_id,))
				row = dict(cursor.fetchone())
				olddep = row.get("user_department")
				cursor.execute("UPDATE user SET user_name=?, user_password=?, user_role=?, user_department=?, user_status=?, user_token=? WHERE user_id=?",
					(user_name, user_password, user_role, user_department, user_status, user_token, user_id))
			else:
				cursor.execute("INSERT INTO user (user_name, user_password, user_role, user_department, user_status, user_token) VALUES(?, ?, ?, ?, ?, ?)",
					(user_name, user_password, user_role, user_department, user_status, user_token))
			cursor.execute("SELECT user_id, user_name, user_role, user_department, user_status FROM user WHERE user_name=?", (user_name,))
			row = cursor.fetchone()
			return jsonify({
				"olddep": olddep,
				"success": 1,
				"row": dict(row)
			}), 200

@admin.route("/export/<int:user_token>", methods=["GET"])
def export_db(user_token):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	if not signed.get("user_role") in ["admin"]:
		return jsonify({"error": "Insufficient privileges"}), 403
	return send_file(os.path.join(current_app.root_path, "data.db"), as_attachment=True)

@admin.route("/import/<int:user_token>", methods=["POST"])
def import_db(user_token):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	if not signed.get("user_role") in ["admin"]:
		return jsonify({"error": "Insufficient privileges"}), 403
	data = request.files["data"]
	if not data:
		return jsonify({"error": "Field data is empty"}), 400
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT * FROM user WHERE user_role='admin'")
		admin_data = dict(cursor.fetchone())
	with sqlite3.connect(":memory:") as db:
		raw = data.read()
		db.deserialize(raw)
		db.execute("PRAGMA schema_version;")
		with open(os.path.join(current_app.root_path, "data.db"), "wb") as f:
			f.write(raw)
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT * FROM user WHERE user_role='admin'")
		row = cursor.fetchone()
		if row:
			cursor.execute(f"""UPDATE user SET {"=?, ".join([i for i in admin_data.keys()])+"=? "} WHERE user_role='admin'""",
				tuple([i for i in admin_data.values()]))
		else:
			cursor.execute(f"""INSERT INTO user ({",".join([i for i in admin_data.keys()])}) VALUES({",".join(["?" for _ in range(len(admin_data))])})""",
				tuple([i for i in admin_data.values()]))
		return jsonify({"success": 1}), 200