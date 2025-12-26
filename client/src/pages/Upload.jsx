import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Upload = () => {
  const [selectedType, setSelectedType] = useState("project");
  const { token, axios } = useAppContext();
  const [loading, setLoading] = useState(false);

  // For dynamic subject suggestions
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const uploadData = [
    { key: "project", label: "Project" },
    { key: "notes", label: "Notes" },
    { key: "pyp", label: "Previous Year Paper" },
    { key: "info", label: "Share Info" },
  ];

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setQuery("");
    setSubjects([]);
  };

  // Fetch dynamic subjects as user types
  useEffect(() => {
    if (branch && semester && query.length >= 2) {
      axios
        .get(
          `/api/uploads/subjects?branch=${branch}&semester=${semester}&q=${query}`
        )
        .then((res) => setSubjects(res.data))
        .catch((err) => console.error("Error fetching subjects:", err));
    }
  }, [branch, semester, query]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const form = e.target;
  const formData = new FormData();

  formData.append("type", selectedType);

  try {
    if (selectedType === "project") {
      formData.append("title", form.title.value);
      formData.append("description", form.description.value);
      if (form.liveLink.value) formData.append("liveLink", form.liveLink.value);
      if (form.githubLink.value) formData.append("githubLink", form.githubLink.value);

      // ✅ FIX: loop files
      for (let i = 0; i < form.file.files.length; i++) {
        formData.append("file", form.file.files[i]);
      }
    }

    if (selectedType === "notes") {
      formData.append("subject", query);
      formData.append("branch", form.branch.value);
      formData.append("semester", form.semester.value);

      for (let i = 0; i < form.file.files.length; i++) {
        formData.append("file", form.file.files[i]);
      }
    }

    if (selectedType === "pyp") {
      formData.append("subject", query);
      formData.append("branch", form.branch.value);
      formData.append("semester", form.semester.value);
      formData.append("year", form.year.value);

      for (let i = 0; i < form.file.files.length; i++) {
        formData.append("file", form.file.files[i]);
      }
    }

    if (selectedType === "info") {
      formData.append("title", form.title.value);
      formData.append("message", form.message.value);

      for (let i = 0; i < form.file.files.length; i++) {
        formData.append("file", form.file.files[i]);
      }
    }

    const { data } = await axios.post("/api/uploads", formData, {
      headers: { Authorization: token },
    });

    toast.success(data.message || "Uploaded successfully!");
    form.reset();
    setQuery("");
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Upload failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <Navbar />
      <div className="mt-24 flex flex-col items-center px-4">
        {/* Selection Buttons */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {uploadData.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTypeChange(item.key)}
              className={`px-6 py-3 rounded-xl border text-base font-medium shadow-sm transition-all duration-300 ${
                selectedType === item.key
                  ? "bg-indigo-500 text-white border-indigo-600 shadow-md scale-105"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Slide Forms */}
        <div className="relative w-full max-w-lg overflow-hidden border border-gray-300 rounded-2xl bg-white shadow p-6 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedType}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 p-6"
            >
              {/* Project Upload Form */}
              {selectedType === "project" && (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Upload Project
                  </h2>
                  <input
                    name="title"
                    type="text"
                    placeholder="Project Title"
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    className="border rounded-lg px-3 py-2 h-24 resize-none"
                    required
                  />
                  <input
                    name="file"
                    type="file"
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    name="liveLink"
                    type="url"
                    placeholder="Live Link (optional)"
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    name="githubLink"
                    type="url"
                    placeholder="GitHub Repo (optional)"
                    className="border rounded-lg px-3 py-2"
                  />
                  <button
                    disabled={loading}
                    className="bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition"
                  >
                    {loading ? "Uploading..." : "Upload Project"}
                  </button>
                </form>
              )}

              {/* Notes Upload Form */}
              {selectedType === "notes" && (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Upload Notes
                  </h2>

                  {/* Dynamic subject input with suggestions */}
                  <div className="relative">
                    <input
                      name="subject"
                      type="text"
                      placeholder="Subject Name"
                      className="border rounded-lg px-3 py-2 w-full"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      required
                    />
                    {showSuggestions && subjects.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded-lg w-full mt-1 max-h-40 overflow-y-auto shadow">
                        {subjects.map((s, i) => (
                          <li
                            key={i}
                            className="px-3 py-2 hover:bg-indigo-100 cursor-pointer"
                            onClick={() => {
                              setQuery(s);
                              setShowSuggestions(false);
                            }}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <select
                      name="branch"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                      <option value="EE">EE</option>
                      <option value="CM">CM</option>
                    </select>
                    <select
                      name="semester"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    name="file"
                    type="file"
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <button
                    disabled={loading}
                    className="bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition"
                  >
                    {loading ? "Uploading..." : "Upload Notes"}
                  </button>
                </form>
              )}

              {/* PYP Upload Form */}
              {selectedType === "pyp" && (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Upload Previous Year Paper
                  </h2>

                  {/* Dynamic subject input */}
                  <div className="relative">
                    <input
                      name="subject"
                      type="text"
                      placeholder="Subject Name"
                      className="border rounded-lg px-3 py-2 w-full"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      required
                    />
                    {showSuggestions && subjects.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded-lg w-full mt-1 max-h-40 overflow-y-auto shadow">
                        {subjects.map((s, i) => (
                          <li
                            key={i}
                            className="px-3 py-2 hover:bg-indigo-100 cursor-pointer"
                            onClick={() => {
                              setQuery(s);
                              setShowSuggestions(false);
                            }}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <select
                      name="branch"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="EE">EE</option>
                      <option value="CE">CE</option>
                      <option value="CM">CM</option>
                    </select>
                    <select
                      name="semester"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    name="year"
                    type="number"
                    placeholder="Year (e.g. 2023)"
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    name="file"
                    type="file"
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <button
                    disabled={loading}
                    className="bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition"
                  >
                    {loading ? "Uploading..." : "Upload PYP"}
                  </button>
                </form>
              )}

              {/* Info Upload Form */}
              {selectedType === "info" && (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Share Info
                  </h2>

                  <input
                    name="title"
                    type="text"
                    placeholder="Title"
                    className="border rounded-lg px-3 py-2"
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="Write your message..."
                    className="border rounded-lg px-3 py-2 h-24 resize-none"
                    required
                  />

                  <input
                    name="file"
                    type="file"
                    accept="image/*"
                    multiple
                    className="border rounded-lg px-3 py-2"
                  />

                  <button
                    disabled={loading}
                    className="bg-indigo-500 text-white rounded-lg py-2 hover:bg-indigo-600 transition"
                  >
                    {loading ? "Sharing..." : "Share Info"}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Upload;
