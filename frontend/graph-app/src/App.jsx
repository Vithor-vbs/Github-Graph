import "./App.css";
import GithubRepoGraph from "./GithubGraph";
import { Input } from "./Input";
import { useState } from "react";

function App() {
  const [submitData, setSubmit] = useState({});
  return (
    <>
      <Input setSubmit={setSubmit} />
      <GithubRepoGraph submitData={submitData} />
    </>
  );
}

export default App;
