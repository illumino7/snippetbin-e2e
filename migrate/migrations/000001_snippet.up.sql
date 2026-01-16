CREATE TABLE IF NOT EXISTS snippets (
    short_url VARCHAR(10) PRIMARY KEY,
    id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_snippets_expires_at ON snippets (expires_at);