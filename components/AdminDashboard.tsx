
import React, { useState, useEffect } from 'react';
import { Users, Activity, Shield, Clock, Search, BarChart3, Globe, MoreHorizontal, UserX, UserCheck, Trash2, Lock, Unlock, Zap, Server, Download, Megaphone, Plus, X } from 'lucide-react';
import { LoginLog, User, SystemEvent, Announcement } from '../types';

interface AdminDashboardProps {
  logs: LoginLog[];
  users: User[];
  systemEvents: SystemEvent[];
  announcements: Announcement[];
  currentUser: User;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onAddAnnouncement: (message: string, type: 'info' | 'alert') => void;
  onDeleteAnnouncement: (id: string) => void;
}

type Tab = 'overview' | 'users' | 'logs' | 'activity' | 'health' | 'announcements';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  logs, 
  users, 
  systemEvents,
  announcements,
  currentUser, 
  onToggleUserStatus, 
  onDeleteUser,
  onAddAnnouncement,
  onDeleteAnnouncement
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Announcement Input
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'alert'>('info');

  // Simulated Health Metrics
  const [metrics, setMetrics] = useState({ cpu: 12, memory: 34, latency: 45 });
  
  useEffect(() => {
    if (activeTab === 'health' || activeTab === 'overview') {
      const interval = setInterval(() => {
        setMetrics({
          cpu: Math.floor(Math.random() * 30) + 10,
          memory: Math.floor(Math.random() * 20) + 30,
          latency: Math.floor(Math.random() * 50) + 20
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Derived Stats
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const adminCount = users.filter(u => u.isAdmin).length;
  const recentFailures = logs.filter(l => l.status === 'Failed' && (Date.now() - l.timestamp < 24 * 60 * 60 * 1000)).length;
  const activeAnnouncementsCount = announcements.filter(a => a.isActive).length;

  const stats = [
    { label: 'Total Registered', value: users.length.toString(), icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Active Users', value: activeUsersCount.toString(), icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Failed Logins (24h)', value: recentFailures.toString(), icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Admins', value: adminCount.toString(), icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Announcements', value: activeAnnouncementsCount.toString(), icon: Megaphone, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header & Tabs */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">System control center for Vempati Uday Kiran's Chat Bot.</p>
          </div>
          <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 overflow-x-auto max-w-full">
            {(['overview', 'health', 'activity', 'users', 'logs', 'announcements'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-slide-up">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:border-gray-700 transition-all">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Usage */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                   <Zap size={18} className="text-yellow-400" /> Token Usage Estimates
                 </h3>
                 <div className="space-y-6">
                   <div>
                     <div className="flex justify-between text-xs text-gray-400 mb-2">
                       <span>Gemini 2.5 Flash</span>
                       <span className="text-indigo-400">2.4M / 5M</span>
                     </div>
                     <div className="w-full bg-gray-800 rounded-full h-2">
                       <div className="bg-indigo-500 h-2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '45%' }}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs text-gray-400 mb-2">
                       <span>Gemini 3 Pro</span>
                       <span className="text-purple-400">850K / 2M</span>
                     </div>
                     <div className="w-full bg-gray-800 rounded-full h-2">
                       <div className="bg-purple-500 h-2 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: '30%' }}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs text-gray-400 mb-2">
                       <span>Veo Video Gen</span>
                       <span className="text-pink-400">120 / 500</span>
                     </div>
                     <div className="w-full bg-gray-800 rounded-full h-2">
                       <div className="bg-pink-500 h-2 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: '24%' }}></div>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Quick Health */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={100} className="text-emerald-500" />
                 </div>
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                   <Server size={18} className="text-emerald-400" /> System Status
                 </h3>
                 <div className="grid grid-cols-3 gap-4 text-center mt-8">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                       <div className="text-2xl font-bold text-emerald-400">{metrics.cpu}%</div>
                       <div className="text-xs text-gray-500 mt-1">CPU Load</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                       <div className="text-2xl font-bold text-blue-400">{metrics.memory}%</div>
                       <div className="text-xs text-gray-500 mt-1">Memory</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                       <div className="text-2xl font-bold text-orange-400">{metrics.latency}ms</div>
                       <div className="text-xs text-gray-500 mt-1">API Latency</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
           <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'CPU Usage', val: metrics.cpu, color: 'bg-emerald-500' },
                  { label: 'Memory Usage', val: metrics.memory, color: 'bg-blue-500' },
                  { label: 'API Latency', val: metrics.latency, max: 200, color: 'bg-orange-500', unit: 'ms' }
                ].map((m, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center h-64 relative">
                    <h3 className="text-gray-400 font-medium mb-4">{m.label}</h3>
                    <div className="w-full flex-1 flex items-end justify-center gap-1 px-4">
                      {Array.from({ length: 20 }).map((_, j) => {
                         const h = Math.max(10, Math.min(100, m.val + (Math.random() * 20 - 10)));
                         return (
                           <div 
                             key={j} 
                             className={`w-2 rounded-t-sm transition-all duration-300 ${m.color} opacity-60`}
                             style={{ height: `${h}%` }}
                           ></div>
                         )
                      })}
                    </div>
                    <div className="mt-4 text-2xl font-bold text-white">
                      {m.val}{m.unit || '%'}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'activity' && (
           <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-slide-up">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={18} className="text-indigo-400" /> Recent Activity Timeline
              </h3>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                 {systemEvents.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 pl-8">No recent activity recorded.</div>
                 ) : (
                    [...systemEvents].reverse().slice(0, 20).map((event, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-800 bg-gray-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                           {event.type === 'error' ? <Shield size={16} className="text-red-400" /> : 
                            event.type === 'success' ? <UserCheck size={16} className="text-emerald-400" /> :
                            <Activity size={16} className="text-indigo-400" />}
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-white text-sm">{event.action}</div>
                            <time className="font-mono text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</time>
                          </div>
                          <div className="text-gray-400 text-xs">
                             {event.details}
                          </div>
                        </div>
                      </div>
                    ))
                 )}
              </div>
           </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-slide-up">
             <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                   <Megaphone size={18} className="text-pink-400" /> Create Announcement
                </h3>
                <div className="flex gap-4">
                   <input 
                     type="text" 
                     value={newAnnouncement}
                     onChange={(e) => setNewAnnouncement(e.target.value)}
                     placeholder="Type announcement message..."
                     className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                   />
                   <select 
                     value={announcementType}
                     onChange={(e) => setAnnouncementType(e.target.value as any)}
                     className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                   >
                     <option value="info">Info</option>
                     <option value="alert">Alert</option>
                   </select>
                   <button 
                     onClick={() => {
                        if (newAnnouncement.trim()) {
                           onAddAnnouncement(newAnnouncement, announcementType);
                           setNewAnnouncement('');
                        }
                     }}
                     className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                   >
                      <Plus size={16} /> Post
                   </button>
                </div>
             </div>

             <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 font-bold text-gray-400 text-sm">Active Announcements</div>
                {announcements.length === 0 ? (
                   <div className="p-8 text-center text-gray-500">No active announcements.</div>
                ) : (
                   <div className="divide-y divide-gray-800">
                      {announcements.map(ann => (
                         <div key={ann.id} className="p-4 flex items-center justify-between hover:bg-gray-800/30">
                            <div className="flex items-center gap-3">
                               <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  ann.type === 'alert' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                               }`}>
                                  {ann.type}
                               </span>
                               <span className="text-white text-sm">{ann.message}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-xs text-gray-500 font-mono">{new Date(ann.createdAt).toLocaleString()}</span>
                               <button 
                                 onClick={() => onDeleteAnnouncement(ann.id)}
                                 className="text-gray-500 hover:text-red-400 transition-colors"
                               >
                                  <X size={16} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-4">
                 <h3 className="font-bold text-white flex items-center gap-2">
                   <Users size={18} className="text-gray-400" /> User Management
                 </h3>
                 <button 
                   onClick={() => exportToCSV(users, 'users_export.csv')}
                   className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 transition-colors"
                 >
                    <Download size={12} /> Export CSV
                 </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 w-full md:w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-950/50 text-gray-500 font-medium border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold overflow-hidden">
                            {user.avatar && !user.avatar.includes('default-user') ? (
                              <img src={user.avatar} className="w-full h-full object-cover" />
                            ) : (
                               user.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs border ${
                          user.isAdmin 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 ${
                          user.status === 'Active' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {new Date(user.lastActive).toLocaleDateString()} {new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           {user.id !== currentUser.id && (
                             <>
                                <button 
                                  onClick={() => onToggleUserStatus(user.id)}
                                  className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${user.status === 'Active' ? 'text-yellow-400' : 'text-emerald-400'}`}
                                  title={user.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                                >
                                  {user.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm('Are you sure you want to permanently delete this user?')) onDeleteUser(user.id)
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-700 text-red-400 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                             </>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> Security Logs
              </h3>
              <button 
                  onClick={() => exportToCSV(logs, 'security_logs.csv')}
                  className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 transition-colors"
                >
                  <Download size={12} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-950/50 text-gray-500 font-medium border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">User / Identity</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[...logs].reverse().map((log) => (
                    <tr key={log.id} className={`hover:bg-gray-800/50 transition-colors ${log.status === 'Failed' ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-white">{log.userName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.method === 'Admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 ${log.status === 'Success' ? 'text-emerald-400' : 'text-red-400 font-bold'}`}>
                           {log.status === 'Success' ? <Unlock size={14} /> : <Lock size={14} />}
                           {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
