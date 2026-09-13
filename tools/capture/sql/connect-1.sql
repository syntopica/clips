
CREATE TABLE IF NOT EXISTS captures (
    normalized_url TEXT PRIMARY KEY,
    url            TEXT NOT NULL,
    capture_id     TEXT NOT NULL,
    clip_dir       TEXT NOT NULL,
    content_sha256 TEXT,
    title          TEXT,
    captured_at    TEXT,
    status         TEXT NOT NULL DEFAULT 'captured'
);
CREATE INDEX IF NOT EXISTS captures_content ON captures(content_sha256);
CREATE INDEX IF NOT EXISTS captures_id ON captures(capture_id);

CREATE TABLE IF NOT EXISTS assets (
    asset_sha256 TEXT,
    source_url   TEXT NOT NULL,
    capture_id   TEXT NOT NULL,
    bytes        INTEGER,
    status       TEXT NOT NULL,  -- 'ok' or the failure reason; sha is NULL when not ok
    PRIMARY KEY (capture_id, source_url)
);
CREATE INDEX IF NOT EXISTS assets_sha ON assets(asset_sha256);

CREATE TABLE IF NOT EXISTS unavailable (
    url          TEXT PRIMARY KEY,
    http_status  INTEGER,
    first_seen   TEXT,
    last_tried   TEXT,
    recovered_from TEXT
);
