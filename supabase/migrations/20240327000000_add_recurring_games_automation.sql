-- Function to update recurring games
CREATE OR REPLACE FUNCTION handle_recurring_games()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update games that are:
  -- 1. Recurring (is_recurring = true)
  -- 2. Have a date in the past
  UPDATE games
  SET date = date + INTERVAL '1 week'
  WHERE 
    is_recurring = true 
    AND date < NOW()
    AND date > NOW() - INTERVAL '1 week'; -- Only update games that ended within the last week

  RETURN NULL;
END;
$$;

-- Create a trigger to run after any SELECT on games table
CREATE OR REPLACE TRIGGER update_recurring_games_trigger
  AFTER SELECT ON games
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_recurring_games();

-- Add comment explaining the function and trigger
COMMENT ON FUNCTION handle_recurring_games() IS 'Automatically updates recurring games to the next week when their date has passed';
COMMENT ON TRIGGER update_recurring_games_trigger ON games IS 'Triggers the update of recurring games after any SELECT operation on the games table';
