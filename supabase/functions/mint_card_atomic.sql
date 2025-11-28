-- Atomic card minting function
-- This function ensures that card minting is atomic and prevents race conditions
-- It handles:
-- 1. Checking if minting cap has been reached
-- 2. Generating the next serial number
-- 3. Inserting the minted card
-- 4. Updating the current_mints counter
-- All in a single transaction

CREATE OR REPLACE FUNCTION mint_card_atomic(
  p_template_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  minted_card_id UUID,
  serial_number INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_template RECORD;
  v_next_serial INTEGER;
  v_minted_card_id UUID;
BEGIN
  -- Lock the template row to prevent race conditions
  SELECT * INTO v_template
  FROM card_templates
  WHERE id = p_template_id
  FOR UPDATE;

  -- Check if template exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, 'Card template not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate next serial number
  v_next_serial := COALESCE(v_template.current_mints, 0) + 1;

  -- Check if minting cap has been reached
  IF v_template.max_mints IS NOT NULL AND v_next_serial > v_template.max_mints THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INTEGER, 'Card template has reached maximum mints'::TEXT;
    RETURN;
  END IF;

  -- Insert the minted card
  INSERT INTO minted_cards (template_id, user_id, serial_number)
  VALUES (p_template_id, p_user_id, v_next_serial)
  RETURNING id INTO v_minted_card_id;

  -- Update the current_mints counter
  UPDATE card_templates
  SET current_mints = v_next_serial
  WHERE id = p_template_id;

  -- Return success
  RETURN QUERY SELECT v_minted_card_id, v_next_serial, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mint_card_atomic TO authenticated;
