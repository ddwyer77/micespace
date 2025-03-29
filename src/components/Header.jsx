import React from "react";
import { Link, useLocation } from "react-router-dom";
import logoSlogan from "../assets/images/logo_slogan.png";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { name: "Explore", path: "/" },
    { name: "Create", path: "/create" },
    { name: "Campaigns", path: "/campaigns" },
    { name: "Feed", path: "/feed" },
  ];

  return (
    <header className="bg-white shadow-md w-full z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/">
          <img src={logoSlogan} alt="MiceSpace Logo" className="w-40 sm:w-48" />
        </Link>

        <nav className="flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-sm sm:text-base px-3 py-2 rounded-md font-medium transition duration-150 ${
                location.pathname === item.path
                  ? "bg-primary text-white hover:text-gray-900"
                  : "text-gray-700 hover:bg-gray-200 hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
