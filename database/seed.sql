-- ============================================================
-- Yatrik – Demo Seed Data
-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor
-- All dates relative to 2026-11-14 (matches app seed.ts)
-- ============================================================

-- ── Settings ─────────────────────────────────────────────────
INSERT INTO settings (id, college_name, college_address, college_email, college_phone, admin_name, admin_email,
  validity_monthly, validity_quarterly, validity_half_yearly, validity_yearly,
  fee_monthly, fee_quarterly, fee_half_yearly, fee_yearly,
  instructions, counter_app, counter_pass)
VALUES ('main',
  'Mumbai Metropolitan College',
  'LBS Marg, Mulund West, Mumbai 400080',
  'transport@mmc.edu.in',
  '+91 22 2560 1234',
  'Transport Office',
  'admin@demo.com',
  30, 90, 180, 365,
  450, 1250, 2400, 4500,
  'Bring original ID card at the time of pass collection. Pass is non-transferable.',
  27, 18)
ON CONFLICT (id) DO NOTHING;


-- ── Users ─────────────────────────────────────────────────────
-- password "demo123" — store bcrypt hash in production;
-- using plaintext here so the demo app (which stores plain) works directly.
INSERT INTO users (id, email, password, role, name) VALUES
  ('admin-001',  'admin@demo.com',   'demo123', 'admin',   'Transport Office'),
  ('user-001',   'student@demo.com', 'demo123', 'student', 'Rahul Sharma'),
  ('user-002',   's2@demo.com',      'demo123', 'student', 'Priya Patel'),
  ('user-003',   's3@demo.com',      'demo123', 'student', 'Amit Kumar'),
  ('user-004',   's4@demo.com',      'demo123', 'student', 'Sneha Desai'),
  ('user-005',   's5@demo.com',      'demo123', 'student', 'Rohan Mehta'),
  ('user-006',   's6@demo.com',      'demo123', 'student', 'Anjali Singh'),
  ('user-007',   's7@demo.com',      'demo123', 'student', 'Vikram Nair'),
  ('user-008',   's8@demo.com',      'demo123', 'student', 'Kavita Joshi'),
  ('user-009',   's9@demo.com',      'demo123', 'student', 'Suresh Rao'),
  ('user-010',   's10@demo.com',     'demo123', 'student', 'Meena Krishnan'),
  ('user-011',   's11@demo.com',     'demo123', 'student', 'Arjun Verma'),
  ('user-012',   's12@demo.com',     'demo123', 'student', 'Pooja Gupta'),
  ('user-013',   's13@demo.com',     'demo123', 'student', 'Rahul Das'),
  ('user-014',   's14@demo.com',     'demo123', 'student', 'Nisha Pandey'),
  ('user-015',   's15@demo.com',     'demo123', 'student', 'Kiran Malhotra'),
  ('user-016',   's16@demo.com',     'demo123', 'student', 'Deepak Sharma'),
  ('user-017',   's17@demo.com',     'demo123', 'student', 'Sunita Iyer'),
  ('user-018',   's18@demo.com',     'demo123', 'student', 'Manish Tiwari')
ON CONFLICT (id) DO NOTHING;


-- ── Student Profiles ─────────────────────────────────────────
INSERT INTO student_profiles (id, user_id, full_name, student_id, college, course, year, mobile, email) VALUES
  ('sp-001', 'user-001', 'Rahul Sharma',    'STU2025001', 'Mumbai Metropolitan College', 'B.Com',  'TY', '9876543201', 'student@demo.com'),
  ('sp-002', 'user-002', 'Priya Patel',     'STU2025002', 'Mumbai Metropolitan College', 'B.Sc',   'SY', '9876543202', 's2@demo.com'),
  ('sp-003', 'user-003', 'Amit Kumar',      'STU2025003', 'Mumbai Metropolitan College', 'B.E',    'FY', '9876543203', 's3@demo.com'),
  ('sp-004', 'user-004', 'Sneha Desai',     'STU2025004', 'Mumbai Metropolitan College', 'B.A',    'TY', '9876543204', 's4@demo.com'),
  ('sp-005', 'user-005', 'Rohan Mehta',     'STU2025005', 'Mumbai Metropolitan College', 'M.Com',  'FY', '9876543205', 's5@demo.com'),
  ('sp-006', 'user-006', 'Anjali Singh',    'STU2025006', 'Mumbai Metropolitan College', 'B.Com',  'SY', '9876543206', 's6@demo.com'),
  ('sp-007', 'user-007', 'Vikram Nair',     'STU2025007', 'Mumbai Metropolitan College', 'M.Sc',   'SY', '9876543207', 's7@demo.com'),
  ('sp-008', 'user-008', 'Kavita Joshi',    'STU2025008', 'Mumbai Metropolitan College', 'B.A',    'FY', '9876543208', 's8@demo.com'),
  ('sp-009', 'user-009', 'Suresh Rao',      'STU2025009', 'Mumbai Metropolitan College', 'B.E',    'SY', '9876543209', 's9@demo.com'),
  ('sp-010', 'user-010', 'Meena Krishnan',  'STU2025010', 'Mumbai Metropolitan College', 'B.Sc',   'TY', '9876543210', 's10@demo.com'),
  ('sp-011', 'user-011', 'Arjun Verma',     'STU2025011', 'Mumbai Metropolitan College', 'B.Com',  'FY', '9876543211', 's11@demo.com'),
  ('sp-012', 'user-012', 'Pooja Gupta',     'STU2025012', 'Mumbai Metropolitan College', 'M.A',    'SY', '9876543212', 's12@demo.com'),
  ('sp-013', 'user-013', 'Rahul Das',       'STU2025013', 'Mumbai Metropolitan College', 'B.E',    'TY', '9876543213', 's13@demo.com'),
  ('sp-014', 'user-014', 'Nisha Pandey',    'STU2025014', 'Mumbai Metropolitan College', 'B.Sc',   'FY', '9876543214', 's14@demo.com'),
  ('sp-015', 'user-015', 'Kiran Malhotra',  'STU2025015', 'Mumbai Metropolitan College', 'B.A',    'SY', '9876543215', 's15@demo.com'),
  ('sp-016', 'user-016', 'Deepak Sharma',   'STU2025016', 'Mumbai Metropolitan College', 'M.Com',  'TY', '9876543216', 's16@demo.com'),
  ('sp-017', 'user-017', 'Sunita Iyer',     'STU2025017', 'Mumbai Metropolitan College', 'B.Com',  'FY', '9876543217', 's17@demo.com'),
  ('sp-018', 'user-018', 'Manish Tiwari',   'STU2025018', 'Mumbai Metropolitan College', 'M.Sc',   'SY', '9876543218', 's18@demo.com')
