--Schema

CREATE TABLE IF NOT EXISTS fy (
	fy_id INTEGER PRIMARY KEY AUTOINCREMENT,
	fy_name TEXT NOT NULL,
	fy_status TEXT NOT NULL DEFAULT "unlocked" CHECK (fy_status IN ("unlocked", "locked")),
	user_id INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

--View

CREATE VIEW IF NOT EXISTS fy_fake AS SELECT * FROM fy;

--Insert Triggers

CREATE TRIGGER IF NOT EXISTS fy_insert
INSTEAD OF INSERT ON fy_fake
FOR EACH ROW  
BEGIN
	SELECT CASE

		--Lock check

		WHEN (SELECT user_status FROM user WHERE user.user_id = NEW.user_id) = "locked"
		THEN RAISE(ABORT, "{""error"": ""Account is locked""}")

		--Existence check

		WHEN EXISTS (SELECT 1 FROM fy WHERE
			fy.fy_name = NEW.fy_name
			AND fy.user_id = NEW.user_id
		) THEN RAISE(ABORT, "{""error"": ""The fy name is taken"", ""field"": ""fy_name""}")

		--OK

		ELSE NULL

	END;
	INSERT INTO fy (fy_name, fy_status, user_id)
	VALUES (NEW.fy_name, NEW.fy_status, NEW.user_id);
END;


--Update Trigger

CREATE TRIGGER IF NOT EXISTS fy_update
INSTEAD OF UPDATE ON fy_fake
FOR EACH ROW
BEGIN
	SELECT CASE

		--Lock check

		WHEN (SELECT user_status FROM user WHERE user.user_id = OLD.user_id) = "locked"
		THEN RAISE(ABORT, "{""error"": ""Account is locked""}")

		--Existence check

		WHEN EXISTS (SELECT 1 FROM fy WHERE
			fy.fy_name = NEW.fy_name
			AND fy.user_id = OLD.user_id
			AND fy.fy_id != OLD.fy_id
		) THEN RAISE(ABORT, "{""error"": ""The fy name is taken"", ""field"": ""fy_name""}")

		--OK

		ELSE NULL

	END;
	UPDATE fy SET fy_status=NEW.fy_status WHERE fy_id=OLD.fy_id AND user_id=OLD.user_id AND NEW.fy_status != OLD.fy_status;
	UPDATE fy SET fy_name=NEW.fy_name WHERE fy_id=OLD.fy_id AND user_id=OLD.user_id AND NEW.fy_name != OLD.fy_name;
END;


-- Delete Trigger

CREATE TRIGGER IF NOT EXISTS fy_delete
INSTEAD OF DELETE ON fy_fake
FOR EACH ROW 
BEGIN
	SELECT CASE

		--Lock check

		WHEN (SELECT user_status FROM user WHERE user.user_id = OLD.user_id) = "locked" 
		THEN RAISE(ABORT, "{""error"": ""Account is locked""")

		--OK

		ELSE  NULL

	END;
	DELETE FROM fy WHERE fy_id=OLD.fy_id AND user_id=OLD.user_id;
END;