import GithubRepoGraph from "../components/GithubGraph/GithubGraph";
import { Input } from "../components/InputComponent/Input";
import { useState } from "react";

function App() {
  const [submitData, setSubmit] = useState({ username: "", personalToken: "" });
  return (
    <>
      <Input setSubmit={setSubmit} />
      <GithubRepoGraph submitData={submitData} setSubmit={setSubmit} />
    </>
  );
}

export default App;
