import { ComplaintQueue, DashboardStats, SettingsPanel } from './DashboardShared';

function AdminDashboard({ text, activePage, complaints, isLoading, updatingId, error, onStatusUpdate, language, languageOptions, onLanguageChange }) {
  return <>
    {activePage === 'settings' && <SettingsPanel text={text} language={language} languageOptions={languageOptions} onLanguageChange={onLanguageChange} />}
    {activePage === 'home' && <DashboardStats text={text} complaints={complaints} />}
    {activePage === 'hazards' && <ComplaintQueue text={text} isLoading={isLoading} updatingId={updatingId} error={error} visibleComplaints={complaints} onStatusUpdate={onStatusUpdate} />}
  </>;
}

export default AdminDashboard;
