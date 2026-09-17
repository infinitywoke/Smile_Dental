ALTER TABLE patients 
  ADD COLUMN location TEXT,
  ADD COLUMN city TEXT;

ALTER TABLE booking_requests
  ADD COLUMN location TEXT,
  ADD COLUMN city TEXT;
