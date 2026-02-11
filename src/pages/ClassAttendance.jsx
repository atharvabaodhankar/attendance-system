import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ClassAttendance() {
  const { class_name } = useParams();
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, roll_number")
        .eq("class_name", class_name)
        .eq("role", "student");

      if (error) console.error(error);
      else setStudents(data);

      setLoading(false);
    };

    loadStudents();
  }, [class_name]);

  const toggleStatus = (id) => {
    setStatus((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);

    const today = new Date().toISOString().split("T")[0];

    const attendanceObj = {};
    students.forEach((student) => {
      attendanceObj[student.id] = status[student.id] || "absent";
    });

    const { error } = await supabase.from("attendance").insert({
      date: today,
      class_name,
      data: attendanceObj,
    });

    if (error) {
      alert("Failed to save attendance: " + error.message);
    } else {
      alert("✅ Attendance saved!");
    }

    setSubmitting(false);
  };

  if (loading) return <p className="text-center mt-10">Loading students...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">📅 Mark Attendance for {class_name}</h2>

      {students.length === 0 ? (
        <p className="text-red-500">No students registered in this class.</p>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-600">Roll: {student.roll_number}</p>
              </div>
              <button
                onClick={() => toggleStatus(student.id)}
                className={`px-4 py-1 rounded ${
                  status[student.id] === "present"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {status[student.id] || "absent"}
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={students.length === 0 || submitting}
        className="mt-6 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {submitting ? "Submitting..." : "Submit Attendance"}
      </button>
    </div>
  );
}
