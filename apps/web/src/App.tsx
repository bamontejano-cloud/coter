import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RegisterWithInvitationPage } from './pages/RegisterWithInvitationPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { TechniqueLibraryPage } from './pages/TechniqueLibraryPage';
import { TechniqueFormPage } from './pages/TechniqueFormPage';
import { AssignmentsListPage } from './pages/AssignmentsListPage';
import { AssignmentDetailPage } from './pages/AssignmentDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MessagesListPage } from './pages/MessagesListPage';
import { ConversationPage } from './pages/ConversationPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:token" element={<RegisterWithInvitationPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/:id" element={<PatientProfilePage />} />
            <Route path="/library" element={<TechniqueLibraryPage />} />
            <Route path="/library/new" element={<TechniqueFormPage />} />
            <Route path="/library/:id/edit" element={<TechniqueFormPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/assignments" element={<AssignmentsListPage />} />
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/messages" element={<MessagesListPage />} />
            <Route path="/messages/:conversationId" element={<ConversationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
