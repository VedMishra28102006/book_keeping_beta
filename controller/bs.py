from controller.main import check_signed
from flask import Blueprint, Flask, jsonify, Response, request
import io, sqlite3, zipfile

bs = Blueprint("bs", __name__)

def prepare_bs(fy_id, user_id, download):
	with sqlite3.connect("data.db") as db:
		cursor = db.cursor()
		cursor.row_factory = sqlite3.Row
		cursor.execute("SELECT bs_account, bs_operation, bs_subtype FROM bs_fake WHERE bs_type=? AND fy_id=? AND user_id=?", ("asset", fy_id, user_id))
		assets = cursor.fetchall()
		assets_total = 0
		current_assets = []
		current_assets_total = 0
		noncurrent_assets = []
		noncurrent_assets_total = 0
		if assets:
			assets = [dict(row) for row in assets]
			i = 0
			assets_len = len(assets)
			while i < assets_len:
				bs_account = assets[i].get("bs_account")
				cursor.execute("""SELECT
					COALESCE ((SELECT SUM(journal_amount) FROM journal_fake WHERE journal_ac_debited=? AND fy_id=? AND user_id=?), 0)
					- COALESCE ((SELECT SUM(journal_amount) FROM journal_fake WHERE journal_ac_credited=? AND fy_id=? AND user_id=?), 0)
					AS balance
				""", (bs_account, fy_id, user_id, bs_account, fy_id, user_id))
				balance = cursor.fetchone()
				assets[i]["bs_amount"] = abs(balance["balance"])
				if assets[i].get("bs_subtype") == "current":
					current_assets.append(assets[i])
				else:
					noncurrent_assets.append(assets[i])
				i += 1
			if current_assets:
				current_assets_total = sum([row["bs_amount"] for row in current_assets if row["bs_operation"] == "add"]) - sum([row["bs_amount"] for row in current_assets if row["bs_operation"] == "less"])
			if noncurrent_assets:
				noncurrent_assets_total = sum([row["bs_amount"] for row in noncurrent_assets if row["bs_operation"] == "add"]) - sum([row["bs_amount"] for row in noncurrent_assets if row["bs_operation"] == "less"])
			if assets:
				assets_total = current_assets_total + noncurrent_assets_total
		assets = {
			"current": current_assets,
			"current_total": current_assets_total,
			"noncurrent": noncurrent_assets,
			"noncurrent_total": noncurrent_assets_total,
			"total": assets_total
		}
		cursor.execute("SELECT bs_account, bs_operation, bs_subtype FROM bs_fake WHERE bs_type=? AND fy_id=? AND user_id=?", ("liability", fy_id, user_id))
		liabilities = cursor.fetchall()
		liabilities_total = 0
		current_liabilities = []
		current_liabilities_total = 0
		noncurrent_liabilities = []
		noncurrent_liabilities_total = 0
		equity = []
		equity_total = 0
		if liabilities:
			liabilities = [dict(row) for row in liabilities]
			i = 0
			liabilities_len = len(liabilities)
			while i < liabilities_len:
				bs_account = liabilities[i].get("bs_account")
				cursor.execute("""SELECT
					COALESCE ((SELECT SUM(journal_amount) FROM journal_fake WHERE journal_ac_debited=? AND user_id=? AND fy_id=?), 0)
					- COALESCE ((SELECT SUM(journalamount) FROM journal_fake WHERE journal_ac_credited=? AND user_id=? AND fy_id=?), 0)
					AS balance
				""", (bs_account, user_id, fy_id, bs_account, user_id, fy_id))
				balance = cursor.fetchone()
				liabilities[i]["bs_amount"] = abs(balance["balance"])
				if liabilities[i].get("bs_subtype") == "current":
					current_liabilities.append(liabilities[i])
				elif liabilities[i].get("bs_subtype") == "noncurrent":
					noncurrent_liabilities.append(liabilities[i])
				else:
					equity.append(liabilities[i])
				i += 1
			if current_liabilities:
				current_liabilities_total = sum([row["bs_amount"] for row in current_liabilities if row["bs_operation"] == "add"]) - sum([row["bs_amount"] for row in current_liabilities if row["bs_operation"] == "less"])
			if noncurrent_liabilities:
				noncurrent_liabilities_total = sum([row["bs_amount"] for row in noncurrent_liabilities if row["bs_operation"] == "add"]) - sum([row["bs_amount"] for row in noncurrent_liabilities if row["bs_operation"] == "less"])
			if equity:
				equity_total = sum([row["bs_amount"] for row in equity if row["bs_operation"] == "add"]) - sum([row["bs_amount"] for row in equity if row["bs_operation"] == "less"])
			if liabilities:
				liabilities_total = current_liabilities_total + noncurrent_liabilities_total + equity_total
		liabilities = {
			"current": current_liabilities,
			"current_total": current_liabilities_total,
			"noncurrent": noncurrent_liabilities,
			"noncurrent_total": noncurrent_liabilities_total,
			"equity": equity,
			"equity_total": equity_total,
			"total": liabilities_total
		}
		if download:
			cursor.execute("SELECT fy_name FROM fy WHERE id=? AND user_id=?", (fy_id, user_id))
			fy_name = cursor.fetchone()["fy_name"]
			csv = "Assets,Amount,Liabilities,Amount\r\n"
			csv += "Current Assets:,,Current Liabilities:,\r\n"
			for i in range(max(len(assets["current"]), len(liabilities["current"]))):
				csv += f"""{'' if i >= len(assets['current']) else assets['current'][i]['account']},{'' if i >= len(assets['current']) else (assets['current'][i]['amount'] if assets['current'][i]['operation'] == 'add' else f"({assets['current'][i]['amount']})")},{'' if i >= len(liabilities['current']) else liabilities['current'][i]['account']},{'' if i >= len(liabilities['current']) else (liabilities['current'][i]['amount'] if liabilities['current'][i]['operation'] == 'add' else f"({liabilities['current'][i]['amount']})")}\r\n"""
			csv += f"""\r\nTotal current assets,{assets['current_total'] if assets['current_total'] >= 0 else f"({abs(assets['current_total'])})"},Total current liabilities,{liabilities['current_total'] if liabilities['current_total'] >= 0 else f"({abs(liabilities['current_total'])})"}\r\n"""
			csv += "\r\nNon-Current Assets:,,Non-Current Liabilities:,\r\n"
			for i in range(max(len(assets["noncurrent"]), len(liabilities["noncurrent"]))):
				csv += f"""{'' if i >= len(assets['noncurrent']) else assets['noncurrent'][i]['account']},{'' if i >= len(assets['noncurrent']) else (assets['noncurrent'][i]['amount'] if assets['noncurrent'][i]['operation'] == 'add' else f"({assets['noncurrent'][i]['amount']})")},{'' if i >= len(liabilities['noncurrent']) else liabilities['noncurrent'][i]['account']},{'' if i >= len(liabilities['noncurrent']) else (liabilities['noncurrent'][i]['amount'] if liabilities['noncurrent'][i]['operation'] == 'add' else f"({liabilities['noncurrent'][i]['amount']})")}\r\n"""
			csv += f"""\r\nTotal non-current assets,{assets['noncurrent_total'] if assets['noncurrent_total'] >= 0 else f"({abs(assets['noncurrent_total'])})"},Total non-current liabilities,{liabilities['noncurrent_total'] if liabilities['noncurrent_total'] >= 0 else f"({abs(liabilities['noncurrent_total'])})"}\r\n"""
			csv += "\r\n,,Shareholders' Equity:,\r\n"
			for i in range(len(liabilities["equity"])):
				csv += f""",,{'' if i >= len(liabilities['equity']) else liabilities['equity'][i]['account']},{'' if i >= len(liabilities['equity']) else (liabilities['equity'][i]['amount'] if liabilities['equity'][i]['operation'] == 'add' else f"({liabilities['equity'][i]['amount']})")}\r\n"""
			csv += f"""\r\n,,Total shareholders' equity,{liabilities['equity_total'] if liabilities['equity_total'] >= 0 else f"({abs(liabilities['equity_total'])})"}\r\n"""
			csv += f"""\r\nTotal assets,{assets['total'] if assets['total'] >= 0 else f"({abs(assets['total'])})"},Total liabilities,{liabilities['total'] if liabilities['total'] >= 0 else f"({abs(liabilities['total'])})"}"""
			return {
				"name": f"{fy_name}_bs.csv",
				"content": csv,
				"csv": True
			}
		else:
			return {
				"assets": assets,
				"liabilities": liabilities
			}

