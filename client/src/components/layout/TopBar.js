import React from "react";
import { Link } from "react-router-dom";
import SignOutButton from "../authentication/SignOutButton";

const TopBar = ({ user, hidden }) => {
  const unauthenticatedListItems = [
    <li key="sign-in">
      <Link to="/user-sessions/new">Sign In</Link>
    </li>,
    <li key="sign-up">
      <Link to="/users/new" className="button">
        Sign Up
      </Link>
    </li>,
  ];

  const authenticatedListItems = [
    <li key="sign-out">
      <SignOutButton />
    </li>,
  ];

  let containerClass = "top-bar--container"
  let barClass="top-bar"
  if (hidden) {
    containerClass += " top-bar--hidden"
    barClass+=" top-bar--hidden"
  }

  return (
    <div className={containerClass}>
      <div className={barClass}>
        <div className="top-bar--subcontainer">
          <div className="top-bar-left">
            <ul className="menu">
              <li className="menu-text">Chess</li>
              <li>
                <Link to="/">Home</Link>
              </li>
            </ul>
          </div>
          <div className="top-bar-right">
            <ul className="menu">{user ? authenticatedListItems : unauthenticatedListItems}</ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
