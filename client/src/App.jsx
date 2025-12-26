import { useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import BranchDetails from "./pages/BranchDetails";
import SubjectList from "./pages/SubjectList";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import InfoFeed from "./pages/InfoFeed";
import ProjectVerse from "./pages/ProjectVerse";
import Academics from "./pages/Academics";
import About from "./pages/About";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/about" element={<About />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/info" element={<InfoFeed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects" element={<ProjectVerse />} />
        <Route
          path="/:branchShortName/:yearNumber/:semNumber"
          element={<SubjectList />}
        />
        <Route path="/:branchShortName" element={<BranchDetails />} />
      </Routes>
    </>
  );
}

export default App;
