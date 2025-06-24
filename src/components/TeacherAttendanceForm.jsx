import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TeacherAttendanceForm({ className }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Not logged in");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("class_name", className)
        .eq("role", "student");

      if (error) {
        console.error(error);
      } else {
        setStudents(data);
      }

      setLoading(false);
    };

    load();
  }, [className]);

  const handleCheckboxChange = (roll) => {
    setAttendance((prev) => ({
      ...prev,
      [roll]: {
        present: !prev[roll]?.present,
        marked_by: userId,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!userId || Object.keys(attendance).length === 0) {
      alert("Mark attendance first.");
      return;
    }

    setSubmitting(true);

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          class_name: className,
          date: today,
          data: attendance,
        },
      ]);

    if (error) {
      console.error("Submit error:", error.message);
      alert("Error saving attendance");
    } else {
      alert("Attendance saved!");
    }

    setSubmitting(false);
  };

  if (loading) return <p className="text-center">Loading students...</p>;

  return (
    <div className="p-4 border rounded bg-white shadow space-y-4">
      <h2 className="text-xl font-semibold">Mark Attendance for {className}</h2>

      {students.length === 0 && <p>No students found in this class.</p>}

      <ul className="space-y-2">
        {students.map((stu) => (
          <li key={stu.roll_number} className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attendance[stu.roll_number]?.present || false}
                onChange={() => handleCheckboxChange(stu.roll_number)}
              />
              {stu.name} ({stu.roll_number})
            </label>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Submit Attendance"}
      </button>
    </div>
  );
}
