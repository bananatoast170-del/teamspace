import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Folder, FileCode, FileVideo, Image as ImageIcon, FileText, 
  Upload, MessageSquare, Send, Home, Settings, Trash2, X, 
  Download, ChevronRight, ChevronLeft, Lock, Building, UserCircle, 
  FolderPlus, ArrowRight, ArrowLeft, Plus, Users, Moon, Sun
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc, deleteDoc, updateDoc
} from 'firebase/firestore';

// --- Firebase Setup ---
// ⚠️ שים לב: עליך להחליף את הנתונים כאן בנתונים שלך מ-Firebase! ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyABSRswVl1lHbzHkg5NYxAjpeNyTTn_qHI",
  authDomain: "teamspace-b4071.firebaseapp.com",
  projectId: "teamspace-b4071",
  storageBucket: "teamspace-b4071.firebasestorage.app",
  messagingSenderId: "1027482289330",
  appId: "1:1027482289330:web:4d315ad0e3cdb2000675ab",
  measurementId: "G-42XD6QS8WJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-teamspace-app'; // שם האפליקציה במסד הנתונים

// --- Translations Dictionary ---
const dict = {
  he: {
    loading: "טוען...",
    myWorkspaces: "החברות שלי",
    noWorkspaces: "לא הצטרפת עדיין לאף חברה.",
    welcome: "ברוכים הבאים ל-TeamSpace",
    welcomeDesc: "מרחב העבודה המשותף לצוות שלך. בחר פעולה כדי להתחיל.",
    createWsTitle: "צור חברה חדשה",
    createWsDesc: "הקם מרחב עבודה חדש מאפס, הגדר סיסמה מאובטחת והזמן את הצוות שלך.",
    joinWsTitle: "הצטרף לחברה",
    joinWsDesc: "יש לך כבר חברה? הזן את מזהה החברה והסיסמה כדי להתחבר למרחב הקיים.",
    profile: "הפרופיל שלי",
    displayName: "שם תצוגה",
    save: "שמור",
    cancel: "ביטול",
    wsName: "שם החברה (מזהה ייחודי)",
    password: "סיסמה",
    create: "צור חברה עכשיו",
    join: "היכנס למרחב העבודה",
    files: "קבצים",
    chat: "צ'אט",
    newFolder: "תיקייה חדשה",
    upload: "העלה קובץ",
    emptyFolder: "התיקייה ריקה",
    group: "קבוצה",
    members: "חברים",
    typeMsg: "הקלד הודעה...",
    deleteConfirmTitle: "מחיקת פריט",
    deleteConfirmText: "האם אתה בטוח שברצונך למחוק את",
    delete: "מחק",
    language: "שפה",
    theme: "תצוגה",
    light: "מצב בהיר",
    dark: "מצב חושך",
    admin: "מנהל",
    me: "אני",
    dm: "הודעה פרטית",
    main: "ראשי",
    uploading: "מעלה...",
    creating: "מקים...",
    joining: "מתחבר...",
    errorReq: "יש להזין שם וסיסמה",
    errorExists: "חברה בשם זה כבר קיימת.",
    errorNotFound: "לא נמצאה חברה בשם זה.",
    errorPass: "סיסמה שגויה.",
    errorComm: "אירעה שגיאה בתקשורת עם השרת.",
    changePic: "החלף תמונה"
  },
  en: {
    loading: "Loading...",
    myWorkspaces: "My Workspaces",
    noWorkspaces: "You haven't joined any workspace yet.",
    welcome: "Welcome to TeamSpace",
    welcomeDesc: "The shared workspace for your team. Choose an action to start.",
    createWsTitle: "Create New Workspace",
    createWsDesc: "Set up a new workspace from scratch, set a secure password and invite your team.",
    joinWsTitle: "Join Workspace",
    joinWsDesc: "Already have a workspace? Enter the workspace ID and password to connect.",
    profile: "My Profile",
    displayName: "Display Name",
    save: "Save",
    cancel: "Cancel",
    wsName: "Workspace Name (Unique ID)",
    password: "Password",
    create: "Create Workspace",
    join: "Enter Workspace",
    files: "Files",
    chat: "Chat",
    newFolder: "New Folder",
    upload: "Upload File",
    emptyFolder: "The folder is empty",
    group: "Group",
    members: "Members",
    typeMsg: "Type a message...",
    deleteConfirmTitle: "Delete Item",
    deleteConfirmText: "Are you sure you want to delete",
    delete: "Delete",
    language: "Language",
    theme: "Theme",
    light: "Light Mode",
    dark: "Dark Mode",
    admin: "Admin",
    me: "Me",
    dm: "Direct Message",
    main: "Main",
    uploading: "Uploading...",
    creating: "Creating...",
    joining: "Joining...",
    errorReq: "Please enter name and password",
    errorExists: "Workspace name already exists.",
    errorNotFound: "Workspace not found.",
    errorPass: "Incorrect password.",
    errorComm: "Communication error with server.",
    changePic: "Change Pic"
  }
};

