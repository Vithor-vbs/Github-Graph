import React, { useState } from "react";

export const Input = ({ setSubmit }) => {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmit({ username: username, personalToken: token });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">GitHub Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="token">Personal Access Token:</label>
        <input
          type="password"
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};
