// src/pages/Home.jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      <Navbar />

      <div className="pt-[120px] px-6 md:px-16 lg:px-24 xl:px-32">
        {/* Hero Section */}
        <section className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Welcome to <span className="text-indigo-600">CompileX</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            A complete academic & project-sharing platform for engineering
            students. Access notes, previous year papers, projects, and share
            knowledge with your peers.
          </p>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link
              to="/academics"
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              Explore Academics
            </Link>
            <Link
              to="/projects"
              className="px-8 py-3 border border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition"
            >
              ProjectVerse
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Feature
            title="📘 Notes"
            desc="Well-organized semester-wise notes uploaded by students."
          />
          <Feature
            title="📝 PYPs"
            desc="Previous year question papers to help you prepare better."
          />
          <Feature
            title="🚀 Projects"
            desc="Showcase and explore real student projects in ProjectVerse."
          />
          <Feature
            title="📰 Info Feed"
            desc="Share updates, notices, and useful information."
          />
        </section>

        {/* Call to Action */}
        <section className="py-16 text-center bg-indigo-50 rounded-3xl">
          <h2 className="text-3xl font-bold text-gray-900">
            Contribute & Grow Together
          </h2>
          <p className="mt-4 text-gray-600">
            Upload notes, papers, projects, or share helpful information.
          </p>
          <Link
            to="/upload"
            className="inline-block mt-6 px-10 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            Upload Content
          </Link>
        </section>
      </div>

      <Footer />
    </>
  );
};

const Feature = ({ title, desc }) => (
  <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{desc}</p>
  </div>
);

export default Home;
