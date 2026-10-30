const express = require('express');
const cors = require('cors');
const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

const app = express();
const PORT = 5000;

const requiredFirebaseSettings = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];
const missingFirebaseSettings = requiredFirebaseSettings.filter((setting) => !process.env[setting]);

if (missingFirebaseSettings.length > 0) {
  throw new Error(`Missing Firebase settings: ${missingFirebaseSettings.join(', ')}`);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const db = getFirestore();
const auth = getAuth();
const complaintsCollection = db.collection('complaints');
const usersCollection = db.collection('users');

const getComplaintDate = (complaint) => complaint.date_reported || complaint['Date Reported'] || complaint.dateReported;

const normalizeLocation = (location) => {
  if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return { latitude: location.latitude, longitude: location.longitude };
  }

  if (typeof location !== 'string') {
    return location || '';
  }

  const coordinates = location.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  if (!coordinates) {
    return location;
  }

  const latitude = Number(coordinates[1]);
  const longitude = Number(coordinates[2]);

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return location;
  }

  return { latitude, longitude };
};

const normalizeComplaint = (document) => {
  const complaint = document.data();
  const dateReported = getComplaintDate(complaint);

  return {
    ...complaint,
    id: complaint.id || complaint.report || complaint.Report || document.id,
    hazard_type: complaint.hazard_type || complaint.hazard || complaint.Hazard || '',
    location: normalizeLocation(complaint.location || complaint.Location || ''),
    date_reported: dateReported?.toDate ? dateReported.toDate().toISOString() : dateReported || '',
    status: complaint.status || complaint.Status || 'Pending',
    action: complaint.action || complaint.Action || '',
    image_url: complaint.image_url || complaint.imageUrl || '',
    taskStatus: complaint.taskStatus || '',
    completionNotes: complaint.completionNotes || '',
    materialsUsed: complaint.materialsUsed || '',
    timeTaken: complaint.timeTaken ?? null,
    escalated: complaint.escalated === true,
    needsReinspection: complaint.needsReinspection === true
  };
};

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Parse incoming JSON payloads

const sampleComplaints = [
  {
    id: "RH-1001",
    hazard_type: "Pothole",
    location: "Main Street & 4th Avenue",
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=160&q=80",
    status: "Pending",
    date_reported: "2026-09-16"
  },
  {
    id: "RH-1002",
    hazard_type: "Fallen Tree",
    location: "Riverside Drive",
    image_url: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=160&q=80",
    status: "Reviewed",
    date_reported: "2026-09-14"
  },
  {
    id: "RH-1003",
    hazard_type: "Broken Sign",
    location: "Oak Boulevard & 12th Street",
    image_url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=160&q=80",
    status: "Pending",
    date_reported: "2026-09-12"
  }
];

const seedComplaints = async () => {
  const snapshot = await complaintsCollection.limit(1).get();

  if (!snapshot.empty) {
    return;
  }

  const batch = db.batch();
  sampleComplaints.forEach((complaint) => {
    batch.set(complaintsCollection.doc(complaint.id), complaint);
  });
  await batch.commit();
};

const requireAdmin = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Firebase authentication required' });
  }

  return auth.verifyIdToken(authorization.substring('Bearer '.length))
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch(() => res.status(401).json({ message: 'Invalid or expired Firebase token' }));
};

const requireAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access required' });
  }

  return next();
};

const normalizeUser = (document) => {
  const user = document.data();

  return {
    email: user.email || '',
    fullName: user.fullName || '',
    idNumber: user.idNumber || '',
    phone: user.phone || '',
    id: user.id || document.id
  };
};

const findComplaintReference = async (id) => {
  let reference = complaintsCollection.doc(id);
  let snapshot = await reference.get();

  if (!snapshot.exists) {
    for (const identifierField of ['id', 'report', 'Report']) {
      const matchingDocuments = await complaintsCollection
        .where(identifierField, '==', id)
        .limit(1)
        .get();

      if (!matchingDocuments.empty) {
        reference = matchingDocuments.docs[0].ref;
        snapshot = matchingDocuments.docs[0];
        break;
      }
    }
  }

  return snapshot.exists ? { reference, snapshot } : null;
};

