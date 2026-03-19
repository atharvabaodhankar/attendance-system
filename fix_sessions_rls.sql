-- Fix RLS policies for attendance_sessions table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can create sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students can view active sessions" ON public.attendance_sessions;

-- Teachers can view their own sessions
CREATE POLICY "Teachers can view own sessions"
ON public.attendance_sessions
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- Teachers can create sessions for their classrooms
CREATE POLICY "Teachers can create sessions"
ON public.attendance_sessions
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own sessions
CREATE POLICY "Teachers can update own sessions"
ON public.attendance_sessions
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view active sessions (for QR scanning)
CREATE POLICY "Students can view active sessions"
ON public.attendance_sessions
FOR SELECT
TO authenticated
USING (
  end_time IS NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
);
