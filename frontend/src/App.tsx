import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { DashboardPage } from "./pages/DashboardPage/DashboardPage";
import { RemindersPage } from "./pages/RemindersPage/RemindersPage";
import { ReminderForm } from "./components/ReminderForm/ReminderForm";
import { HabitsPage } from "./pages/HabitsPage/HabitsPage";
import { ProjectsPage } from "./pages/ProjectsPage/ProjectsPage";
import styles from "./App.module.css";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

function App() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  );

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <main className={`${styles.content} ${collapsed ? styles.contentCollapsed : ""}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/lembretes" replace />} />
            <Route path="/inicio" element={<DashboardPage />} />
            <Route path="/lembretes" element={<RemindersPage />}>
              <Route path="novo" element={<ReminderForm />} />
              <Route path="r/:id" element={<ReminderForm />} />
            </Route>
            <Route path="/habitos" element={<HabitsPage />} />
            <Route path="/projetos" element={<ProjectsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
