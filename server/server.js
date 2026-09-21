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

const getComplaintDate = (complaint) => complaint.date_reported || complaint['Date Reported'] || complaint.dateReported;

const normalizeComplaint = (document) => {
  const complaint = document.data();
  const dateReported = getComplaintDate(complaint);

  return {
    ...complaint,
    id: complaint.id || complaint.report || complaint.Report || document.id,
    hazard_type: complaint.hazard_type || complaint.hazard || complaint.Hazard || '',
    location: complaint.location || complaint.Location || '',
    date_reported: dateReported?.toDate ? dateReported.toDate().toISOString() : dateReported || '',
    status: complaint.status || complaint.Status || 'Pending',
    action: complaint.action || complaint.Action || '',
    image_url: complaint.image_url || complaint.imageUrl || ''
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

// GET endpoint: Fetch all complaints
app.get('/api/complaints', requireAdmin, async (req, res) => {
  try {
    const snapshot = await complaintsCollection.get();
    const complaints = snapshot.docs
      .map(normalizeComplaint)
      .sort((first, second) => new Date(second.date_reported) - new Date(first.date_reported));
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

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid complaint status' });
  }

  if (req.user.role === 'technician' && status !== 'Resolved') {
    return res.status(403).json({ message: 'Technicians can only complete reviewed complaints' });
  }

  try {
    let complaintReference = complaintsCollection.doc(id);
    let complaintSnapshot = await complaintReference.get();

    if (!complaintSnapshot.exists) {
      for (const identifierField of ['id', 'report', 'Report']) {
        const matchingDocuments = await complaintsCollection
          .where(identifierField, '==', id)
          .limit(1)
          .get();

        if (!matchingDocuments.empty) {
          complaintReference = matchingDocuments.docs[0].ref;
          complaintSnapshot = matchingDocuments.docs[0];
          break;
        }
      }
    }

    if (!complaintSnapshot.exists) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role === 'technician' && normalizeComplaint(complaintSnapshot).status !== 'Reviewed') {
      return res.status(409).json({ message: 'Only reviewed complaints can be completed' });
    }

    await complaintReference.update({ status });
    return res.json(normalizeComplaint({
      data: () => ({ ...complaintSnapshot.data(), status }),
      id
    }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update complaint in Firebase' });
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