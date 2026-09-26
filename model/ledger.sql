--Schema

CREATE TABLE IF NOT EXISTS ledger (
	ledger_id INTEGER PRIMARY KEY AUTOINCREMENT,
	ledger_account TEXT NOT NULL,
	user_id INTEGER NOT NULL,
	fy_id INTEGER NOT NULL,
	UNIQUE (ledger_account, user_id, fy_id),
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
	FOREIGN KEY (fy_id) REFERENCES fy(id) ON DELETE CASCADE
);

--View

CREATE VIEW IF NOT EXISTS ledger_fake AS SELECT * FROM ledger;

--Trigger

CREATE TRIGGER IF NOT EXISTS ledger_insert
INSTEAD OF INSERT ON ledger_fake
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

		WHEN EXISTS (SELECT 1 FROM ledger WHERE
			ledger_account = NEW.ledger_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
		) THEN RAISE(ABORT, "{""error"": ""The account already exists""}")

		--Journal consistency check

		WHEN NOT EXISTS (SELECT 1 FROM journal WHERE
			(journal.journal_ac_credited = NEW.ledger_account OR journal.journal_ac_debited = NEW.ledger_account)
			AND journal.user_id = NEW.user_id
			AND journal.fy_id = NEW.fy_id
		) THEN RAISE(ABORT, "{""error"": ""Invalid account""}")

		--OK

		ELSE NULL

	END;

	--Update check

	UPDATE ledger SET ledger_side=NEW.ledger_side WHERE
		ledger_account = NEW.ledger_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id;

	--Delete check

	DELETE FROM ledger WHERE
		ledger_account = NEW.ledger_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id;

	--Insert check

	INSERT INTO ledger (ledger_account, user_id, fy_id)
	SELECT NEW.ledger_account, NEW.user_id, NEW.fy_id WHERE
		NOT EXISTS (SELECT 1 FROM ledger WHERE
			ledger_account = NEW.ledger_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
		);
END;