// GET endpoint: Fetch all complaints
app.get('/api/complaints', requireAdmin, async (req, res) => {
  try {
    const snapshot = await complaintsCollection.get();
    let complaints = snapshot.docs
      .map(normalizeComplaint)
      .sort((first, second) => new Date(second.date_reported) - new Date(first.date_reported));

    if (req.user.role === 'technician') {
      complaints = complaints.filter((complaint) => (
        complaint.status === 'Reviewed' || (complaint.status === 'Resolved' && complaint.needsReinspection)
      ));
    }

    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load complaints from Firebase' });
  }
});

// PATCH endpoint: Update complaint status
app.patch('/api/complaints/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['Pending', 'Reviewed', 'Rejected', 'Resolved'];

  if (req.user.role === 'technician') {
    return res.status(403).json({ message: 'Technicians must use the task update endpoint' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid complaint status' });
  }

  try {
    const complaint = await findComplaintReference(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaintData = complaint.snapshot.data();
    const update = { status };

    if (status === 'Reviewed') {
      update.taskStatus = complaintData.taskStatus || 'Started';
      update.completionNotes = complaintData.completionNotes || '';
      update.materialsUsed = complaintData.materialsUsed || '';
      update.timeTaken = complaintData.timeTaken ?? null;
      update.escalated = complaintData.escalated === true;
      update.needsReinspection = complaintData.needsReinspection === true;
    }

    await complaint.reference.update(update);
    return res.json(normalizeComplaint({
      data: () => ({ ...complaintData, ...update }),
      id
    }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update complaint in Firebase' });
  }
});

app.patch('/api/complaints/:id/task', requireAdmin, async (req, res) => {
  if (req.user.role !== 'technician') {
    return res.status(403).json({ message: 'Technician access required' });
  }

  const task = req.body;
  const allowedTaskStatuses = ['Started', 'In Progress', 'Completed', 'Blocked'];

  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return res.status(400).json({ message: 'Task details are required' });
  }

  const { taskStatus, completionNotes, materialsUsed, timeTaken, escalated, needsReinspection } = task;
  if (
    !allowedTaskStatuses.includes(taskStatus)
    || typeof completionNotes !== 'string'
    || completionNotes.length > 2000
    || typeof materialsUsed !== 'string'
    || materialsUsed.length > 2000
    || (timeTaken !== null && (typeof timeTaken !== 'number' || !Number.isFinite(timeTaken) || timeTaken < 0))
    || typeof escalated !== 'boolean'
    || typeof needsReinspection !== 'boolean'
    || (needsReinspection && taskStatus !== 'Completed')
  ) {
    return res.status(400).json({ message: 'Invalid task details' });
  }

  try {
    const complaint = await findComplaintReference(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const currentComplaint = normalizeComplaint(complaint.snapshot);
    const isAssignedTask = currentComplaint.status === 'Reviewed'
      || (currentComplaint.status === 'Resolved' && currentComplaint.needsReinspection);

    if (!isAssignedTask) {
      return res.status(409).json({ message: 'This task is not assigned or is already closed' });
    }

    const status = taskStatus === 'Completed' ? 'Resolved' : 'Reviewed';
    await complaint.reference.update({
      status,
      taskStatus,
      completionNotes: completionNotes.trim(),
      materialsUsed: materialsUsed.trim(),
      timeTaken,
      escalated,
      needsReinspection
    });

    const updatedSnapshot = await complaint.reference.get();
    return res.json(normalizeComplaint(updatedSnapshot));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update technician task in Firebase' });
  }
});

app.get('/api/users', requireAdmin, requireAdminRole, async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    res.json(snapshot.docs.map(normalizeUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load users from Firebase' });
  }
});

app.post('/api/users', requireAdmin, requireAdminRole, async (req, res) => {
  const { email, fullName, idNumber, password, phone } = req.body;

  if (![email, fullName, idNumber, password, phone].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ message: 'All user fields are required' });
  }

  try {
    const userReference = usersCollection.doc();
    await userReference.set({ email: email.trim(), fullName: fullName.trim(), idNumber: idNumber.trim(), password, phone: phone.trim(), id: userReference.id });
    return res.status(201).json(normalizeUser(await userReference.get()));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to add user to Firebase' });
  }
});

app.delete('/api/users/:id', requireAdmin, requireAdminRole, async (req, res) => {
  try {
    const userReference = usersCollection.doc(req.params.id);
    const userSnapshot = await userReference.get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userReference.delete();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to remove user from Firebase' });
  }
});

seedComplaints()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to initialize Firebase data:', error);
    process.exit(1);
  });