import { ComplaintQueue, DashboardStats, SettingsPanel, UsersPanel } from './DashboardShared';

function AdminDashboard({ text, activePage, complaints, isLoading, updatingId, error, onStatusUpdate, onLocationClick, language, languageOptions, onLanguageChange, users, usersLoading, userForm, usersError, isSavingUser, removingId, onUserFormChange, onAddUser, onRemoveUser }) {
  return <>
    {activePage === 'settings' && <SettingsPanel text={text} language={language} languageOptions={languageOptions} onLanguageChange={onLanguageChange} />}
    {activePage === 'home' && <DashboardStats text={text} complaints={complaints} />}
    {activePage === 'hazards' && <ComplaintQueue text={text} isLoading={isLoading} updatingId={updatingId} error={error} visibleComplaints={complaints} onStatusUpdate={onStatusUpdate} onLocationClick={onLocationClick} />}
    {activePage === 'users' && <UsersPanel text={text} users={users} isLoading={usersLoading} error={usersError} userForm={userForm} isSaving={isSavingUser} removingId={removingId} onFormChange={onUserFormChange} onAddUser={onAddUser} onRemoveUser={onRemoveUser} />}
  </>;
}

export default AdminDashboard;
