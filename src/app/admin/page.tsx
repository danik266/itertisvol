'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/lib/LangContext';
import { Users, Building, Calendar, Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<'users' | 'orgs' | 'events'>('users');
  
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [dirs, setDirs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingDir, setEditingDir] = useState<any>(null);
  const [viewingUsersForEvent, setViewingUsersForEvent] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []); // Только при загрузке страницы, так как мы грузим все сразу

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, oRes, eRes, dRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/organizations'),
        fetch('/api/events'),
        fetch('/api/directions')
      ]);
      const uData = await uRes.json();
      const oData = await oRes.json();
      const eData = await eRes.json();
      const dData = await dRes.json();
      
      setUsers(uData.users || []);
      setOrgs(oData.organizations || []);
      setEvents(eData.events || []);
      setDirs(dData.directions || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className="bg-red-100 text-red-800 px-2 py-1 flex rounded text-xs font-bold uppercase w-fit">Админ</span>;
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 flex w-fit rounded text-xs font-bold uppercase">Пользователь</span>;
  };

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingOrg._id;
    const method = isNew ? 'POST' : 'PUT';
    
    // Convert volunteers slightly if needed
    const payload = { ...editingOrg, volunteers: Number(editingOrg.volunteers) || 0 };
    
    try {
      const res = await fetch('/api/admin/organizations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert('Ошибка при сохранении: ' + (data.error || res.status));
        return;
      }
      setEditingOrg(null);
      fetchData();
    } catch (err) {
      alert('Ошибка сети при сохранении');
    }
  };

  const deleteOrg = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту организацию?')) return;
    try {
      const res = await fetch(`/api/admin/organizations?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert('Ошибка при удалении организации: ' + (data.error || res.status));
        return;
      }
      fetchData();
    } catch (err) {
      alert('Ошибка сети при удалении');
    }
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingEvent._id;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const res = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent)
      });
      if (!res.ok) {
        alert('Ошибка при сохранении: ' + res.status + ' ' + res.statusText);
        return;
      }
      setEditingEvent(null);
      fetchData();
    } catch (err) {
      alert('Ошибка сети при сохранении');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это мероприятие?')) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert('Ошибка при удалении мероприятия: ' + (data.error || res.status));
        return;
      }
      fetchData();
    } catch (err) {
      alert('Ошибка сети при удалении');
    }
  };

  const saveDirection = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingDir._id;
    const method = isNew ? 'POST' : 'PUT';
    try {
      const res = await fetch('/api/admin/directions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDir)
      });
      if (!res.ok) {
        alert('Ошибка при сохранении: ' + res.status + ' ' + res.statusText);
        return;
      }
      setEditingDir(null);
      fetchData();
    } catch (err) {
      alert('Ошибка сети при сохранении');
    }
  };

  const deleteDir = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить направление? (Это может нарушить связь с существующими организациями)')) return;
    try {
      const res = await fetch(`/api/admin/directions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert('Ошибка при удалении направления: ' + (data.error || res.status));
        return;
      }
      fetchData();
    } catch (err) {
      alert('Ошибка сети при удалении');
    }
  };

  const renderTabs = () => (
    <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4 overflow-x-auto scrollbar-none">
      <button 
        onClick={() => setActiveTab('users')} 
        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        <Users size={18} /> Пользователи
      </button>
      <button 
        onClick={() => setActiveTab('orgs')} 
        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'orgs' ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        <Building size={18} /> Организации
      </button>
      <button 
        onClick={() => setActiveTab('events')} 
        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === 'events' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        <Calendar size={18} /> Мероприятия
      </button>
      <button 
        onClick={() => setActiveTab('dirs' as any)} 
        className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-colors whitespace-nowrap ${activeTab === ('dirs' as any) ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
      >
        <Calendar size={18} /> Направления
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-display font-black text-gray-900 mb-8">Панель администратора</h1>
        
        {/* Stats cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Users size={20} className="text-teal-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{users.length}</span>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Пользователей</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Building size={20} className="text-orange-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{orgs.length}</span>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Организаций</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{events.length}</span>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Мероприятий</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
                  📊
                </div>
                <span className="text-2xl font-black text-gray-900">
                  {users.reduce((sum, u) => sum + (u.appliedEvents?.length || 0), 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Записей на мероприятия</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          {renderTabs()}

          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-500">
                        <th className="pb-4 font-bold">Имя</th>
                        <th className="pb-4 font-bold">Email</th>
                        <th className="pb-4 font-bold">Телефон</th>
                        <th className="pb-4 font-bold">Роль</th>
                        <th className="pb-4 font-bold">Город</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-4 font-semibold">{u.firstName} {u.lastName}</td>
                          <td className="py-4 text-gray-600">{u.email}</td>
                          <td className="py-4 text-gray-600">{u.phone || '-'}</td>
                          <td className="py-4">{getRoleBadge(u.role)}</td>
                          <td className="py-4 text-gray-600">{u.city || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ORGS TAB */}
              {activeTab === 'orgs' && (
                <div>
                  <button onClick={() => setEditingOrg({})} className="mb-6 flex items-center gap-2 bg-teal-500 text-white px-4 py-2 font-bold rounded-xl hover:bg-teal-600 transition-colors">
                    <Plus size={18} /> Добавить организацию
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orgs.map(org => (
                      <div key={org._id} className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{org.descRu}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                          <button onClick={() => setEditingOrg(org)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 flex justify-center items-center gap-2 text-sm"><Edit size={16}/> Ред.</button>
                          <button onClick={() => deleteOrg(org._id)} className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl hover:bg-red-100 flex justify-center items-center gap-2 text-sm"><Trash2 size={16}/> Удал.</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EVENTS TAB */}
              {activeTab === 'events' && (
                <div>
                  <button onClick={() => setEditingEvent({})} className="mb-6 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 font-bold rounded-xl hover:bg-blue-600 transition-colors">
                    <Plus size={18} /> Добавить мероприятие
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(ev => {
                      const enrolledUsers = users.filter(usr => usr.appliedEvents?.includes(ev.id));
                      return (
                      <div key={ev._id} className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 items-center mb-1">
                            {ev.image ? (
                              <img alt="" src={ev.image} className="w-10 h-10 rounded shadow-sm object-cover shrink-0" />
                            ) : (
                              <span className="text-2xl shrink-0">{ev.emoji}</span>
                            )}
                            <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{ev.titleRu}</h3>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{ev.date} • {ev.location}</p>
                        </div>
                        
                        <div className="mt-4 border-t border-gray-50 pt-4 flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-500">Записались: {enrolledUsers.length} чел.</p>
                          {enrolledUsers.length > 0 && (
                            <button 
                              onClick={() => setViewingUsersForEvent({ event: ev, users: enrolledUsers })}
                              className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Смотреть список
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                          <button onClick={() => setEditingEvent(ev)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 flex justify-center items-center gap-2 text-sm"><Edit size={16}/> Ред.</button>
                          <button onClick={() => deleteEvent(ev._id)} className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl hover:bg-red-100 flex justify-center items-center gap-2 text-sm"><Trash2 size={16}/> Удал.</button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DIRS TAB */}
              {activeTab === 'dirs' as any && (
                <div>
                  <button onClick={() => setEditingDir({ color: '#000000', bg: '#ffffff', icon: '' })} className="mb-6 flex items-center gap-2 bg-purple-500 text-white px-4 py-2 font-bold rounded-xl hover:bg-purple-600 transition-colors">
                    <Plus size={18} /> Добавить направление
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {dirs.map((d: any) => (
                      <div key={d._id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between" style={{ borderTop: `4px solid ${d.color}` }}>
                        <div>
                          {d.image ? (
                            <img alt="" src={d.image} className="w-10 h-10 rounded shadow-sm object-cover mb-2" />
                          ) : (
                            <p className="text-2xl mb-2">{d.icon}</p>
                          )}
                          <h3 className="font-bold text-gray-900">{d.labelRu}</h3>
                          <p className="text-xs text-gray-500 mt-1 mb-2 font-mono">ID: {d.id}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                          <button onClick={() => setEditingDir(d)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 flex justify-center items-center gap-2 text-sm"><Edit size={16}/> Ред.</button>
                          <button onClick={() => deleteDir(d._id)} className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl hover:bg-red-100 flex justify-center items-center gap-2 text-sm"><Trash2 size={16}/> Удал.</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editing Org Modal */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setEditingOrg(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-6">{editingOrg._id ? 'Редактировать' : 'Новая организация'}</h2>
            <form onSubmit={saveOrg} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Название</span>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={editingOrg.name || ''} onChange={e => setEditingOrg({...editingOrg, name: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Направление</span>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={editingOrg.direction || ''} onChange={e => setEditingOrg({...editingOrg, direction: e.target.value})}>
                    <option value="" disabled>Выберите направление...</option>
                    {dirs.map(d => <option key={d.id} value={d.id}>{d.labelRu} {d.icon}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-1 block">Описание (RU)</span>
                <textarea required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-24" value={editingOrg.descRu || ''} onChange={e => setEditingOrg({...editingOrg, descRu: e.target.value})} />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-1 block">Описание (KZ)</span>
                <textarea className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-24" value={editingOrg.descKz || ''} onChange={e => setEditingOrg({...editingOrg, descKz: e.target.value})} />
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Город</span>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={editingOrg.city || ''} onChange={e => setEditingOrg({...editingOrg, city: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Телефон</span>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={editingOrg.phone || ''} onChange={e => setEditingOrg({...editingOrg, phone: e.target.value})} placeholder="+7 (7182) 33-44-55" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-1 block">Email</span>
                <input type="email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={editingOrg.email || ''} onChange={e => setEditingOrg({...editingOrg, email: e.target.value})} placeholder="info@org.kz" />
              </label>

              <div>
                <span className="text-sm font-bold text-gray-700 mb-3 block">Социальные сети</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">📷</span>
                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-sm" value={editingOrg.social?.instagram || ''} onChange={e => setEditingOrg({...editingOrg, social: {...(editingOrg.social || {}), instagram: e.target.value}})} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">📘</span>
                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-sm" value={editingOrg.social?.facebook || ''} onChange={e => setEditingOrg({...editingOrg, social: {...(editingOrg.social || {}), facebook: e.target.value}})} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">📱</span>
                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-sm" value={editingOrg.social?.whatsapp || ''} onChange={e => setEditingOrg({...editingOrg, social: {...(editingOrg.social || {}), whatsapp: e.target.value}})} placeholder="+77001234567" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">✈️</span>
                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-sm" value={editingOrg.social?.telegram || ''} onChange={e => setEditingOrg({...editingOrg, social: {...(editingOrg.social || {}), telegram: e.target.value}})} placeholder="https://t.me/..." />
                  </div>
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 bg-teal-500 text-white font-bold rounded-xl mt-6 hover:bg-teal-600">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* Editing Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setEditingEvent(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-6">{editingEvent._id ? 'Редактировать' : 'Новое мероприятие'}</h2>
            <form onSubmit={saveEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Название (RU)</span>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editingEvent.titleRu || ''} onChange={e => setEditingEvent({...editingEvent, titleRu: e.target.value})} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-gray-700 mb-2 block">Галерея изображений (загрузите несколько)</span>
                  <div className="flex flex-wrap gap-4 items-start">
                    {/* Event Emoji fallback if no images */}
                    {(!editingEvent.images || editingEvent.images.length === 0) && !editingEvent.image && (
                      <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-3xl">
                        <input className="w-full h-full bg-transparent text-center outline-none" value={editingEvent.emoji || ''} onChange={e => setEditingEvent({...editingEvent, emoji: e.target.value})} placeholder="🚀" />
                      </div>
                    )}

                    {/* Image Thumbnails */}
                    {(editingEvent.images || (editingEvent.image ? [editingEvent.image] : [])).map((img: string, idx: number) => (
                      <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 relative group shadow-sm bg-gray-50">
                        <img alt="" src={img} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newImages = (editingEvent.images || [editingEvent.image]).filter((_: any, i: number) => i !== idx);
                            setEditingEvent({
                              ...editingEvent, 
                              images: newImages,
                              image: newImages[0] || ''
                            });
                          }} 
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        >
                          <X size={14} />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-teal-500 text-[8px] text-white font-bold text-center py-0.5">ОБЛОЖКА</div>
                        )}
                      </div>
                    ))}
                    
                    {/* Upload Button */}
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500">
                      <Plus size={20} />
                      <span className="text-[10px] font-bold">Добавить</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          if (file.size > 2 * 1024 * 1024) {
                            alert(`Файл ${file.name} слишком большой. Максимум 2MB`);
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const currentImages = editingEvent.images || (editingEvent.image ? [editingEvent.image] : []);
                            const newImages = [...currentImages, reader.result as string];
                            setEditingEvent({ 
                              ...editingEvent, 
                              images: newImages, 
                              image: newImages[0], // Set first as main image
                              emoji: '' 
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      }} />
                    </label>
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-1 block">Описание (RU)</span>
                <textarea required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-24" value={editingEvent.descRu || ''} onChange={e => setEditingEvent({...editingEvent, descRu: e.target.value})} />
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Дата</span>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editingEvent.date || ''} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Локация</span>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editingEvent.location || ''} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Направление</span>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editingEvent.direction || ''} onChange={e => setEditingEvent({...editingEvent, direction: e.target.value})}>
                    <option value="" disabled>Выберите направление...</option>
                    {dirs.map(d => <option key={d.id} value={d.id}>{d.labelRu} {d.icon}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Цвет карточки (например палитра выбора)</span>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="w-12 h-12 p-1 bg-gray-50 rounded-xl border border-gray-200 outline-none cursor-pointer" value={editingEvent.color || '#000000'} onChange={e => setEditingEvent({...editingEvent, color: e.target.value})} />
                    <input type="text" className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 uppercase font-mono text-sm" value={editingEvent.color || '#000000'} onChange={e => setEditingEvent({...editingEvent, color: e.target.value})} />
                  </div>
                </label>
              </div>
              
              <button type="submit" className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl mt-6 hover:bg-blue-600">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* Editing Direction Modal */}
      {editingDir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setEditingDir(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-6">{editingDir._id ? 'Редактировать направление' : 'Новое направление'}</h2>
            <form onSubmit={saveDirection} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Уникальный ID (eco, social на англ)</span>
                  <input required disabled={!!editingDir._id} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 disabled:opacity-50" value={editingDir.id || ''} onChange={e => setEditingDir({...editingDir, id: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Иконка или обложка (загрузить)</span>
                  <div className="flex gap-4 items-center">
                    {editingDir.image ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 relative flex-shrink-0 bg-gray-50">
                        <img alt="" src={editingDir.image} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setEditingDir({...editingDir, image: ''})} className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 shadow hover:bg-red-50">✕</button>
                      </div>
                    ) : (
                      <input className="w-20 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center text-xl" value={editingDir.icon || ''} onChange={e => setEditingDir({...editingDir, icon: e.target.value})} placeholder="🌿" />
                    )}
                    
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
                      Загрузить фото
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1 * 1024 * 1024) {
                            alert('Файл слишком большой. Максимум 1MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingDir({ ...editingDir, image: reader.result as string, icon: '' });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Название (RU)</span>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500" value={editingDir.labelRu || ''} onChange={e => setEditingDir({...editingDir, labelRu: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Название (KZ)</span>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500" value={editingDir.labelKz || ''} onChange={e => setEditingDir({...editingDir, labelKz: e.target.value})} />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-1 block">Описание (RU)</span>
                <textarea className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 min-h-16" value={editingDir.descRu || ''} onChange={e => setEditingDir({...editingDir, descRu: e.target.value})} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Цвет текста (HEX)</span>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="w-12 h-12 p-1 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer" value={editingDir.color || '#000000'} onChange={e => setEditingDir({...editingDir, color: e.target.value})} />
                    <input type="text" className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono uppercase" value={editingDir.color || '#000000'} onChange={e => setEditingDir({...editingDir, color: e.target.value})} />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-1 block">Цвет фона (HEX)</span>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="w-12 h-12 p-1 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer" value={editingDir.bg || '#ffffff'} onChange={e => setEditingDir({...editingDir, bg: e.target.value})} />
                    <input type="text" className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono uppercase" value={editingDir.bg || '#ffffff'} onChange={e => setEditingDir({...editingDir, bg: e.target.value})} />
                  </div>
                </label>
              </div>

              <button type="submit" className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl mt-6 hover:bg-purple-600">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* View Users Modal */}
      {viewingUsersForEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Список участников</h2>
              <button onClick={() => setViewingUsersForEvent(null)} className="text-gray-400 hover:text-gray-900"><X size={24}/></button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <p className="text-sm text-gray-500 mb-4">Мероприятие: <span className="font-bold text-gray-900">{viewingUsersForEvent.event.titleRu}</span></p>
              <div className="space-y-3">
                {viewingUsersForEvent.users.map((usr: any) => (
                  <div key={usr._id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{usr.firstName} {usr.lastName}</p>
                      <p className="text-xs text-gray-500">{usr.phone || usr.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
