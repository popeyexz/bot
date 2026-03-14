import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/Dashboard'
import ToolsPage from './pages/Tools'
import ChatPage from './pages/Chat'
import AnalyticsPage from './pages/Analytics'
import SettingsPage from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
