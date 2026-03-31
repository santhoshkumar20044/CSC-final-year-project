import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { 
  Upload, CheckCircle, Cpu, LogOut, LayoutDashboard, History, 
  Search, Moon, Sun, Layers, Zap, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = "https://csc-final-year-project.onrender.com";
const GOOGLE_CLIENT_ID = "930915758489-olls4fvou2r2fet2eou683hti5jfb4qd.apps.googleusercontent.com";
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

  // 🔹 Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('texScanUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('app');
    }
  }, []);

  // 🔹 Calculate stats
  const calculateStats = useCallback((data) => {
    const total = data.length;
    const passed = data.filter(h => h.status === 'PASS').length;
    const avgAccuracy = total > 0 ? data.reduce((sum, h) => sum + h.score, 0) / total : 0;

    setStats({
      total,
      passed,
      failed: total - passed,
      avgAccuracy: avgAccuracy.toFixed(1)
    });
  }, []);

  // 🔹 Fetch history
  const fetchHistory = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get(
        `${BACKEND_URL}/history?email=${user.email}&is_admin=${isAdmin}`
      );
      setScanHistory(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.log("History fetch error", err);
    }
  }, [user, isAdmin, calculateStats]);

  // ✅ FIXED ESLINT ISSUE HERE
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab, fetchHistory]);

  // 🔹 Login success
  const handleLoginSuccess = (res) => {
    const decoded = jwtDecode(res.credential);
    setUser(decoded);
    localStorage.setItem('texScanUser', JSON.stringify(decoded));
    setView('app');
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem('texScanUser');
    setUser(null);
    setView('landing');
  };

  // 🔹 Upload image
  const uploadImage = async () => {
    if (!file || isAdmin) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);

    try {
      const response = await axios.post(`${BACKEND_URL}/analyze`, formData);
      setResult(response.data);

      // 🔹 refresh history after upload
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

  const SideBtn = ({active, onClick, icon, label}) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '15px',
        width: '100%', padding: '15px', border: 'none',
        borderRadius: '12px',
        background: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#64748b',
        cursor: 'pointer', fontWeight: '600', marginBottom: '5px'
      }}>
      {icon} {label}
    </button>
  );

  const StatBox = ({label, val, icon}) => (
    <div style={{...styles.statBox, background:'#0f172a', border:'1px solid #1e293b'}}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <p style={{margin:0, color:'#64748b', fontSize:'0.75rem'}}>{label}</p>
        <h2 style={{margin:0, fontSize:'1.2rem', color:'#fff'}}>{val}</h2>
      </div>
    </div>
  );

  // 🔹 LANDING PAGE
  if (view === 'landing') {
    return (
      <div style={{...styles.landingWrapper, background: darkMode ? '#020617' : '#ffffff'}}>
        <nav style={styles.navbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.logoIcon}><Cpu color="#fff" size={28} /></div>
            <span style={{...styles.logoText, color: darkMode ? '#fff' : '#020617'}}>
              TEXSCAN<span style={{color:'#3b82f6'}}>PRO</span>
            </span>
          </div>
          <button onClick={() => setView('login')} style={styles.navBtn}>Get Started</button>
        </nav>

        <header style={styles.heroSection}>
          <h1 style={{...styles.heroTitle, color: darkMode ? '#fff' : '#020617'}}>
            AI Fabric <span style={{color: '#3b82f6'}}>Inspector</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Enterprise-grade textile quality control powered by deep learning.
          </p>
          <button onClick={() => setView('login')} style={{...styles.primaryBtn, margin:'40px auto'}}>
            Launch Dashboard <ArrowRight/>
          </button>
        </header>
      </div>
    );
  }

  // 🔹 LOGIN PAGE
  if (view === 'login') {
    return (
      <div style={{...styles.loginContainer, background: darkMode ? '#020617' : '#f8fafc'}}>
        <div style={styles.loginGlassCard}>
          <Cpu size={50} color="#3b82f6" style={{marginBottom:'20px'}}/>
          <h2 style={{color: darkMode ? '#fff' : '#000'}}>System Portal</h2>

          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              theme={darkMode ? "dark" : "outline"}
              shape="pill"
            />
          </GoogleOAuthProvider>

          <button onClick={() => setView('landing')} style={{marginTop:'20px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer'}}>
            ← Home
          </button>
        </div>
      </div>
    );
  }

  // 🔹 MAIN APP
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: darkMode ? '#020617' : '#f8fafc' }}>
      <nav style={{...styles.sidebar, background: darkMode ? '#0f172a' : '#1e40af'}}>
        <div style={styles.sidebarLogo}><strong style={{color:'#fff'}}>TEXSCAN PRO</strong></div>

        <div style={{flex:1, marginTop: '40px'}}>
          <SideBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <SideBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20}/>} label="History" />
        </div>

        <div style={styles.profileSection}>
          <img src={user.picture} style={styles.avatar} alt="user"/>
          <p style={{color:'#fff'}}>{user.name}</p>
          <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={16}/></button>
        </div>
      </nav>

      <main style={{flex:1, padding: '30px'}}>
        <h2>Dashboard</h2>
      </main>
    </div>
  );
}

const styles = {
  landingWrapper: { minHeight: '100vh', padding: '0 5%' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' },
  logoIcon: { background: '#3b82f6', padding: '8px', borderRadius: '10px' },
  logoText: { fontSize: '1.2rem', fontWeight: 'bold' },
  navBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px' },
  heroSection: { textAlign: 'center', marginTop: '100px' },
  heroTitle: { fontSize: '4rem', fontWeight: '900' },
  heroSubtitle: { color: '#64748b' },
  primaryBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '10px' },
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginGlassCard: { padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid #1e293b' },
  sidebar: { width: '240px', padding: '20px', display: 'flex', flexDirection: 'column' },
  sidebarLogo: { padding: '10px' },
  profileSection: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  logoutBtn: { background: 'none', border: 'none', color: '#ef4444' },
  statBox: { padding: '20px', borderRadius: '15px', display: 'flex', gap: '15px' },
  statIcon: { background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '10px' }
};

export default App;