ON CONFLICT (id) DO NOTHING;


-- ── Bus Routes ────────────────────────────────────────────────
INSERT INTO bus_routes (id, number, name, start_point, end_point, description, distance_km, duration_min, color, pass_types) VALUES
  ('route-001', '12A', 'Andheri – Mulund Express',
    'Andheri Station (West)', 'Mulund Campus Gate',
    'Direct express service via Western Express Highway and LBS Marg',
    28.5, 65, '#155A3F',
    array['monthly','quarterly','half-yearly','yearly']::pass_type[]),

  ('route-002', '14B', 'Borivali – Mulund via Ghodbunder',
    'Borivali Station (East)', 'Mulund Campus Gate',
    'Covers Thane and Borivali areas via Ghodbunder Road',
    32.0, 75, '#2563EB',
    array['monthly','quarterly','half-yearly','yearly']::pass_type[]),

  ('route-003', '18C', 'Thane – Mulund Local',
    'Thane Station (West)', 'Mulund Campus Gate',
    'Short local route connecting Thane to campus',
    8.5, 25, '#D97706',
    array['monthly','quarterly','half-yearly','yearly']::pass_type[]),

  ('route-004', '21D', 'Vashi – Mulund via Airoli',
    'Vashi Bus Depot', 'Mulund Campus Gate',
    'Trans-harbour route via Airoli Bridge and Eastern Express Highway',
    22.0, 55, '#7C3AED',
    array['monthly','quarterly','half-yearly','yearly']::pass_type[]),

  ('route-005', '5S', 'Dadar – Mulund Express',
    'Dadar Station (East)', 'Mulund Campus Gate',
    'Non-stop express service via Eastern Express Highway',
    18.0, 45, '#DC2626',
    array['monthly','half-yearly','yearly']::pass_type[])
ON CONFLICT (id) DO NOTHING;


-- ── Bus Stops ─────────────────────────────────────────────────
-- Route 12A stops
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-12a-1', 'route-001', 'Andheri Station (West)',   19.1197, 72.8464, 0),
  ('stop-12a-2', 'route-001', 'DN Nagar',                 19.1150, 72.8560, 1),
  ('stop-12a-3', 'route-001', 'Jogeshwari Junction',      19.1393, 72.8503, 2),
  ('stop-12a-4', 'route-001', 'Goregaon East',            19.1600, 72.8697, 3),
  ('stop-12a-5', 'route-001', 'Powai Lake',               19.1176, 72.9060, 4),
  ('stop-12a-6', 'route-001', 'Vikhroli',                 19.1049, 72.9239, 5),
  ('stop-12a-7', 'route-001', 'Bhandup',                  19.1427, 72.9388, 6),
  ('stop-12a-8', 'route-001', 'Mulund Campus Gate',       19.1722, 72.9565, 7)
ON CONFLICT (id) DO NOTHING;

-- Route 14B stops
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-14b-1', 'route-002', 'Borivali Station (East)',  19.2288, 72.8601, 0),
  ('stop-14b-2', 'route-002', 'Kandivali East',           19.2043, 72.8632, 1),
  ('stop-14b-3', 'route-002', 'Malad East',               19.1893, 72.8630, 2),
  ('stop-14b-4', 'route-002', 'Ghodbunder Road Junction', 19.2500, 72.9700, 3),
  ('stop-14b-5', 'route-002', 'Thane Naka',               19.2183, 72.9781, 4),
  ('stop-14b-6', 'route-002', 'Mulund Campus Gate',       19.1722, 72.9565, 5)
ON CONFLICT (id) DO NOTHING;

