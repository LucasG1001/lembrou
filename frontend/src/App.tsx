import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { RemindersPage } from "./pages/RemindersPage/RemindersPage";
import { ReminderFormPage } from "./pages/ReminderFormPage/ReminderFormPage";
import { HabitsPage } from "./pages/HabitsPage/HabitsPage";
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
            <Route path="/lembretes" element={<RemindersPage />} />
            <Route path="/lembretes/novo" element={<ReminderFormPage />} />
            <Route path="/lembretes/r/:id" element={<ReminderFormPage />} />
            <Route path="/habitos" element={<HabitsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
