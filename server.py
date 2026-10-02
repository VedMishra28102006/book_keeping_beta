from flask import Blueprint, current_app, Flask, redirect
import sqlite3

server = Flask(__name__, static_folder="view")

with sqlite3.connect("data.db") as db:
	models = [
		"model/main.sql",
		"model/auth.sql",
		"model/fy.sql",
		"model/admin.sql",
		"model/journal.sql",
		"model/ledger.sql",
		"model/bs.sql",
		"model/tb.sql"
	]
	for model in models:
		with open(model) as m:
			db.executescript(m.read())

with server.app_context():
	import controller
	server.register_blueprint(controller.main)
	server.register_blueprint(controller.auth)
	server.register_blueprint(controller.fy)
	server.register_blueprint(controller.admin)
	server.register_blueprint(controller.journal)
	server.register_blueprint(controller.ledger)
	server.register_blueprint(controller.bs)
	server.register_blueprint(controller.tb)

@server.route("/", methods=["GET"])
def server_index():
	return redirect("/view/index.html")

if __name__ == "__main__":
	server.run(host="0.0.0.0", port=10000)
