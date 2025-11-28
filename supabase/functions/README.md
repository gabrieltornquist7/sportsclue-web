# Supabase Database Functions

This directory contains PostgreSQL functions (RPC) that need to be deployed to your Supabase project.

## Deployment Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `mint_card_atomic.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the SQL
7. Verify the function was created successfully

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to project root
cd /path/to/sportsclue-web

# Run the migration
supabase db execute -f supabase/functions/mint_card_atomic.sql
```

### Option 3: Via SQL Client

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" -f supabase/functions/mint_card_atomic.sql
```

## Functions Included

### `mint_card_atomic`

**Purpose:** Atomically mints a card and updates the current_mints counter, preventing race conditions.

**Parameters:**
- `p_template_id` (UUID): The card template ID to mint
- `p_user_id` (UUID): The user ID who will own the card

**Returns:**
- `minted_card_id` (UUID): ID of the newly minted card (NULL on error)
- `serial_number` (INTEGER): Serial number assigned to the card (NULL on error)
- `error_message` (TEXT): Error description if minting failed (NULL on success)

**Features:**
- ✅ Atomic transaction - either everything succeeds or everything fails
- ✅ Row-level locking prevents race conditions
- ✅ Enforces max_mints cap at database level
- ✅ Automatically increments current_mints
- ✅ Generates sequential serial numbers

**Example Usage (from application code):**

```javascript
const { data, error } = await supabase
  .rpc('mint_card_atomic', {
    p_template_id: 'uuid-here',
    p_user_id: 'uuid-here'
  })

if (error || data[0].error_message) {
  console.error('Minting failed:', error || data[0].error_message)
} else {
  console.log('Minted card ID:', data[0].minted_card_id)
  console.log('Serial number:', data[0].serial_number)
}
```

## Verification

After deploying, verify the function exists:

```sql
SELECT proname, proargtypes, prosrc
FROM pg_proc
WHERE proname = 'mint_card_atomic';
```

## Troubleshooting

### Error: "function mint_card_atomic does not exist"
- Ensure you've run the SQL script in your Supabase project
- Check that you're connected to the correct project
- Verify the function was created in the `public` schema

### Error: "permission denied for function mint_card_atomic"
- The function includes `GRANT EXECUTE` for authenticated users
- Ensure your Supabase RLS policies allow authenticated users to execute functions
- Check that the user is properly authenticated

### Error: "Card template has reached maximum mints"
- This is expected behavior when a card reaches its mint cap
- The function is working correctly by preventing over-minting
- Check the `max_mints` and `current_mints` values in the `card_templates` table

## Migration Notes

This function replaces the previous non-atomic minting logic in `src/app/store/actions.js`. The old implementation had two critical issues:

1. **Data inconsistency:** The `current_mints` field could become out of sync if the update failed
2. **Race conditions:** Multiple users could mint cards beyond the max_mints cap

The atomic RPC function solves both issues by using PostgreSQL's transaction system and row-level locking.
