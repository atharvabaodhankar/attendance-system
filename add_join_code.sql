-- Add join_code column to classrooms table
ALTER TABLE public.classrooms 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Generate join codes for existing classrooms
UPDATE public.classrooms 
SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE join_code IS NULL;

-- Make join_code NOT NULL after populating
ALTER TABLE public.classrooms 
ALTER COLUMN join_code SET NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON public.classrooms(join_code);
