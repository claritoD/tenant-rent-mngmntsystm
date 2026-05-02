-- ============================================================
-- Migration to add payment_method
-- ============================================================

ALTER TABLE payments 
ADD COLUMN payment_method TEXT DEFAULT 'gcash' CHECK (payment_method IN ('gcash', 'cash'));

ALTER TABLE payments 
ALTER COLUMN gcash_ref DROP NOT NULL;
