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
    <div className="container-centering">
      <div className="login-box">
        <form>
          <div className="user-box">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />{" "}
            <label>Username</label>
          </div>
          <div className="user-box">
            <input
              type="password"
              id="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />{" "}
            <label>Personal Token (Optional)</label>
          </div>
          <center>
            <a onClick={handleSubmit} className="submit-button">
              Submit
              <span></span>
            </a>
          </center>
        </form>
      </div>
    </div>
  );
};
