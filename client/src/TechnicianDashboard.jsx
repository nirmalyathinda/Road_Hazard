import { useState } from 'react';
import { DataLoadError, SettingsPanel } from './DashboardShared';
import { getTechnicianTasks } from './technicianTasks';

const taskStatuses = ['Started', 'In Progress', 'Completed', 'Blocked'];

const getLocationText = (location) => {
  const latitude = location?.latitude ?? location?._latitude;
  const longitude = location?.longitude ?? location?._longitude;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude}, ${longitude}`;
  }

  return typeof location === 'string' ? location : '';
};

function TechnicianTaskCard({ text, complaint, updating, onStatusUpdate, onLocationClick }) {
  const [draft, setDraft] = useState({
    taskStatus: complaint.taskStatus || 'Started',
    completionNotes: complaint.completionNotes || '',
    materialsUsed: complaint.materialsUsed || '',
    timeTaken: complaint.timeTaken ?? '',
    escalated: complaint.escalated || false,
    needsReinspection: complaint.needsReinspection || false
  });
  const locationText = getLocationText(complaint.location);
  const latitude = complaint.location?.latitude ?? complaint.location?._latitude;
  const longitude = complaint.location?.longitude ?? complaint.location?._longitude;
  const hasCoordinates = typeof latitude === 'number'
    && typeof longitude === 'number'
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
  const directionsUrl = locationText
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationText)}`
    : '';
  const statusLabels = {
    Started: text.started,
    'In Progress': text.inProgressStatus,
    Completed: text.completedStatus,
    Blocked: text.blockedStatus
  };
  const statusStyles = {
    Started: 'tech-status-started',
    'In Progress': 'tech-status-progress',
    Completed: 'tech-status-completed',
    Blocked: 'tech-status-blocked'
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onStatusUpdate(complaint.id, {
      ...draft,
      timeTaken: draft.timeTaken === '' ? null : Number(draft.timeTaken),
      needsReinspection: draft.taskStatus === 'Completed' && draft.needsReinspection
    });
  };

  return (
    <article className="tech-task-card">
      <header className="tech-task-header">
        <div className="d-flex align-items-start gap-3">
          <div className="tech-task-mark" aria-hidden="true">!</div>
          <div className="min-w-0">
            <p className="tech-eyebrow mb-1">{text.reportNumber} {complaint.id}</p>
            <h3 className="h5 mb-1">{complaint.hazard_type || text.hazard}</h3>
            <p className="text-secondary small mb-0">{locationText || text.mapUnavailable}</p>
          </div>
        </div>
        <span className={`tech-status-badge ${statusStyles[complaint.taskStatus] || 'tech-status-assigned'}`}>
          {statusLabels[complaint.taskStatus] || text.assignedStatus}
        </span>
      </header>

      <div className="tech-task-links">
        {locationText && (
          <>
            {hasCoordinates && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onLocationClick(complaint.id)}>{text.viewOnMap}</button>}
            <a className="btn btn-sm btn-light" href={directionsUrl} target="_blank" rel="noreferrer">
              {text.getDirections}
            </a>
          </>
        )}
        {complaint.escalated && <span className="tech-flag">{text.escalationFlagged}</span>}
        {complaint.needsReinspection && <span className="tech-flag tech-flag-review">{text.reinspectionFlagged}</span>}
      </div>

      <form className="tech-task-form" onSubmit={handleSubmit}>
        <div className="tech-form-grid">
          <div>
            <label className="form-label" htmlFor={`task-status-${complaint.id}`}>{text.taskStatus}</label>
            <select
              id={`task-status-${complaint.id}`}
              className="form-select"
              value={draft.taskStatus}
              onChange={(event) => updateDraft('taskStatus', event.target.value)}
              disabled={updating || (complaint.taskStatus === 'Completed' && !complaint.needsReinspection)}
            >
              {taskStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor={`task-time-${complaint.id}`}>{text.timeTaken}</label>
            <div className="input-group">
              <input
                id={`task-time-${complaint.id}`}
                className="form-control"
                type="number"
                min="0"
                step="0.25"
                value={draft.timeTaken}
                onChange={(event) => updateDraft('timeTaken', event.target.value)}
                disabled={updating}
              />
              <span className="input-group-text">{text.hours}</span>
            </div>
          </div>
          <div className="tech-form-wide">
            <label className="form-label" htmlFor={`task-notes-${complaint.id}`}>{text.completionNotes}</label>
            <textarea
              id={`task-notes-${complaint.id}`}
              className="form-control"
              rows="2"
              maxLength="2000"
              value={draft.completionNotes}
              onChange={(event) => updateDraft('completionNotes', event.target.value)}
              placeholder={text.completionNotesHint}
              disabled={updating}
            />
          </div>
          <div className="tech-form-wide">
            <label className="form-label" htmlFor={`task-materials-${complaint.id}`}>{text.materialsUsed}</label>
            <textarea
              id={`task-materials-${complaint.id}`}
              className="form-control"
              rows="2"
              maxLength="2000"
              value={draft.materialsUsed}
              onChange={(event) => updateDraft('materialsUsed', event.target.value)}
              placeholder={text.materialsHint}
              disabled={updating}
            />
          </div>
        </div>

        <div className="tech-task-options">
          <label className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={draft.escalated}
              onChange={(event) => updateDraft('escalated', event.target.checked)}
              disabled={updating}
            />
            <span className="form-check-label">{text.flagEscalation}</span>
          </label>
          <label className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={draft.needsReinspection}
              onChange={(event) => updateDraft('needsReinspection', event.target.checked)}
              disabled={updating || draft.taskStatus !== 'Completed'}
            />
            <span className="form-check-label">{text.needsReinspection}</span>
          </label>
        </div>

        <div className="d-flex justify-content-end pt-3">
          <button className="btn btn-primary px-4" type="submit" disabled={updating}>
            {updating ? text.savingTask : text.saveTask}
          </button>
        </div>
      </form>
    </article>
  );
}

