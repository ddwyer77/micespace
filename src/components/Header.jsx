import React from "react";
import { NavLink } from "react-router-dom";
import logoSlogan from "../assets/images/logo_slogan.png";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 w-full py-6 px-4">
      <nav className="max-w-2xl mx-auto flex items-center gap-6">
        {/* Logo Section */}
        <NavLink to="/" className="flex-shrink-0">
          <img
            src={logoSlogan}
            alt="micespace logo"
            className="hidden w-48 md:block"
          />

          <img
            src={logoSlogan}
            alt="micespace logo"
            className="w-28 md:hidden"
          />
        </NavLink>

        {/* Navigation Links */}
        <ul className="flex items-center gap-4">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-sm text-black"
                  : "font-semibold text-sm text-gray-500"
              }
            >
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-sm text-black"
                  : "font-semibold text-sm text-gray-500"
              }
            >
              Create
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
