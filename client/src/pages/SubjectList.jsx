import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAppContext } from "../context/AppContext";
import { Eye, Download } from "lucide-react";
import toast from "react-hot-toast";

const SubjectList = () => {
  const { branchShortName, semNumber } = useParams();
  const branch = branchShortName.toUpperCase();
  const semester = Number(semNumber.replace("sem", ""));

  const { axios, token } = useAppContext();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await axios.get(
          `/api/uploads/subjects/list?branch=${branch}&semester=${semester}`
        );
        setSubjects(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
    // eslint-disable-next-line
  }, [branch, semester]);

  // ---------------- VIEW ----------------
  const handleView = (fileUrl) => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  // ---------------- DOWNLOAD (same as Profile) ----------------
  const handleDownload = async (uploadId, filename = "download") => {
    try {
      const res = await axios.get(
        `/api/uploads/${uploadId}/download`,
        {
          headers: { Authorization: token },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen pt-28 pb-16 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-indigo-700 mb-10">
            {branch} – Semester {semester}
          </h1>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : subjects.length === 0 ? (
            <p className="text-gray-500">No subjects found.</p>
          ) : (
            <div className="space-y-10">
              {subjects.map((sub) => (
                <div
                  key={sub.subject}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  {/* SUBJECT TITLE */}
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize">
                    {sub.subject}
                  </h2>

                  {/* TABLE HEADER */}
                  <div className="hidden sm:grid grid-cols-12 text-xs text-gray-500 mb-2">
                    <div className="col-span-2">Type</div>
                    <div className="col-span-7">Name / Year</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>

                  {/* NOTES */}
                  {sub.notes?.map((n, i) => (
                    <div
                      key={n._id || i}
                      className="grid grid-cols-12 items-center py-2 border-b text-sm hover:bg-gray-50"
                    >
                      <div className="col-span-2 font-medium text-gray-600">
                        Notes
                      </div>

                      <div className="col-span-7 truncate">
                        {n.originalName || `Notes ${i + 1}`}
                      </div>

                      <div className="col-span-3 flex justify-end gap-3">
                        <button
                          onClick={() => handleView(n.url)}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Eye size={16} /> View
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(n.uploadId, n.originalName)
                          }
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <Download size={16} /> Download
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* PYP */}
                  {sub.pyp?.map((p, i) => (
                    <div
                      key={p._id || i}
                      className="grid grid-cols-12 items-center py-2 border-b text-sm hover:bg-gray-50"
                    >
                      <div className="col-span-2 font-medium text-gray-600">
                        PYP
                      </div>

                      <div className="col-span-7">
                        {p.year ? `Year ${p.year}` : p.originalName}
                      </div>

                      <div className="col-span-3 flex justify-end gap-3">
                        <button
                          onClick={() => handleView(p.url)}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Eye size={16} /> View
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(p.uploadId, p.originalName)
                          }
                          className="flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <Download size={16} /> Download
                        </button>
                      </div>
                    </div>
                  ))}

                  {sub.notes?.length === 0 && sub.pyp?.length === 0 && (
                    <p className="text-sm text-gray-400 py-2">
                      No resources uploaded
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default SubjectList;
