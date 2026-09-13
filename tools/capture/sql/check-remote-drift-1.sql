
CREATE TABLE IF NOT EXISTS remote_checks (
    capture_id     TEXT PRIMARY KEY,
    url            TEXT NOT NULL,
    checked_at     TEXT NOT NULL,
    captured_sha   TEXT,
    remote_sha     TEXT,
    outcome        TEXT NOT NULL   -- 'unchanged', 'drifted' or the failure reason
);
