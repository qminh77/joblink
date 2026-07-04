-- =============================================================================
-- MIGRATION: contact_submissions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    subject       VARCHAR(255) NOT NULL DEFAULT '',
    message       TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    user_id       BIGINT NULL,
    replied_at    TIMESTAMPTZ NULL,
    reply_message TEXT NULL,
    replied_by    BIGINT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ NULL,
    CONSTRAINT chk_contact_status CHECK (status IN ('pending','read','replied','closed')),
    CONSTRAINT fk_contact_user   FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_contact_replier FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_status     ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_deleted_at ON contact_submissions(deleted_at);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_submissions_insert_anon"
    ON contact_submissions FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "contact_submissions_select_admin"
    ON contact_submissions FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role'
        OR EXISTS (
            SELECT 1 FROM users
            WHERE auth_id = auth.uid() AND role = 'admin'
        ));

CREATE POLICY "contact_submissions_update_admin"
    ON contact_submissions FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role');
