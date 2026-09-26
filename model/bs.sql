--Schema

CREATE TABLE IF NOT EXISTS bs (
	bs_id INTEGER PRIMARY KEY AUTOINCREMENT,
	bs_account TEXT NOT NULL,
	bs_type TEXT NOT NULL CHECK (bs_type IN ("asset", "liability")),
	bs_subtype TEXT NOT NULL CHECK (CASE
		WHEN bs_type="asset" THEN (bs_subtype IN ("current", "noncurrent"))
		ELSE (bs_subtype IN ("current", "noncurrent", "equity"))
	END = 1),
	bs_operation TEXT NOT NULL CHECK (bs_operation IN ("add", "less")),
	user_id INTEGER NOT NULL,
	fy_id INTEGER NOT NULL,
	UNIQUE (bs_account, bs_type, bs_subtype, bs_operation, user_id, fy_id)
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (fy_id) REFERENCES fys(id) ON DELETE CASCADE
);

--View

CREATE VIEW IF NOT EXISTS bs_fake AS SELECT * FROM bs;

--Trigger

CREATE TRIGGER IF NOT EXISTS bs_insert
INSTEAD OF INSERT ON bs_fake
FOR EACH ROW 
BEGIN
	SELECT CASE

		--User status check

		WHEN (SELECT user_status FROM user WHERE user.user_id = NEW.user_id) = "locked" 
		THEN RAISE(ABORT, "Account is locked")
		--FY status check
		WHEN (SELECT fy_status FROM fy WHERE
			fy.fy_id = NEW.fy_id
			AND fy.user_id = NEW.user_id
		) = "locked" THEN RAISE(ABORT, "{""error"": ""FY is locked""}")

		--Existence check

		WHEN EXISTS (SELECT 1 FROM bs WHERE
			bs_account = NEW.bs_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
			AND bs_type = NEW.bs_type
			AND bs_subtype = NEW.bs_subtype
			AND bs_operation = NEW.bs_operation
		) THEN RAISE(ABORT, "{""error"": ""The account already exists""}")

		--Journal consistency check

		WHEN NOT EXISTS (SELECT 1 FROM journal WHERE
			(journal.journal_ac_credited = NEW.bs_account OR journal.journal_ac_debited = NEW.bs_account)
			AND journal.user_id = NEW.user_id
			AND journal.fy_id = NEW.fy_id
		) THEN RAISE(ABORT, "{""error"": ""Invalid account""}")

		--OK

		ELSE NULL

	END;

	--Update check

	UPDATE bs SET
		bs_type=NEW.bs_type,
		bs_subtype=NEW.bs_subtype,
		bs_operation=NEW.bs_operation
	WHERE
		bs_account = NEW.bs_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id
		AND NEW.bs_type != "nota";

	--Delete check

	DELETE FROM bs WHERE
		bs_account = NEW.bs_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id
		AND NEW.bs_type = "nota";

	--Insert check

	INSERT INTO bs (bs_account, bs_type, bs_subtype, bs_operation, user_id, fy_id)
	SELECT NEW.bs_account, NEW.bs_type, NEW.bs_subtype, NEW.bs_operation, NEW.user_id, NEW.fy_id WHERE
		NEW.bs_type != "nota"
		AND NOT EXISTS (SELECT 1 FROM bs WHERE
			bs_account = NEW.bs_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
		);
END;