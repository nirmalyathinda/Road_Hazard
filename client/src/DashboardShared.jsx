export function DashboardStats({ text, complaints }) {
  const pendingCount = complaints.filter((complaint) => complaint.status === 'Pending').length;
  const reviewedCount = complaints.filter((complaint) => complaint.status === 'Reviewed').length;
  const rejectedCount = complaints.filter((complaint) => complaint.status === 'Rejected').length;
  const completedCount = complaints.filter((complaint) => complaint.status === 'Resolved').length;

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3 mb-4">
      <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-secondary small mb-2">{text.totalReports}</p><p className="display-6 fw-semibold mb-0">{complaints.length}</p></div></div></div>
      <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-secondary small mb-2">{text.needsReview}</p><p className="display-6 fw-semibold text-warning mb-0">{pendingCount}</p></div></div></div>
      <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-secondary small mb-2">{text.reviewed}</p><p className="display-6 fw-semibold text-success mb-0">{reviewedCount}</p></div></div></div>
      <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-secondary small mb-2">{text.rejected}</p><p className="display-6 fw-semibold text-danger mb-0">{rejectedCount}</p></div></div></div>
      <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="text-secondary small mb-2">{text.completed}</p><p className="display-6 fw-semibold text-primary mb-0">{completedCount}</p></div></div></div>
    </div>
  );
}

export function ComplaintQueue({ text, isLoading, updatingId, error, visibleComplaints, isTechnician, onStatusUpdate, onLocationClick }) {
  const statusBadge = { Pending: 'bg-warning text-dark', Reviewed: 'bg-success', Resolved: 'bg-primary', Rejected: 'bg-danger' };
  const statusLabel = { Pending: text.pending, Reviewed: text.reviewed, Resolved: text.resolved, Rejected: text.rejected };
  const hazardLabel = { Pothole: text.pothole, 'Fallen Tree': text.fallenTree, 'Broken Sign': text.brokenSign };
  const getCoordinates = (location) => {
    const latitude = location?.latitude ?? location?._latitude;
    const longitude = location?.longitude ?? location?._longitude;

    if (typeof latitude === 'number' && typeof longitude === 'number' && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return `${latitude}, ${longitude}`;
    }

    return null;
  };

  return (
    <>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 p-4">
          <h2 className="h5 mb-1">{text.complaintQueue}</h2>
          <p className="text-secondary mb-0">{isTechnician ? text.technicianQueueDescription : text.queueDescription}</p>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th className="ps-4">{text.report}</th><th>{text.hazard}</th><th>{text.location}</th><th>{text.dateReported}</th><th>{text.status}</th><th className="text-end pe-4">{text.action}</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan="6" className="text-center py-5 text-secondary">{text.loading}</td></tr>}
              {!isLoading && visibleComplaints.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-secondary">{isTechnician ? text.noAssignedWork : text.noComplaints}</td></tr>}
              {!isLoading && visibleComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="ps-4"><div className="d-flex align-items-center gap-3"><img src={complaint.image_url || '/logo.jpg'} alt="" width="52" height="52" className="rounded object-fit-cover" /><span className="fw-semibold">{complaint.id}</span></div></td>
                  <td className="fw-medium">{hazardLabel[complaint.hazard_type] || complaint.hazard_type}</td>
                  <td className="text-secondary">
                    {getCoordinates(complaint.location) ? (
                      <button className="btn btn-link p-0 text-start text-decoration-none" type="button" aria-label={`${text.showOnMap}: ${getCoordinates(complaint.location)}`} onClick={() => onLocationClick(complaint.id)}>
                        {getCoordinates(complaint.location)}
                      </button>
                    ) : complaint.location || ''}
                  </td>
                  <td className="text-secondary">{new Date(complaint.date_reported).toLocaleDateString()}</td>
                  <td><span className={`badge ${statusBadge[complaint.status] || 'bg-secondary'}`}>{statusLabel[complaint.status] || complaint.status}</span></td>
                  <td className="text-end pe-4"><div className="d-flex justify-content-end gap-2">{!isTechnician && <><button className="btn btn-sm btn-outline-success" disabled={complaint.status !== 'Pending' || updatingId === complaint.id} onClick={() => onStatusUpdate(complaint.id, 'Reviewed')}>{updatingId === complaint.id ? text.updating : text.assign}</button><button className="btn btn-sm btn-outline-danger" disabled={complaint.status !== 'Pending' || updatingId === complaint.id} onClick={() => onStatusUpdate(complaint.id, 'Rejected')}>{text.reject}</button></>}{isTechnician && <button className="btn btn-sm btn-outline-primary" disabled={complaint.status !== 'Reviewed' || updatingId === complaint.id} onClick={() => onStatusUpdate(complaint.id, 'Resolved')}>{updatingId === complaint.id ? text.updating : text.resolve}</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function SettingsPanel({ text, language, languageOptions, onLanguageChange }) {
  return <div className="card border-0 shadow-sm settings-panel"><div className="card-body p-4"><h2 className="h5 mb-2">{text.settings}</h2><p className="text-secondary mb-4">{text.settingsDescription}</p><label className="form-label" htmlFor="settings-language">{text.language}</label><select id="settings-language" className="form-select settings-control" value={language} onChange={onLanguageChange}>{Object.entries(languageOptions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div></div>;
}

export function UsersPanel({ text, users, isLoading, error, userForm, isSaving, removingId, onFormChange, onAddUser, onRemoveUser }) {
  return (
    <div className="users-panel">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 p-4"><h2 className="h5 mb-1">{text.users}</h2><p className="text-secondary mb-0">{text.usersDescription}</p></div>
        <form className="card-body border-top p-4" onSubmit={onAddUser}>
          <div className="row g-3">
            {['fullName', 'email', 'idNumber', 'phone', 'password'].map((field) => <div className="col-12 col-md-6" key={field}><label className="form-label" htmlFor={`user-${field}`}>{text[field]}</label><input id={`user-${field}`} className="form-control" type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} value={userForm[field]} onChange={(event) => onFormChange(field, event.target.value)} required /></div>)}
          </div>
          <button className="btn btn-primary mt-4" type="submit" disabled={isSaving}>{isSaving ? text.addingUser : text.addUser}</button>
        </form>
      </div>
      <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th className="ps-4">{text.fullName}</th><th>{text.email}</th><th>{text.idNumber}</th><th>{text.phone}</th><th className="text-end pe-4">{text.action}</th></tr></thead><tbody>
        {isLoading && <tr><td colSpan="5" className="text-center py-5 text-secondary">{text.loadingUsers}</td></tr>}
        {!isLoading && users.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-secondary">{text.noUsers}</td></tr>}
        {!isLoading && users.map((user) => <tr key={user.id}><td className="ps-4 fw-semibold">{user.fullName}</td><td>{user.email}</td><td>{user.idNumber}</td><td>{user.phone}</td><td className="text-end pe-4"><button className="btn btn-sm btn-outline-danger" type="button" disabled={removingId === user.id} onClick={() => onRemoveUser(user.id)}>{removingId === user.id ? text.removingUser : text.removeUser}</button></td></tr>)}
      </tbody></table></div></div>
    </div>
  );
}
