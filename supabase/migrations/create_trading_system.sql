-- ============================================
-- TRADING & MARKETPLACE SYSTEM
-- ============================================
-- This migration creates tables and functions for:
-- 1. Marketplace listings (buy/sell for coins)
-- 2. Direct trades between users
-- 3. Secure atomic transactions

-- ============================================
-- MARKETPLACE LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES minted_cards(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX idx_marketplace_active ON marketplace_listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_id);

-- ============================================
-- TRADE OFFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  initiator_card_id UUID NOT NULL REFERENCES minted_cards(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_card_id UUID NOT NULL REFERENCES minted_cards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  initiator_confirmed BOOLEAN NOT NULL DEFAULT false,
  recipient_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Prevent trading with yourself
  CHECK (initiator_id != recipient_id),
  -- Prevent trading same card
  CHECK (initiator_card_id != recipient_card_id)
);

-- Indexes for faster queries
CREATE INDEX idx_trades_initiator ON trade_offers(initiator_id, status);
CREATE INDEX idx_trades_recipient ON trade_offers(recipient_id, status);
CREATE INDEX idx_trades_status ON trade_offers(status, created_at DESC);

-- ============================================
-- ATOMIC MARKETPLACE PURCHASE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION purchase_marketplace_listing(
  p_listing_id UUID,
  p_buyer_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  card_id UUID
) AS $$
DECLARE
  v_listing RECORD;
  v_buyer_coins INTEGER;
BEGIN
  -- Lock the listing row to prevent double-purchase
  SELECT * INTO v_listing
  FROM marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  -- Check if listing exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Listing not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if listing is active
  IF v_listing.status != 'active' THEN
    RETURN QUERY SELECT false, 'Listing is no longer available'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Prevent buying your own listing
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN QUERY SELECT false, 'Cannot purchase your own listing'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get buyer's current coins (with lock)
  SELECT coins INTO v_buyer_coins
  FROM profiles
  WHERE id = p_buyer_id
  FOR UPDATE;

  -- Check if buyer has enough coins
  IF v_buyer_coins < v_listing.price THEN
    RETURN QUERY SELECT false, 'Insufficient coins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Deduct coins from buyer
  UPDATE profiles
  SET coins = coins - v_listing.price
  WHERE id = p_buyer_id;

  -- Add coins to seller
  UPDATE profiles
  SET coins = coins + v_listing.price
  WHERE id = v_listing.seller_id;

  -- Transfer card ownership
  UPDATE minted_cards
  SET user_id = p_buyer_id
  WHERE id = v_listing.card_id;

  -- Mark listing as sold
  UPDATE marketplace_listings
  SET
    status = 'sold',
    buyer_id = p_buyer_id,
    sold_at = NOW(),
    updated_at = NOW()
  WHERE id = p_listing_id;

  -- Return success
  RETURN QUERY SELECT true, NULL::TEXT, v_listing.card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ATOMIC TRADE EXECUTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION execute_trade(
  p_trade_id UUID,
  p_user_id UUID,
  p_confirm BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  trade_completed BOOLEAN
) AS $$
DECLARE
  v_trade RECORD;
  v_other_confirmed BOOLEAN;
BEGIN
  -- Lock the trade row
  SELECT * INTO v_trade
  FROM trade_offers
  WHERE id = p_trade_id
  FOR UPDATE;

  -- Check if trade exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Trade offer not found'::TEXT, false;
    RETURN;
  END IF;

  -- Check if trade is still pending
  IF v_trade.status != 'pending' THEN
    RETURN QUERY SELECT false, 'Trade is no longer active'::TEXT, false;
    RETURN;
  END IF;

  -- Check if user is part of the trade
  IF p_user_id != v_trade.initiator_id AND p_user_id != v_trade.recipient_id THEN
    RETURN QUERY SELECT false, 'You are not part of this trade'::TEXT, false;
    RETURN;
  END IF;

  -- If cancelling/rejecting
  IF NOT p_confirm THEN
    UPDATE trade_offers
    SET
      status = CASE
        WHEN p_user_id = v_trade.initiator_id THEN 'cancelled'
        ELSE 'rejected'
      END,
      updated_at = NOW()
    WHERE id = p_trade_id;

    RETURN QUERY SELECT true, NULL::TEXT, false;
    RETURN;
  END IF;

  -- Update confirmation status
  IF p_user_id = v_trade.initiator_id THEN
    UPDATE trade_offers
    SET initiator_confirmed = true, updated_at = NOW()
    WHERE id = p_trade_id;
    v_other_confirmed := v_trade.recipient_confirmed;
  ELSE
    UPDATE trade_offers
    SET recipient_confirmed = true, updated_at = NOW()
    WHERE id = p_trade_id;
    v_other_confirmed := v_trade.initiator_confirmed;
  END IF;

  -- If both confirmed, execute the trade
  IF v_other_confirmed THEN
    -- Verify both users still own their cards
    IF NOT EXISTS (
      SELECT 1 FROM minted_cards
      WHERE id = v_trade.initiator_card_id AND user_id = v_trade.initiator_id
    ) THEN
      UPDATE trade_offers SET status = 'cancelled', updated_at = NOW() WHERE id = p_trade_id;
      RETURN QUERY SELECT false, 'Initiator no longer owns the card'::TEXT, false;
      RETURN;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM minted_cards
      WHERE id = v_trade.recipient_card_id AND user_id = v_trade.recipient_id
    ) THEN
      UPDATE trade_offers SET status = 'cancelled', updated_at = NOW() WHERE id = p_trade_id;
      RETURN QUERY SELECT false, 'Recipient no longer owns the card'::TEXT, false;
      RETURN;
    END IF;

    -- Swap card ownership atomically
    UPDATE minted_cards
    SET user_id = v_trade.recipient_id
    WHERE id = v_trade.initiator_card_id;

    UPDATE minted_cards
    SET user_id = v_trade.initiator_id
    WHERE id = v_trade.recipient_card_id;

    -- Mark trade as completed
    UPDATE trade_offers
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_trade_id;

    RETURN QUERY SELECT true, NULL::TEXT, true;
  ELSE
    -- Only one party confirmed so far
    RETURN QUERY SELECT true, NULL::TEXT, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON marketplace_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON trade_offers TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_marketplace_listing TO authenticated;
GRANT EXECUTE ON FUNCTION execute_trade TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active marketplace listings
CREATE POLICY "Anyone can view active listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());

-- Users can create listings for their own cards
CREATE POLICY "Users can create their own listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
  ON marketplace_listings FOR UPDATE
  USING (seller_id = auth.uid());

-- Users can view trades they're involved in
CREATE POLICY "Users can view their own trades"
  ON trade_offers FOR SELECT
  USING (initiator_id = auth.uid() OR recipient_id = auth.uid());

-- Users can create trade offers
CREATE POLICY "Users can create trade offers"
  ON trade_offers FOR INSERT
  WITH CHECK (initiator_id = auth.uid());

-- Users can update trades they're involved in
CREATE POLICY "Users can update their trades"
  ON trade_offers FOR UPDATE
  USING (initiator_id = auth.uid() OR recipient_id = auth.uid());