-- Route 18C stops
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-18c-1', 'route-003', 'Thane Station (West)',     19.1821, 72.9611, 0),
  ('stop-18c-2', 'route-003', 'Thane Municipal Garden',   19.1879, 72.9693, 1),
  ('stop-18c-3', 'route-003', 'LBS Marg Thane',           19.1800, 72.9640, 2),
  ('stop-18c-4', 'route-003', 'Mulund Check Naka',        19.1750, 72.9590, 3),
  ('stop-18c-5', 'route-003', 'Mulund Campus Gate',       19.1722, 72.9565, 4)
ON CONFLICT (id) DO NOTHING;

-- Route 21D stops
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-21d-1', 'route-004', 'Vashi Bus Depot',          19.0770, 73.0070, 0),
  ('stop-21d-2', 'route-004', 'Koparkhairane',            19.1030, 73.0130, 1),
  ('stop-21d-3', 'route-004', 'Airoli Bridge',            19.1570, 72.9970, 2),
  ('stop-21d-4', 'route-004', 'Mulund (E) Junction',      19.1680, 72.9700, 3),
  ('stop-21d-5', 'route-004', 'Mulund Campus Gate',       19.1722, 72.9565, 4)
ON CONFLICT (id) DO NOTHING;

-- Route 5S stops (expanded)
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-5s-1',  'route-005', 'Dadar Station (East)',      19.0218, 72.8456,  0),
  ('stop-5s-2',  'route-005', 'Dadar East',                19.0225, 72.8470,  1),
  ('stop-5s-3',  'route-005', 'Sion Hospital',             19.0430, 72.8647,  2),
  ('stop-5s-4',  'route-005', 'Kurla West',                19.0680, 72.8794,  3),
  ('stop-5s-5',  'route-005', 'Kurla Junction',            19.0728, 72.8842,  4),
  ('stop-5s-6',  'route-005', 'Ghatkopar East',            19.0864, 72.9080,  5),
  ('stop-5s-7',  'route-005', 'Vikhroli Pipeline Road',    19.1020, 72.9240,  6),
  ('stop-5s-8',  'route-005', 'Vikhroli East',             19.1049, 72.9339,  7),
  ('stop-5s-9',  'route-005', 'Bhandup Pumping Station',   19.1300, 72.9410,  8),
  ('stop-5s-10', 'route-005', 'Mulund Campus Gate',        19.1722, 72.9565,  9)
ON CONFLICT (id) DO NOTHING;

-- Route 12A stops (expanded)
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-12a-1',  'route-001', 'Andheri Station (West)',   19.1197, 72.8464,  0),
  ('stop-12a-2',  'route-001', 'DN Nagar',                 19.1150, 72.8560,  1),
  ('stop-12a-3',  'route-001', 'Andheri East Bus Depot',   19.1130, 72.8680,  2),
  ('stop-12a-4',  'route-001', 'Jogeshwari Junction',      19.1393, 72.8503,  3),
  ('stop-12a-5',  'route-001', 'Sakivihar Road',           19.1200, 72.8900,  4),
  ('stop-12a-6',  'route-001', 'Hiranandani Gardens',      19.1176, 72.9060,  5),
  ('stop-12a-7',  'route-001', 'Goregaon East',            19.1600, 72.8697,  6),
  ('stop-12a-8',  'route-001', 'Powai Lake',               19.1176, 72.9060,  7),
  ('stop-12a-9',  'route-001', 'Vikhroli',                 19.1049, 72.9239,  8),
  ('stop-12a-10', 'route-001', 'LBS Marg Kanjur',          19.1300, 72.9350,  9),
  ('stop-12a-11', 'route-001', 'Bhandup Complex',          19.1430, 72.9388, 10),
  ('stop-12a-12', 'route-001', 'Mulund Campus Gate',       19.1722, 72.9565, 11)
ON CONFLICT (id) DO NOTHING;

-- Route 14B stops (expanded)
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-14b-1',  'route-002', 'Borivali Station (East)',  19.2288, 72.8601,  0),
  ('stop-14b-2',  'route-002', 'Borivali East Depot',      19.2300, 72.8650,  1),
  ('stop-14b-3',  'route-002', 'Kandivali East',           19.2043, 72.8632,  2),
  ('stop-14b-4',  'route-002', 'Kandivali East Bus Stop',  19.2050, 72.8640,  3),
  ('stop-14b-5',  'route-002', 'Malad East Bus Stop',      19.1890, 72.8640,  4),
  ('stop-14b-6',  'route-002', 'Malad East',               19.1893, 72.8630,  5),
  ('stop-14b-7',  'route-002', 'Goregaon East',            19.1650, 72.8690,  6),
  ('stop-14b-8',  'route-002', 'Ghodbunder Road Junction', 19.2500, 72.9700,  7),
  ('stop-14b-9',  'route-002', 'Powai Hiranandani',        19.1180, 72.9070,  8),
  ('stop-14b-10', 'route-002', 'Thane Naka',               19.2183, 72.9781,  9),
  ('stop-14b-11', 'route-002', 'Mulund Campus Gate',       19.1722, 72.9565, 10)
ON CONFLICT (id) DO NOTHING;

