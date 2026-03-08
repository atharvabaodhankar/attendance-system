-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Profiles Table (files)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    
    -- Student Specific Fields
    prn TEXT UNIQUE,
    branch TEXT,
    year TEXT,
    batch TEXT, -- e.g., 'A', 'B'
    roll_no TEXT,
    roll_edit_count INT DEFAULT 0,
    
    -- Teacher Specific Fields
    is_approved BOOLEAN DEFAULT FALSE, -- Requires Admin approval
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- Classrooms Table
CREATE TABLE public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
    batch_filter TEXT, -- If set, only students from this batch can join
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Classrooms
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classrooms are viewable by everyone" 
ON public.classrooms FOR SELECT USING (true); -- Simplified for visibility

CREATE POLICY "Teachers can create classrooms" 
ON public.classrooms FOR INSERT WITH CHECK (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher' and is_approved = true)
);

-- Classroom Enrollments (Many-to-Many)
CREATE TABLE public.classroom_students (
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (classroom_id, student_id)
);

ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can join classrooms" 
ON public.classroom_students FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "View enrollments" 
ON public.classroom_students FOR SELECT USING (true);


-- Attendance Sessions
CREATE TABLE public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    qr_code TEXT NOT NULL, -- Dynamic code for the session
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ, -- If null, session is active
    location_required BOOLEAN DEFAULT FALSE,
    teacher_latitude FLOAT,
    teacher_longitude FLOAT,
    radius_meters FLOAT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions" 
ON public.attendance_sessions FOR SELECT USING (true);

CREATE POLICY "Teachers can manage sessions" 
ON public.attendance_sessions FOR ALL USING (auth.uid() = teacher_id);


-- Attendance Records
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'flagged');

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    status attendance_status DEFAULT 'present',
    risk_score FLOAT DEFAULT 0.0,
    
    -- Metadata for verification
    latitude FLOAT,
    longitude FLOAT,
    device_info TEXT,
    ip_address TEXT,
    
    UNIQUE(session_id, student_id) -- Only mark once per session
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own attendance" 
ON public.attendance_records FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their session attendance" 
ON public.attendance_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = attendance_records.session_id
        AND s.teacher_id = auth.uid()
    )
);

CREATE POLICY "Students can mark attendance" 
ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = student_id);


-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" 
ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
