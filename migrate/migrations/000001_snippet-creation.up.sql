CREATE TABLE IF NOT EXISTS snippets (
    id UUID PRIMARY KEY,           
    title BYTEA,        
    content BYTEA NOT NULL,
    iv BYTEA NOT NULL,             
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_snippets_expires ON snippets (expires_at);