-- Route 18C stops (expanded)
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-18c-1', 'route-003', 'Thane Station (West)',       19.1821, 72.9611, 0),
  ('stop-18c-2', 'route-003', 'Thane Municipal Garden',     19.1879, 72.9693, 1),
  ('stop-18c-3', 'route-003', 'Thane Cadbury Junction',     19.1900, 72.9720, 2),
  ('stop-18c-4', 'route-003', 'Wagle Estate',               19.1860, 72.9780, 3),
  ('stop-18c-5', 'route-003', 'Kapurbawdi',                 19.1850, 72.9750, 4),
  ('stop-18c-6', 'route-003', 'LBS Marg Thane',             19.1800, 72.9640, 5),
  ('stop-18c-7', 'route-003', 'LBS Marg Mulund',            19.1760, 72.9600, 6),
  ('stop-18c-8', 'route-003', 'Mulund Check Naka',          19.1750, 72.9590, 7),
  ('stop-18c-9', 'route-003', 'Mulund Campus Gate',         19.1722, 72.9565, 8)
ON CONFLICT (id) DO NOTHING;

-- Route 21D stops (expanded)
INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-21d-1', 'route-004', 'Vashi Bus Depot',            19.0770, 73.0070, 0),
  ('stop-21d-2', 'route-004', 'Vashi Sector 17',            19.0790, 73.0100, 1),
  ('stop-21d-3', 'route-004', 'Koparkhairane',              19.1030, 73.0130, 2),
  ('stop-21d-4', 'route-004', 'Ghansoli',                   19.1250, 73.0120, 3),
  ('stop-21d-5', 'route-004', 'Airoli Bridge',              19.1570, 72.9970, 4),
  ('stop-21d-6', 'route-004', 'Mulund (E) Naka',            19.1660, 72.9710, 5),
  ('stop-21d-7', 'route-004', 'LBS Marg Mulund',            19.1710, 72.9600, 6),
  ('stop-21d-8', 'route-004', 'Mulund (E) Junction',        19.1680, 72.9700, 7),
  ('stop-21d-9', 'route-004', 'Mulund Campus Gate',         19.1722, 72.9565, 8)
ON CONFLICT (id) DO NOTHING;

-- Route 9X – NEW (Panvel – Mulund Campus Express)
INSERT INTO bus_routes (id, number, name, start_point, end_point, description, distance_km, duration_min, color, pass_types) VALUES
  ('route-006', '9X', 'Panvel – Mulund Campus Express',
    'Panvel Bus Depot', 'Mulund Campus Gate',
    'Express service connecting Panvel via Palm Beach Road and Vashi',
    42.0, 90, '#0891B2',
    array['monthly','quarterly','half-yearly','yearly']::pass_type[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO bus_stops (id, route_id, name, lat, lng, "order") VALUES
  ('stop-9x-1', 'route-006', 'Panvel Bus Depot',            18.9900, 73.1100, 0),
  ('stop-9x-2', 'route-006', 'Panvel Junction',             18.9930, 73.1130, 1),
  ('stop-9x-3', 'route-006', 'Kharghar Sector 7',           19.0430, 73.0680, 2),
  ('stop-9x-4', 'route-006', 'Belapur CBD',                 19.0220, 73.0400, 3),
  ('stop-9x-5', 'route-006', 'Nerul Station',               19.0330, 73.0150, 4),
  ('stop-9x-6', 'route-006', 'Vashi Bus Depot',             19.0770, 73.0070, 5),
  ('stop-9x-7', 'route-006', 'Turbhe MIDC',                 19.0960, 73.0070, 6),
  ('stop-9x-8', 'route-006', 'Ghansoli Station',            19.1200, 73.0100, 7),
  ('stop-9x-9', 'route-006', 'Mulund (E) Junction',         19.1680, 72.9700, 8)
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- APPLICATIONS
-- Using NOW() with offsets so relative dates stay correct.
-- TODAY = current DB time (run date).
-- ══════════════════════════════════════════════════════════════

-- ── Rahul Sharma (student@demo.com) – APPROVED, active pass ──

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260001', 'user-001', 'sp-001', 'route-001',
  'Rahul Sharma', 'STU2025001', 'Mumbai Metropolitan College', 'B.Com', 'TY',
  '9876543201', 'student@demo.com',
  'Andheri Station (West)', 'Mulund Campus Gate', 'stop-12a-8',
  'half-yearly', 'approved',
  NOW() - INTERVAL '55 days', NOW() - INTERVAL '53 days', 'BP20260001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260001', 'submitted', 'Application submitted',    NOW() - INTERVAL '55 days'),
  ('APP20260001', 'review',    'Under review by admin',    NOW() - INTERVAL '54 days'),
  ('APP20260001', 'approved',  'Application approved',     NOW() - INTERVAL '53 days'),
  ('APP20260001', 'pass',      'Bus pass generated',       NOW() - INTERVAL '53 days');


-- ── Issued pass for Rahul – active, expires in 52 days ───────

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260001', 'APP20260001', 'sp-001', 'user-001', 'route-001',
  'half-yearly',
  NOW() - INTERVAL '128 days',
  NOW() + INTERVAL '52 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260001', 'issued', 'Pass issued for half-yearly term', NOW() - INTERVAL '128 days');


