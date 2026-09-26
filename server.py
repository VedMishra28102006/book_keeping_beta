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
	from controller.main import main
	server.register_blueprint(main)
	from controller.auth import auth
	server.register_blueprint(auth)
	from controller.fy import fy
	server.register_blueprint(fy)
	from controller.admin import admin
	server.register_blueprint(admin)
	from controller.journal import journal
	server.register_blueprint(journal)
	from controller.ledger import ledger
	server.register_blueprint(ledger)
	from controller.bs import bs
	server.register_blueprint(bs)
	from controller.tb import tb
	server.register_blueprint(tb)

@server.route("/", methods=["GET"])
def server_index():
	return redirect("/view/index.html")

if __name__ == "__main__":
	server.run(host="0.0.0.0", port=10000)
