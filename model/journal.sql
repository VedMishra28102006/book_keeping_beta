--Schema

CREATE TABLE IF NOT EXISTS journal (
	journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
	journal_date TEXT NOT NULL,
	journal_ac_debited TEXT NOT NULL,
	journal_ac_credited TEXT NOT NULL,
	journal_amount INTEGER NOT NULL CHECK (journal_amount > 0),
	journal_description TEXT NOT NULL,
	journal_entry_id TEXT NOT NULL,
	user_id INTEGER NOT NULL,
	fy_id INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
	FOREIGN KEY (fy_id) REFERENCES fy(id) ON DELETE CASCADE
);

--View

CREATE VIEW IF NOT EXISTS journal_fake AS SELECT * FROM journal;

--Insert Trigger

CREATE TRIGGER IF NOT EXISTS journal_insertion
INSTEAD OF INSERT ON journal_fake
FOR EACH ROW
BEGIN
	SELECT CASE
		--User status check
		WHEN (SELECT user_status FROM user WHERE user.user_id = NEW.user_id) = "locked" 
		THEN RAISE(ABORT, "{""error"": ""Account is locked""}")
		--FY status check
		WHEN (SELECT fy_status FROM fy WHERE fy.fy_id = NEW.fy_id AND fy.user_id = NEW.user_id) = "locked" 
		THEN RAISE(ABORT, "{""error"": ""FY is locked""}")
		--Amount check
		WHEN TYPEOF(CAST(NEW.journal_amount AS INTEGER)) != "integer"
		THEN RAISE(ABORT, "{""journal_entry_id"": """ || NEW.journal_entry_id || """, ""field"": ""journal_amount"", ""error"": ""Invalid amount""}")
		--Date check
		WHEN strftime("%Y-%m-%d", NEW.journal_date) IS NULL
		THEN RAISE(ABORT, "{""journal_entry_id"": """ || NEW.journal_entry_id || """, ""field"": ""journal_date"", ""error"": ""Invalid date""}")
		--OK
		ELSE NULL
	END;
	--New data
	INSERT INTO journal (journal_date, journal_ac_debited, journal_ac_credited, journal_amount, journal_description, journal_entry_id, user_id, fy_id)
	VALUES (NEW.journal_date, NEW.journal_ac_debited, NEW.journal_ac_credited, CAST(NEW.journal_amount AS INTEGER), NEW.journal_description, NEW.journal_entry_id, NEW.user_id, NEW.fy_id);
	--Consistency with bs
	DELETE FROM bs WHERE NOT EXISTS (SELECT 1 FROM journal WHERE (bs.bs_account=journal.journal_ac_credited OR bs.bs_account = journal.journal_ac_debited) AND bs.user_id=journal.user_id AND bs.fy_id=journal.fy_id);
	--Consistency with tb
	DELETE FROM tb WHERE NOT EXISTS (SELECT 1 FROM journal WHERE (tb.tb_account=journal.journal_ac_credited OR tb.tb_account = journal.journal_ac_debited) AND tb.user_id=journal.user_id AND tb.fy_id=journal.fy_id);
END;

--Delete Trigger

CREATE TRIGGER IF NOT EXISTS journal_delete
INSTEAD OF DELETE ON journal_fake
FOR EACH ROW
BEGIN
	SELECT CASE
		--User status check
		WHEN (SELECT user_status FROM user WHERE user.user_id = OLD.user_id) = "locked" 
		THEN RAISE(ABORT, "{""error"": ""Account is locked""}")
		--FY status check
		WHEN (SELECT fy_status FROM fy WHERE fy.fy_id = OLD.fy_id AND fy.user_id = OLD.user_id) = "locked" 
		THEN RAISE(ABORT, "{""error"": ""FY is locked""}")
		--OK
		ELSE NULL
	END;
	DELETE FROM journal WHERE user_id=OLD.user_id AND fy_id=OLD.fy_id;
END;