import React from "react";
import { Link } from "react-router-dom";

const Card = ({ branch }) => {
  return (
    <Link
      to={`/${branch.shortName}`}
      className="block border border-gray-200 m-0 p-0 rounded-xl shadow-xl overflow-hidden ease-out cursor-pointer max-w-80 bg-white hover:scale-105 transition duration-300"
    >
      <img
        src={branch.link}
        alt={branch.fullName}
        className="w-full h-52 object-contain"
      />
      <div className="text-center">
        <h3 className="mt-3 px-4 pt-3 mb-1 text-lg font-semibold text-gray-800">
            {branch.fullName}
        </h3>
        <p className="text-sm px-4 pb-6 text-gray-600">
            {branch.shortName}
        </p>
    </div>
    </Link>
  );
};

export default Card;
