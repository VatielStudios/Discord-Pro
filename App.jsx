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
  getAuth, signInWithCustomToken, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

const MOD_EMAIL = import.meta.env.VITE_MOD_EMAIL;
const GLOBAL_SERVER_ID = "global_server";
const GLOBAL_CHAT_ID = "global_chat";

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'discord-clone-pro';

const getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [serverMembers, setServerMembers] = useState([]);
  
  const [activeView, setActiveView] = useState('dms');
  const [activeTab, setActiveTab] = useState('friends'); 
  const [activeServer, setActiveServer] = useState(null);
  const [friendTab, setFriendTab] = useState('add'); 
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) {}
      }
      setAuthLoading(false);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
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
      onSnapshot(getColRef('channels'), s => setChannels(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(getColRef('server_members'), s => setServerMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];
    return () => unsub.forEach(u => u());
  }, [user]);

  useEffect(() => {
    if (!user || users.length === 0) return;
    const profile = users.find(u => u.id === user.uid);
    if (!profile) return;

    const initGlobal = async () => {
      const serverRef = doc(db, 'artifacts', appId, 'public', 'data', 'servers', GLOBAL_SERVER_ID);
      const chanRef = doc(db, 'artifacts', appId, 'public', 'data', 'channels', GLOBAL_CHAT_ID);
      
      await setDoc(serverRef, { name: 'Global Community', isGlobal: true }, { merge: true });
      await setDoc(chanRef, { serverId: GLOBAL_SERVER_ID, name: 'global-chat' }, { merge: true });

      const memberId = `${GLOBAL_SERVER_ID}_${user.uid}`;
      const isOwner = user.email?.toLowerCase() === MOD_EMAIL.toLowerCase();
      
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'server_members', memberId), {
        serverId: GLOBAL_SERVER_ID,
        userId: user.uid,
        role: isOwner ? 'owner' : 'member'
      }, { merge: true });
    };
    initGlobal();
  }, [user, users]);

  if (authLoading) return <div className="h-screen bg-[#1e1f22] flex items-center justify-center text-white font-medium">Loading Discord...</div>;
  
  const profile = users.find(u => u.id === user?.uid);
  if (!user || !profile) return <AuthScreen user={user} db={db} appId={appId} />;

  const myFriends = friends.filter(f => f.user1Id === user.uid || f.user2Id === user.uid);
  const dmChats = chats.filter(c => c.participants.includes(user.uid));

  return (
    <div className="flex h-screen w-full bg-[#313338] text-[#dbdee1] font-sans overflow-hidden select-none">
      
      {/* 1. SERVER RAIL */}
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
            <button onClick={() => { setActiveView('server'); setActiveServer(s.id); setActiveTab(channels.find(c => c.serverId === s.id)?.id || 'friends'); }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 rounded-[24px] group-hover:rounded-[16px] font-bold text-lg
              ${activeServer === s.id ? 'bg-[#5865f2] text-white rounded-[16px]' : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'}`}>
              {s.name[0]}
            </button>
          </div>
        ))}
        <button className="w-12 h-12 flex items-center justify-center bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white rounded-[24px] hover:rounded-[16px] transition-all duration-200">
          <Plus size={24} />
        </button>
      </div>

      {/* 2. CHANNEL LIST / DM LIST */}
      <div className="w-60 bg-[#2b2d31] flex-shrink-0 flex flex-col">
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 shadow-sm shrink-0 font-bold text-white">
          {activeView === 'dms' ? (
             <button className="w-full h-7 bg-[#1e1f22] text-[#949ba4] text-[13px] px-2 rounded-sm text-left font-normal truncate">
               Find or start a conversation
             </button>
          ) : (
            <div className="w-full flex justify-between items-center cursor-pointer">
              <span className="truncate">{servers.find(s => s.id === activeServer)?.name}</span>
              <Settings size={16} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
          {activeView === 'dms' ? (
            <>
              <NavItem icon={<Users size={20}/>} label="Friends" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} />
              <NavItem icon={<Gamepad2 size={20}/>} label="Nitro" active={activeTab === 'nitro'} />
              <NavItem icon={<ShoppingBag size={20}/>} label="Shop" active={activeTab === 'shop'} badge="NEW" />
              <NavItem icon={<Radio size={20}/>} label="Quests" active={activeTab === 'quests'} />
              
              <div className="mt-5 mb-1 px-2 flex justify-between items-center group">
                <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wide">Direct Messages</span>
                <Plus size={14} className="text-[#949ba4] cursor-pointer hover:text-white" />
              </div>
              {dmChats.map(c => {
                const other = users.find(u => u.id === c.participants.find(id => id !== user.uid));
                return other && <DMItem key={c.id} user={other} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />;
              })}
            </>
          ) : (
            <>
              <div className="text-[11px] font-bold text-[#949ba4] uppercase px-2 mb-1 tracking-wide">Text Channels</div>
              {channels.filter(c => c.serverId === activeServer).map(c => (
                <NavItem key={c.id} icon={<Hash size={20}/>} label={c.name} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />
              ))}
            </>
          )}
        </div>

        {/* PROFILE BAR */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 p-1 rounded hover:bg-[#3f4147] cursor-pointer flex-1 min-w-0 transition-colors">
            <Avatar url={profile.avatar} status={profile.status} size="w-8 h-8" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white leading-tight truncate">{profile.username}</span>
              <span className="text-[11px] text-[#b5bac1] leading-tight truncate">Online</span>
            </div>
          </div>
          <div className="flex items-center text-[#b5bac1]">
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Mic size={18}/></button>
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Headphones size={18}/></button>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:bg-[#3f4147] rounded hover:text-red-400 transition-colors"><Settings size={18}/></button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        {/* TOP NAV */}
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            {activeView === 'dms' && activeTab === 'friends' ? (
              <>
                <div className="flex items-center gap-2 font-bold text-white border-r border-[#3f4147] pr-4"><Users size={20} className="text-[#80848e]" /> Friends</div>
                <div className="flex gap-4 text-sm">
                  {['Online', 'All', 'Pending', 'Blocked'].map(t => (
                    <button key={t} onClick={() => setFriendTab(t.toLowerCase())} 
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${friendTab === t.toLowerCase() ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:bg-[#3f4147] hover:text-[#dbdee1]'}`}>
                      {t}
                    </button>
                  ))}
                  <button onClick={() => setFriendTab('add')} className={`px-2 py-0.5 rounded font-medium transition-colors ${friendTab === 'add' ? 'text-[#23a559]' : 'bg-[#248046] text-white'}`}>Add Friend</button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 font-bold text-white">
                <Hash size={24} className="text-[#80848e]" /> 
                {activeView === 'server' ? channels.find(c => c.id === activeTab)?.name : 'Conversation'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-[#b5bac1]">
            <MessageSquare size={20} className="cursor-pointer hover:text-white" />
            <Inbox size={20} className="cursor-pointer hover:text-white" />
            <HelpCircle size={20} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {activeView === 'dms' && activeTab === 'friends' ? (
            <FriendsMain tab={friendTab} profile={profile} users={users} friends={myFriends} db={db} appId={appId} />
          ) : (
            <ChatArea chatId={activeTab} messages={messages} profile={profile} users={users} db={db} appId={appId} />
          )}

          {/* 4. ACTIVE NOW SIDEBAR */}
          {activeView === 'dms' && activeTab === 'friends' && (
            <div className="w-[360px] border-l border-[#3f4147] flex-shrink-0 p-4 hidden lg:block">
              <h2 className="text-white font-black text-xl mb-4">Active Now</h2>
              <div className="bg-[#2b2d31] rounded-lg p-6 text-center">
                <h3 className="text-white font-bold mb-1">It's quiet for now...</h3>
                <p className="text-[#b5bac1] text-xs">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Internal Layout Components ---

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md group transition-colors ${active ? 'bg-[#3f4147] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
      <div className="flex items-center gap-3">
        <span className={active ? 'text-white' : 'text-[#80848e] group-hover:text-[#dbdee1]'}>{icon}</span>
        <span className="font-medium text-[15px]">{label}</span>
      </div>
      {badge && <span className="bg-[#f0b232] text-[10px] text-black font-black px-1 rounded-sm">{badge}</span>}
    </button>
  );
}

function DMItem({ user, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md group transition-colors ${active ? 'bg-[#3f4147] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
      <Avatar url={user.avatar} status={user.status} size="w-8 h-8" />
      <span className="font-medium text-[15px] truncate">{user.username}</span>
    </button>
  );
}

function Avatar({ url, status, size = "w-8 h-8" }) {
  const isOnline = status === 'online';
  return (
    <div className={`relative shrink-0 ${size}`}>
      <div className="w-full h-full bg-[#5865f2] rounded-full flex items-center justify-center overflow-hidden">
        {url ? <img src={url} className="w-full h-full object-cover" alt="" /> : <Users size={16} className="text-white opacity-80" />}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#2b2d31] ${isOnline ? 'bg-[#23a559]' : 'bg-[#80848e]'}`} />
    </div>
  );
}

function FriendsMain({ tab, profile, users, friends, db, appId }) {
  const [input, setInput] = useState('');
  
  if (tab === 'add') {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-white font-bold mb-2 uppercase text-sm">Add Friend</h1>
        <p className="text-[#b5bac1] text-sm mb-4">You can add friends with their Discord username.</p>
        <div className="bg-[#1e1f22] rounded-lg p-3 flex items-center focus-within:ring-1 focus-within:ring-[#00a8fc] transition-all">
          <input 
            value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-[#6d6f78] text-sm" 
            placeholder="You can add friends with their Discord username." 
          />
          <button className="bg-[#5865f2] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!input}>
            Send Friend Request
          </button>
        </div>
        <div className="mt-8">
           <div className="border border-[#3f4147] rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:bg-[#35373c]">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#23a559] rounded-full flex items-center justify-center text-white"><Compass size={18}/></div>
               <span className="text-white font-bold text-sm">Explore Discoverable Servers</span>
             </div>
             <MoreVertical size={16} className="text-[#b5bac1]" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <img src="https://discord.com/assets/f638848483ef3e3f738f.svg" className="w-64 mx-auto mb-4 opacity-50" alt="" />
        <p className="text-[#b5bac1]">No friends to show... yet.</p>
      </div>
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
      senderId: profile.id,
      text: text.trim(),
      timestamp: Date.now(),
      channelId: chatId
    });
    setText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filtered.map((m, i) => {
          const sender = users.find(u => u.id === m.senderId);
          return (
            <div key={m.id} className="flex gap-4 group">
              <Avatar url={sender?.avatar} size="w-10 h-10" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white hover:underline cursor-pointer flex items-center gap-1">
                    {sender?.username}
                    {sender?.isMod && <ShieldCheck size={14} className="text-[#949cf7]" />}
                  </span>
                  <span className="text-[11px] text-[#949ba4] font-medium">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[#dbdee1] break-words">{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="p-4 pt-0">
        <form onSubmit={send} className="bg-[#383a40] rounded-lg px-4 py-2 flex items-center gap-4">
          <Plus size={20} className="bg-[#b5bac1] text-[#313338] rounded-full cursor-pointer hover:bg-white" />
          <input 
            value={text} onChange={e => setText(e.target.value)}
            className="flex-1 bg-transparent text-[#dbdee1] outline-none" 
            placeholder={`Message #${chatId.slice(0,8)}...`} 
          />
        </form>
      </div>
    </div>
  );
}

// --- Auth Screen ---
function AuthScreen({ user, db, appId }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isMod = email.toLowerCase() === MOD_EMAIL.toLowerCase();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), {
          username: username.trim(),
          isMod: isMod,
          avatar: '',
          status: 'online',
          createdAt: Date.now()
        });
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="h-screen bg-[#5865f2] flex items-center justify-center p-4">
      <div className="bg-[#313338] w-full max-w-[480px] p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{isLogin ? 'Welcome back!' : 'Create an account'}</h1>
          <p className="text-[#b5bac1] text-sm mt-2">{isLogin ? "We're so excited to see you again!" : "Join the world's most popular community platform."}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2 block tracking-wider">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1e1f22] text-white p-2.5 rounded outline-none" required />
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2 block tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1e1f22] text-white p-2.5 rounded outline-none" required />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#b5bac1] uppercase mb-2 block tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1e1f22] text-white p-2.5 rounded outline-none" required />
          </div>
          <button className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 rounded transition-colors mt-4">
            {isLogin ? 'Log In' : 'Continue'}
          </button>
        </form>
        <p className="mt-4 text-sm text-[#949ba4]">
          {isLogin ? "Need an account?" : "Already have an account?"} 
          <span onClick={() => setIsLogin(!isLogin)} className="text-[#00a8fc] hover:underline cursor-pointer ml-1">{isLogin ? 'Register' : 'Login'}</span>
        </p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
