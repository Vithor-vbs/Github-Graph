import React, { useState } from "react";
import "./Input.css";

export const Input = ({ setSubmit }) => {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmit({ username: username, personalToken: token });
  };

  return (
    <div className="general-container">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <div>
            <label htmlFor="username" className="input-label">
              GitHub Username:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="token" className="input-label">
              Personal Access Token:
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
};