// --- App Context ---
const AppContext = createContext<any>(null);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [profiles, setProfiles] = useState<any>({});
  
  // App preferences (Language and Theme)
  const [lang, setLang] = useState('he');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth); 
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch profiles and personal preferences
  useEffect(() => {
    if (!user) return;
    
    // Listen to personal profile for theme/lang
    const myProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubMyProfile = onSnapshot(myProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lang) setLang(data.lang);
        if (data.theme) setTheme(data.theme);
      }
      setAuthLoading(false);
    });

    // Listen to global profiles (for names/avatars)
    const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'userProfiles');
    const unsubProfiles = onSnapshot(profilesRef, (snapshot) => {
      const p: any = {};
      snapshot.docs.forEach(doc => { p[doc.id] = doc.data(); });
      setProfiles(p);
    });

    return () => { unsubMyProfile(); unsubProfiles(); };
  }, [user]);

  const t = (key: string) => (dict as any)[lang][key] || key;

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`} dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ t, lang, setLang, theme, setTheme }}>
      <div className={`h-screen flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-800'}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
        {!activeWorkspace ? (
          <HomePage user={user} profiles={profiles} onEnterWorkspace={setActiveWorkspace} />
        ) : (
          <WorkspaceView user={user} profiles={profiles} workspace={activeWorkspace} onBack={() => setActiveWorkspace(null)} />
        )}
      </div>
    </AppContext.Provider>
  );
}

