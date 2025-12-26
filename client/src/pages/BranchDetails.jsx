import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// Import Link for client-side navigation
import { useParams, Link } from "react-router-dom";

// --- Dummy Data Structure ---
// In a real app, this data would come from an API based on the selected branch.
const ACADEMIC_YEARS = [
  { year: 1, semesters: [1, 2] },
  { year: 2, semesters: [3, 4] },
  { year: 3, semesters: [5, 6] },
  { year: 4, semesters: [7, 8] },
];

const BranchDetails = () => {
  // Get the dynamic part of the URL (e.g., 'cse' or 'ec')
  const { branchShortName } = useParams();

  // Capitalize for display (e.g., 'cse' -> 'CSE')
  const displayBranchName = branchShortName
    ? branchShortName.toUpperCase()
    : "Branch";

  // The 60px padding top is crucial here too, as the Navbar is fixed
  return (
    <>
      <Navbar />

      {/* Main content container with fixed navbar spacing */}
      <div className="min-h-screen pt-[120px] px-6 md:px-16 lg:px-24 xl:px-32 py-10">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 border-b pb-2">
          {displayBranchName} Previous Year Papers
        </h1>

        <p className="text-gray-600 mb-8">
          Select an academic year to view semesters and subjects.
        </p>

        {/* Grid layout for the academic years */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ACADEMIC_YEARS.map((academicYear) => (
            <div
              key={academicYear.year}
              className="bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Year {academicYear.year}
              </h2>
              <div className="flex flex-col space-y-3">
                {academicYear.semesters.map((sem) => (
                  // Link to the next page: e.g., /cse/year1/sem1
                  <Link
                    key={sem}
                    to={`/${branchShortName}/year${academicYear.year}/sem${sem}`}
                    className="py-2 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-center hover:bg-indigo-100 transition duration-150"
                  >
                    Semester {sem}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BranchDetails;