-- ── Priya Patel – APPROVED + pass (expires in 25 days) ───────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260002', 'user-002', 'sp-002', 'route-002',
  'Priya Patel', 'STU2025002', 'Mumbai Metropolitan College', 'B.Sc', 'SY',
  '9876543202', 's2@demo.com',
  'Borivali Station (East)', 'Mulund Campus Gate', 'stop-14b-6',
  'monthly', 'approved',
  NOW() - INTERVAL '28 days', NOW() - INTERVAL '26 days', 'BP20260002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260002', 'submitted', 'Application submitted', NOW() - INTERVAL '28 days'),
  ('APP20260002', 'review',    'Under review',          NOW() - INTERVAL '27 days'),
  ('APP20260002', 'approved',  'Approved',              NOW() - INTERVAL '26 days'),
  ('APP20260002', 'pass',      'Bus pass generated',    NOW() - INTERVAL '26 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260002', 'APP20260002', 'sp-002', 'user-002', 'route-002',
  'monthly', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260002', 'issued', 'Pass issued for monthly term', NOW() - INTERVAL '5 days');


-- ── Amit Kumar – APPROVED + pass (expires in 19 days) ────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260003', 'user-003', 'sp-003', 'route-003',
  'Amit Kumar', 'STU2025003', 'Mumbai Metropolitan College', 'B.E', 'FY',
  '9876543203', 's3@demo.com',
  'Thane Station (West)', 'Mulund Campus Gate', 'stop-18c-5',
  'monthly', 'approved',
  NOW() - INTERVAL '23 days', NOW() - INTERVAL '21 days', 'BP20260003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260003', 'submitted', 'Application submitted', NOW() - INTERVAL '23 days'),
  ('APP20260003', 'review',    'Under review',          NOW() - INTERVAL '22 days'),
  ('APP20260003', 'approved',  'Approved',              NOW() - INTERVAL '21 days'),
  ('APP20260003', 'pass',      'Bus pass generated',    NOW() - INTERVAL '21 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260003', 'APP20260003', 'sp-003', 'user-003', 'route-003',
  'monthly', NOW() - INTERVAL '11 days', NOW() + INTERVAL '19 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260003', 'issued', 'Pass issued for monthly term', NOW() - INTERVAL '11 days');


