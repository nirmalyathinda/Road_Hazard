import { useEffect, useState } from 'react';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const translations = {
  en: {
    language: 'Language', cityOperations: 'City operations', adminSignIn: 'Admin sign in', loginDescription: 'Access the road hazard complaint queue.', username: 'Username', password: 'Password', signIn: 'Sign in to Admin', signingIn: 'Signing in...', prototypeLogin: 'Prototype login: admin / admin123', invalidCredentials: 'Invalid username or password.', roadHazardReview: 'Road hazard review', dashboardDescription: 'Monitor and triage reports from the citizen mobile app.', liveQueue: 'Live queue', logOut: 'Log out', home: 'Home', hazards: 'Hazards', settings: 'Settings', settingsDescription: 'Manage dashboard preferences.', totalReports: 'Total reports', needsReview: 'Needs review', reviewed: 'Reviewed', completed: 'Completed', rejected: 'Rejected', complaintQueue: 'Complaint queue', queueDescription: 'Review submitted hazards and keep the city response team informed.', report: 'Report', hazard: 'Hazard', location: 'Location', dateReported: 'Date reported', status: 'Status', action: 'Action', loading: 'Loading complaints...', noComplaints: 'No complaints found.', markReviewed: 'Verify', reject: 'Reject', resolve: 'Complete', updating: 'Updating...', unableToLoad: 'Unable to load complaints. Your session may have expired.', updateFailed: 'The complaint could not be updated. Please try again.', pending: 'Pending', resolved: 'Resolved', pothole: 'Pothole', fallenTree: 'Fallen Tree', brokenSign: 'Broken Sign'
  },
  si: {
    language: 'භාෂාව', cityOperations: 'නගර මෙහෙයුම්', adminSignIn: 'පරිපාලක පිවිසුම', loginDescription: 'මාර්ග අනතුරු පැමිණිලි පෝලිමට පිවිසෙන්න.', username: 'පරිශීලක නාමය', password: 'මුරපදය', signIn: 'පරිපාලක ලෙස පිවිසෙන්න', signingIn: 'පිවිසෙමින්...', prototypeLogin: 'ආදර්ශ පිවිසුම: admin / admin123', invalidCredentials: 'පරිශීලක නාමය හෝ මුරපදය වැරදියි.', roadHazardReview: 'මාර්ග අනතුරු සමාලෝචනය', dashboardDescription: 'පුරවැසි ජංගම යෙදුමෙන් ලැබෙන වාර්තා පරීක්ෂා කරන්න.', liveQueue: 'සජීවී පෝලිම', logOut: 'ඉවත් වන්න', home: 'මුල් පිටුව', hazards: 'අනතුරු', settings: 'සැකසුම්', settingsDescription: 'උපකරණ පුවරු මනාප කළමනාකරණය කරන්න.', totalReports: 'මුළු වාර්තා', needsReview: 'සමාලෝචනය අවශ්‍යයි', reviewed: 'සමාලෝචනය කළ', completed: 'සම්පූර්ණ කළ', rejected: 'ප්‍රතික්ෂේප කළ', complaintQueue: 'පැමිණිලි පෝලිම', queueDescription: 'වාර්තා කළ අනතුරු සමාලෝචනය කර ප්‍රතිචාර කණ්ඩායම දැනුවත් කරන්න.', report: 'වාර්තාව', hazard: 'අනතුර', location: 'ස්ථානය', dateReported: 'වාර්තා කළ දිනය', status: 'තත්ත්වය', action: 'ක්‍රියාව', loading: 'පැමිණිලි පූරණය වෙමින්...', noComplaints: 'පැමිණිලි හමු නොවීය.', markReviewed: 'තහවුරු කරන්න', reject: 'ප්‍රතික්ෂේප කරන්න', resolve: 'සම්පූර්ණ කරන්න', updating: 'යාවත්කාලීන කරමින්...', unableToLoad: 'පැමිණිලි පූරණය කළ නොහැක. ඔබගේ සැසිය අවසන් වී තිබිය හැක.', updateFailed: 'පැමිණිල්ල යාවත්කාලීන කළ නොහැක. නැවත උත්සාහ කරන්න.', pending: 'පොරොත්තුවෙන්', resolved: 'විසඳන ලදී', pothole: 'වළක්', fallenTree: 'වැටුණු ගස', brokenSign: 'කැඩුණු සංඥා පුවරුව'
  },
  ta: {
    language: 'மொழி', cityOperations: 'நகர செயல்பாடுகள்', adminSignIn: 'நிர்வாகி உள்நுழைவு', loginDescription: 'சாலை ஆபத்து புகார் வரிசையை அணுகவும்.', username: 'பயனர் பெயர்', password: 'கடவுச்சொல்', signIn: 'நிர்வாகியாக உள்நுழைக', signingIn: 'உள்நுழைகிறது...', prototypeLogin: 'மாதிரி உள்நுழைவு: admin / admin123', invalidCredentials: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறானது.', roadHazardReview: 'சாலை ஆபத்து மதிப்பாய்வு', dashboardDescription: 'குடிமக்கள் செயலியில் இருந்து வரும் அறிக்கைகளை கண்காணிக்கவும்.', liveQueue: 'நேரடி வரிசை', logOut: 'வெளியேறு', home: 'முகப்பு', hazards: 'ஆபத்துகள்', settings: 'அமைப்புகள்', settingsDescription: 'டாஷ்போர்டு விருப்பங்களை நிர்வகிக்கவும்.', totalReports: 'மொத்த அறிக்கைகள்', needsReview: 'மதிப்பாய்வு தேவை', reviewed: 'மதிப்பாய்வு செய்யப்பட்டது', completed: 'முடிக்கப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது', complaintQueue: 'புகார் வரிசை', queueDescription: 'புகாரளிக்கப்பட்ட ஆபத்துகளை மதிப்பாய்வு செய்து குழுவைத் தகவலறியச் செய்யவும்.', report: 'அறிக்கை', hazard: 'ஆபத்து', location: 'இடம்', dateReported: 'அறிக்கை தேதி', status: 'நிலை', action: 'செயல்', loading: 'புகார்கள் ஏற்றப்படுகின்றன...', noComplaints: 'புகார்கள் எதுவும் இல்லை.', markReviewed: 'சரிபார்க்கவும்', reject: 'நிராகரிக்கவும்', resolve: 'முடிக்கவும்', updating: 'புதுப்பிக்கப்படுகிறது...', unableToLoad: 'புகார்களை ஏற்ற முடியவில்லை. உங்கள் அமர்வு முடிந்திருக்கலாம்.', updateFailed: 'புகாரை புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', pending: 'நிலுவையில்', resolved: 'தீர்க்கப்பட்டது', pothole: 'சாலை குழி', fallenTree: 'விழுந்த மரம்', brokenSign: 'உடைந்த பலகை'
  }
};

