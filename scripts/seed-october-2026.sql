-- Seed historical October 2026 regulated fuel prices.
--
-- Sources: Cenový věstník 90–107/2026 (Ministerstvo financí ČR)
--   https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/
--   https://zpravy.kurzy.cz (verified daily announcements)
--
-- Run once against your Neon Postgres instance:
--   psql $DATABASE_URL -f scripts/seed-october-2026.sql
--
-- Multi-day bulletins (Fri → Sat/Sun/Mon) are stored as a single row for the
-- first effective day.  The DB query "WHERE effective_date <= today" naturally
-- returns the correct price on subsequent days.
--
-- All prices include VAT (s DPH).  ON CONFLICT DO NOTHING makes this idempotent.

INSERT INTO prices (bulletin_id, effective_date, gasoline_czk, diesel_czk, source_url)
VALUES
  -- Oct 1 Thu — CV 90/2026, published Sep 30
  ('direct/2026-10-01', '2026-10-01', 46.14, 48.72,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-90-2026-65318'),

  -- Oct 2 Fri — CV 91/2026
  ('direct/2026-10-02', '2026-10-02', 45.92, 48.58,
   'https://zpravy.kurzy.cz/876651-sdeleni-ministerstva-financi-o-vyhlaseni-maximalnich-cen-pohonnych-hmot-na-den-2-rijna-2026/'),

  -- Oct 3–5 Sat/Sun/Mon — CV 92/2026, multi-day bulletin published Oct 2
  ('direct/2026-10-03', '2026-10-03', 45.97, 48.54,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-92-2026-65358'),

  -- Oct 6 Tue — CV 93/2026
  ('direct/2026-10-06', '2026-10-06', 45.97, 48.38,
   'https://zpravy.kurzy.cz/877083-sdeleni-ministerstva-financi-o-vyhlaseni-maximalnich-cen-pohonnych-hmot-na-den-6-rijna-2026/'),

  -- Oct 7 Wed — CV 95/2026
  ('direct/2026-10-07', '2026-10-07', 46.07, 47.97,
   'https://zpravy.kurzy.cz/877225-sdeleni-ministerstva-financi-o-vyhlaseni-maximalnich-cen-pohonnych-hmot-na-den-7-rijna-2026/'),

  -- Oct 8 Thu — CV 96/2026
  ('direct/2026-10-08', '2026-10-08', 46.07, 47.23,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-96-2026-65378'),

  -- Oct 9 Fri — CV 97/2026
  ('direct/2026-10-09', '2026-10-09', 46.31, 47.29,
   'https://zpravy.kurzy.cz/877618-vyhlaseni-maximalnich-cen-pohonnych-hmot-na-den-9-rijna-2026-cenovy-vestnik-97-2026/'),

  -- Oct 10–12 Sat/Sun/Mon — CV 98/2026, multi-day bulletin published Oct 9
  ('direct/2026-10-10', '2026-10-10', 46.48, 47.67,
   'https://zpravy.kurzy.cz/877772-vyhlaseni-maximalnich-cen-pohonnych-hmot-na-obdobi-10-rijna-2026-az-12-rijna-2026-sdeleni/'),

  -- Oct 13 Tue — CV ~99/2026
  ('direct/2026-10-13', '2026-10-13', 46.85, 48.36, NULL),

  -- Oct 14 Wed — CV ~100/2026
  ('direct/2026-10-14', '2026-10-14', 47.21, 48.61, NULL),

  -- Oct 15 Thu — CV ~101/2026
  ('direct/2026-10-15', '2026-10-15', 47.11, 48.63, NULL),

  -- Oct 16 Fri — CV 102/2026
  ('direct/2026-10-16', '2026-10-16', 46.72, 48.77,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-102-2026-65485'),

  -- Oct 17–19 Sat/Sun/Mon — CV 103/2026, multi-day bulletin published Oct 16
  ('direct/2026-10-17', '2026-10-17', 46.11, 48.89,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-103-2026-65502'),

  -- Oct 20 Tue — CV ~104/2026
  ('direct/2026-10-20', '2026-10-20', 45.65, 48.67, NULL),

  -- Oct 21 Wed — CV ~105/2026
  ('direct/2026-10-21', '2026-10-21', 45.46, 48.61, NULL),

  -- Oct 22 Thu — CV 107/2026, also stored automatically by the cron
  ('direct/2026-10-22', '2026-10-22', 45.19, 48.60,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/maximalni-pripustne-ceny-benzinu-a-nafty'),

  -- Oct 23 Fri — CV 108/2026
  ('direct/2026-10-23', '2026-10-23', 44.94, 48.70,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-108-2026-65540'),

  -- Oct 24–26 Sat/Sun/Mon — CV 109/2026, multi-day bulletin published Oct 23
  ('direct/2026-10-24', '2026-10-24', 44.55, 48.69,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-109-2026-65542'),

  -- Backfill for Oct 27 – Nov 3: the cron ran but failed to parse the MF page
  -- (nav text pushed the fuel keywords >2 KB from the prices). Values taken
  -- from the Cenový věstník PDFs. CV 111/2026 is an unrelated price decree.

  -- Oct 27 Tue — CV 110/2026
  ('direct/2026-10-27', '2026-10-27', 44.47, 48.96,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-110-2026-65549'),

  -- Oct 28–29 Wed/Thu — CV 112/2026, multi-day bulletin (Oct 28 state holiday)
  ('direct/2026-10-28', '2026-10-28', 44.45, 49.46,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-112-2026-65574'),

  -- Oct 30 Fri — CV 113/2026
  ('direct/2026-10-30', '2026-10-30', 44.26, 49.69,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-113-2026-65582'),

  -- Oct 31 – Nov 2 Sat/Sun/Mon — CV 114/2026, multi-day bulletin published Oct 30
  ('direct/2026-10-31', '2026-10-31', 43.87, 49.45,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-114-2026-65594'),

  -- Nov 3 Tue — CV 115/2026, published Nov 2
  ('direct/2026-11-03', '2026-11-03', 43.65, 49.35,
   'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik/2026/cenovy-vestnik-115-2026-65624')

ON CONFLICT DO NOTHING;
