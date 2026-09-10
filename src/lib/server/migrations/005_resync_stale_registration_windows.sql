-- Re-open registration for rescheduled programs whose close date was left in the past.
-- Status rule: registration_closed when today >= close AND today < start.
-- After admin moved start/event date forward without updating close, cards stayed closed.

UPDATE courses
SET
  registration_close_date = start_date,
  registration_open_date = COALESCE(
    registration_open_date,
    DATE_SUB(start_date, INTERVAL 30 DAY)
  ),
  program_end_date = CASE
    WHEN program_end_date IS NULL OR program_end_date < start_date THEN start_date
    ELSE program_end_date
  END
WHERE start_date > CURDATE()
  AND registration_close_date IS NOT NULL
  AND registration_close_date <= CURDATE()
  AND registration_close_date < start_date;

UPDATE events
SET
  registration_close_date = event_date,
  registration_open_date = COALESCE(
    registration_open_date,
    DATE_SUB(event_date, INTERVAL 21 DAY)
  ),
  program_end_date = CASE
    WHEN program_end_date IS NULL OR program_end_date < event_date THEN event_date
    ELSE program_end_date
  END
WHERE event_date > CURDATE()
  AND registration_close_date IS NOT NULL
  AND registration_close_date <= CURDATE()
  AND registration_close_date < event_date;
