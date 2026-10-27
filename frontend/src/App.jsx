import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/authContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
// Pages
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InterviewSetupPage } from './features/interview/InterviewSetupPage';
import { InterviewArenaPage } from './features/interview/InterviewArenaPage';
import { AnswerEvaluationPage } from './features/interview/AnswerEvaluationPage';
import { FinalReportPage } from './features/interview/FinalReportPage';
import { CoachPage } from './features/coach/CoachPage';
import { InterviewDnaPage } from './features/analytics/InterviewDnaPage';
import { SkillTreePage } from './features/analytics/SkillTreePage';
import { HistoryPage } from './features/history/HistoryPage';
import { LearningCentrePage } from './features/learning/LearningCentrePage';
import { AchievementsPage } from './features/gamification/AchievementsPage';
import { SettingsPage } from './features/settings/SettingsPage';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
export function App() {
    return (<QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />}/>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/register" element={<RegisterPage />}/>

            {/* Protected Routes inside AppLayout */}
            <Route path="/dashboard" element={<ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/interview/setup" element={<ProtectedRoute>
                  <AppLayout>
                    <InterviewSetupPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/interview/arena" element={<ProtectedRoute>
                  <InterviewArenaPage />
                </ProtectedRoute>}/>

            <Route path="/interview/:id" element={<ProtectedRoute>
                  <InterviewArenaPage />
                </ProtectedRoute>}/>

            <Route path="/interview/:id/evaluation/:questionId" element={<ProtectedRoute>
                  <AnswerEvaluationPage />
                </ProtectedRoute>}/>

            <Route path="/interview/evaluation" element={<ProtectedRoute>
                  <AnswerEvaluationPage />
                </ProtectedRoute>}/>

            <Route path="/interview/:id/report" element={<ProtectedRoute>
                  <AppLayout>
                    <FinalReportPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/interview/report" element={<ProtectedRoute>
                  <AppLayout>
                    <FinalReportPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/coach" element={<ProtectedRoute>
                  <AppLayout>
                    <CoachPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/analytics/dna" element={<ProtectedRoute>
                  <AppLayout>
                    <InterviewDnaPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/dna" element={<ProtectedRoute>
                  <AppLayout>
                    <InterviewDnaPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/analytics/skill-tree" element={<ProtectedRoute>
                  <AppLayout>
                    <SkillTreePage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/skill-tree" element={<ProtectedRoute>
                  <AppLayout>
                    <SkillTreePage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/history" element={<ProtectedRoute>
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/learning" element={<ProtectedRoute>
                  <AppLayout>
                    <LearningCentrePage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/achievements" element={<ProtectedRoute>
                  <AppLayout>
                    <AchievementsPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            <Route path="/settings" element={<ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>}/>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>);
}
export default App;
