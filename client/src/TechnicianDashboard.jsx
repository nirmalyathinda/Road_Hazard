import { ComplaintQueue, DashboardStats, SettingsPanel } from './DashboardShared';

function TechnicianDashboard({ text, activePage, complaints, isLoading, updatingId, error, onStatusUpdate, onLocationClick, language, languageOptions, onLanguageChange }) {
  const assignedComplaints = complaints.filter((complaint) => complaint.status === 'Reviewed');

  return <>
    {activePage === 'settings' && <SettingsPanel text={text} language={language} languageOptions={languageOptions} onLanguageChange={onLanguageChange} />}
    {activePage === 'home' && <DashboardStats text={text} complaints={assignedComplaints} />}
    {activePage === 'hazards' && <ComplaintQueue text={text} isLoading={isLoading} updatingId={updatingId} error={error} visibleComplaints={assignedComplaints} isTechnician onStatusUpdate={onStatusUpdate} onLocationClick={onLocationClick} />}
  </>;
}

export default TechnicianDashboard;
