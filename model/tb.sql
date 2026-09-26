--Schema

CREATE TABLE IF NOT EXISTS tb (
	tb_id INTEGER PRIMARY KEY AUTOINCREMENT,
	tb_account TEXT NOT NULL,
	tb_side TEXT NOT NULL CHECK (tb_side IN ("debit", "credit", "nota")),
	user_id INTEGER NOT NULL,
	fy_id INTEGER NOT NULL,
	UNIQUE (tb_account, user_id, fy_id),
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
	FOREIGN KEY (fy_id) REFERENCES fy(id) ON DELETE CASCADE
);

--View

CREATE VIEW IF NOT EXISTS tb_fake AS SELECT * FROM tb;

--Trigger

CREATE TRIGGER IF NOT EXISTS tb_insert
INSTEAD OF INSERT ON tb_fake
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

		WHEN EXISTS (SELECT 1 FROM tb WHERE
			tb_account = NEW.tb_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
			AND tb_side = NEW.tb_side
		) THEN RAISE(ABORT, "{""error"": ""The account already exists""}")

		--Journal consistency check

		WHEN NOT EXISTS (SELECT 1 FROM journal WHERE
			(journal.journal_ac_credited = NEW.tb_account OR journal.journal_ac_debited = NEW.tb_account)
			AND journal.user_id = NEW.user_id
			AND journal.fy_id = NEW.fy_id
		) THEN RAISE(ABORT, "{""error"": ""Invalid account""}")

		--OK

		ELSE NULL

	END;

	--Update check

	UPDATE tb SET tb_side=NEW.tb_side WHERE
		tb_account = NEW.tb_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id
		AND NEW.tb_side != "nota";

	--Delete check

	DELETE FROM tb WHERE
		tb_account = NEW.tb_account
		AND user_id = NEW.user_id
		AND fy_id = NEW.fy_id
		AND NEW.tb_side = "nota";

	--Insert check

	INSERT INTO tb (tb_account, tb_side, user_id, fy_id)
	SELECT NEW.tb_account, NEW.tb_side, NEW.user_id, NEW.fy_id WHERE
		NEW.tb_side != "nota"
		AND NOT EXISTS (SELECT 1 FROM tb WHERE
			tb_account = NEW.tb_account
			AND user_id = NEW.user_id
			AND fy_id = NEW.fy_id
		);
END;