-- ── Sneha Desai – APPROVED + pass (expires in 4 days — expiring soon) ──

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260004', 'user-004', 'sp-004', 'route-004',
  'Sneha Desai', 'STU2025004', 'Mumbai Metropolitan College', 'B.A', 'TY',
  '9876543204', 's4@demo.com',
  'Vashi Bus Depot', 'Mulund Campus Gate', 'stop-21d-5',
  'monthly', 'approved',
  NOW() - INTERVAL '33 days', NOW() - INTERVAL '31 days', 'BP20260004')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260004', 'submitted', 'Application submitted', NOW() - INTERVAL '33 days'),
  ('APP20260004', 'review',    'Under review',          NOW() - INTERVAL '32 days'),
  ('APP20260004', 'approved',  'Approved',              NOW() - INTERVAL '31 days'),
  ('APP20260004', 'pass',      'Bus pass generated',    NOW() - INTERVAL '31 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260004', 'APP20260004', 'sp-004', 'user-004', 'route-004',
  'monthly', NOW() - INTERVAL '26 days', NOW() + INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260004', 'issued', 'Pass issued for monthly term', NOW() - INTERVAL '26 days');


-- ── Rohan Mehta – APPROVED + pass (expires in 3 days — expiring soon) ───

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260005', 'user-005', 'sp-005', 'route-005',
  'Rohan Mehta', 'STU2025005', 'Mumbai Metropolitan College', 'M.Com', 'FY',
  '9876543205', 's5@demo.com',
  'Dadar Station (East)', 'Mulund Campus Gate', 'stop-5s-5',
  'monthly', 'approved',
  NOW() - INTERVAL '34 days', NOW() - INTERVAL '32 days', 'BP20260005')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260005', 'submitted', 'Application submitted', NOW() - INTERVAL '34 days'),
  ('APP20260005', 'approved',  'Approved',              NOW() - INTERVAL '32 days'),
  ('APP20260005', 'pass',      'Bus pass generated',    NOW() - INTERVAL '32 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260005', 'APP20260005', 'sp-005', 'user-005', 'route-005',
  'monthly', NOW() - INTERVAL '27 days', NOW() + INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260005', 'issued', 'Pass issued for monthly term', NOW() - INTERVAL '27 days');


-- ── Anjali Singh – APPROVED + pass (EXPIRED 12 days ago) ─────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260006', 'user-006', 'sp-006', 'route-001',
  'Anjali Singh', 'STU2025006', 'Mumbai Metropolitan College', 'B.Com', 'SY',
  '9876543206', 's6@demo.com',
  'Andheri Station (West)', 'Mulund Campus Gate', 'stop-12a-8',
  'monthly', 'approved',
  NOW() - INTERVAL '55 days', NOW() - INTERVAL '53 days', 'BP20260006')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260006', 'submitted', 'Application submitted', NOW() - INTERVAL '55 days'),
  ('APP20260006', 'review',    'Under review',          NOW() - INTERVAL '54 days'),
  ('APP20260006', 'approved',  'Approved',              NOW() - INTERVAL '53 days'),
  ('APP20260006', 'pass',      'Bus pass generated',    NOW() - INTERVAL '53 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260006', 'APP20260006', 'sp-006', 'user-006', 'route-001',
  'monthly', NOW() - INTERVAL '42 days', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260006', 'issued',  'Pass issued for monthly term', NOW() - INTERVAL '42 days'),
  ('BP20260006', 'expired', 'Pass expired',                 NOW() - INTERVAL '12 days');


-- ── Vikram Nair – REVOKED pass ────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260007', 'user-007', 'sp-007', 'route-002',
  'Vikram Nair', 'STU2025007', 'Mumbai Metropolitan College', 'M.Sc', 'SY',
  '9876543207', 's7@demo.com',
  'Borivali Station (East)', 'Mulund Campus Gate', 'stop-14b-6',
  'quarterly', 'approved',
  NOW() - INTERVAL '70 days', NOW() - INTERVAL '68 days', 'BP20260007')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260007', 'submitted', 'Application submitted', NOW() - INTERVAL '70 days'),
  ('APP20260007', 'review',    'Under review',          NOW() - INTERVAL '69 days'),
  ('APP20260007', 'approved',  'Approved',              NOW() - INTERVAL '68 days'),
  ('APP20260007', 'pass',      'Bus pass generated',    NOW() - INTERVAL '68 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date, revoked)
VALUES ('BP20260007', 'APP20260007', 'sp-007', 'user-007', 'route-002',
  'quarterly', NOW() - INTERVAL '68 days', NOW() + INTERVAL '22 days', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260007', 'issued',  'Pass issued for quarterly term',           NOW() - INTERVAL '68 days'),
  ('BP20260007', 'revoked', 'Revoked due to misuse — admin action',     NOW() - INTERVAL '10 days');


-- ── Kavita Joshi – PENDING ────────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260008', 'user-008', 'sp-008', 'route-003',
  'Kavita Joshi', 'STU2025008', 'Mumbai Metropolitan College', 'B.A', 'FY',
  '9876543208', 's8@demo.com',
  'Thane Station (West)', 'Mulund Campus Gate', 'stop-18c-5',
  'monthly', 'pending',
  NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260008', 'submitted', 'Application submitted', NOW() - INTERVAL '1 day');


-- ── Suresh Rao – UNDER REVIEW ─────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260009', 'user-009', 'sp-009', 'route-004',
  'Suresh Rao', 'STU2025009', 'Mumbai Metropolitan College', 'B.E', 'SY',
  '9876543209', 's9@demo.com',
  'Vashi Bus Depot', 'Mulund Campus Gate', 'stop-21d-5',
  'quarterly', 'under_review',
  NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260009', 'submitted', 'Application submitted', NOW() - INTERVAL '3 days'),
  ('APP20260009', 'review',    'Under review by admin', NOW() - INTERVAL '2 days');


-- ── Meena Krishnan – REJECTED ─────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, rejection_reason)
VALUES ('APP20260010', 'user-010', 'sp-010', 'route-005',
  'Meena Krishnan', 'STU2025010', 'Mumbai Metropolitan College', 'B.Sc', 'TY',
  '9876543210', 's10@demo.com',
  'Dadar Station (East)', 'Mulund Campus Gate', 'stop-5s-5',
  'half-yearly', 'rejected',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days',
  'Incomplete documentation — ID card copy not legible. Please resubmit with a clear scan.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260010', 'submitted', 'Application submitted', NOW() - INTERVAL '10 days'),
  ('APP20260010', 'review',    'Under review',          NOW() - INTERVAL '9 days'),
  ('APP20260010', 'rejected',  'Application rejected',  NOW() - INTERVAL '8 days');


-- ── Arjun Verma – PENDING ─────────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260011', 'user-011', 'sp-011', 'route-001',
  'Arjun Verma', 'STU2025011', 'Mumbai Metropolitan College', 'B.Com', 'FY',
  '9876543211', 's11@demo.com',
  'Andheri Station (West)', 'Mulund Campus Gate', 'stop-12a-8',
  'yearly', 'pending',
  NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260011', 'submitted', 'Application submitted', NOW() - INTERVAL '2 days');


-- ── Pooja Gupta – APPROVED + active pass ─────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260012', 'user-012', 'sp-012', 'route-002',
  'Pooja Gupta', 'STU2025012', 'Mumbai Metropolitan College', 'M.A', 'SY',
  '9876543212', 's12@demo.com',
  'Borivali Station (East)', 'Mulund Campus Gate', 'stop-14b-6',
  'quarterly', 'approved',
  NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days', 'BP20260008')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260012', 'submitted', 'Application submitted', NOW() - INTERVAL '40 days'),
  ('APP20260012', 'review',    'Under review',          NOW() - INTERVAL '39 days'),
  ('APP20260012', 'approved',  'Approved',              NOW() - INTERVAL '38 days'),
  ('APP20260012', 'pass',      'Bus pass generated',    NOW() - INTERVAL '38 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260008', 'APP20260012', 'sp-012', 'user-012', 'route-002',
  'quarterly', NOW() - INTERVAL '38 days', NOW() + INTERVAL '52 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260008', 'issued', 'Pass issued for quarterly term', NOW() - INTERVAL '38 days');


