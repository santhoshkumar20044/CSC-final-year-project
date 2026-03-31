import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { 
  Upload, CheckCircle, Cpu, LogOut, LayoutDashboard, History, 
  Search, Moon, Sun, Layers, Zap, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Render Backend URL
const BACKEND_URL = "https://csc-final-year-project.onrender.com";
const GOOGLE_CLIENT_ID = "930915758489-olls4fvou2r2fet2ou683hti5jfb4qd.apps.googleusercontent.com";
const ADMIN_EMAIL = "santhoshwebworker@gmail.com";

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, avgAccuracy: 0 });

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const savedUser = localStorage.getItem('texScanUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('app');
    }
  }, []);

  const calculateStats = (data) => {
    const total = data.length;
    const passed = data.filter(h => h.status === 'PASS').length;
    const avgAccuracy = total > 0 ? data.reduce((sum, h) => sum + h.score, 0) / total : 0;
    setStats({ total, passed, failed: total - passed, avgAccuracy: avgAccuracy.toFixed(1) });
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/history?email=${user.email}&is_admin=${isAdmin}`);
      setScanHistory(response.data);
      calculateStats(response.data);
    } catch (err) { console.log("History fetch error"); }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab]);

  const handleLoginSuccess = (res) => {
    const decoded = jwtDecode(res.credential);
    setUser(decoded);
    localStorage.setItem('texScanUser', JSON.stringify(decoded));
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('texScanUser');
    setUser(null);
    setView('landing');
  };

  const uploadImage = async () => {
    if (!file || isAdmin) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);
    try {
      const response = await axios.post(`${BACKEND_URL}/analyze`, formData);
      setResult(response.data);
      fetchHistory();
    } catch (error) { 
      alert('Backend Connection Failed! Check if Render is live.'); 
    }
    setLoading(false);
  };

  const filteredHistory = scanHistory.filter(item => 
    item.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'landing') {
    return (
      <div style={{...styles.landingWrapper, background: darkMode ? '#020617' : '#ffffff'}}>
        <nav style={styles.navbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.logoIcon}><Cpu color="#fff" size={28} /></div>
            <span style={{...styles.logoText, color: darkMode ? '#fff' : '#020617'}}>TEXSCAN<span style={{color:'#3b82f6'}}>PRO</span></span>
          </div>
          <button onClick={() => setView('login')} style={styles.navBtn}>Get Started</button>
        </nav>
        <header style={styles.heroSection}>
          <h1 style={{...styles.heroTitle, color: darkMode ? '#fff' : '#020617'}}>AI Fabric <span style={{color: '#3b82f6'}}>Inspector</span></h1>
          <p style={styles.heroSubtitle}>Enterprise-grade textile quality control powered by deep learning.</p>
          <button onClick={() => setView('login')} style={{...styles.primaryBtn, margin:'40px auto'}}>Launch Dashboard <ArrowRight/></button>
        </header>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div style={{...styles.loginContainer, background: darkMode ? '#020617' : '#f8fafc'}}>
        <div style={styles.loginGlassCard}>
          <Cpu size={50} color="#3b82f6" style={{marginBottom:'20px'}}/>
          <h2 style={{color: darkMode ? '#fff' : '#000'}}>System Portal</h2>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin onSuccess={handleLoginSuccess} theme={darkMode ? "dark" : "outline"} shape="pill"/>
          </GoogleOAuthProvider>
          <button onClick={() => setView('landing')} style={{marginTop:'20px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer'}}>← Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: darkMode ? '#020617' : '#f8fafc', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
      <nav style={{...styles.sidebar, background: darkMode ? '#0f172a' : '#1e40af'}}>
        <div style={styles.sidebarLogo}><strong style={{color:'#fff'}}>TEXSCAN PRO</strong></div>
        <div style={{flex:1, marginTop: '40px'}}>
          <SideBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label={isAdmin ? "Overview" : "Dashboard"} />
          <SideBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20}/>} label={isAdmin ? "User Logs" : "My History"} />
        </div>
        <div style={styles.profileSection}>
          <img src={user.picture} style={styles.avatar} alt="user"/>
          <div style={{overflow:'hidden'}}><p style={{margin:0, fontSize:'0.8rem', fontWeight:'bold', color: '#fff'}}>{user.name.split(' ')[0]}</p></div>
          <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={16}/></button>
        </div>
      </nav>

      <main style={{flex:1, padding: '30px', overflowY: 'auto'}}>
        <header style={styles.mainHeader}>
          <h2>{isAdmin ? "Admin Control Panel" : "Auditor Dashboard"}</h2>
          <div style={styles.headerActions}>
            <div style={styles.searchBar}>
              <Search size={18} color="#64748b"/><input placeholder="Search..." style={styles.searchInp} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} style={styles.themeToggle}>{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div style={styles.dashboardGrid}>
            <div style={styles.statsRow}>
              <StatBox label="Total Scans" val={stats.total} icon={<Layers color="#3b82f6"/>} />
              <StatBox label="Pass Rate" val={`${(stats.passed/stats.total*100 || 0).toFixed(1)}%`} icon={<CheckCircle color="#10b981"/>} />
              <StatBox label="Avg Accuracy" val={`${stats.avgAccuracy}%`} icon={<Zap color="#facc15"/>} />
            </div>

            {!isAdmin && (
              <div style={styles.actionGrid}>
                <div style={{...styles.mainCard, background: darkMode ? '#0f172a' : '#fff'}}>
                  <h3>Fabric Input</h3>
                  <div style={styles.dropZone}>
                    {preview ? <img src={preview} style={styles.previewBox} alt="preview"/> : 
                      <label style={styles.uploadLabel}><Upload size={40}/><p>Upload Image</p><input type="file" hidden onChange={(e) => {setFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0]));}}/></label>
                    }
                  </div>
                  <button onClick={uploadImage} disabled={loading || !file} style={styles.analyzeBtn}>
                    {loading ? "Processing..." : "Run Analysis"}
                  </button>
                </div>
                <div style={{...styles.mainCard, background: darkMode ? '#0f172a' : '#fff'}}>
                  <h3>Result</h3>
                  {result ? <div style={{textAlign:'center'}}><div style={{...styles.statusChip, background: result.status==='PASS'?'#064e3b':'#450a0a'}}>{result.status}</div><p>Accuracy: {result.score}%</p></div> : <p>No data</p>}
                </div>
              </div>
            )}

            {isAdmin && (
              <div style={{...styles.mainCard, height:'400px', background: darkMode ? '#0f172a' : '#fff'}}>
                <h3>Inspection Performance</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={scanHistory.slice(0,15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{background:'#020617'}}/>
                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div style={{...styles.mainCard, background: darkMode ? '#0f172a' : '#fff'}}>
            <h3>{isAdmin ? "Global User Logs" : "My Scan History"}</h3>
            <table style={styles.table}>
              <thead>
                <tr style={{color:'#64748b', textAlign:'left'}}>
                  <th>Time</th>
                  {isAdmin && <th>User</th>}
                  <th>File</th>
                  <th>Verdict</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                    {isAdmin && <td>{item.user_email}</td>}
                    <td>{item.filename}</td>
                    <td style={{color: item.status==='PASS'?'#4ade80':'#f87171', fontWeight:'bold'}}>{item.status}</td>
                    <td>{item.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const SideBtn = ({active, onClick, icon, label}) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', border: 'none', borderRadius: '12px', background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: '600', marginBottom: '5px' }}>{icon} {label}</button>
);

const StatBox = ({label, val, icon}) => (
  <div style={{...styles.statBox, background:'#0f172a', border:'1px solid #1e293b'}}>
    <div style={styles.statIcon}>{icon}</div>
    <div><p style={{margin:0, color:'#64748b', fontSize:'0.75rem'}}>{label}</p><h2 style={{margin:0, fontSize:'1.2rem', color:'#fff'}}>{val}</h2></div>
  </div>
);

const styles = {
  landingWrapper: { minHeight: '100vh', padding: '0 5%', fontFamily: 'Inter, sans-serif' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' },
  logoIcon: { background: '#3b82f6', padding: '8px', borderRadius: '10px' },
  logoText: { fontSize: '1.2rem', fontWeight: 'bold' },
  navBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  heroSection: { textAlign: 'center', marginTop: '100px' },
  heroTitle: { fontSize: '4rem', fontWeight: '900' },
  heroSubtitle: { color: '#64748b', fontSize: '1.2rem' },
  primaryBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '10px', display: 'flex', gap: '10px', fontWeight: 'bold', alignItems: 'center' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginGlassCard: { padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid #1e293b', width: '350px' },
  sidebar: { width: '240px', padding: '20px', display: 'flex', flexDirection: 'column' },
  sidebarLogo: { padding: '10px', fontSize: '1.2rem' },
  profileSection: { marginTop: 'auto', background: '#020617', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  logoutBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  headerActions: { display: 'flex', gap: '15px' },
  searchBar: { background: '#0f172a', padding: '8px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #1e293b' },
  searchInp: { background: 'none', border: 'none', color: '#fff', outline: 'none' },
  themeToggle: { background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '10px', padding: '8px', cursor: 'pointer' },
  dashboardGrid: { display: 'flex', flexDirection: 'column', gap: '25px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  statBox: { padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' },
  statIcon: { background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '10px' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  mainCard: { padding: '25px', borderRadius: '20px', border: '1px solid #1e293b' },
  dropZone: { height: '250px', border: '2px dashed #1e293b', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', position: 'relative' },
  uploadLabel: { cursor: 'pointer', textAlign: 'center', color: '#64748b' },
  previewBox: { height: '100%', width: '100%', objectFit: 'contain' },
  analyzeBtn: { width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' },
  statusChip: { display: 'inline-block', padding: '5px 15px', borderRadius: '20px', color: '#fff', fontWeight: 'bold', marginBottom: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #1e293b', height: '50px' }
};

export default App;
