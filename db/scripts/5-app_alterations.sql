CREATE UNIQUE INDEX unique_owner ON groups (created_sub) WHERE (created_sub IS NOT NULL);