-- ── Rahul Das – PENDING ───────────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260013', 'user-013', 'sp-013', 'route-003',
  'Rahul Das', 'STU2025013', 'Mumbai Metropolitan College', 'B.E', 'TY',
  '9876543213', 's13@demo.com',
  'Thane Station (West)', 'Mulund Campus Gate', 'stop-18c-5',
  'monthly', 'pending',
  NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260013', 'submitted', 'Application submitted', NOW() - INTERVAL '4 hours');


-- ── Nisha Pandey – REJECTED ───────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, rejection_reason)
VALUES ('APP20260014', 'user-014', 'sp-014', 'route-004',
  'Nisha Pandey', 'STU2025014', 'Mumbai Metropolitan College', 'B.Sc', 'FY',
  '9876543214', 's14@demo.com',
  'Vashi Bus Depot', 'Mulund Campus Gate', 'stop-21d-5',
  'monthly', 'rejected',
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days',
  'No seats available on route 21D for monthly pass. Please try quarterly or half-yearly.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260014', 'submitted', 'Application submitted', NOW() - INTERVAL '15 days'),
  ('APP20260014', 'review',    'Under review',          NOW() - INTERVAL '14 days'),
  ('APP20260014', 'rejected',  'Application rejected',  NOW() - INTERVAL '13 days');


-- ── Kiran Malhotra – APPROVED + active yearly pass ───────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260015', 'user-015', 'sp-015', 'route-001',
  'Kiran Malhotra', 'STU2025015', 'Mumbai Metropolitan College', 'B.A', 'SY',
  '9876543215', 's15@demo.com',
  'Andheri Station (West)', 'Mulund Campus Gate', 'stop-12a-8',
  'yearly', 'approved',
  NOW() - INTERVAL '100 days', NOW() - INTERVAL '98 days', 'BP20260009')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260015', 'submitted', 'Application submitted', NOW() - INTERVAL '100 days'),
  ('APP20260015', 'review',    'Under review',          NOW() - INTERVAL '99 days'),
  ('APP20260015', 'approved',  'Approved',              NOW() - INTERVAL '98 days'),
  ('APP20260015', 'pass',      'Bus pass generated',    NOW() - INTERVAL '98 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260009', 'APP20260015', 'sp-015', 'user-015', 'route-001',
  'yearly', NOW() - INTERVAL '98 days', NOW() + INTERVAL '267 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260009', 'issued', 'Pass issued for yearly term', NOW() - INTERVAL '98 days');


-- ── Deepak Sharma – UNDER REVIEW ─────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260016', 'user-016', 'sp-016', 'route-002',
  'Deepak Sharma', 'STU2025016', 'Mumbai Metropolitan College', 'M.Com', 'TY',
  '9876543216', 's16@demo.com',
  'Borivali Station (East)', 'Mulund Campus Gate', 'stop-14b-6',
  'half-yearly', 'under_review',
  NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260016', 'submitted', 'Application submitted', NOW() - INTERVAL '5 days'),
  ('APP20260016', 'review',    'Under review by admin', NOW() - INTERVAL '4 days');


-- ── Sunita Iyer – APPROVED + active pass ─────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, pass_id)
VALUES ('APP20260017', 'user-017', 'sp-017', 'route-005',
  'Sunita Iyer', 'STU2025017', 'Mumbai Metropolitan College', 'B.Com', 'FY',
  '9876543217', 's17@demo.com',
  'Dadar Station (East)', 'Mulund Campus Gate', 'stop-5s-5',
  'half-yearly', 'approved',
  NOW() - INTERVAL '62 days', NOW() - INTERVAL '60 days', 'BP20260010')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260017', 'submitted', 'Application submitted', NOW() - INTERVAL '62 days'),
  ('APP20260017', 'review',    'Under review',          NOW() - INTERVAL '61 days'),
  ('APP20260017', 'approved',  'Approved',              NOW() - INTERVAL '60 days'),
  ('APP20260017', 'pass',      'Bus pass generated',    NOW() - INTERVAL '60 days');

