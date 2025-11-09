/**
 * App.tsx
 *
 * Main application component with routing.
 * Routes:
 * - / - Home page (landing + learning flow)
 * - /graph - Full-screen graph view
 */

import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { GraphPage } from "./pages/GraphPage";

/**
 * Main App Component with Routing
 */
export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/graph" element={<GraphPage />} />
    </Routes>
  );
};
