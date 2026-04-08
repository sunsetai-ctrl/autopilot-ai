import { useState, useRef, useEffect } from 'react';

const SUPABASE_URL = 'https://yfaccxjykhhyuftwnzrx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmYWNjeGp5a2hoeXVmdHduenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzAzNjAsImV4cCI6MjA5MTE0NjM2MH0.Bc1EGtPp-uchD852G85r-4w-CQftPLrCDM_vNEoVjmU';

export default function ChatInterface({ user, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [sidebarView, setSidebarView] = useState('projects');
  const messagesEndRef = useRef(null);

  // Get the auth token from session
  const getAuthToken = () => {
    return session?.access_token || SUPABASE_KEY;
  };

  // Supabase query helper with auth
  const supabaseQuery = async (table, method, body = null, filters = '') => {
    const url = SUPABASE_URL + '/rest/v1/' + table + filters;
    const token = getAuthToken();
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
      }
    };
    if (body) options.body = JSON.stringify(body);
    try {
      const res = await fetch(url, options);
      return res.json();
    } catch (err) {
      console.error('Supabase error:', err);
      return [];
    }
  };

  useEffect(() => { if (user && session) fetchProjects(); }, [user, session]);
  useEffect(() => { if (currentProject) fetchMessages(currentProject.id); else setMessages([]); }, [currentProject]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchProjects = async () => {
    const data = await supabaseQuery('projects', 'GET', null, '?order=updated_at.desc');
    if (Array.isArray(data)) setProjects(data);
  };

  const fetchMessages = async (projectId) => {
    const data = await supabaseQuery('messages', 'GET', null, '?project_id=eq.' + projectId + '&order=created_at.asc');
    if (Array.isArray(data)) setMessages(data.map(m => ({ role: m.role, content: m.content, toolsExecuted: m.tools_executed || [] })));
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user) return;
    const data = await supabaseQuery('projects', 'POST', { user_id: user.id, name: newProjectName, icon: '📁' });
    if (data && data[0]) {
      setProjects([data[0], ...projects]);
      setCurrentProject(data[0]);
      setNewProjectName('');
      setShowProjectModal(false);
      setMessages([]);
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('Delete this project?')) return;
    await supabaseQuery('projects', 'DELETE', null, '?id=eq.' + projectId);
    setProjects(projects.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) { setCurrentProject(null); setMessages([]); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const msg = input;
    setInput('');
    setLoading(true);
    try {
      const response = await fetch(SUPABASE_URL + '/functions/v1/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, project_id: currentProject?.id, user_id: user?.id })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No response', toolsExecuted: data.toolsExecuted || [] }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error occurred.', toolsExecuted: [] }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1a' }}>
      <div style={{ width: '280px', background: '#0d1321', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ color: '#fff', fontSize: '20px', margin: 0 }}>⚡ AutoPilot AI</h1>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          <button onClick={() => setSidebarView('chat')} style={{ flex: 1, padding: '12px', background: sidebarView === 'chat' ? '#1e293b' : 'transparent', border: 'none', color: sidebarView === 'chat' ? '#fff' : '#64748b', cursor: 'pointer' }}>💬 Chat</button>
          <button onClick={() => setSidebarView('projects')} style={{ flex: 1, padding: '12px', background: sidebarView === 'projects' ? '#1e293b' : 'transparent', border: 'none', color: sidebarView === 'projects' ? '#fff' : '#64748b', cursor: 'pointer' }}>📁 Projects</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {sidebarView === 'projects' ? (
            <>
              <button onClick={() => setShowProjectModal(true)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', marginBottom: '12px', fontWeight: '500' }}>+ New Project</button>
              {projects.map(project => (
                <div key={project.id} onClick={() => { setCurrentProject(project); setSidebarView('chat'); }} style={{ padding: '12px', background: currentProject?.id === project.id ? '#1e293b' : 'transparent', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px' }}>{project.icon} {project.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{new Date(project.updated_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
              {projects.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No projects yet!</p>}
            </>
          ) : currentProject ? (
            <div style={{ padding: '12px', background: '#1e293b', borderRadius: '8px' }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{currentProject.icon} {currentProject.name}</div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{messages.length} messages</div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              <p>Select a project first</p>
              <button onClick={() => setSidebarView('projects')} style={{ marginTop: '12px', padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>View Projects</button>
            </div>
          )}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '12px' }}>{user?.email}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', background: '#0d1321' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{currentProject ? currentProject.icon + ' ' + currentProject.name : 'AutoPilot AI'}</h2>
          {currentProject && <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px' }}>Conversation history is saved</p>}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>{currentProject ? 'Welcome to ' + currentProject.name : 'Welcome to AutoPilot AI'}</h3>
              <p style={{ color: '#64748b' }}>{currentProject ? 'I remember our conversation!' : 'Select or create a project.'}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', background: msg.role === 'user' ? '#3b82f6' : '#1e293b', color: '#fff' }}>{msg.content}</div>
              {msg.toolsExecuted?.length > 0 && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#064e3b', borderRadius: '8px', fontSize: '13px' }}>
                  {msg.toolsExecuted.map((tool, j) => <div key={j} style={{ color: '#10b981' }}>{tool.details}</div>)}
                </div>
              )}
            </div>
          ))}
          {loading && <div style={{ color: '#64748b', padding: '12px' }}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', background: '#0d1321' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={currentProject ? "Message AutoPilot..." : "Select a project first..."} disabled={loading || !currentProject} style={{ flex: 1, padding: '12px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} />
            <button type="submit" disabled={loading || !input.trim() || !currentProject} style={{ padding: '12px 24px', background: loading ? '#334155' : '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>{loading ? '...' : 'Send'}</button>
          </div>
        </form>
      </div>
      {showProjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 16px' }}>Create New Project</h3>
            <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name..." autoFocus style={{ width: '100%', padding: '12px', background: '#0d1321', border: '1px solid #334155', borderRadius: '8px', color: '#fff', marginBottom: '16px', boxSizing: 'border-box' }} onKeyPress={(e) => e.key === 'Enter' && createProject()} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProjectModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createProject} style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}