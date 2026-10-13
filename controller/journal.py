from controller.main import check_fields, check_signed
from flask import Blueprint, Flask, jsonify, Response, request
import io, sqlite3, zipfile

journal = Blueprint("journal", __name__)

def prepare_journal(fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT * FROM journal_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id))
		rows = cursor.fetchall()
		rows = [dict(row) for row in rows]
		total = 0
		if rows:
			cursor.execute("SELECT SUM(journal_amount) FROM journal_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id))
			total = cursor.fetchone()
			total = total[0] if total and total[0] is not None else 0
		if download:
			cursor.execute("SELECT fy_name FROM fy WHERE fy_id=? AND user_id=?", (fy_id, user_id))
			fy_name = cursor.fetchone()["fy_name"]
			csv = "Date,Particulars,Debit,Credit\r\n"
			for row in rows:
				csv += f"{row['journal_date']},{row['journal_ac_debited']} A/c Dr.,{row['journal_amount']},\r\n,    To {row['journal_ac_credited']} A/c,,{row['journal_amount']}\r\n,({row['journal_description']}),,\r\n"
			csv += f"\r\n,,{total},{total}"
			return {
				"name": f"{fy_name}_journal.csv",
				"content": csv,
				"csv": True
			}
		else:
			return {
				"rows": rows,
				"total": total
			}

@journal.route("/journal/<int:user_token>/<int:user_id>/<int:fy_id>", methods=["GET", "POST"])
def journal_index(user_token, user_id, fy_id):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	audition = 0
	if signed.get("user_id") != user_id and signed.get("user_role") != "auditor":
		user_id = signed.get("user_id")
	if signed.get("user_id") != user_id and signed.get("user_role") == "auditor":
		audition = 1
	if request.method != "GET" and audition:
		return jsonify({"error": "Unauthorized access"}), 403
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		try:
			if request.method == "GET":
				download = request.args.get("download")
				result = prepare_journal(fy_id, user_id, download)
				if result.get("csv"):
					return Response (
						result.get("content"),
						mimetype="text/csv",
						headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
					), 200
				else:
					return jsonify(result), 200
			elif request.method == "POST":
				required_fields = ["journal_date", "journal_ac_debited", "journal_ac_credited", "journal_amount", "journal_description"]
				balance = {}
				for i in range(len(request.json)):
					error = check_fields(request.json[i], required_fields)
					if error:
						error["index"] = i
						return jsonify(error), 400
				cursor.execute("DELETE FROM journal_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id));
				for i in range(len(request.json)):
					cursor.execute("INSERT INTO journal_fake (journal_date, journal_ac_debited, journal_ac_credited, journal_amount, journal_description, journal_entry_id, fy_id, user_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
						(request.json[i]["journal_date"].strip(), (request.json[i]["journal_ac_debited"].strip()).replace(",", ""), (request.json[i]["journal_ac_credited"].strip()).replace(",", ""), request.json[i]["journal_amount"].strip(), (request.json[i]["journal_description"].strip()).translate(str.maketrans({"(": "", ",": "", ")": ""})), i, fy_id, user_id))
				return jsonify({"success": 1}), 200
		except sqlite3.IntegrityError as e:
			return str(e), 400, {"Content-Type": "application/json"}