import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Profile = () => {
  const { axios, token, user } = useAppContext();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // ---------------- FILE TYPE ----------------
  const getFileType = (file) => {
    const mime = file?.mimeType || "";
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf" || file?.originalName?.endsWith(".pdf"))
      return "pdf";
    if (
      mime.includes("word") ||
      file?.originalName?.endsWith(".doc") ||
      file?.originalName?.endsWith(".docx")
    )
      return "word";
    return "other";
  };

  // ---------------- FETCH UPLOADS ----------------
  const fetchUploads = async () => {
    try {
      const { data } = await axios.get("/api/uploads/my", {
        headers: { Authorization: token },
      });
      if (data.success) setUploads(data.uploads);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
    // eslint-disable-next-line
  }, []);

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this upload?")) return;
    try {
      const { data } = await axios.delete(`/api/uploads/${id}`, {
        headers: { Authorization: token },
      });
      if (data.success) {
        setUploads((prev) => prev.filter((u) => u._id !== id));
        toast.success("Deleted successfully");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  // ---------------- DOWNLOAD ----------------
  const handleDownload = async (e, upload) => {
    e.stopPropagation();
    try {
      const firstFile = upload.files?.[0] || upload.file || {};
      const filename =
        firstFile.originalName || upload.title || upload.subject || "download";

      const res = await axios.get(`/api/uploads/${upload._id}/download`, {
        headers: { Authorization: token },
        responseType: "blob",
      });

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

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 px-4">
        <div className="max-w-5xl mx-auto">
          {/* PROFILE HEADER */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white mb-12 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold uppercase">
                {user?.name?.[0] || "U"}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-semibold">{user?.name}</h2>
                <p className="text-sm opacity-90">{user?.email}</p>

                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 text-xs">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    Joined{" "}
                    {user?.joinedAt
                      ? new Date(user.joinedAt).toDateString()
                      : "—"}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {uploads.length} Uploads
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* UPLOADS */}
          <div className="bg-white rounded-3xl shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-6">My Uploads</h2>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : uploads.length === 0 ? (
              <p className="text-gray-500">No uploads yet.</p>
            ) : (
              <ul className="space-y-6">
                {uploads.map((u) => (
                  <li
                    key={u._id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                  >
                    {/* HEADER WITH TOGGLE */}
                    <div className="flex gap-4">
                      {/* TOGGLE BUTTON */}
                      <button
                        onClick={() => toggleExpand(u._id)}
                        className="w-8 h-8 flex items-center justify-center 
             rounded-full  hover:bg-gray-100 transition"
                        aria-label={
                          expandedId === u._id ? "Collapse" : "Expand"
                        }
                      >
                        <span
                          className={`block w-2.5 h-2.5 border-r-2 border-b-2 border-gray-600 
                transform transition-transform duration-200
                ${expandedId === u._id ? "rotate-[-135deg]" : "rotate-45"}`}
                        />
                      </button>

                      {/* CONTENT */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {u.title || u.subject || "Untitled"}
                            </h3>
                            <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 capitalize">
                              {u.type}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>

                            {(u.files?.length > 0 || u.file) && (
                              <button
                                onClick={(e) => handleDownload(e, u)}
                                className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                              >
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED */}
                    {expandedId === u._id && (
                      <div className="mt-6 bg-gray-50 rounded-xl p-5 space-y-5 animate-fadeIn">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {u.description && (
                            <p>
                              <strong>Description:</strong> {u.description}
                            </p>
                          )}
                          {u.branch && (
                            <p>
                              <strong>Branch:</strong> {u.branch}
                            </p>
                          )}
                          {u.semester && (
                            <p>
                              <strong>Semester:</strong> {u.semester}
                            </p>
                          )}
                          {u.year && (
                            <p>
                              <strong>Year:</strong> {u.year}
                            </p>
                          )}
                        </div>

                        {/* INFO MESSAGE */}
                        {u.type === "info" && u.message && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                            <p className="font-medium text-yellow-700 mb-1">
                              Information
                            </p>
                            <p className="whitespace-pre-wrap">{u.message}</p>
                          </div>
                        )}

                        {/* FILE LIST */}
                        {(u.files?.length > 0 || u.file) && (
                          <div>
                            <p className="font-medium mb-2">Files</p>
                            <div className="space-y-2">
                              {(u.files?.length ? u.files : [u.file]).map(
                                (f, idx) =>
                                  f?.url && (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center bg-white border rounded-lg px-4 py-2"
                                    >
                                      <span className="text-xs truncate">
                                        {f.originalName || `file-${idx + 1}`}
                                      </span>
                                      <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 text-xs hover:underline"
                                      >
                                        View
                                      </a>
                                    </div>
                                  )
                              )}
                            </div>
                          </div>
                        )}

                        {/* PREVIEW */}
                        {u.file?.url && (
                          <div className="border-t pt-4 space-y-3">
                            {getFileType(u.file) === "image" && (
                              <img
                                src={u.file.url}
                                alt={u.file.originalName}
                                className="max-w-md rounded-xl shadow"
                              />
                            )}
                            {getFileType(u.file) === "pdf" && (
                              <iframe
                                src={u.file.url}
                                title="PDF"
                                className="w-full h-[500px] border rounded-xl"
                              />
                            )}
                            {getFileType(u.file) === "word" && (
                              <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(
                                  u.file.url
                                )}&embedded=true`}
                                className="w-full h-[500px] border rounded-xl"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out;
          }
        `}
      </style>
    </>
  );
};

export default Profile;
