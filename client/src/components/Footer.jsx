import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const Footer = () => {
  const footerSections = [
    {
      title: "Academics",
      links: [
        { label: "Branches", to: "/" },
        { label: "Previous Year Papers", to: "/pyp" },
        { label: "Notes", to: "/notes" },
        { label: "Assignments", to: "/assignments" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Share Info", to: "/feed" },
        { label: "Projects", to: "/projects" },
        { label: "Contributors", to: "/contributors" },
        { label: "Profile", to: "/profile" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "How It Works", to: "/about" },
        { label: "Guidelines", to: "/guidelines" },
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms & Conditions", to: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* LEFT : BRAND */}
          <div className="max-w-sm">
            <h1 className="font-bold text-3xl my-3">
              Compile<span className="text-indigo-500">X</span>
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              CompileX is a collaborative academic platform where students can
              access notes, previous year papers, assignments, and share
              knowledge to grow together.
            </p>
          </div>

          {/* RIGHT : LINKS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        to={link.to}
                        className="text-gray-600 hover:text-indigo-600 transition"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-gray-700">CompileX</span>. All
            rights reserved.
          </p>

          <p className="text-xs text-gray-400">
            Built for students • Powered by MERN
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
