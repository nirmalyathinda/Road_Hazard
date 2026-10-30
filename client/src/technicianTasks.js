export const getTechnicianTasks = (complaints) => complaints.filter((complaint) => (
  complaint.status === 'Reviewed' || (complaint.status === 'Resolved' && complaint.needsReinspection)
));
