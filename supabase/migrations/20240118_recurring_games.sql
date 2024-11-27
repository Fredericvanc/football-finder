drop function if exists handle_recurring_games() cascade;

-- Function to handle recurring games
create
or replace function handle_recurring_games () returns void as $$
DECLARE
  updated_count integer;
BEGIN
  -- Update dates for recurring games that have passed
  WITH updated_rows AS (
    UPDATE games
    SET date = date + INTERVAL '1 week'
    WHERE is_recurring = true
    AND date::timestamptz < CURRENT_TIMESTAMP
    RETURNING *
  )
  SELECT count(*) INTO updated_count FROM updated_rows;

  -- Log the update
  RAISE NOTICE 'Updated % recurring games', updated_count;
END;
$$ language plpgsql;