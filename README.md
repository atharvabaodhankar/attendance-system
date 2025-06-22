# Attendance Management System

A modern web application for tracking student attendance, built with React and Supabase.

## Features

- **User Authentication**: Secure login and registration system with role-based access (student/teacher)
- **Attendance Tracking**: Teachers can mark students as present or absent
- **Self-Attendance**: Students can mark themselves as present
- **Attendance History**: View attendance records by month and year
- **Role-Based Access Control**: Different interfaces for students and teachers

## Tech Stack

- **Frontend**: React with Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Routing**: React Router

## Database Schema

```sql
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text])),
  marked_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(id),
  CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd attendance-system
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up your Supabase database with the schema provided above

5. Start the development server
   ```bash
   npm run dev
   ```

## Usage

### Teacher Role

1. Register/Login with a teacher account
2. Use the "Manage Attendance" tab to mark students as present or absent
3. View attendance history for all students or filter by specific student

### Student Role

1. Register/Login with a student account
2. Use the "Mark Attendance" tab to mark yourself as present
3. View your personal attendance history

## License

MIT