function TechnicianTaskList({ text, complaints, isLoading, updatingId, error, onStatusUpdate, onLocationClick }) {
  return (
    <section className="tech-task-list">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {isLoading && <div className="tech-empty-state">{text.loading}</div>}
      {!isLoading && complaints.length === 0 && (
        <div className="tech-empty-state">
          <div className="tech-empty-icon" aria-hidden="true">✓</div>
          <h3 className="h5">{text.noAssignedTasks}</h3>
          <p className="text-secondary mb-0">{text.noAssignedTasksDescription}</p>
        </div>
      )}
      {!isLoading && complaints.map((complaint) => (
        <TechnicianTaskCard
          key={[
            complaint.id,
            complaint.taskStatus,
            complaint.completionNotes,
            complaint.materialsUsed,
            complaint.timeTaken,
            complaint.escalated,
            complaint.needsReinspection
          ].join('|')}
          text={text}
          complaint={complaint}
          updating={updatingId === complaint.id}
          onStatusUpdate={onStatusUpdate}
          onLocationClick={onLocationClick}
        />
      ))}
    </section>
  );
}

function TechnicianDashboard({ text, activePage, complaints, isLoading, updatingId, error, onRetry, onTaskUpdate, onLocationClick, language, languageOptions, onLanguageChange }) {
  const assignedTasks = getTechnicianTasks(complaints);
  const inProgressCount = assignedTasks.filter((task) => task.taskStatus === 'In Progress').length;
  const blockedCount = assignedTasks.filter((task) => task.taskStatus === 'Blocked').length;
  const reinspectionCount = assignedTasks.filter((task) => task.needsReinspection).length;
  const chartMaximum = Math.max(assignedTasks.length, 1);
  const chartItems = [
    { key: 'assigned', label: text.assignedTasks, value: assignedTasks.length, className: 'tech-chart-assigned' },
    { key: 'progress', label: text.inProgressStatus, value: inProgressCount, className: 'tech-chart-progress' },
    { key: 'blocked', label: text.blockedStatus, value: blockedCount, className: 'tech-chart-blocked' },
    { key: 'reinspection', label: text.reinspectionFlagged, value: reinspectionCount, className: 'tech-chart-review' }
  ];

  if (activePage === 'settings') {
    return <SettingsPanel text={text} language={language} languageOptions={languageOptions} onLanguageChange={onLanguageChange} />;
  }

  return (
    <div className="technician-workspace">
      {activePage === 'home' && (
        <>
          <section className="tech-intro">
            <div>
              <p className="tech-eyebrow">{text.technicianWorkspace}</p>
              <h2>{text.technicianWorkTitle}</h2>
              <p className="mb-0">{text.technicianWorkDescription}</p>
            </div>
          </section>

          <section className="tech-chart-panel" aria-labelledby="tech-chart-title">
            <DataLoadError text={text} error={error} onRetry={onRetry} />
            <header className="tech-chart-header">
              <div>
                <p className="tech-eyebrow mb-1">{text.tasksOverview}</p>
                <h2 className="h4 mb-1" id="tech-chart-title">{text.taskStatusOverview}</h2>
                <p className="text-secondary mb-0">{text.taskChartDescription}</p>
              </div>
              <span className="tech-chart-total"><strong>{assignedTasks.length}</strong><span>{text.assignedTasks}</span></span>
            </header>
            {isLoading ? (
              <div className="tech-chart-loading text-secondary">{text.loading}</div>
            ) : (
              <div className="tech-bar-chart" role="list" aria-label={text.taskStatusOverview}>
                {chartItems.map((item) => {
                  const percentage = (item.value / chartMaximum) * 100;
                  return (
                    <div className="tech-bar-item" role="listitem" key={item.key}>
                      <div className="tech-bar-label"><span>{item.label}</span><strong>{item.value}</strong></div>
                      <div
                        className="tech-bar-track"
                        role="progressbar"
                        aria-label={item.label}
                        aria-valuemin="0"
                        aria-valuemax={chartMaximum}
                        aria-valuenow={item.value}
                      >
                        <span className={`tech-bar-fill ${item.className}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {activePage === 'hazards' && (
        <div className="tech-section-heading">
          <div><p className="tech-eyebrow mb-1">{text.technicianWorkspace}</p><h2 className="h4 mb-1">{text.assignedTasks}</h2><p className="text-secondary mb-0">{text.taskListDescription}</p></div>
          <span className="tech-total-pill">{assignedTasks.length} {text.tasksLabel}</span>
        </div>
      )}

      {activePage === 'hazards' && (
        <TechnicianTaskList
          text={text}
          complaints={assignedTasks}
          isLoading={isLoading}
          updatingId={updatingId}
          error={error}
          onStatusUpdate={onTaskUpdate}
          onLocationClick={onLocationClick}
        />
      )}
    </div>
  );
}

export default TechnicianDashboard;
