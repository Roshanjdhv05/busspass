-- ============================================================
-- Fix Permissions and RLS for Yatrik Supabase
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. Grant table privileges to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Allow anon role to read and write without being blocked by RLS
-- Since the frontend uses custom user accounts with the anon client:

-- Users table
DROP POLICY IF EXISTS "Allow anon full access on users" ON users;
CREATE POLICY "Allow anon full access on users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Student profiles table
DROP POLICY IF EXISTS "Allow anon full access on student_profiles" ON student_profiles;
CREATE POLICY "Allow anon full access on student_profiles" ON student_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bus routes & stops
DROP POLICY IF EXISTS "Allow anon full access on bus_routes" ON bus_routes;
CREATE POLICY "Allow anon full access on bus_routes" ON bus_routes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on bus_stops" ON bus_stops;
CREATE POLICY "Allow anon full access on bus_stops" ON bus_stops FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Applications & timeline
DROP POLICY IF EXISTS "Allow anon full access on applications" ON applications;
CREATE POLICY "Allow anon full access on applications" ON applications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on application_timeline" ON application_timeline;
CREATE POLICY "Allow anon full access on application_timeline" ON application_timeline FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Issued passes & history
DROP POLICY IF EXISTS "Allow anon full access on issued_passes" ON issued_passes;
CREATE POLICY "Allow anon full access on issued_passes" ON issued_passes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on pass_history" ON pass_history;
CREATE POLICY "Allow anon full access on pass_history" ON pass_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Announcements & notifications
DROP POLICY IF EXISTS "Allow anon full access on announcements" ON announcements;
CREATE POLICY "Allow anon full access on announcements" ON announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on notifications" ON notifications;
CREATE POLICY "Allow anon full access on notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Settings & tickets
DROP POLICY IF EXISTS "Allow anon full access on settings" ON settings;
CREATE POLICY "Allow anon full access on settings" ON settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access on bus_tickets" ON bus_tickets;
CREATE POLICY "Allow anon full access on bus_tickets" ON bus_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