INSERT INTO issued_passes (id, application_id, student_profile_id, user_id, route_id, pass_type, issue_date, expiry_date)
VALUES ('BP20260010', 'APP20260017', 'sp-017', 'user-017', 'route-005',
  'half-yearly', NOW() - INTERVAL '60 days', NOW() + INTERVAL '120 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pass_history (pass_id, action, note, occurred_at) VALUES
  ('BP20260010', 'issued', 'Pass issued for half-yearly term', NOW() - INTERVAL '60 days');


-- ── Manish Tiwari – PENDING ───────────────────────────────────

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at)
VALUES ('APP20260018', 'user-018', 'sp-018', 'route-003',
  'Manish Tiwari', 'STU2025018', 'Mumbai Metropolitan College', 'M.Sc', 'SY',
  '9876543218', 's18@demo.com',
  'Thane Station (West)', 'Mulund Campus Gate', 'stop-18c-5',
  'quarterly', 'pending',
  NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260018', 'submitted', 'Application submitted', NOW() - INTERVAL '6 hours');


-- ── Extra pending apps from student@demo.com (for history) ───

INSERT INTO applications (id, user_id, student_profile_id, route_id, full_name, student_id_no, college, course, year, mobile, email, start_point, destination, stop_id, pass_type, status, submitted_at, reviewed_at, rejection_reason)
VALUES ('APP20260019', 'user-001', 'sp-001', 'route-003',
  'Rahul Sharma', 'STU2025001', 'Mumbai Metropolitan College', 'B.Com', 'TY',
  '9876543201', 'student@demo.com',
  'Thane Station (West)', 'Mulund Campus Gate', 'stop-18c-5',
  'monthly', 'rejected',
  NOW() - INTERVAL '120 days', NOW() - INTERVAL '118 days',
  'Duplicate application for a different route. Original route 12A application was processed.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO application_timeline (application_id, event_key, label, occurred_at) VALUES
  ('APP20260019', 'submitted', 'Application submitted', NOW() - INTERVAL '120 days'),
  ('APP20260019', 'review',    'Under review',          NOW() - INTERVAL '119 days'),
  ('APP20260019', 'rejected',  'Application rejected',  NOW() - INTERVAL '118 days');


-- ══════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ══════════════════════════════════════════════════════════════

INSERT INTO announcements (id, title, body, priority, active, created_at) VALUES
  ('ann-001',
    'Winter Schedule Changes – Effective December 1',
    'Please note that bus timings will be adjusted for the winter semester. All morning routes will depart 15 minutes earlier from December 1. Please check the updated schedule on the notice board.',
    'important', true,
    NOW() - INTERVAL '5 days'),
  ('ann-002',
    'Pass Renewal Drive – November 20–25',
    'Students whose passes are expiring before December 15 can renew early at the Transport Office counter, Block A, Ground Floor. Bring your current pass and college ID. No application form required for renewal.',
    'normal', true,
    NOW() - INTERVAL '3 days'),
  ('ann-003',
    'Route 21D (Vashi) – Temporary Diversion',
    'Due to road construction on the Airoli Bridge, Route 21D will operate via an alternate path until further notice. Travel time may increase by 10–15 minutes. We apologize for the inconvenience.',
    'urgent', true,
    NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════

INSERT INTO notifications (id, audience, type, title, message, link, read, created_at) VALUES
  ('notif-001', 'user-001', 'approved',
    'Application Approved!',
    'Your bus pass application APP20260001 has been approved. Your pass BP20260001 is ready.',
    '/student/passes', true,
    NOW() - INTERVAL '53 days'),
  ('notif-002', 'admin', 'submitted',
    'New Application Received',
    'Kavita Joshi has submitted a new bus pass application APP20260008.',
    '/admin/applications', false,
    NOW() - INTERVAL '1 day'),
  ('notif-003', 'admin', 'submitted',
    'New Application Received',
    'Rahul Das has submitted a new bus pass application APP20260013.',
    '/admin/applications', false,
    NOW() - INTERVAL '4 hours'),
  ('notif-004', 'admin', 'submitted',
    'New Application Received',
    'Manish Tiwari has submitted a new bus pass application APP20260018.',
    '/admin/applications', false,
    NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- ── Expiry notifications for expiring passes ──────────────────
INSERT INTO notifications (id, audience, type, title, message, link, read, created_at) VALUES
  ('notif-005', 'user-004', 'expiring',
    'Pass Expiring Soon',
    'Your bus pass BP20260004 expires in 4 days. Apply for renewal to avoid interruption.',
    '/student/passes', false,
    NOW() - INTERVAL '1 day'),
  ('notif-006', 'user-005', 'expiring',
    'Pass Expiring Soon',
    'Your bus pass BP20260005 expires in 3 days. Apply for renewal to avoid interruption.',
    '/student/passes', false,
    NOW() - INTERVAL '1 day'),
  ('notif-007', 'user-006', 'expired',
    'Pass Has Expired',
    'Your bus pass BP20260006 expired 12 days ago. Please apply for a new pass.',
    '/student/apply', false,
    NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- BUS TICKETS  (demo — 2 tickets for Rahul Sharma)
-- ══════════════════════════════════════════════════════════════

INSERT INTO bus_tickets
  (id, user_id, student_profile_id, student_name,
   route_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
   ticket_type, passengers, fare, stations,
   issued_at, expires_at, used)
VALUES
  -- Active single ticket: Andheri Station → Vikhroli (8 stops, ₹8 × 1 pax)
  ('TKT20260001',
   'user-001', 'sp-001', 'Rahul Sharma',
   'route-001', 'stop-12a-1', 'stop-12a-9',
   'Andheri Station (West)', 'Vikhroli',
   'single', 1, 8, 8,
   NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', false),

  -- Expired return ticket: Dadar East → Ghatkopar East (4 stops, ₹4×2×2 pax = ₹16)
  ('TKT20260002',
   'user-001', 'sp-001', 'Rahul Sharma',
   'route-005', 'stop-5s-2', 'stop-5s-6',
   'Dadar East', 'Ghatkopar East',
   'return', 2, 16, 4,
   NOW() - INTERVAL '30 hours', NOW() - INTERVAL '6 hours', false)

ON CONFLICT (id) DO NOTHING;
