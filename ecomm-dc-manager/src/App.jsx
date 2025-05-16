import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ManagerDashboard from "./components/ManagerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ManagerDashboard />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
