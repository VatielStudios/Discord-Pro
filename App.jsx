import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Users, MessageSquare, Hash, Plus, Settings, 
  Check, X, Compass, Inbox, HelpCircle, ChevronRight,
  Gamepad2, ShoppingBag, Radio, Mic, Headphones,
  Smile, Pencil, Reply, Forward, Copy, Pin, LayoutGrid, 
  BellOff, Link, Volume2, Trash2, Flag, Bookmark, Fingerprint,
  UserCircle, Calendar, ShieldCheck, MoreHorizontal, UserPlus
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

// --- Configuration ---
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

// --- Helpers ---
const getAvatarColor = (username) => {
  const colors = ['#ff5c5c', '#5865f2', '#23a559', '#f23f42', '#fee75c', '#eb459e', '#a44af6'];
  if (!username) return colors[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// --- Components ---

function Avatar({ user, status, size = "w-8 h-8", onClick }) {
  const bgColor = useMemo(() => getAvatarColor(user?.username), [user?.username]);
  
  return (
    <div className={`relative shrink-0 ${size} cursor-pointer group`} onClick={onClick}>
      <div 
        style={{ backgroundColor: user?.avatar ? 'transparent' : bgColor }}
        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
      >
        {user?.avatar ? (
          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
        ) : (
          <span className="text-white font-bold select-none" style={{ fontSize: 'calc(40%)' }}>
            {user?.username?.substring(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${status === 'online' ? 'bg-[#23a559]' : 'bg-[#80848e]'}`} />
    </div>
  );
}

function UserProfileCard({ user, onClose, isMe, onOpenSettings }) {
  const bgColor = getAvatarColor(user.username);
  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[340px] bg-[#111214] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div style={{ backgroundColor: bgColor }} className="h-16 w-full relative" />
        
        <div className="px-4 pb-4 relative">
          {/* Avatar Positioned on Banner */}
          <div className="absolute -top-10 left-4">
            <div className="p-1.5 bg-[#111214] rounded-full">
              <Avatar user={user} size="w-20 h-20" />
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{user.displayName || user.username}</h2>
              <p className="text-[#dbdee1] text-sm">{user.username}</p>
            </div>

            <div className="h-[1px] bg-[#2b2d31] w-full" />

            <div>
              <p className="text-[11px] font-bold text-[#dbdee1] uppercase mb-1">About Me</p>
              <p className="text-sm text-[#dbdee1] whitespace-pre-wrap">
                {user.bio || (isMe ? "Click 'Edit Profile' to add a bio!" : "This user hasn't added a bio yet.")}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-[#dbdee1] uppercase mb-1">Member Since</p>
              <div className="flex items-center gap-2 text-sm text-[#dbdee1]">
                <Calendar size={14} /> {memberSince}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {isMe ? (
                <button 
                  onClick={() => { onOpenSettings(); onClose(); }}
                  className="flex-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white text-sm font-medium py-2 rounded transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Message
                  </button>
                  <button className="p-2 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded transition-colors">
                    <UserPlus size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ profile, onClose, db, appId }) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', profile.id), {
      displayName,
      bio
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#313338] flex">
      <div className="w-60 bg-[#2b2d31] flex flex-col items-end pt-14 px-2">
        <div className="w-48">
          <p className="text-[11px] font-bold text-[#949ba4] uppercase px-2 mb-1.5">User Settings</p>
          <button className="w-full text-left px-2 py-1.5 rounded bg-[#3f4147] text-white text-sm font-medium">My Account</button>
          <button className="w-full text-left px-2 py-1.5 rounded text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1] text-sm mt-0.5">Profiles</button>
        </div>
      </div>

      <div className="flex-1 bg-[#313338] pt-14 pb-20 px-10 overflow-y-auto">
        <div className="max-w-[700px]">
          <h2 className="text-white text-xl font-bold mb-5">Profiles</h2>
          
          <div className="space-y-6">
            <div className="bg-[#2b2d31] p-4 rounded-lg">
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">Display Name</label>
              <input 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded outline-none border border-transparent focus:border-[#00a8fc]"
              />
            </div>

            <div className="bg-[#2b2d31] p-4 rounded-lg">
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-2">About Me</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="You can use markdown and links if you like."
                className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded outline-none border border-transparent focus:border-[#00a8fc] resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#232428] p-4 flex justify-center">
        <div className="w-full max-w-[700px] flex justify-between items-center">
          <p className="text-white text-sm">Careful — you have unsaved changes!</p>
          <div className="flex gap-4">
            <button onClick={onClose} className="text-white text-sm hover:underline">Reset</button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-[#23a559] hover:bg-[#1a8344] text-white px-6 py-2 rounded font-medium text-sm transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <button onClick={onClose} className="absolute top-14 right-14 w-9 h-9 border-2 border-[#b5bac1] rounded-full flex items-center justify-center text-[#b5bac1] hover:text-white hover:border-white transition-all">
        <X size={20} />
      </button>
    </div>
  );
}

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

  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

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

  if (authLoading) return <div className="h-screen bg-[#1e1f22] flex items-center justify-center text-white font-medium">Loading...</div>;
  
  const profile = users.find(u => u.id === user?.uid);
  if (!user || !profile) return <AuthScreen db={db} appId={appId} />;

  const myFriends = friends.filter(f => f.fromId === user.uid || f.toId === user.uid);
  const dmChats = chats.filter(c => c.participants.includes(user.uid));
  const pendingCount = friends.filter(f => f.toId === user.uid && f.status === 'pending').length;

  return (
    <div className="flex h-screen w-full bg-[#313338] text-[#dbdee1] font-sans overflow-hidden select-none">
      {/* Profile Overlays */}
      {selectedProfileId && (
        <UserProfileCard 
          user={users.find(u => u.id === selectedProfileId)} 
          isMe={selectedProfileId === user.uid}
          onClose={() => setSelectedProfileId(null)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {showSettings && <SettingsModal profile={profile} onClose={() => setShowSettings(false)} db={db} appId={appId} />}

      {/* 1. Server Rail */}
      <div className="w-[72px] bg-[#1e1f22] flex-shrink-0 flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar relative z-20">
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

      {/* 2. Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex-shrink-0 flex flex-col relative z-10">
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 shadow-sm shrink-0">
          {activeView === 'dms' ? (
             <button className="w-full h-7 bg-[#1e1f22] text-[#949ba4] text-[13px] px-2 rounded-sm text-left font-normal truncate">Find or start a conversation</button>
          ) : (
             <span className="font-bold text-white truncate">{servers.find(s => s.id === activeServer)?.name}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
          {activeView === 'dms' ? (
            <>
              <NavItem icon={<Users size={20}/>} label="Friends" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} badge={pendingCount > 0 ? pendingCount : null} />
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
            channels.filter(c => c.serverId === activeServer).map(c => (
              <NavItem key={c.id} icon={<Hash size={20}/>} label={c.name} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />
            ))
          )}
        </div>

        {/* Profile Section */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 shrink-0">
          <div onClick={() => setSelectedProfileId(profile.id)} className="flex items-center gap-2 p-1 rounded hover:bg-[#3f4147] cursor-pointer flex-1 min-w-0">
            <Avatar user={profile} status={profile.status} size="w-8 h-8" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white leading-tight truncate">{profile.displayName || profile.username}</span>
              <span className="text-[11px] text-[#b5bac1] leading-tight truncate">Online</span>
            </div>
          </div>
          <div className="flex items-center text-[#b5bac1]">
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Mic size={18}/></button>
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Headphones size={18}/></button>
            <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-[#3f4147] rounded hover:text-white transition-colors"><Settings size={18}/></button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative z-0">
        <div className="h-12 border-b border-[#1e1f22]/50 flex items-center px-4 justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-white border-r border-[#3f4147] pr-4">
              <Users size={20} className="text-[#80848e]" /> Friends
            </div>
            {activeTab === 'friends' && (
              <div className="flex gap-4 text-sm">
                {['Online', 'All', 'Pending'].map(t => (
                  <button key={t} onClick={() => setFriendTab(t.toLowerCase())} 
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${friendTab === t.toLowerCase() ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:bg-[#3f4147] hover:text-[#dbdee1]'}`}>
                    {t}
                  </button>
                ))}
                <button onClick={() => setFriendTab('add')} className={`px-2 py-0.5 rounded font-medium transition-colors ${friendTab === 'add' ? 'text-[#23a559] bg-[#23a559]/10' : 'bg-[#248046] text-white hover:bg-[#1a6334]'}`}>Add Friend</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-[#b5bac1]">
             <MessageSquare size={20} className="cursor-pointer hover:text-white" />
             <div className="w-[1px] h-6 bg-[#3f4147]" />
             <Inbox size={20} className="cursor-pointer hover:text-white" />
             <HelpCircle size={20} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab === 'friends' ? (
              <FriendsMain tab={friendTab} profile={profile} users={users} friends={myFriends} chats={chats} setActiveTab={setActiveTab} setActiveView={setActiveView} db={db} appId={appId} onOpenProfile={setSelectedProfileId} />
            ) : (
              <ChatArea chatId={activeTab} messages={messages} profile={profile} users={users} db={db} appId={appId} onOpenProfile={setSelectedProfileId} />
            )}
          </div>

          {activeTab === 'friends' && (
            <div className="w-[340px] border-l border-[#3f4147] flex-shrink-0 p-4 hidden xl:block bg-[#313338]">
              <h2 className="text-white font-black text-xl mb-4 tracking-wide">Active Now</h2>
              <div className="bg-[#2b2d31] rounded-lg p-6 text-center">
                <h3 className="text-white font-bold mb-1">It's quiet for now...</h3>
                <p className="text-[#b5bac1] text-xs leading-relaxed">When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!</p>
              </div>
            </div>
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
      {badge && (
        <span className={`text-[12px] text-white font-bold px-1.5 rounded-full ${badge === 'NEW' ? 'bg-[#5865f2]' : 'bg-[#f23f42]'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function DMItem({ user, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${active ? 'bg-[#3f4147] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>
      <Avatar user={user} status={user.status} size="w-8 h-8" />
      <span className="font-medium text-[15px] truncate">{user.displayName || user.username}</span>
    </button>
  );
}

function ContextMenu({ x, y, menuType, message, onClose, actions }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const safeX = Math.min(x, window.innerWidth - 220);
  const safeY = Math.min(y, window.innerHeight - 380);

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); onClose(); }}
      className={`flex items-center justify-between px-2 py-1.5 mx-2 rounded cursor-pointer text-sm font-medium transition-colors ${danger ? 'text-[#f23f42] hover:bg-[#f23f42] hover:text-white' : 'text-[#dbdee1] hover:bg-[#5865f2] hover:text-white'}`}
    >
      <span>{label}</span>
      {Icon && <Icon size={16} />}
    </div>
  );

  return (
    <div ref={menuRef} style={{ top: safeY, left: safeX }} className="fixed w-52 bg-[#111214] border border-[#1e1f22] rounded shadow-xl py-2 z-50 select-none">
      <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-[#2b2d31] pb-2 text-lg">
         <span>❤️</span><span>💯</span><span>👍</span><span>👎</span>
      </div>
      <Item label="Add Reaction" icon={ChevronRight} onClick={() => {}} />
      <div className="my-1 border-t border-[#2b2d31]" />
      {menuType === 'own' && <Item label="Edit Message" icon={Pencil} onClick={() => actions.edit(message)} />}
      <Item label="Reply" icon={Reply} onClick={() => {}} />
      <Item label="Forward" icon={Forward} onClick={() => {}} />
      <div className="my-1 border-t border-[#2b2d31]" />
      <Item label="Copy Text" icon={Copy} onClick={() => actions.copy(message.text)} />
      <Item label="Pin Message" icon={Pin} onClick={() => {}} />
      {menuType === 'other' && <Item label="Bookmark Message" icon={Bookmark} onClick={() => {}} />}
      <div className="my-1 border-t border-[#2b2d31]" />
      <Item label="Speak Message" icon={Volume2} onClick={() => {}} />
      <div className="my-1 border-t border-[#2b2d31]" />
      {menuType === 'own' ? (
        <Item label="Delete Message" icon={Trash2} danger onClick={() => actions.delete(message.id)} />
      ) : (
        <Item label="Report Message" icon={Flag} danger onClick={() => {}} />
      )}
    </div>
  );
}

function FriendsMain({ tab, profile, users, friends, chats, setActiveTab, setActiveView, db, appId, onOpenProfile }) {
  const [input, setInput] = useState('');
  const handleAddFriend = async () => {
    const target = users.find(u => u.username.toLowerCase() === input.toLowerCase());
    if (!target || target.id === profile.id) return alert("Invalid User");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'friends'), {
      fromId: profile.id, toId: target.id, status: 'pending', timestamp: Date.now()
    });
    setInput('');
  };

  const list = friends.filter(f => tab === 'pending' ? (f.status === 'pending' && f.toId === profile.id) : f.status === 'accepted');

  return (
    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
      {tab === 'add' ? (
        <div className="max-w-2xl">
          <h1 className="text-white font-bold mb-2 uppercase text-sm">Add Friend</h1>
          <p className="text-[#b5bac1] text-xs mb-4">You can add friends with their Discord username.</p>
          <div className="relative">
            <input value={input} onChange={e => setInput(e.target.value)} className="w-full bg-[#1e1f22] p-3 rounded-lg text-white outline-none focus:border-[#00a8fc] border border-transparent" placeholder="Enter a Username#0000" />
            <button onClick={handleAddFriend} className="absolute right-2 top-2 bg-[#5865f2] text-white px-4 py-1.5 rounded text-sm font-medium">Send Friend Request</button>
          </div>
        </div>
      ) : list.map(f => {
        const other = users.find(u => u.id === (f.fromId === profile.id ? f.toId : f.fromId));
        return other && (
          <div key={f.docId} className="flex items-center justify-between p-3 hover:bg-[#3f4147]/50 rounded-lg group border-t border-[#3f4147] first:border-0 cursor-pointer" onClick={() => onOpenProfile(other.id)}>
            <div className="flex items-center gap-3">
              <Avatar user={other} status={other.status}/>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight">{other.displayName || other.username}</span>
                <span className="text-xs text-[#b5bac1]">{other.status || 'Offline'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatArea({ chatId, messages, profile, users, db, appId, onOpenProfile }) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const endRef = useRef(null);
  const filtered = messages.filter(m => m.chatId === chatId).sort((a,b) => a.timestamp - b.timestamp);
  
  useEffect(() => { endRef.current?.scrollIntoView(); }, [filtered]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      senderId: profile.id, text: text.trim(), timestamp: Date.now(), chatId: chatId
    });
    setText('');
  };

  const menuActions = {
    delete: async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id)),
    edit: (msg) => { setEditingId(msg.id); setEditText(msg.text); },
    copy: (text) => navigator.clipboard.writeText(text)
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] relative">
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} menuType={contextMenu.type} message={contextMenu.message} onClose={() => setContextMenu(null)} actions={menuActions} />}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filtered.map(m => {
          const sender = users.find(u => u.id === m.senderId);
          return (
            <div key={m.id} className="flex gap-4 hover:bg-[#2e3035] -mx-4 px-4 py-1 group relative" onContextMenu={e => { e.preventDefault(); setContextMenu({x: e.clientX, y: e.clientY, message: m, type: m.senderId === profile.id ? 'own' : 'other'}); }}>
              <Avatar user={sender} size="w-10 h-10 mt-0.5" onClick={() => onOpenProfile(sender.id)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white hover:underline cursor-pointer" onClick={() => onOpenProfile(sender.id)}>{sender?.displayName || sender?.username}</span>
                  <span className="text-[11px] text-[#949ba4]">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                {editingId === m.id ? (
                  <form onSubmit={async e => { e.preventDefault(); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', m.id), {text: editText}); setEditingId(null); }} className="mt-1">
                    <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-[#383a40] rounded px-3 py-1.5 text-[#dbdee1] outline-none" />
                  </form>
                ) : <div className="text-[#dbdee1] break-words">{m.text}</div>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-4 pt-0">
        <input value={text} onChange={e => setText(e.target.value)} className="w-full bg-[#383a40] rounded-lg px-4 py-3 text-[#dbdee1] outline-none" placeholder="Message..." />
      </form>
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
          username: username.trim(), avatar: '', status: 'online', createdAt: Date.now(), id: cred.user.uid, bio: '', displayName: ''
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
          <button className="w-full bg-[#5865f2] font-bold py-3 rounded mt-2">{isLogin ? 'Log In' : 'Continue'}</button>
        </form>
        <p className="mt-4 text-sm text-[#949ba4] text-center" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Need an account? Register" : "Have an account? Login"}</p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
