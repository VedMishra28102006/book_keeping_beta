from controller.main import check_fields, check_signed
from controller.journal import prepare_journal
from controller.ledger import prepare_all_ledgers
from controller.bs import prepare_bs
from controller.tb import prepare_tb
from flask import Blueprint, Flask, jsonify, Response, request
import io, sqlite3, zipfile

fy = Blueprint("fy", __name__)

def prepare_fy(fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		journal_csv = prepare_journal(fy_id, user_id, download)
		ledgers_zip = prepare_all_ledgers(None, fy_id, user_id, download)
		bs_csv = prepare_bs(fy_id, user_id, download)
		tb_csv = prepare_tb(fy_id, user_id, download)
		zip_buffer = io.BytesIO()
		with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
			zip_file.writestr(journal_csv.get("name"), journal_csv.get("content"))
			zip_file.writestr(ledgers_zip.get("name"), ledgers_zip.get("content"))
			zip_file.writestr(bs_csv.get("name"), bs_csv.get("content"))
			zip_file.writestr(tb_csv.get("name"), tb_csv.get("content"))
		zip_buffer.seek(0)
		cursor.execute("SELECT name FROM fy WHERE id=? AND user_id=?", (fy_id, user_id))
		fy_name = cursor.fetchone()["name"]
		return {
			"content": zip_buffer.read(),
			"name": f"{fy_name}.zip",
			"zip": True
		}

def prepare_all_fys(fy_id, user_id, download):
	if fy_id:
		return prepare_fy(fy_id, user_id, download)
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT * FROM fy_fake WHERE user_id=?", (user_id,))
		rows = cursor.fetchall()
		rows = [dict(row) for row in rows]
		if download:
			zip_buffer = io.BytesIO()
			with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
				for row in rows:
					result = prepare_fy(row["fy_id"], user_id, download)
					zip_file.writestr(result.get("name"), result.get("content"))
			zip_buffer.seek(0)
			cursor.execute("SELECT user_name FROM user WHERE user_id=?", (user_id,))
			user_name = cursor.fetchone()["username"]
			return {
				"content": zip_buffer.read(),
				"name": f"{user_name}.zip",
				"zip": True
			}
		else:
			return rows

@fy.route("/fy/<int:user_token>/<int:user_id>/<int:fy_id>", methods=["GET", "DELETE", "POST"])
def fy_index(user_token, user_id, fy_id):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	audition = 0
	if signed.get("user_id") != user_id and signed.get("user_role") != "auditor":
		user_id = signed.get("user_id")
	if signed.get("user_id") != user_id and signed.get("user_role") == "auditor":
		audition = 1
	if request.method != "GET" and audition:
		return jsonify({"error": "Insufficient privileges"}), 403
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		try:
			if request.method == "GET":
				download = request.args.get("download")
				result = prepare_all_fys(fy_id, user_id, download)
				if isinstance(result, dict) and result.get("zip"):
					return Response (
						result.get("content"),
						mimetype="application/zip",
						headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
					)
				else:
					return jsonify(result), 200
			elif request.method == "DELETE":
				cursor.execute("DELETE FROM fy_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id))
				return jsonify({"success": 1}), 200
			elif request.method == "POST":
				error = check_fields(request.form, ["fy_id", "fy_name", "fy_status"])
				if error:
					return jsonify(error), 400
				fy_id = request.form.get("fy_id").strip()
				fy_name = request.form.get("fy_name").strip()
				cursor.execute("SELECT 1 FROM fy_fake WHERE fy_name=? AND user_id=? AND fy_id!=?", (fy_name, user_id, fy_id))
				row = cursor.fetchone()
				if row:
					return jsonify({
						"error": "The fy name is taken",
						"field": "fy_name"
					}), 400
				fy_status = request.form.get("fy_status").strip()
				if fy_status not in ["locked", "unlocked"]:
					return jsonify({
						"error": "Invalid fy status",
						"field": "fy_status"
					}), 400
				if int(fy_id) == 0:
					cursor.execute("INSERT INTO fy_fake (fy_name, fy_status, user_id) VALUES(?, ?, ?)", (fy_name, fy_status, user_id))
				else:
					cursor.execute("SELECT * FROM fy WHERE fy_id=?", (fy_id,))
					row = cursor.fetchone()
					row = dict(row)
					if not row:
						return jsonify({
							"error": "Invalid fy id",
							"field": "fy_id"
						}), 400
					cursor.execute("UPDATE fy_fake SET fy_name=?, fy_status=? WHERE fy_id=? AND user_id=?", (fy_name, fy_status, fy_id, user_id))
				cursor.execute("SELECT fy_id, fy_name, fy_status FROM fy_fake WHERE fy_name=? AND user_id=?", (fy_name, user_id))
				row = cursor.fetchone()
				return jsonify({
					"success": 1,
					"row": dict(row)
				}), 200
		except sqlite3.IntegrityError as e:
			return str(e), 400, {"Content-Type": "application/json"}