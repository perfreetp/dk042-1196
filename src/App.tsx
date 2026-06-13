import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import FeedbackSubmit from "@/pages/FeedbackSubmit";
import TicketList from "@/pages/TicketList";
import TicketDetail from "@/pages/TicketDetail";
import StudentProfile from "@/pages/StudentProfile";
import Analytics from "@/pages/Analytics";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/submit" replace />} />
          <Route path="/submit" element={<FeedbackSubmit />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/submit" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
