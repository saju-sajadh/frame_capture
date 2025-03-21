import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/home";
import Emolyzer from "../pages/emolyzer";


export default function Mainrouter() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<HomePage />} />
        <Route path={"/authenticate"} element={<Emolyzer />} />
      </Routes>
    </>
  );
}
