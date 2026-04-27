import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { VotePage } from "@/pages/VotePage";
import { AuditPage } from "@/pages/AuditPage";
import { DirectoryPage } from "@/pages/DirectoryPage";
import { DocsPage } from "@/pages/DocsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
