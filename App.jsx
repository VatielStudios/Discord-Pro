import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Users, MessageSquare, Hash, Plus, Settings, 
  LogOut, ShieldCheck, Check, X, Search, MoreVertical, 
  Send, Compass, Crown, Star, Inbox, HelpCircle,
  Gamepad2, ShoppingBag, Radio, Mic, Headphones
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc, query, where
} from 'firebase/firestore';

// --- Configuration ---
const MOD_EMAIL = import.meta.env.VITE_MOD_EMAIL;
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'discord-clone-pro';

const getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

// --- Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  
  const [activeView, setActiveView] = useState('dms');
  const [activeTab, setActiveTab] = useState('friends'); 
  const [activeServer, setActiveServer] = useState(null);
  const [friendTab, setFriendTab] = useState('online'); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = [
      onSnapshot(getColRef('users'), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(getColRef('friends'), s => setFriends(s.docs.map(d => ({ docId: d.id, ...d.data() })))),
      onSnapshot(getColRef('chats'), s => setChats(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(getColRef('messages'), s => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(getColRef('servers'), s => setServers(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(getColRef('channels'), s => setChannels(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];
    return () => unsub.forEach(u => u());
  }, [user]);

  if (authLoading) return <div className="h-screen bg-[#1e1f22] flex items-center justify-center text-white font-medium">Loading Discord...</div>;
  
  const profile = users.find(u => u.id === user?.uid);
  if (!user || !profile) return <AuthScreen db={db} appId={appId} />;

  const myFriends = friends.filter(f => f.fromId === user.uid || f.toId === user.uid);
  const dmChats = chats.filter(c => c.participants.includes(user.uid));
  const pendingCount = friends.filter(f => f.toId === user.uid && f.status === 'pending').length;

  return (
    <div className="flex h-screen w-full bg-[#313338] text-[#dbdee1] font-sans overflow-hidden select-none">
      {/* Server Rail */}
      <div className="w-[72px] bg-[#1e1f22] flex-shrink-0 flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar">
        <div className="relative group">
          <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${activeView === 'dms' ? 'h-10 top-1' : 'h-0 top-6 group-hover:h-5'}`}></div>
          <button onClick={() => { setActiveView('dms'); setActiveServer(null); setActiveTab('friends'); }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 rounded-[24px] group-hover:rounded-[16px] 
            ${activeView === 'dms' ? 'bg-[#5865f2] text-white rounded-[16px]' : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'}`}>
            <MessageSquare size={26} fill={activeView === 'dms' ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full mx-auto shrink-0" />
        {servers.map(s => (
          <div key={s.id} className="relative group">
            <div className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${activeServer === s.id ? 'h-10 top-1' : 'h-0 top-6 group-hover:h-5'}`}></div>
            <button onClick={() => { setActiveView('server'); setActiveServer(s.id); setActiveTab(channels.find(c => c.serverId === s.id)?.id || ''); }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 rounded-[24px] group-hover:rounded-[16px] font-bold text-lg
              ${activeServer === s.id ? 'bg-[#5865f2] text-white rounded-[16px]' : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'}`}>
              {s.name[0]}
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex-shrink-0 flex flex-col">
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 shadow-sm shrink-0 font-bold text-white">
           {activeView === 'dms' ? "Direct Messages" : servers.find(s => s.id === activeServer)?.name}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
          {activeView === 'dms' ? (
            <>
              <NavItem icon={<Users size={20}/>} label="Friends" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} badge={pendingCount > 0 ? pendingCount : null} />
              <NavItem icon={<Gamepad2 size={20}/>} label="Nitro" active={activeTab === 'nitro'} />
              <div className="mt-5 mb-1 px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wide">Direct Messages</div>
              {dmChats.map(c => {
                const other = users.find(u => u.id === c.participants.find(id => id !== user.uid));
                return other && <DMItem key={c.id} user={other} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />;
              })}
            </>
          ) : (
            channels.filter(c => c.serverId === activeServer).map(c => (
              <NavItem key={c.id} icon={<Hash size={20}/>} label={c.name} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />
            ))
          )}
        </div>

        <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 shrink-0">
          <Avatar url={profile.avatar} status={profile.status} size="w-8 h-8" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-white truncate">{profile.username}</span>
            <span className="text-[11px] text-[#b5bac1]">Online</span>
          </div>
          <button onClick={() => signOut(auth)} className="p-1.5 hover:bg-[#3f4147] rounded text-[#b5bac1] hover:text-red-400 transition-colors"><Settings size={18}/></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-white">
            {activeTab === 'friends' ? <><Users size={20} className="text-[#80848e] mr-2"/> Friends</> : <><Hash size={24} className="text-[#80848e]"/> {channels.find(c => c.id === activeTab)?.name || 'Chat'}</>}
          </div>
          {activeTab === 'friends' && (
            <div className="flex gap-4 text-sm">
              {['Online', 'All', 'Pending'].map(t => (
                <button key={t} onClick={() => setFriendTab(t.toLowerCase())} 
                  className={`px-2 py-0.5 rounded font-medium ${friendTab === t.toLowerCase() ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:text-[#dbdee1]'}`}>
                  {t}
                </button>
              ))}
              <button onClick={() => setFriendTab('add')} className={`px-2 py-0.5 rounded font-medium ${friendTab === 'add' ? 'text-[#23a559] bg-[#23a559]/10' : 'bg-[#248046] text-white'}`}>Add Friend</button>
            </div>
          )}
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {activeTab === 'friends' ? (
            <FriendsMain tab={friendTab} profile={profile} users={users} friends={myFriends} chats={chats} setActiveTab={setActiveTab} setActiveView={setActiveView} db={db} appId={appId} />
          ) : (
            <ChatArea chatId={activeTab} messages={messages} profile={profile} users={users} db={db} appId={appId} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md group transition-colors ${active ? 'bg-[#3f4147] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
      <div className="flex items-center gap-3">
        <span className={active ? 'text-white' : 'text-[#80848e] group-hover:text-[#dbdee1]'}>{icon}</span>
        <span className="font-medium text-[15px]">{label}</span>
      </div>
      {badge && <span className="bg-[#f23f42] text-[12px] text-white font-bold px-1.5 rounded-full">{badge}</span>}
    </button>
  );
}

function DMItem({ user, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${active ? 'bg-[#3f4147] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
      <Avatar url={user.avatar} status={user.status} size="w-8 h-8" />
      <span className="font-medium text-[15px] truncate">{user.username}</span>
    </button>
  );
}

function Avatar({ url, status, size = "w-8 h-8" }) {
  return (
    <div className={`relative shrink-0 ${size}`}>
      <div className="w-full h-full bg-[#5865f2] rounded-full flex items-center justify-center overflow-hidden">
        {url ? <img src={url} className="w-full h-full object-cover" /> : <Users size={16} className="text-white opacity-80" />}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${status === 'online' ? 'bg-[#23a559]' : 'bg-[#80848e]'}`} />
    </div>
  );
}

function FriendsMain({ tab, profile, users, friends, chats, setActiveTab, setActiveView, db, appId }) {
  const [input, setInput] = useState('');

  const handleAddFriend = async () => {
    const target = users.find(u => u.username.toLowerCase() === input.toLowerCase());
    if (!target || target.id === profile.id) return alert("Invalid User");
    
    // Check if already friends or pending
    const existing = friends.find(f => (f.fromId === target.id && f.toId === profile.id) || (f.fromId === profile.id && f.toId === target.id));
    if (existing) return alert("Friend request already exists or you are already friends.");

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'friends'), {
      fromId: profile.id, toId: target.id, status: 'pending', timestamp: Date.now()
    });
    setInput('');
    alert("Request Sent!");
  };

  const updateStatus = async (friendDocId, newStatus) => {
    const friendRef = doc(db, 'artifacts', appId, 'public', 'data', 'friends', friendDocId);
    if (newStatus === 'accepted') {
      await updateDoc(friendRef, { status: 'accepted' });
      const friendData = friends.find(f => f.docId === friendDocId);
      const otherId = friendData.fromId === profile.id ? friendData.toId : friendData.fromId;
      
      const existingChat = chats.find(c => c.participants.includes(profile.id) && c.participants.includes(otherId));
      if (existingChat) {
        setActiveTab(existingChat.id);
      } else {
        const newChat = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
          participants: [profile.id, otherId], timestamp: Date.now()
        });
        setActiveTab(newChat.id);
      }
      setActiveView('dms');
    } else {
      // This handles both "Reject" and "Unfriend"
      if (confirm("Are you sure you want to remove this friend?")) {
        await deleteDoc(friendRef);
      }
    }
  };

  if (tab === 'add') {
    return (
      <div className="p-6 w-full">
        <h2 className="text-white font-bold mb-4">ADD FRIEND</h2>
        <div className="bg-[#1e1f22] p-3 rounded-lg flex gap-4">
          <input value={input} onChange={e => setInput(e.target.value)} className="bg-transparent flex-1 outline-none text-white" placeholder="Enter a Username" />
          <button onClick={handleAddFriend} className="bg-[#5865f2] px-4 py-1 rounded text-white font-medium">Send Request</button>
        </div>
      </div>
    );
  }

  const list = friends.filter(f => tab === 'pending' ? (f.status === 'pending' && f.toId === profile.id) : f.status === 'accepted');

  return (
    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
      {list.length === 0 ? (
        <div className="flex flex-col items-center mt-20 opacity-40">
           <Users size={64} />
           <p className="mt-4">No friends here yet.</p>
        </div>
      ) : list.map(f => {
        const other = users.find(u => u.id === (f.fromId === profile.id ? f.toId : f.fromId));
        return other && (
          <div key={f.docId} className="flex items-center justify-between p-3 hover:bg-[#3f4147]/50 rounded-lg group">
            <div className="flex items-center gap-3">
              <Avatar url={other.avatar} status={other.status}/>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight">{other.username}</span>
                <span className="text-xs text-[#b5bac1]">{other.status || 'offline'}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {f.status === 'pending' ? (
                <>
                  <button onClick={() => updateStatus(f.docId, 'accepted')} className="p-2 bg-[#23a559] rounded-full text-white hover:bg-[#1a8344] transition-colors"><Check size={18}/></button>
                  <button onClick={() => updateStatus(f.docId, 'rejected')} className="p-2 bg-[#f23f42] rounded-full text-white hover:bg-[#a12d2f] transition-colors"><X size={18}/></button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setActiveTab(chats.find(c => c.participants.includes(other.id))?.id || 'friends'); setActiveView('dms'); }} 
                    className="p-2 bg-[#1e1f22] rounded-full text-[#b5bac1] hover:text-white transition-colors"
                  >
                    <MessageSquare size={18}/>
                  </button>
                  {/* UNFRIEND BUTTON */}
                  <button 
                    onClick={() => updateStatus(f.docId, 'remove')} 
                    className="p-2 bg-[#1e1f22] rounded-full text-[#b5bac1] hover:text-red-400 transition-colors"
                    title="Remove Friend"
                  >
                    <X size={18}/>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatArea({ chatId, messages, profile, users, db, appId }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const filtered = messages.filter(m => m.channelId === chatId || m.chatId === chatId).sort((a,b) => a.timestamp - b.timestamp);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [filtered]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      senderId: profile.id, text: text.trim(), timestamp: Date.now(), chatId: chatId
    });
    setText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.map(m => {
          const sender = users.find(u => u.id === m.senderId);
          return (
            <div key={m.id} className="flex gap-4">
              <Avatar url={sender?.avatar} size="w-10 h-10" />
              <div>
                <div className="font-bold text-white">{sender?.username}</div>
                <div className="text-[#dbdee1]">{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-4"><input value={text} onChange={e => setText(e.target.value)} className="w-full bg-[#383a40] rounded-lg px-4 py-2 text-white outline-none" placeholder="Message..." /></form>
    </div>
  );
}

function AuthScreen({ db, appId }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) { await signInWithEmailAndPassword(auth, email, password); } 
      else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), {
          username: username.trim(), avatar: '', status: 'online', createdAt: Date.now()
        });
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="h-screen bg-[#5865f2] flex items-center justify-center p-4">
      <div className="bg-[#313338] w-full max-w-[480px] p-8 rounded-lg shadow-2xl text-white">
        <h1 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Welcome back!' : 'Create an account'}</h1>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none" required />}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none" required />
          <button className="w-full bg-[#5865f2] hover:bg-[#4752c4] font-bold py-3 rounded mt-2">{isLogin ? 'Log In' : 'Continue'}</button>
        </form>
        <p className="mt-4 text-sm text-[#949ba4] text-center">{isLogin ? "Need an account?" : "Already have an account?"} <span onClick={() => setIsLogin(!isLogin)} className="text-[#00a8fc] cursor-pointer hover:underline">{isLogin ? 'Register' : 'Login'}</span></p>
      </div>
    </div>
  );
}

// --- Entry Point ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
