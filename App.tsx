import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse, generateImage, generateVideo } from './services/geminiService';
import { ChatMessage, Role, AppMode, Attachment, ImageAspectRatio, ImageResolution, User, LoginLog, SystemEvent, Announcement } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { Header } from './components/Header';
import { TypingIndicator } from './components/TypingIndicator';
import { LiveSession } from './components/LiveSession';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Sparkles, Megaphone } from 'lucide-react';

const App: React.FC = () => {
  // Global State for Users (Mock Database)
  const [allUsers, setAllUsers] = useState<User[]>([
    { id: 'admin-uday', name: 'Vempati Uday Kiran', email: 'admin@udaybot.com', isAdmin: true, role: 'admin', status: 'Active', lastActive: Date.now() },
    { id: 'user-demo-1', name: 'Alice Smith', email: 'alice@example.com', isAdmin: false, role: 'user', status: 'Active', lastActive: Date.now() - 86400000 },
    { id: 'user-demo-2', name: 'Bob Jones', email: 'bob@example.com', isAdmin: false, role: 'user', status: 'Disabled', lastActive: Date.now() - 172800000 },
  ]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  
  // System State
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>('chat-flash');
  const [imageSettings, setImageSettings] = useState<{ aspectRatio: ImageAspectRatio; resolution: ImageResolution }>({
    aspectRatio: '1:1',
    resolution: '1K'
  });
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Ref for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Session Management (15-min Persistence)
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        const { user: savedUser, expiry } = JSON.parse(storedSession);
        if (Date.now() < expiry) {
          // Valid session, restore
          const foundUser = allUsers.find(u => u.id === savedUser.id) || savedUser;
          setUser(foundUser);
          // Refresh existing check if we need to sync mock DB
          if (!allUsers.find(u => u.id === savedUser.id)) {
            setAllUsers(prev => [...prev, savedUser]);
          }
        } else {
          localStorage.removeItem('user_session');
        }
      }
    } catch (e) {
      console.error("Session restore failed", e);
    }
  }, []);

  const saveUserSession = (userToSave: User) => {
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    localStorage.setItem('user_session', JSON.stringify({ user: userToSave, expiry }));
  };

  const logSystemEvent = (action: string, details: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const newEvent: SystemEvent = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      action,
      details,
      type
    };
    setSystemEvents(prev => [...prev, newEvent]);
  };

  const verifyKeySelection = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && aiStudio.hasSelectedApiKey) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (!hasKey && aiStudio.openSelectKey) {
        await aiStudio.openSelectKey();
        return await aiStudio.hasSelectedApiKey();
      }
      return hasKey;
    }
    return true; // Fallback if not running in specific environment
  };

  const handleLogin = (authenticatedUser: User) => {
    // Check if user exists in "DB", if not add them
    const existingUserIndex = allUsers.findIndex(u => u.id === authenticatedUser.id);
    let currentUser = authenticatedUser;

    if (existingUserIndex >= 0) {
      // Update existing
      const updatedUser = { 
        ...allUsers[existingUserIndex], 
        lastActive: Date.now(),
        // Update name/avatar if changed from provider
        name: authenticatedUser.name, 
        avatar: authenticatedUser.avatar 
      };
      
      // Check status
      if (updatedUser.status === 'Disabled') {
        alert("Your account has been disabled by an administrator.");
        return;
      }

      const newUsers = [...allUsers];
      newUsers[existingUserIndex] = updatedUser;
      setAllUsers(newUsers);
      currentUser = updatedUser;
    } else {
      // Add new
      setAllUsers(prev => [...prev, currentUser]);
      logSystemEvent('User Registration', `New user registered: ${currentUser.name}`, 'success');
    }

    setUser(currentUser);
    saveUserSession(currentUser);
    
    // Log the successful login
    const newLog: LoginLog = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      method: currentUser.isAdmin ? 'Admin' : 'Google',
      status: 'Success',
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    };
    setLoginLogs(prev => [...prev, newLog]);
    logSystemEvent('Login Success', `${currentUser.name} logged in via ${currentUser.isAdmin ? 'Admin' : 'Google'}.`, 'info');
  };

  const handleAdminLoginAttempt = (success: boolean, username: string) => {
    if (!success) {
      const newLog: LoginLog = {
        id: Date.now().toString(),
        userId: 'unknown',
        userName: username,
        timestamp: Date.now(),
        method: 'Admin',
        status: 'Failed',
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      };
      setLoginLogs(prev => [...prev, newLog]);
      logSystemEvent('Login Failed', `Failed admin login attempt for user: ${username}`, 'warning');
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], tools: { search: boolean, maps: boolean }) => {
    if (!user) return;

    // 1. Check Key requirements for High-End Modes (Pro Image, Veo)
    if (mode === 'video-studio' || (mode === 'image-studio' && imageSettings.resolution !== '1K')) {
      const authorized = await verifyKeySelection();
      if (!authorized) {
        alert("Please select an API Key to use this premium feature.");
        return;
      }
    }

    const newMessageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: newMessageId,
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botMessageId = (Date.now() + 1).toString();

      // Handle Image Generation/Editing
      if (mode === 'image-studio') {
        // Add placeholder
        setMessages(prev => [...prev, { id: botMessageId, role: Role.MODEL, content: 'Generating image with Nano Banana...', timestamp: Date.now() }]);
        
        // Check if editing or new gen
        const referenceImage = attachments.find(a => a.type === 'image') || null;
        
        // Using Nano Banana (Flash Image) by default unless 2K/4K selected
        const b64Image = await generateImage(text, referenceImage, imageSettings.resolution, imageSettings.aspectRatio);
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: referenceImage ? 'Here is your edited image:' : 'Here is your generated image:', generatedImage: b64Image } 
            : msg
        ));
        logSystemEvent('Image Gen', `User ${user.name} generated an image (${imageSettings.resolution})`, 'info');
      
      // Handle Video Generation
      } else if (mode === 'video-studio') {
        setMessages(prev => [...prev, { id: botMessageId, role: Role.MODEL, content: 'Generating video (this may take a minute)...', timestamp: Date.now() }]);
        
        const referenceImage = attachments.find(a => a.type === 'image') || null;
        const videoUrl = await generateVideo(text, referenceImage);
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: 'Here is your generated video:', generatedVideo: videoUrl } 
            : msg
        ));
        logSystemEvent('Video Gen', `User ${user.name} generated a video`, 'info');

      // Handle Text/Chat (Flash & Reasoning)
      } else {
        // Build History
        const history = messages.map(msg => ({
          role: msg.role === Role.USER ? 'user' : 'model',
          parts: [{ text: msg.content }] // Simplified history
        }));

        const modelName = mode === 'chat-reasoning' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
        const thinkingBudget = mode === 'chat-reasoning' ? 32768 : undefined;
        
        const activeTools = [];
        const toolConfig: any = {};
        
        if (mode === 'chat-flash') {
          if (tools.search) activeTools.push({ googleSearch: {} });
          if (tools.maps) {
             activeTools.push({ googleMaps: {} });
             // Try to get location
             try {
                const pos: GeolocationPosition = await new Promise((resolve, reject) => 
                  navigator.geolocation.getCurrentPosition(resolve, reject)
                );
                toolConfig.retrievalConfig = {
                  latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                };
             } catch(e) { console.warn("Loc failed", e); }
          }
        }

        const stream = streamChatResponse(text, attachments, {
          model: modelName,
          history,
          tools: activeTools.length > 0 ? activeTools : undefined,
          toolConfig: activeTools.length > 0 && toolConfig.retrievalConfig ? toolConfig : undefined,
          thinkingBudget,
          systemInstruction: `You are Vempati Uday Kiran's Chat Bot, a helpful and friendly AI assistant. ${mode === 'chat-reasoning' ? 'You are currently in Reasoning Mode, so provide deep, thoughtful answers.' : 'Keep answers concise and useful.'}`
        });

        // Placeholder
        setMessages(prev => [...prev, { id: botMessageId, role: Role.MODEL, content: '', timestamp: Date.now() }]);

        let accumulatedText = '';
        const groundingChunks: any[] = [];

        for await (const chunk of stream) {
          if (chunk.text) {
            accumulatedText += chunk.text;
          }
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
             groundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
          }
          
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === botMessageId 
                ? { ...msg, content: accumulatedText, groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined }
                : msg
            )
          );
        }
      }

    } catch (error: any) {
      console.error("App Error:", error);
      
      let errorMessage = "Sorry, something went wrong.";
      if (error && error.message) {
         if (error.message.includes('API_KEY')) {
            errorMessage = `Configuration Error: ${error.message}`;
         } else if (error.message.includes('403')) {
            errorMessage = "Access Denied (403). Please check your API Key permissions and quotas.";
         } else {
            errorMessage = `Error: ${error.message}`;
         }
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === Role.MODEL) {
          return prev.map(msg => msg.id === last.id ? { ...msg, content: errorMessage, isError: true } : msg);
        }
        return [...prev, { id: Date.now().toString(), role: Role.MODEL, content: errorMessage, timestamp: Date.now(), isError: true }];
      });
      logSystemEvent('API Error', `Failed to process request for ${user.name}: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Clear conversation?")) setMessages([]);
  };

  const handleLogout = () => {
    logSystemEvent('Logout', `${user?.name} logged out.`, 'info');
    setUser(null);
    setMessages([]);
    setMode('chat-flash');
    localStorage.removeItem('user_session');
  };

  const updateUserProfile = (newName: string, newAvatar?: string) => {
    if (user) {
      // Update local state
      const updatedUser = { ...user, name: newName, avatar: newAvatar || user.avatar };
      setUser(updatedUser);
      saveUserSession(updatedUser); // Update session storage too
      // Update DB
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      logSystemEvent('Profile Update', `User ${user.id} updated their profile.`, 'info');
    }
  };

  // User Management Handlers (Admin)
  const toggleUserStatus = (userId: string) => {
    setAllUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } 
        : u
    ));
    logSystemEvent('User Modified', `Admin toggled status for user ID: ${userId}`, 'warning');
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    logSystemEvent('User Deleted', `Admin deleted user ID: ${userId}`, 'warning');
  };

  const handleAddAnnouncement = (message: string, type: 'info' | 'alert') => {
    setAnnouncements(prev => [...prev, {
       id: Date.now().toString(),
       message,
       type,
       isActive: true,
       createdAt: Date.now()
    }]);
    logSystemEvent('Announcement', `New announcement posted: ${message}`, 'info');
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // If not logged in, show Login Page
  if (!user) {
    return <LoginPage onLogin={handleLogin} onAdminLoginAttempt={handleAdminLoginAttempt} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      <Header 
        onClearChat={clearChat} 
        hasMessages={messages.length > 0} 
        currentMode={mode}
        onModeChange={setMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      
      {/* Announcements Banner */}
      {announcements.length > 0 && mode !== 'admin-dashboard' && (
         <div className="bg-gray-900 border-b border-gray-800">
            {announcements.map(ann => (
               <div key={ann.id} className={`px-4 py-2 flex items-center justify-center gap-2 text-sm ${
                 ann.type === 'alert' ? 'bg-red-500/10 text-red-200' : 'bg-indigo-500/10 text-indigo-200'
               }`}>
                  <Megaphone size={14} />
                  <span className="font-medium">{ann.message}</span>
               </div>
            ))}
         </div>
      )}

      {/* Admin Dashboard */}
      {mode === 'admin-dashboard' && user.isAdmin ? (
        <AdminDashboard 
          logs={loginLogs} 
          users={allUsers}
          systemEvents={systemEvents}
          announcements={announcements}
          currentUser={user}
          onToggleUserStatus={toggleUserStatus}
          onDeleteUser={deleteUser}
          onAddAnnouncement={handleAddAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
        />
      ) : (
        /* Main Chat Area */
        <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            
            {messages.length === 0 && mode !== 'live' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 1 }}>
                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-900/20 ring-1 ring-gray-800">
                  <Sparkles size={40} className="text-indigo-500" />
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Welcome back, {user.name.split(' ')[0]}
                </h2>
                <p className="text-gray-400 max-w-md mb-8">
                  {mode === 'chat-reasoning' 
                    ? 'Deep reasoning mode enabled (Gemini 3.0 Pro).' 
                    : mode === 'image-studio'
                    ? 'Generate or Edit images with Gemini Flash Image (Nano Banana).'
                    : mode === 'video-studio'
                    ? 'Describe a scene to generate a video using Veo.'
                    : 'Ask me anything.'}
                </p>
              </div>
            )}

            <div className="flex-1">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} userName={user.name} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6 animate-fade-in">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </main>
      )}

      {/* Input */}
      {mode !== 'live' && mode !== 'admin-dashboard' && (
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isLoading} 
          isImageMode={mode === 'image-studio'}
          isVideoMode={mode === 'video-studio'}
          imageSettings={imageSettings}
          onImageSettingsChange={setImageSettings}
        />
      )}

      {/* Live Overlay */}
      {mode === 'live' && (
        <LiveSession onClose={() => setMode('chat-flash')} />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userName={user.name}
        userAvatar={user.avatar}
        onSave={updateUserProfile}
      />
    </div>
  );
};

export default App;