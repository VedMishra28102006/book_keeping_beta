from controller.main import check_signed
from flask import Blueprint, Flask, jsonify, Response, request
import io, sqlite3, zipfile

ledger = Blueprint("ledger", __name__)

def prepare_ledger(account, fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		balance = 0
		cursor.execute("SELECT journal_entry_id,journal_date,journal_ac_credited AS account,journal_amount FROM journal_fake WHERE journal_ac_debited=? AND fy_id=? AND user_id=?", (account, fy_id, user_id))
		debit_side = cursor.fetchall()
		debit_total = 0
		if debit_side:
			debit_side = [dict(row) for row in debit_side]
			debit_total = sum([row["journal_amount"] for row in debit_side])
			balance += debit_total
		cursor.execute(f"SELECT journal_entry_id,journal_date,journal_ac_debited AS account,journal_amount FROM journal_fake WHERE journal_ac_credited=? AND fy_id=? AND user_id=?", (account, fy_id, user_id))
		credit_side = cursor.fetchall()
		credit_total = 0
		if credit_side:
			credit_side = [dict(row) for row in credit_side]
			credit_total = sum([row["journal_amount"] for row in credit_side])
			balance -= credit_total
		if not debit_side and not credit_side:
			return {"error": "Invalid account"}
		balance_side = None
		if balance > 0:
			balance_side = "credit_side"
		if balance < 0:
			balance_side = "debit_side"
		total = 0
		if debit_total and credit_total:
			total = debit_total if debit_total > credit_total else credit_total
		if not debit_total:
			total = credit_total
		if not credit_total:
			total = debit_total
		balance = abs(balance)
		if download:
			cursor.execute("SELECT fy_name FROM fy WHERE fy_id=? AND user_id=?", (fy_id, user_id))
			fy_name = cursor.fetchone()["fy_name"]
			csv = "Dr,,,,,Cr\r\nDate,Particulars,Amount,Date,Particulars,Amount\r\n"
			for i in range(max(len(debit_side), len(credit_side))):
				csv += f"{'' if i >= len(debit_side) else debit_side[i]['journal_date']},{'' if i >= len(debit_side) else debit_side[i]['account']},{'' if i >= len(debit_side) else debit_side[i]['journal_amount']},{'' if i >= len(credit_side) else credit_side[i]['journal_date']},{'' if i >= len(credit_side) else credit_side[i]['account']},{'' if i >= len(credit_side) else credit_side[i]['journal_amount']}\r\n"
			csv += f"\r\n,{'Balance c/d' if balance_side == 'debit_side' else ''},{balance if balance_side == 'debit_side' else ''},,{'Balance c/d' if balance_side == 'credit_side' else ''},{balance if balance_side == 'credit_side' else ''}\r\n" if balance else ''
			csv += f"\r\n,,{total},,,{total}"
			return {
				"name": f"{fy_name}_{account}_account.csv",
				"content": csv,
				"csv": True
			}
		else:
			return {
				"debit_side": debit_side,
				"credit_side": credit_side,
				"balance_side": balance_side,
				"balance": balance,
				"total": total
			}

def prepare_all_ledgers(fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute(f"""
			SELECT journal_ac_debited AS account FROM journal_fake WHERE fy_id=? AND user_id=?
			UNION SELECT journal_ac_credited AS account FROM journal_fake WHERE fy_id=? AND user_id=?
		""", (fy_id, user_id, fy_id, user_id))
		rows = cursor.fetchall()
		rows = [dict(row) for row in rows]
		cursor.execute("SELECT * FROM bs_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id))
		bss = cursor.fetchall()
		bss = [dict(bs) for bs in bss]
		cursor.execute("SELECT * FROM tb_fake WHERE fy_id=? AND user_id=?", (fy_id, user_id))
		tbs = cursor.fetchall()
		tbs = [dict(tb) for tb in tbs]
		for i in range(len(rows)):
			for j in range(len(bss)):
				if rows[i].get("account") == bss[j].get("bs_account"):
					rows[i]["bs_operation"] = bss[j].get("bs_operation")
					rows[i]["bs_type"] = bss[j].get("bs_type")
					rows[i]["bs_subtype"] = bss[j].get("bs_subtype")
					break
			for j in range(len(tbs)):
				if rows[i].get("account") == tbs[j].get("tb_account"):
					rows[i]["tb_side"] = tbs[j].get("tb_side")
					break
			if not rows[i].get("bs_operation") or not rows[i].get("bs_type") or not rows[i].get("bs_subtype"):
				rows[i]["bs_operation"] = None
				rows[i]["bs_type"] = None
				rows[i]["bs_subtype"] = None
			if not rows[i].get("tb_side"):
				rows[i]["tb_side"] = None
			rows[i]["id"] = i
		if download:
			zip_buffer = io.BytesIO()
			with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
				for i in range(len(rows)):
					result = prepare_ledger(rows[i].get("account"), fy_id, user_id, download)
					zip_file.writestr(result.get("name"), result.get("content"))
			zip_buffer.seek(0)
			cursor.execute("SELECT fy_name FROM fy WHERE fy_id=? AND user_id=?", (fy_id, user_id))
			fy_name = cursor.fetchone()["fy_name"]
			return {
				"content": zip_buffer.read(),
				"name": f"{fy_name}_ledgers.zip",
				"zip": True
			}
		else:
			return rows

@ledger.route("/ledger/<int:user_token>/<int:user_id>/<int:fy_id>", methods=["GET"])
def ledger_index(user_token, user_id, fy_id):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	is_self = (signed.get("user_id") == user_id)
	if signed.get("user_id") != user_id and signed.get("user_role") not in ["admin", "auditor"]:
		user_id = signed.get("id")
	if request.method == "GET":
		account = request.args.get("account")
		download = request.args.get("download")
		if not account:
			result = prepare_all_ledgers(fy_id, user_id, download)
			if isinstance(result, dict) and result.get("zip"):
				return Response (
					result.get("content"),
					mimetype="application/zip",
					headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
				)
			else:
				return jsonify(result), 200
		download = request.args.get("download")
		result = prepare_ledger(account, fy_id, user_id, download)
		if result.get("csv"):
			return Response (
				result.get("content"),
				mimetype="text/csv",
				headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
			), 200
		else:
			return jsonify(result), 200