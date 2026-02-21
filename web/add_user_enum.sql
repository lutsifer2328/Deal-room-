-- Safe additive migration to add 'user' to the user_role ENUM type.
-- This prevents the "Database error creating new user" crash during handle_new_user execution.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