@bs.route("/bs/<int:user_token>/<int:user_id>/<int:fy_id>", methods=["GET", "PATCH"])
def bs_index(user_token, user_id, fy_id):
	signed = check_signed(user_token)
	if not signed:
		return jsonify({"error": "Invalid user token"}), 400
	audition = 0
	if signed.get("user_id") != user_id and signed.get("user_role") not in ["admin", "auditor"]:
		user_id = signed.get("id")
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
				result = prepare_bs(fy_id, user_id, download)
				if result.get("csv"):
					return Response (
						result.get("content"),
						mimetype="text/csv",
						headers={"Content-Disposition": f"attachment; filename={result.get("name")}"}
					), 200
				else:
					return jsonify(result), 200
			elif request.method == "PATCH":
				required_fields = ["bs_type", "bs_subtype", "bs_account"]
				error = check_fields(request.form, required_fields)
				if error:
					return jsonify(error), 400
				bs_type = request.form.get("bs_type").strip()
				required_types = ["asset", "liability", "nota"]
				if bs_type not in required_types:
					return jsonify({"error": "Invalid type"}), 400
				bs_subtype = request.form.get("bs_subtype").strip()
				required_subtypes = ["current", "noncurrent", "equity"]
				if bs_type != "nota" and (bs_subtype not in required_subtypes or (bs_type == "asset" and bs_subtype == "equity")):
					return jsonify({"error": "Invalid subtype"}), 400
				bs_operation = request.form.get("bs_operation").strip()
				required_operations = ["add", "less"]
				if bs_type != "nota" and bs_operation not in required_operations:
					return jsonify({"error": "Invalid operation"}), 400
				bs_account = request.form.get("bs_account").strip()
				cursor.execute("INSERT INTO bs_fake (bs_account, bs_type, bs_subtype, bs_operation, fy_id, user_id) VALUES(?, ?, ?, ?, ?, ?)", (bs_account, bs_type, bs_subtype, bs_operation, fy_id, user_id))
				return jsonify({
					"success": 1,
					"bs_type": bs_type,
					"bs_subtype": bs_subtype,
					"bs_operation": bs_operation
				}), 200
		except sqlite3.IntegrityError as e:
			return str(e), 400, {"Content-Type": "application/json"}