// --- Home Page Component ---
function HomePage({ user, profiles, onEnterWorkspace }: any) {
  const { t, theme } = useContext(AppContext);
  const [myWorkspaces, setMyWorkspaces] = useState<string[]>([]);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedWsName, setSelectedWsName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const myProfile = profiles[user?.uid] || { displayName: `User ${user?.uid.substring(0,4)}`, avatar: null };

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().savedWorkspaces) {
        setMyWorkspaces(docSnap.data().savedWorkspaces);
      } else {
        setMyWorkspaces([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className={`w-64 border-e shadow-sm flex flex-col z-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-indigo-50'}`}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Building size={24} />
          </div>
          <h1 className="text-xl font-bold text-indigo-500">TeamSpace</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
            {t('myWorkspaces')}
          </h2>
          {myWorkspaces.length === 0 ? (
            <p className="text-sm text-gray-500 px-2">{t('noWorkspaces')}</p>
          ) : (
            <ul className="space-y-1">
              {myWorkspaces.map(wsName => (
                <li key={wsName}>
                  <button 
                    onClick={() => { setSelectedWsName(wsName); setShowLoginModal(true); }}
                    className={`w-full text-start flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <span className="truncate">{wsName}</span>
                    <ChevronLeft size={16} className="text-gray-400 rtl:inline ltr:hidden" />
                    <ChevronRight size={16} className="text-gray-400 ltr:inline rtl:hidden" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
             {myProfile.avatar ? (
                <img src={myProfile.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-slate-600" />
             ) : (
                <UserCircle size={32} className="text-gray-400" />
             )}
             <span className="text-sm font-semibold truncate text-gray-500 dark:text-slate-300">{myProfile.displayName}</span>
          </div>
          <button onClick={() => setShowProfileModal(true)} className="text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors" title={t('profile')}>
             <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className={`flex-1 overflow-y-auto p-6 md:p-12 relative flex flex-col ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-indigo-50 to-blue-100'}`}>
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-indigo-500 mb-4">{t('welcome')}</h2>
            <p className="text-lg text-indigo-400/80 dark:text-slate-400">{t('welcomeDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => setShowCreateModal(true)}
              className={`p-10 rounded-3xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-6 group border-2 border-transparent hover:border-indigo-400 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <div className="bg-indigo-100 dark:bg-indigo-900 p-8 rounded-full text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform shadow-inner">
                <Plus size={64} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{t('createWsTitle')}</h3>
                <p className="text-gray-500 dark:text-slate-400">{t('createWsDesc')}</p>
              </div>
            </button>

            <button 
              onClick={() => setShowJoinModal(true)}
              className={`p-10 rounded-3xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-6 group border-2 border-transparent hover:border-blue-400 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <div className="bg-blue-100 dark:bg-blue-900 p-8 rounded-full text-blue-600 dark:text-blue-300 group-hover:scale-110 transition-transform shadow-inner">
                <Lock size={64} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{t('joinWsTitle')}</h3>
                <p className="text-gray-500 dark:text-slate-400">{t('joinWsDesc')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && <CreateWorkspaceModal user={user} onClose={() => setShowCreateModal(false)} onSuccess={(ws: any) => { setShowCreateModal(false); onEnterWorkspace(ws); }} />}
      {showJoinModal && <JoinWorkspaceModal user={user} onClose={() => setShowJoinModal(false)} onSuccess={(ws: any) => { setShowJoinModal(false); onEnterWorkspace(ws); }} />}
      {showLoginModal && <WorkspaceLoginModal wsName={selectedWsName} user={user} onClose={() => setShowLoginModal(false)} onSuccess={(ws: any) => { setShowLoginModal(false); onEnterWorkspace(ws); }} />}
      {showProfileModal && <ProfileModal user={user} profiles={profiles} onClose={() => setShowProfileModal(false)} />}
    </div>
  );
}

// --- Modals logic (Profile, Login, Create, Join) ---
function ProfileModal({ user, profiles, onClose }: any) {
  const { t, lang, setLang, theme, setTheme } = useContext(AppContext);
  const existingProfile = profiles[user.uid] || { displayName: '' };
  const [name, setName] = useState(existingProfile.displayName || `User ${user.uid.substring(0,4)}`);
  const [avatar, setAvatar] = useState(existingProfile.avatar || null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) return alert("Max size 200KB");
    const reader = new FileReader();
    reader.onload = (event: any) => setAvatar(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'userProfiles', user.uid);
      await setDoc(publicRef, { displayName: name, avatar: avatar }, { merge: true });
      
      const privateRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(privateRef, { lang, theme }, { merge: true });
      
      onClose();
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-sm p-8 shadow-2xl relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <button onClick={onClose} className="absolute top-4 start-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('profile')}</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
             <div className="relative group cursor-pointer w-24 h-24">
                {avatar ? (
                  <img src={avatar} alt="profile" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900" />
                ) : (
                  <UserCircle size={96} className="text-gray-300 dark:text-slate-600" />
                )}
                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold">
                  {t('changePic')}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
             </div>
          </div>
          
          <div className="text-start">
            <label className="block text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">{t('displayName')}</label>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-start">
              <label className="block text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">{t('language')}</label>
              <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                 <button type="button" onClick={()=>setLang('he')} className={`flex-1 flex justify-center py-1.5 rounded-md text-sm font-bold ${lang==='he' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-slate-400'}`}>עברית</button>
                 <button type="button" onClick={()=>setLang('en')} className={`flex-1 flex justify-center py-1.5 rounded-md text-sm font-bold ${lang==='en' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-slate-400'}`}>English</button>
              </div>
            </div>
            <div className="text-start">
              <label className="block text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">{t('theme')}</label>
              <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                 <button type="button" onClick={()=>setTheme('light')} className={`flex-1 flex justify-center items-center py-1.5 rounded-md ${theme==='light' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-500 dark:text-slate-400'}`}><Sun size={16}/></button>
                 <button type="button" onClick={()=>setTheme('dark')} className={`flex-1 flex justify-center items-center py-1.5 rounded-md ${theme==='dark' ? 'bg-slate-600 shadow-sm text-indigo-300' : 'text-gray-500 dark:text-slate-400'}`}><Moon size={16}/></button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-4">
             {loading ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateWorkspaceModal({ user, onClose, onSuccess }: any) {
  const { t, theme } = useContext(AppContext);
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(!name.trim() || !pass.trim()) return setErr(t('errorReq'));
    setLoad(true); setErr('');
    try {
      const wsId = name.trim();
      const wsRef = doc(db, 'artifacts', appId, 'public', 'data', 'workspaces', wsId);
      if ((await getDoc(wsRef)).exists()) return setErr(t('errorExists')), setLoad(false);
      
      const newWs = { name: wsId, displayName: wsId, password: pass, creatorId: user.uid, createdAt: Date.now() };
      await setDoc(wsRef, newWs);
      
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      const pSnap = await getDoc(pRef);
      const saved = pSnap.exists() && pSnap.data().savedWorkspaces ? pSnap.data().savedWorkspaces : [];
      if(!saved.includes(wsId)) await setDoc(pRef, {savedWorkspaces:[...saved, wsId]}, {merge:true});
      
      onSuccess({id: wsId, ...newWs});
    } catch(e) { setErr(t('errorComm')); setLoad(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-md p-8 shadow-2xl relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <button onClick={onClose} className="absolute top-4 start-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={24}/></button>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('createWsTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={t('wsName')} className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={t('password')} className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          {err && <p className="text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{err}</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className={`w-1/3 font-bold rounded-xl ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{t('cancel')}</button>
            <button type="submit" disabled={load} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl">{load ? t('creating') : t('create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinWorkspaceModal({ user, onClose, onSuccess }: any) {
  const { t, theme } = useContext(AppContext);
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(!name.trim() || !pass.trim()) return setErr(t('errorReq'));
    setLoad(true); setErr('');
    try {
      const wsId = name.trim();
      const wsSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'workspaces', wsId));
      if (!wsSnap.exists()) return setErr(t('errorNotFound')), setLoad(false);
      if (wsSnap.data().password !== pass) return setErr(t('errorPass')), setLoad(false);
      
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      const pSnap = await getDoc(pRef);
      const saved = pSnap.exists() && pSnap.data().savedWorkspaces ? pSnap.data().savedWorkspaces : [];
      if(!saved.includes(wsId)) await setDoc(pRef, {savedWorkspaces:[...saved, wsId]}, {merge:true});
      
      onSuccess({id: wsSnap.id, ...wsSnap.data()});
    } catch(e) { setErr(t('errorComm')); setLoad(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-md p-8 shadow-2xl relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <button onClick={onClose} className="absolute top-4 start-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={24}/></button>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('joinWsTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={t('wsName')} className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={t('password')} className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 tracking-widest ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          {err && <p className="text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{err}</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className={`w-1/3 font-bold rounded-xl ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{t('cancel')}</button>
            <button type="submit" disabled={load} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">{load ? t('joining') : t('join')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspaceLoginModal({ wsName, user, onClose, onSuccess }: any) {
  const { t, theme } = useContext(AppContext);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoad(true); setErr('');
    try {
      const wsSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'workspaces', wsName));
      if (!wsSnap.exists()) return setErr(t('errorNotFound')), setLoad(false);
      if (wsSnap.data().password !== pass) return setErr(t('errorPass')), setLoad(false);
      onSuccess({id: wsSnap.id, ...wsSnap.data()});
    } catch(e) { setErr(t('errorComm')); setLoad(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-sm p-6 shadow-2xl relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <button onClick={onClose} className="absolute top-4 start-4 p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
        <h3 className="text-xl font-bold mb-4 text-center">{t('joinWsTitle')} {wsName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-center">
          <input type="password" autoFocus value={pass} onChange={e=>setPass(e.target.value)} placeholder={t('password')} className={`w-full px-4 py-2 border rounded-xl tracking-widest text-center outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
          {err && <p className="text-red-500 font-bold">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`w-1/3 font-bold rounded-xl py-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{t('cancel')}</button>
            <button type="submit" disabled={load} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2">{load ? t('joining') : t('join')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Workspace Dashboard ---
function WorkspaceView({ user, profiles, workspace, onBack }: any) {
  const { t, theme } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('files');
  const [wsData, setWsData] = useState(workspace);

  useEffect(() => {
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_members`, user.uid);
    setDoc(memberRef, { uid: user.uid, lastActive: Date.now() }, { merge: true });

    const wsRef = doc(db, 'artifacts', appId, 'public', 'data', 'workspaces', workspace.id);
    const unsubscribe = onSnapshot(wsRef, (docSnap) => {
      if (!docSnap.exists()) onBack(); 
      else setWsData({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsubscribe();
  }, [workspace.id, user, onBack]);

  const handleSystemNotification = async (text: string) => {
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', `ws_${wsData.id}_chat`);
    await addDoc(chatRef, { text, senderId: user.uid, isSystem: true, createdAt: Date.now() });
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <header className={`shadow-sm border-b px-4 md:px-6 py-3 flex justify-between items-center z-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}><Home size={22} /></button>
          <div className={`flex items-center gap-3 border-s ps-4 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-700 dark:text-indigo-400"><Building size={20} /></div>
            <div><h1 className="text-lg md:text-xl font-bold">{wsData.displayName || wsData.name}</h1></div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Tabs */}
        <div className={`md:hidden flex flex-col border-e w-16 items-center py-4 gap-6 z-20 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
           <button onClick={() => setActiveTab('files')} className={`p-3 rounded-xl transition-colors ${activeTab === 'files' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><Folder size={24} /></button>
           <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition-colors ${activeTab === 'chat' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><MessageSquare size={24} /></button>
        </div>

        <div className={`flex-1 flex-col ${activeTab === 'files' ? 'flex' : 'hidden md:flex'} h-full relative`}>
          <FileExplorer user={user} workspace={wsData} profiles={profiles} onUploadSuccess={handleSystemNotification} />
        </div>

        <div className={`w-full md:w-[400px] border-s flex-col ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'} h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <ChatArea user={user} workspace={wsData} profiles={profiles} />
        </div>
      </div>
    </div>
  );
}

// --- File Explorer Component ---
function FileExplorer({ user, workspace, profiles, onUploadSuccess }: any) {
  const { t, theme } = useContext(AppContext);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  const [currentPath, setCurrentPath] = useState([{id: 'root', name: t('main')}]);
  const currentFolderId = currentPath[currentPath.length - 1].id;
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const fileInputRef = useRef<any>(null);

  useEffect(() => {
    setCurrentPath(prev => [{id: 'root', name: t('main')}, ...prev.slice(1)]);
  }, [t]);

  useEffect(() => {
    if (!user) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_files_real`);
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [workspace.id, user]);

  const handleDelete = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_files_real`, itemId));
      setItemToDelete(null); 
    } catch (e) { console.error(e); }
  };

  const handleFileSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) { alert("Max size 800KB"); e.target.value=null; return; }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_files_real`), {
          name: file.name,
          type: file.type || 'unknown',
          size: (file.size / 1024).toFixed(1) + ' KB',
          data: event.target.result,
          uploadedBy: user.uid,
          parentId: currentFolderId,
          isFolder: false,
          createdAt: Date.now()
        });
        onUploadSuccess(`📁 ${file.name}`);
      } catch (err) { alert("Error uploading"); } 
      finally { setIsUploading(false); e.target.value = null; }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateFolder = async (folderName: string) => {
    if(!folderName.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_files_real`), {
        name: folderName,
        isFolder: true,
        parentId: currentFolderId,
        uploadedBy: user.uid,
        createdAt: Date.now()
      });
      setShowCreateFolderModal(false);
    } catch(e) { alert("Error"); }
  };

  const displayedItems = items
    .filter(item => (item.parentId || 'root') === currentFolderId)
    .sort((a, b) => {
       if(a.isFolder === b.isFolder) return b.createdAt - a.createdAt;
       return a.isFolder ? -1 : 1; 
    });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="text-purple-500" size={40} />;
    if (type.includes('video')) return <FileVideo className="text-red-500" size={40} />;
    if (type.includes('code') || type.includes('javascript') || type.includes('json')) return <FileCode className="text-indigo-500" size={40} />;
    return <FileText className="text-gray-500" size={40} />;
  };

  return (
    <div className={`flex-1 flex flex-col h-full p-6 overflow-y-auto relative ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      
      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className={`flex flex-wrap items-center text-lg font-bold gap-2 px-4 py-2 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-100 text-gray-700'}`}>
          <Folder className="text-indigo-400" size={20} />
          {currentPath.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <span className="text-gray-400 mt-1">/</span>}
              <button 
                onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                className={`hover:text-indigo-500 transition-colors ${idx === currentPath.length-1 ? (theme==='dark'?'text-indigo-400':'text-indigo-800') : 'text-gray-500'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowCreateFolderModal(true)}
            className={`flex-1 md:flex-none border px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-indigo-900 text-indigo-300 hover:bg-slate-700' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
          >
            <FolderPlus size={18} />
            <span className="hidden sm:inline">{t('newFolder')}</span>
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button 
            onClick={() => fileInputRef.current.click()} disabled={isUploading}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Upload size={18} />}
            <span className="hidden sm:inline">{isUploading ? t('uploading') : t('upload')}</span>
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center items-center flex-1"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
      ) : displayedItems.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-3xl p-10 mt-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-white border-gray-300 text-gray-400'}`}>
          <Folder size={64} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('emptyFolder')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mt-2">
          {displayedItems.map(item => (
            <div key={item.id} className={`p-4 rounded-xl shadow-sm border transition-all group flex flex-col relative ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-750' : 'bg-white border-gray-100 hover:shadow-md hover:border-indigo-200'}`}>
              <div onClick={() => item.isFolder ? setCurrentPath([...currentPath, {id: item.id, name: item.name}]) : null} className={`flex justify-center mb-3 relative ${item.isFolder ? 'cursor-pointer' : ''}`}>
                {item.isFolder ? (
                  <Folder className="text-indigo-400" size={56} fill="currentColor" fillOpacity={0.2} />
                ) : item.type?.includes('image') ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border shadow-sm dark:border-slate-600">
                    <img src={item.data} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : getFileIcon(item.type)}
              </div>
              
              <h3 className="text-sm font-semibold text-center truncate px-1">{item.name}</h3>
              {!item.isFolder && <p className="text-[10px] text-gray-400 text-center mt-1 mb-2">{item.size}</p>}
              
              <div className="mt-auto flex gap-2 justify-center absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.isFolder && (
                  <a href={item.data} download={item.name} className={`p-1.5 shadow rounded-lg ${theme==='dark'?'bg-slate-700 text-indigo-300 hover:bg-slate-600':'bg-white text-indigo-600 hover:bg-indigo-50'}`}><Download size={14} /></a>
                )}
                {(item.uploadedBy === user.uid || workspace.creatorId === user.uid) && (
                  <button onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} className={`p-1.5 shadow rounded-lg ${theme==='dark'?'bg-slate-700 text-red-400 hover:bg-slate-600':'bg-white text-red-500 hover:bg-red-50'}`}><Trash2 size={14} /></button>
                )}
              </div>

              {profiles[item.uploadedBy] && (
                <div className="absolute top-2 start-2" title={profiles[item.uploadedBy].displayName}>
                   {profiles[item.uploadedBy].avatar ? 
                     <img src={profiles[item.uploadedBy].avatar} className="w-5 h-5 rounded-full object-cover shadow-sm border border-white dark:border-slate-600" /> : 
                     <UserCircle className="w-5 h-5 text-gray-400 bg-white dark:bg-slate-800 rounded-full" />
                   }
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals for Explorer */}
      {showCreateFolderModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className={`p-6 rounded-2xl w-full max-w-sm shadow-xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white'}`}>
              <h3 className="text-lg font-bold mb-4">{t('newFolder')}</h3>
              <form onSubmit={(e: any) => { e.preventDefault(); handleCreateFolder(e.target.folder.value); }}>
                 <input name="folder" autoFocus placeholder={t('newFolder')} required className={`w-full border px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 ${theme==='dark'?'bg-slate-700 border-slate-600':'bg-white'}`} />
                 <div className="flex gap-2">
                    <button type="button" onClick={()=>setShowCreateFolderModal(false)} className={`flex-1 py-2 rounded-xl font-medium ${theme==='dark'?'bg-slate-700':'bg-gray-100'}`}>{t('cancel')}</button>
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-medium">{t('create')}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {itemToDelete && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className={`p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white'}`}>
              <div className="flex justify-center mb-4"><div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full text-red-500"><Trash2 size={40} /></div></div>
              <h3 className="text-xl font-bold mb-2">{t('deleteConfirmTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t('deleteConfirmText')} "{itemToDelete.name}"?</p>
              <div className="flex gap-3">
                 <button onClick={() => setItemToDelete(null)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${theme==='dark'?'bg-slate-700 hover:bg-slate-600 text-slate-300':'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>{t('cancel')}</button>
                 <button onClick={() => handleDelete(itemToDelete.id)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">{t('delete')}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Chat Component ---
function ChatArea({ user, workspace, profiles }: any) {
  const { t, theme, lang } = useContext(AppContext);
  const [viewMode, setViewMode] = useState('group'); 
  const [dmUser, setDmUser] = useState<any>(null); 
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<any>(null);
  const [membersList, setMembersList] = useState<string[]>([]);

  useEffect(() => {
    const memRef = collection(db, 'artifacts', appId, 'public', 'data', `ws_${workspace.id}_members`);
    const unsub = onSnapshot(memRef, (snap) => setMembersList(snap.docs.map(doc => doc.data().uid)));
    return () => unsub();
  }, [workspace.id]);

  useEffect(() => {
    let collectionName = `ws_${workspace.id}_chat`; 
    if (viewMode === 'dm' && dmUser) {
       const sorted = [user.uid, dmUser].sort();
       collectionName = `ws_${workspace.id}_dm_${sorted[0]}_${sorted[1]}`;
    } else if (viewMode === 'members') return;

    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      const fetchedMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedMsgs.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(fetchedMsgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [workspace.id, user.uid, viewMode, dmUser]);

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const textToSend = newMessage;
    setNewMessage(''); 

    let collectionName = `ws_${workspace.id}_chat`;
    if (viewMode === 'dm' && dmUser) {
       const sorted = [user.uid, dmUser].sort();
       collectionName = `ws_${workspace.id}_dm_${sorted[0]}_${sorted[1]}`;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), {
        text: textToSend, senderId: user.uid, isSystem: false, createdAt: Date.now()
      });
    } catch (error) { setNewMessage(textToSend); }
  };

  const getProfileName = (uid: string) => profiles[uid]?.displayName || `User ${uid.substring(0,4)}`;
  const renderProfile = (uid: string) => profiles[uid]?.avatar ? <img src={profiles[uid].avatar} className="w-8 h-8 rounded-full object-cover shadow-sm" /> : <UserCircle size={32} className="text-gray-400" />;

  return (
    <div className={`flex flex-col h-full relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Tabs */}
      <div className={`p-4 border-b flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
         {viewMode === 'dm' ? (
            <div className="flex items-center gap-3">
               <button onClick={()=>setViewMode('members')} className={`p-1 rounded ${theme==='dark'?'text-slate-400 hover:bg-slate-700':'text-gray-600 hover:bg-gray-200'}`}>{lang === 'he' ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}</button>
               <div className="flex items-center gap-2">
                 {renderProfile(dmUser)}
                 <div>
                    <h3 className="font-bold text-sm">{getProfileName(dmUser)}</h3>
                    <p className="text-[10px] text-indigo-400">{t('dm')}</p>
                 </div>
               </div>
            </div>
         ) : (
            <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
               <button onClick={() => setViewMode('group')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${viewMode==='group' ? (theme==='dark'?'bg-slate-600 text-indigo-300':'bg-white text-indigo-700 shadow-sm') : 'text-gray-500'}`}>
                 <MessageSquare size={16} /> {t('group')}
               </button>
               <button onClick={() => setViewMode('members')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${viewMode==='members' ? (theme==='dark'?'bg-slate-600 text-indigo-300':'bg-white text-indigo-700 shadow-sm') : 'text-gray-500'}`}>
                 <Users size={16} /> {t('members')} ({membersList.length})
               </button>
            </div>
         )}
      </div>

      {/* Main Chat/Members Area */}
      <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-50/50'}`}>
        {viewMode === 'members' ? (
           <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">{t('members')}</h3>
              {membersList.map(uid => (
                 <div key={uid} onClick={() => { if(uid !== user.uid) { setDmUser(uid); setViewMode('dm'); } }} 
                      className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} ${uid !== user.uid ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : 'opacity-70'}`}>
                    {renderProfile(uid)}
                    <div className="flex-1">
                       <span className="font-bold text-sm block">{getProfileName(uid)}</span>
                       {uid === workspace.creatorId && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-1.5 rounded font-bold">{t('admin')}</span>}
                       {uid === user.uid && <span className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1.5 rounded mx-1">{t('me')}</span>}
                    </div>
                    {uid !== user.uid && <MessageSquare size={16} className="text-indigo-400 opacity-50" />}
                 </div>
              ))}
           </div>
        ) : (
           <div className="space-y-4">
              {messages.length === 0 ? (
                <div className={`text-center mt-10 text-sm p-6 rounded-2xl border border-dashed ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-400'}`}>
                  👋
                </div>
              ) : (
                messages.map((msg, idx) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <div className={`text-xs px-4 py-1.5 rounded-full font-medium shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                           <span className="font-bold">{getProfileName(msg.senderId)}</span> {msg.text}
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === user.uid;
                  const showNameAndPic = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId || messages[idx-1].isSystem);
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`flex max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                        {!isMe ? ( <div className="w-8 shrink-0">{showNameAndPic && renderProfile(msg.senderId)}</div> ) : <div className="w-2 shrink-0"></div>}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {showNameAndPic && <span className="text-[10px] text-gray-400 mb-1 mx-1 font-bold">{getProfileName(msg.senderId)}</span>}
                          <div className={`px-4 py-2.5 shadow-sm text-sm break-words leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-be-sm' : (theme === 'dark' ? 'bg-slate-700 text-slate-200 rounded-2xl rounded-bs-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bs-sm')}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 mx-1">{new Date(msg.createdAt).toLocaleTimeString(lang==='he'?'he-IL':'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
           </div>
        )}
      </div>

      {viewMode !== 'members' && (
         <div className={`p-3 border-t ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'}`}>
           <form onSubmit={handleSendMessage} className="flex gap-2">
             <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('typeMsg')} className={`flex-1 border-transparent focus:ring-2 focus:ring-indigo-500 rounded-full px-4 py-2 text-sm outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'}`} />
             <button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
               <Send size={18} className={`mt-0.5 ${lang==='he'?'mr-1 rotate-180':'ml-1'}`} />
             </button>
           </form>
         </div>
      )}
    </div>
  );
}