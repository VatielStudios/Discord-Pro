import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Users, MessageSquare, Hash, Plus, Settings, 
  Check, X, Compass, Inbox, HelpCircle, ChevronRight,
  Gamepad2, ShoppingBag, Radio, Mic, Headphones,
  Smile, Pencil, Reply, Forward, Copy, Pin, LayoutGrid, 
  BellOff, Link, Volume2, Trash2, Flag, Bookmark, Fingerprint
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
          <div className="flex items-center gap-2 p-1 rounded hover:bg-[#3f4147] cursor-pointer flex-1 min-w-0">
            <Avatar url={profile.avatar} status={profile.status} size="w-8 h-8" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white leading-tight truncate">{profile.username}</span>
              <span className="text-[11px] text-[#b5bac1] leading-tight truncate">Online</span>
            </div>
          </div>
          <div className="flex items-center text-[#b5bac1]">
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Mic size={18}/></button>
            <button className="p-1.5 hover:bg-[#3f4147] rounded transition-colors"><Headphones size={18}/></button>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:bg-[#3f4147] rounded hover:text-white transition-colors"><Settings size={18}/></button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative z-0">
        {/* Top Header */}
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
              <FriendsMain tab={friendTab} profile={profile} users={users} friends={myFriends} chats={chats} setActiveTab={setActiveTab} setActiveView={setActiveView} db={db} appId={appId} />
            ) : (
              <ChatArea chatId={activeTab} messages={messages} profile={profile} users={users} db={db} appId={appId} />
            )}
          </div>

          {/* Right Sidebar - "Active Now" */}
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
    
    const existing = friends.find(f => (f.fromId === target.id && f.toId === profile.id) || (f.fromId === profile.id && f.toId === target.id));
    if (existing) return alert("Already connected or pending.");

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
      if (confirm("Are you sure?")) {
        await deleteDoc(friendRef);
      }
    }
  };

  if (tab === 'add') {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-white font-bold mb-2 text-base uppercase">Add Friend</h1>
        <p className="text-[#b5bac1] text-[13px] mb-4">You can add friends with their Discord username.</p>
        
        <div className="relative mb-8">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="w-full bg-[#1e1f22] border border-black/20 rounded-lg py-3 px-4 text-white outline-none focus:border-[#00a8fc] transition-all placeholder:text-[#5c5e66]" 
            placeholder="You can add friends with their Discord username." 
          />
          <button 
            onClick={handleAddFriend}
            disabled={!input}
            className="absolute right-2 top-2 bg-[#5865f2] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send Friend Request
          </button>
        </div>

        <div className="border-t border-[#3f4147] pt-8">
          <h2 className="text-[#b5bac1] font-bold text-xs uppercase tracking-wider mb-4">Other Places to Make Friends</h2>
          <div className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#1e1f22] rounded-lg p-3 flex items-center justify-between cursor-pointer group transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#23a559] rounded-lg flex items-center justify-center text-white">
                <Compass size={20} />
              </div>
              <span className="text-white font-medium text-sm">Explore Discoverable Servers</span>
            </div>
            <ChevronRight size={20} className="text-[#b5bac1] group-hover:text-white" />
          </div>
        </div>
      </div>
    );
  }

  const list = friends.filter(f => tab === 'pending' ? (f.status === 'pending' && f.toId === profile.id) : f.status === 'accepted');

  return (
    <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-60">
           <div className="w-[300px] h-[200px] flex flex-col items-center justify-center mb-10">
              <Users size={80} className="text-[#80848e] mb-6" />
              <p className="text-[#949ba4] text-[15px]">No friends here yet.</p>
           </div>
        </div>
      ) : list.map(f => {
        const other = users.find(u => u.id === (f.fromId === profile.id ? f.toId : f.fromId));
        return other && (
          <div key={f.docId} className="flex items-center justify-between p-3 hover:bg-[#3f4147]/50 rounded-lg group border-t border-[#3f4147] first:border-0">
            <div className="flex items-center gap-3">
              <Avatar url={other.avatar} status={other.status}/>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight">{other.username}</span>
                <span className="text-xs text-[#b5bac1]">{other.status || 'Offline'}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {f.status === 'pending' ? (
                <>
                  <button onClick={() => updateStatus(f.docId, 'accepted')} className="w-9 h-9 flex items-center justify-center bg-[#2b2d31] rounded-full text-[#b5bac1] hover:text-[#23a559] transition-colors"><Check size={20}/></button>
                  <button onClick={() => updateStatus(f.docId, 'rejected')} className="w-9 h-9 flex items-center justify-center bg-[#2b2d31] rounded-full text-[#b5bac1] hover:text-[#f23f42] transition-colors"><X size={20}/></button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setActiveTab(chats.find(c => c.participants.includes(other.id))?.id || 'friends'); setActiveView('dms'); }} 
                    className="w-9 h-9 flex items-center justify-center bg-[#2b2d31] rounded-full text-[#b5bac1] hover:text-white transition-colors"
                  >
                    <MessageSquare size={18}/>
                  </button>
                  <button 
                    onClick={() => updateStatus(f.docId, 'remove')} 
                    className="w-9 h-9 flex items-center justify-center bg-[#2b2d31] rounded-full text-[#b5bac1] hover:text-[#f23f42] transition-colors"
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

// Context Menu Component
function ContextMenu({ x, y, menuType, message, onClose, actions }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from overflowing screen
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
      {/* Emoji Reactions Row */}
      <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-[#2b2d31] pb-2">
         <span className="cursor-pointer hover:bg-[#2b2d31] p-1 rounded text-lg">❤️</span>
         <span className="cursor-pointer hover:bg-[#2b2d31] p-1 rounded text-lg">💯</span>
         <span className="cursor-pointer hover:bg-[#2b2d31] p-1 rounded text-lg">👍</span>
         <span className="cursor-pointer hover:bg-[#2b2d31] p-1 rounded text-lg">👎</span>
      </div>

      <Item label="Add Reaction" icon={ChevronRight} onClick={() => alert('Feature coming soon!')} />
      <div className="my-1 border-t border-[#2b2d31]" />
      
      {menuType === 'own' && <Item label="Edit Message" icon={Pencil} onClick={() => actions.edit(message)} />}
      
      <Item label="Reply" icon={Reply} onClick={() => alert('Feature coming soon!')} />
      <Item label="Forward" icon={Forward} onClick={() => alert('Feature coming soon!')} />
      
      <div className="my-1 border-t border-[#2b2d31]" />
      
      <Item label="Copy Text" icon={Copy} onClick={() => actions.copy(message.text)} />
      <Item label="Pin Message" icon={Pin} onClick={() => alert('Feature coming soon!')} />
      
      {menuType === 'other' && <Item label="Bookmark Message" icon={Bookmark} onClick={() => alert('Feature coming soon!')} />}
      
      <Item label="Apps" icon={ChevronRight} onClick={() => alert('Feature coming soon!')} />
      
      <div className="my-1 border-t border-[#2b2d31]" />
      
      <Item label="Mark Unread" icon={BellOff} onClick={() => alert('Feature coming soon!')} />
      <Item label="Copy Message Link" icon={Link} onClick={() => alert('Feature coming soon!')} />
      <Item label="Speak Message" icon={Volume2} onClick={() => alert('Feature coming soon!')} />

      <div className="my-1 border-t border-[#2b2d31]" />
      
      {menuType === 'own' ? (
        <Item label="Delete Message" icon={Trash2} danger onClick={() => actions.delete(message.id)} />
      ) : (
        <>
          <Item label="Report Message" icon={Flag} danger onClick={() => alert('Report submitted!')} />
          <Item label="Copy Message ID" icon={Fingerprint} onClick={() => actions.copy(message.id)} />
        </>
      )}
    </div>
  );
}

function ChatArea({ chatId, messages, profile, users, db, appId }) {
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

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
      type: message.senderId === profile.id ? 'own' : 'other'
    });
  };

  const menuActions = {
    delete: async (id) => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id));
    },
    edit: (msg) => {
      setEditingId(msg.id);
      setEditText(msg.text);
    },
    copy: (text) => {
      navigator.clipboard.writeText(text);
    }
  };

  const saveEdit = async (e, id) => {
    e.preventDefault();
    if (!editText.trim()) return setEditingId(null);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', id), { text: editText.trim() });
    setEditingId(null);
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;

  filtered.forEach((m) => {
    const dateObj = new Date(m.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    if (dateStr !== lastDate) {
      groupedMessages.push({ type: 'separator', date: dateStr, id: `sep-${dateStr}` });
      lastDate = dateStr;
    }
    groupedMessages.push({ type: 'message', ...m });
  });

  return (
    <div className="flex-1 flex flex-col bg-[#313338] relative" onClick={() => contextMenu && setContextMenu(null)}>
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          menuType={contextMenu.type} 
          message={contextMenu.message} 
          onClose={() => setContextMenu(null)}
          actions={menuActions}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {groupedMessages.map(item => {
          if (item.type === 'separator') {
            return (
              <div key={item.id} className="flex items-center justify-center my-6">
                <div className="flex-1 h-[1px] bg-[#3f4147]"></div>
                <span className="mx-4 text-xs font-semibold text-[#949ba4]">{item.date}</span>
                <div className="flex-1 h-[1px] bg-[#3f4147]"></div>
              </div>
            );
          }

          const m = item;
          const sender = users.find(u => u.id === m.senderId);
          const isEditing = editingId === m.id;

          return (
            <div 
              key={m.id} 
              className="flex gap-4 hover:bg-[#2e3035] -mx-4 px-4 py-1 group relative"
              onContextMenu={(e) => handleContextMenu(e, m)}
            >
              <Avatar url={sender?.avatar} size="w-10 h-10 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white hover:underline cursor-pointer">{sender?.username}</span>
                  <span className="text-[11px] text-[#949ba4]">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                {isEditing ? (
                  <form onSubmit={(e) => saveEdit(e, m.id)} className="mt-1">
                    <input 
                      autoFocus
                      value={editText} 
                      onChange={e => setEditText(e.target.value)} 
                      onKeyDown={e => { if(e.key === 'Escape') setEditingId(null) }}
                      className="w-full bg-[#383a40] rounded px-3 py-1.5 text-[#dbdee1] outline-none" 
                    />
                    <div className="text-xs text-[#949ba4] mt-1">escape to <span className="text-[#00a8fc] cursor-pointer hover:underline" onClick={() => setEditingId(null)}>cancel</span> • enter to <span className="text-[#00a8fc] cursor-pointer hover:underline" onClick={(e) => saveEdit(e, m.id)}>save</span></div>
                  </form>
                ) : (
                  <div className="text-[#dbdee1] leading-relaxed break-words">{m.text}</div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="p-4 pt-0">
        <div className="relative">
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            className="w-full bg-[#383a40] rounded-lg pl-4 pr-12 py-3 text-[#dbdee1] outline-none placeholder:text-[#5c5e66]" 
            placeholder="Message..." 
          />
          <div className="absolute right-3 top-2.5 flex items-center gap-2">
            <Smile size={24} className="text-[#b5bac1] hover:text-[#dbdee1] cursor-pointer transition-colors" />
          </div>
        </div>
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
          username: username.trim(), avatar: '', status: 'online', createdAt: Date.now(), id: cred.user.uid
        });
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="h-screen bg-[#5865f2] flex items-center justify-center p-4">
      <div className="bg-[#313338] w-full max-w-[480px] p-8 rounded-lg shadow-2xl text-white">
        <h1 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Welcome back!' : 'Create an account'}</h1>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none border border-transparent focus:border-[#00a8fc] transition-colors" required />}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none border border-transparent focus:border-[#00a8fc] transition-colors" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1e1f22] p-2.5 rounded outline-none border border-transparent focus:border-[#00a8fc] transition-colors" required />
          <button className="w-full bg-[#5865f2] hover:bg-[#4752c4] font-bold py-3 rounded mt-2 transition-colors">{isLogin ? 'Log In' : 'Continue'}</button>
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