const languageOptions = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('road-hazard-language') || 'en');
  const [token, setToken] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const text = translations[language];

  const changeLanguage = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    localStorage.setItem('road-hazard-language', nextLanguage);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchComplaints = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(response.data);
      } catch {
        setError(text.unableToLoad);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, [token, text.unableToLoad]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.username, credentials.password);
      const firebaseToken = await userCredential.user.getIdToken();
      setToken(firebaseToken);
    } catch {
      setLoginError(text.invalidCredentials);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setComplaints([]);
    setError('');
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    setError('');

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/complaints/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints((currentComplaints) => currentComplaints.map((complaint) => (
        complaint.id === id ? response.data : complaint
      )));
    } catch {
      setError(text.updateFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = complaints.filter((complaint) => complaint.status === 'Pending').length;
  const reviewedCount = complaints.filter((complaint) => complaint.status === 'Reviewed').length;
  const rejectedCount = complaints.filter((complaint) => complaint.status === 'Rejected').length;
  const completedCount = complaints.filter((complaint) => complaint.status === 'Resolved').length;

  const statusBadge = {
    Pending: 'bg-warning text-dark',
    Reviewed: 'bg-success',
    Resolved: 'bg-primary',
    Rejected: 'bg-danger'
  };

  const statusLabel = { Pending: text.pending, Reviewed: text.reviewed, Resolved: text.resolved, Rejected: text.rejected };
  const hazardLabel = { Pothole: text.pothole, 'Fallen Tree': text.fallenTree, 'Broken Sign': text.brokenSign };

  if (!token) {
    return (
      <div className="min-vh-100 bg-dark d-flex align-items-center">
        <main className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-7 col-lg-5">
              <div className="d-flex justify-content-end mb-4"><label className="visually-hidden" htmlFor="login-language">{text.language}</label><select id="login-language" className="form-select form-select-sm w-auto" value={language} onChange={changeLanguage}>{Object.entries(languageOptions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div>
              <div className="text-center text-white mb-4">
                <p className="text-uppercase text-info small fw-semibold mb-2">{text.cityOperations}</p>
                <h1 className="display-6 fw-semibold mb-2">{text.adminSignIn}</h1>
                <p className="text-white-50 mb-0">{text.loginDescription}</p>
              </div>
              <form className="card border-0 shadow-lg" onSubmit={handleLogin}>
                <div className="card-body p-4 p-md-5">
                  {loginError && <div className="alert alert-danger" role="alert">{loginError}</div>}
                  <div className="mb-3"><label className="form-label" htmlFor="username">Email</label><input id="username" type="email" className="form-control" autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required /></div>
                  <div className="mb-4"><label className="form-label" htmlFor="password">{text.password}</label><input id="password" type="password" className="form-control" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></div>
                  <button className="btn btn-info w-100 fw-semibold" type="submit" disabled={isLoggingIn}>{isLoggingIn ? text.signingIn : text.signIn}</button>
                  <p className="text-secondary small text-center mt-3 mb-0">{text.prototypeLogin}</p>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <header className="bg-dark text-white shadow-sm">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <p className="text-uppercase text-info small fw-semibold mb-1">{text.cityOperations}</p>
              <h1 className="h2 mb-1">{text.roadHazardReview}</h1>
              <p className="text-white-50 mb-0">{text.dashboardDescription}</p>
            </div>
            <div className="d-flex align-items-center gap-3"><label className="visually-hidden" htmlFor="dashboard-language">{text.language}</label><select id="dashboard-language" className="form-select form-select-sm w-auto" value={language} onChange={changeLanguage}>{Object.entries(languageOptions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><span className="badge rounded-pill text-bg-info px-3 py-2">{text.liveQueue}</span><button className="btn btn-sm btn-outline-light" onClick={handleLogout}>{text.logOut}</button></div>
          </div>
          <nav className="category-nav" aria-label="Main navigation">
            {[['home', text.home], ['hazards', text.hazards], ['settings', text.settings]].map(([page, label]) => (
              <button key={page} className={`category-nav-link ${activePage === page ? 'active' : ''}`} onClick={() => setActivePage(page)}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container py-4 py-lg-5">
        {activePage === 'settings' && <div className="card border-0 shadow-sm settings-panel"><div className="card-body p-4"><h2 className="h5 mb-2">{text.settings}</h2><p className="text-secondary mb-4">{text.settingsDescription}</p><label className="form-label" htmlFor="settings-language">{text.language}</label><select id="settings-language" className="form-select settings-control" value={language} onChange={changeLanguage}>{Object.entries(languageOptions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div></div>}

        {activePage === 'home' && <div className="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3 mb-4">
          <div className="col">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <p className="text-secondary small mb-2">{text.totalReports}</p>
              <p className="display-6 fw-semibold mb-0">{complaints.length}</p>
            </div></div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <p className="text-secondary small mb-2">{text.needsReview}</p>
              <p className="display-6 fw-semibold text-warning mb-0">{pendingCount}</p>
            </div></div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <p className="text-secondary small mb-2">{text.reviewed}</p>
              <p className="display-6 fw-semibold text-success mb-0">{reviewedCount}</p>
            </div></div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <p className="text-secondary small mb-2">{text.rejected}</p>
              <p className="display-6 fw-semibold text-danger mb-0">{rejectedCount}</p>
            </div></div>
          </div>
          <div className="col">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <p className="text-secondary small mb-2">{text.completed}</p>
              <p className="display-6 fw-semibold text-primary mb-0">{completedCount}</p>
            </div></div>
          </div>
        </div>}

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {activePage === 'hazards' && <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 p-4">
            <h2 className="h5 mb-1">{text.complaintQueue}</h2>
            <p className="text-secondary mb-0">{text.queueDescription}</p>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr><th className="ps-4">{text.report}</th><th>{text.hazard}</th><th>{text.location}</th><th>{text.dateReported}</th><th>{text.status}</th><th className="text-end pe-4">{text.action}</th></tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan="6" className="text-center py-5 text-secondary">{text.loading}</td></tr>}
                {!isLoading && complaints.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-secondary">{text.noComplaints}</td></tr>}
                {!isLoading && complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td className="ps-4"><div className="d-flex align-items-center gap-3"><img src={complaint.image_url || '/logo.jpg'} alt="" width="52" height="52" className="rounded object-fit-cover" /><span className="fw-semibold">{complaint.id}</span></div></td>
                    <td className="fw-medium">{hazardLabel[complaint.hazard_type] || complaint.hazard_type}</td>
                    <td className="text-secondary">{complaint.location}</td>
                    <td className="text-secondary">{new Date(complaint.date_reported).toLocaleDateString()}</td>
                    <td><span className={`badge ${statusBadge[complaint.status] || 'bg-secondary'}`}>{statusLabel[complaint.status] || complaint.status}</span></td>
                    <td className="text-end pe-4"><div className="d-flex justify-content-end gap-2"><button className="btn btn-sm btn-outline-success" disabled={complaint.status !== 'Pending' || updatingId === complaint.id} onClick={() => handleStatusUpdate(complaint.id, 'Reviewed')}>{text.markReviewed}</button><button className="btn btn-sm btn-outline-danger" disabled={complaint.status !== 'Pending' || updatingId === complaint.id} onClick={() => handleStatusUpdate(complaint.id, 'Rejected')}>{text.reject}</button><button className="btn btn-sm btn-outline-primary" disabled={complaint.status !== 'Reviewed' || updatingId === complaint.id} onClick={() => handleStatusUpdate(complaint.id, 'Resolved')}>{updatingId === complaint.id ? text.updating : text.resolve}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
      </main>
    </div>
  );
}

export default App;