import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const About = () => {
  return (
    <>
      <Navbar />

      <div className="pt-[120px]">
        {/* HERO */}
        <section className="px-6">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 mb-6">
              About CompileX
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              <strong>CompileX</strong> is a student-driven academic and project
              sharing platform built for engineering students to access notes,
              previous year papers, and real-world projects — all in one place.
            </p>
          </div>
        </section>

        {/* MISSION */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our mission is to make learning easier, more collaborative, and
                more practical by encouraging students to share notes, projects,
                and useful information. CompileX bridges the gap between academic
                learning and real-world skills.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-md">
              <h3 className="text-xl font-semibold mb-2">Why it matters</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Engineering students often lack organized resources and
                exposure. CompileX creates a single, reliable platform driven
                by the student community itself.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 mb-12 text-center">
              What You Can Do on CompileX
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <Feature
                icon="📘"
                title="Access Notes"
                desc="Semester-wise notes uploaded by fellow students."
              />
              <Feature
                icon="📝"
                title="Previous Year Papers"
                desc="Branch and semester-wise PYPs for better preparation."
              />
              <Feature
                icon="🚀"
                title="ProjectVerse"
                desc="Explore and showcase real student projects."
              />
              <Feature
                icon="📰"
                title="Info Feed"
                desc="Share announcements and useful updates."
              />
              <Feature
                icon="⬆"
                title="Upload Content"
                desc="Contribute notes, papers, projects, or information."
              />
              <Feature
                icon="👥"
                title="Community Driven"
                desc="Built by students, for students."
              />
            </div>
          </div>
        </section>

        {/* WHY COMPILEX */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Why CompileX?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Many students struggle to find organized and reliable academic
              resources. CompileX solves this by providing a centralized
              platform where students can learn from each other, grow together,
              and build strong academic and technical foundations.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto bg-indigo-50 rounded-3xl p-14 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Learn • Share • Grow
            </h3>
            <p className="text-gray-600 text-lg">
              CompileX is more than a platform — it’s a student community.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg transition">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default About;
