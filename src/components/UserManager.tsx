import React, { useState } from 'react';
import { User, AppDatabase } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Key, 
  Edit3, 
  Save, 
  X,
  ShieldAlert,
  UserCheck,
  Eye,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagerProps {
  db: AppDatabase;
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>;
}

const UserManager: React.FC<UserManagerProps> = ({ db, setDb }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    ruolo: 'user',
    permessi: 'read'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveUser = (user: User) => {
    // Force uppercase
    const cleanUser = {
      ...user,
      grado: user.grado.toUpperCase(),
      cognome: user.cognome.toUpperCase(),
      nome: user.nome.toUpperCase(),
      cip: user.cip.toUpperCase(),
    };

    setDb(prev => ({
      ...prev,
      utenti: prev.utenti.map(u => u.cip === user.cip ? cleanUser : u)
    }));
    setEditingId(null);
  };

  const handleAddUser = () => {
    if (!newUser.cip || !newUser.cognome || !newUser.nome) {
      alert("Compilare tutti i campi obbligatori.");
      return;
    }

    const cleanNewUser: User = {
      cip: newUser.cip.toUpperCase(),
      grado: (newUser.grado || '').toUpperCase(),
      cognome: newUser.cognome.toUpperCase(),
      nome: newUser.nome.toUpperCase(),
      ruolo: newUser.ruolo as 'admin' | 'user',
      permessi: newUser.permessi as 'read' | 'write',
      apiKey: newUser.apiKey || ''
    };

    if (db.utenti.some(u => u.cip === cleanNewUser.cip)) {
      alert("Un utente con questo CIP esiste già.");
      return;
    }

    setDb(prev => ({
      ...prev,
      utenti: [...prev.utenti, cleanNewUser]
    }));
    setNewUser({ ruolo: 'user', permessi: 'read' });
    setShowAddForm(false);
  };

  const handleDeleteUser = (cip: string) => {
    if (db.utenti.filter(u => u.ruolo === 'admin').length === 1 && db.utenti.find(u => u.cip === cip)?.ruolo === 'admin') {
      alert("Impossibile eliminare l'ultimo amministratore.");
      return;
    }
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;
    setDb(prev => ({
      ...prev,
      utenti: prev.utenti.filter(u => u.cip !== cip)
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600" />
            Gestione Profili Operatori
          </h2>
          <p className="text-sm text-slate-500">Configurazione accessi, livelli di privilegio e chiavi AI personali.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <UserPlus size={18} />
          Nuovo Operatore
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {db.utenti.map(user => (
          <div key={user.cip} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-5 flex-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user.ruolo === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                {user.ruolo === 'admin' ? <ShieldCheck size={28} /> : <UserIcon size={28} />}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">{user.grado} {user.cognome} {user.nome}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">CIP: {user.cip}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${user.ruolo === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                    {user.ruolo}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${user.permessi === 'write' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {user.permessi === 'write' ? 'Modifica' : 'Sola Lettura'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 mb-1">
                  <Key size={12} className={user.apiKey ? 'text-emerald-500' : 'text-slate-300'} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Chiave AI</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 max-w-[100px] truncate">
                  {user.apiKey ? '••••••••••••••••' : 'NON CONFIGURATA'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setEditingId(user.cip)}
                  className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.cip)}
                  className="p-3 hover:bg-red-50 rounded-2xl text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10"
             >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Modifica Profilo</h3>
                  <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Form implementation for editing ... */}
                  {/* For brevity, I'll use simple inputs, admin can change role, permissions and API key */}
                  {(() => {
                    const user = db.utenti.find(u => u.cip === editingId);
                    if (!user) return null;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Grado</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                              value={user.grado}
                              onChange={e => handleSaveUser({...user, grado: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">CIP</label>
                            <input 
                              disabled
                              type="text" 
                              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed"
                              value={user.cip}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cognome</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                              value={user.cognome}
                              onChange={e => handleSaveUser({...user, cognome: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                              value={user.nome}
                              onChange={e => handleSaveUser({...user, nome: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ruolo</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                              value={user.ruolo}
                              onChange={e => handleSaveUser({...user, ruolo: e.target.value as any})}
                            >
                              <option value="admin">Amministratore</option>
                              <option value="user">Operatore</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Permessi</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                              value={user.permessi}
                              onChange={e => handleSaveUser({...user, permessi: e.target.value as any})}
                            >
                              <option value="read">Sola Lettura</option>
                              <option value="write">Modifica/Inserimento</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Chiave API Gemini</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                              type="password" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono"
                              placeholder="Inserisci API Key..."
                              value={user.apiKey || ''}
                              onChange={e => handleSaveUser({...user, apiKey: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Form - Slide down style */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10"
             >
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                     <UserPlus className="text-indigo-600" /> Nuovo Operatore
                   </h3>
                   <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">CIP *</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                          value={newUser.cip || ''}
                          onChange={e => setNewUser({...newUser, cip: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Grado</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                          value={newUser.grado || ''}
                          onChange={e => setNewUser({...newUser, grado: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cognome *</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                          value={newUser.cognome || ''}
                          onChange={e => setNewUser({...newUser, cognome: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome *</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase"
                          value={newUser.nome || ''}
                          onChange={e => setNewUser({...newUser, nome: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ruolo</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                          value={newUser.ruolo}
                          onChange={e => setNewUser({...newUser, ruolo: e.target.value as any})}
                        >
                          <option value="user">Operatore</option>
                          <option value="admin">Amministratore</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Permessi</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold"
                          value={newUser.permessi}
                          onChange={e => setNewUser({...newUser, permessi: e.target.value as any})}
                        >
                          <option value="read">Sola Lettura</option>
                          <option value="write">Modifica/Inserimento</option>
                        </select>
                      </div>
                   </div>

                   <button 
                    onClick={handleAddUser}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 mt-6 active:scale-95 transition-all"
                   >
                     Crea Profilo
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManager;
