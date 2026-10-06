import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./lib/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { UploadPage } from "./pages/UploadPage";
import { ResultsPage } from "./pages/ResultsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/upload"
            element={
              <RequireAuth>
                <UploadPage />
              </RequireAuth>
            }
          />
          <Route
            path="/results/:analysisId"
            element={
              <RequireAuth>
                <ResultsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
