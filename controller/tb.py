from controller.main import check_signed
from flask import Blueprint, Flask, jsonify, Response, request
import io, sqlite3, zipfile

tb = Blueprint("tb", __name__)

def prepare_tb(fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT tb_account FROM tb_fake WHERE tb_side=? AND fy_id=? AND user_id=?", ("debit", fy_id, user_id))
		debit_side = cursor.fetchall()
		debit_side = [dict(row) for row in debit_side]
		debit_total = 0
		i = 0
		debit_len = len(debit_side)
		while i < debit_len:
			account = debit_side[i]["account"]
			cursor.execute("SELECT SUM(journal_amount) AS balance FROM journal_fake WHERE (journal_ac_debited=? OR journal_ac_credited=?) AND fy_id=? AND user_id=?", (account, account, fy_id, user_id))
			debit_side[i]["balance"] = cursor.fetchone()["balance"]
			debit_total += debit_side[i]["balance"]
			i += 1
		cursor.execute("SELECT tb_account AS account FROM tb_fake WHERE tb_side=? AND fy_id=? AND user_id=?", ("credit", fy_id, user_id))
		credit_side = cursor.fetchall()
		credit_side = [dict(row) for row in credit_side]
		credit_total = 0
		i = 0
		credit_len = len(credit_side)
		while i < credit_len:
			account = credit_side[i]["account"]
			cursor.execute("SELECT SUM(journal_amount) AS balance FROM journal_fake WHERE (journal_ac_debited=? OR journal_ac_credited=?) AND fy_id=? AND user_id=?", (account, account, fy_id, user_id))
			credit_side[i]["balance"] = cursor.fetchone()["balance"]
			credit_total += credit_side[i]["balance"]
			i += 1
		if download:
			cursor.execute("SELECT fy_name FROM fy WHERE fy_id=? AND user_id=?", (fy_id, user_id))
			fy_name = cursor.fetchone()["fy_name"]
			csv = "Account,Debit,Credit\r\n"
			for i in debit_side:
				csv += f"{i['account']},{i['balance']},\r\n"
			for i in credit_side:
				csv += f"{i['account']},,{i['balance']}\r\n"
			csv += f"\r\nTotal,{debit_total},{credit_total}"
			return {
				"name": f"{fy_name}_tb.csv",
				"content": csv,
				"csv": True
			}
		else:
			return {
				"debit_side": debit_side,
				"debit_total": debit_total,
				"credit_side": credit_side,
				"credit_total": credit_total
			}

@tb.route("/tb/<int:user_token>/<int:user_id>/<int:fy_id>", methods=["GET", "PATCH"])
def tb_index(user_token, user_id, fy_id):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	audition = 0
	if signed.get("user_id") != user_id and signed.get("user_role") not in ["admin", "auditor"]:
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
				result = prepare_tb(fy_id, user_id, download)
				if result.get("csv"):
					return Response (
						result.get("content"),
						mimetype="text/csv",
						headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
					), 200
				else:
					return jsonify(result), 200
			elif request.method == "PATCH":
				required_fields = ["tb_account", "tb_side"]
				error = check_fields(request.form, required_fields)
				if error:
					return jsonify(error), 400
				tb_side = request.form.get("tb_side").strip()
				tb_account = request.form.get("tb_account").strip()
				cursor.execute("INSERT INTO tb_fake (tb_account, tb_side, fy_id, user_id) VALUES(?, ?, ?, ?)", (tb_account, tb_side, fy_id, user_id))
				return jsonify({
					"success": 1,
					"tb_side": tb_side
				}), 200
		except sqlite3.IntegrityError as e:
			return str(e), 400, {"Content-Type": "application/json"}