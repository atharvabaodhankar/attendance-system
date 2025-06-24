import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function TeacherAttendanceForm({ className }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch all students in the class
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, roll_number")
        .eq("class_name", className)
        .eq("role", "student")
        .order("roll_number", { ascending: true });

      if (userError) {
        toast.error("Error fetching students");
        console.error(userError);
        setLoading(false);
        return;
      }

      // 2. Fetch attendance row for today
      const { data: attendanceRows, error: attError } = await supabase
        .from("attendance")
        .select("id, data")
        .eq("class_name", className)
        .eq("date", today)
        .single();

      let markedRolls = {};
      if (attendanceRows) {
        markedRolls = attendanceRows.data || {};
        setAttendanceData(markedRolls);
        setRecordId(attendanceRows.id);
      }

      // 3. Filter unmarked students
      const unmarked = users.filter(
        (s) => !markedRolls.hasOwnProperty(s.roll_number)
      );

      setStudents(unmarked);
      setLoading(false);
    };

    fetchData();
  }, [className]);

  const handleMarkAttendance = async (student) => {
    const newData = {
      ...attendanceData,
      [student.roll_number]: {
        present: true,
        marked_by: "teacher", // or teacher ID
      },
    };

    let result;
    if (recordId) {
      // Update existing row
      result = await supabase
        .from("attendance")
        .update({ data: newData })
        .eq("id", recordId);
    } else {
      // Insert new row
      result = await supabase.from("attendance").insert([
        {
          class_name: className,
          date: today,
          data: {
            [student.roll_number]: {
              present: true,
              marked_by: "teacher",
            },
          },
        },
      ]);
    }

    if (result.error) {
      toast.error("Error marking attendance");
      console.error(result.error);
    } else {
      toast.success(`Marked ✅ Roll No: ${student.roll_number}`);
      setAttendanceData(newData);
      setStudents((prev) =>
        prev.filter((s) => s.roll_number !== student.roll_number)
      );
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">
        Students Not Yet Marked Today ({today})
      </h2>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <p className="text-green-600">✅ All students have been marked today!</p>
      ) : (
        <ul className="space-y-2">
          {students.map((student) => (
            <li
              key={student.id}
              className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
            >
              <span>
                {student.roll_number} - {student.name}
              </span>
              <button
                onClick={() => handleMarkAttendance(student)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Mark Present
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
