CREATE TABLE IF NOT EXISTS user (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_name TEXT NOT NULL UNIQUE,
	user_password TEXT NOT NULL,
	user_token INTEGER NOT NULL UNIQUE,
	user_status TEXT NOT NULL DEFAULT "unlocked" CHECK (user_status IN ("locked", "unlocked")),
	user_role TEXT NOT NULL DEFAULT "accountant" CHECK (user_role IN ("admin", "manager", "auditor", "accountant")),
	user_department TEXT NOT NULL
);