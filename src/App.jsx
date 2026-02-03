import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, X, Calendar, Phone, Plus, Trash2, Type, Palette, TextQuote, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rzdcwnddiwjrdhtgqadl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGN3bmRkaXdqcmRodGdxYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzE2MTMsImV4cCI6MjA4NTYwNzYxM30.THei7FXpATfmfCU015XBJbLCkc2KsLox58x1m0xzwek';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CRMDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('pipeline');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState({
    initial: [],
    negotiation: [],
    closed: [],
    denied: [],
    remarketing: [],
    finished: []
  });

  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [newExpense, setNewExpense] = useState({ description: '', value: '', date: '' });
  const [newRevenue, setNewRevenue] = useState({ description: '', value: '', date: '' });
  const [draggedClient, setDraggedClient] = useState(null);

  // Estados para TO-DO LIST / Editor
  const [editorText, setEditorText] = useState('');
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [editorColor, setEditorColor] = useState('#ffffff');
  const [editorFontFamily, setEditorFontFamily] = useState('Arial');

  // Estados para Calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: clientsData } = await supabase.from('clientes').select('*').order('updated_at', { ascending: false });
      const organizedClients = { initial: [], negotiation: [], closed: [], denied: [], remarketing: [], finished: [] };
      
      if (clientsData) {
        clientsData.forEach(client => {
          if (organizedClients[client.status]) {
            organizedClients[client.status].push(client);
          }
        });
        setClients(organizedClients);
      }

      const { data: expensesData } = await supabase.from('despesas').select('*').order('date', { ascending: false });
      if (expensesData) setExpenses(expensesData);

      const { data: revenuesData } = await supabase.from('receitas').select('*').order('date', { ascending: false });
      if (revenuesData) setRevenues(revenuesData);

      // Carregar dados do editor
      const { data: editorData } = await supabase.from('editor_notes').select('*').order('updated_at', { ascending: false }).limit(1).single();
      if (editorData) {
        setEditorText(editorData.content || '');
        setEditorFontSize(editorData.font_size || 16);
        setEditorColor(editorData.color || '#ffffff');
        setEditorFontFamily(editorData.font_family || 'Arial');
      }

      // Carregar eventos do calendário
      const { data: eventsData } = await supabase.from('calendar_events').select('*').order('date', { ascending: true });
      if (eventsData) setCalendarEvents(eventsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (username === 'hive.mkt' && password === 'Bruno29052002@') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  const handleDragStart = (client, column) => {
    setDraggedClient({ client, fromColumn: column });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (toColumn) => {
    if (!draggedClient) return;
    const { client, fromColumn } = draggedClient;
    if (fromColumn === toColumn) {
      setDraggedClient(null);
      return;
    }

    await supabase.from('clientes').update({ status: toColumn, updated_at: new Date().toISOString() }).eq('id', client.id);
    
    setClients(prev => {
      const newClients = { ...prev };
      newClients[fromColumn] = newClients[fromColumn].filter(c => c.id !== client.id);
      newClients[toColumn] = [...newClients[toColumn], { ...client, status: toColumn }];
      return newClients;
    });

    setDraggedClient(null);
  };

  const updateClient = async (updatedClient) => {
    await supabase.from('clientes').update({
      name: updatedClient.name,
      phone: updatedClient.phone,
      notes: updatedClient.notes,
      updated_at: new Date().toISOString()
    }).eq('id', updatedClient.id);

    setClients(prev => {
      const newClients = { ...prev };
      Object.keys(newClients).forEach(column => {
        const index = newClients[column].findIndex(c => c.id === updatedClient.id);
        if (index !== -1) {
          newClients[column][index] = updatedClient;
        }
      });
      return newClients;
    });
    setSelectedClient(updatedClient);
  };

  const deleteClient = async (clientId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await supabase.from('clientes').delete().eq('id', clientId);
      
      setClients(prev => {
        const newClients = { ...prev };
        Object.keys(newClients).forEach(column => {
          newClients[column] = newClients[column].filter(c => c.id !== clientId);
        });
        return newClients;
      });
      setSelectedClient(null);
    }
  };

  const addNewClient = async () => {
    const { data } = await supabase.from('clientes').insert([{ name: 'Novo Cliente', phone: '', status: 'initial', notes: '' }]).select().single();
    if (data) {
      setClients(prev => ({ ...prev, initial: [...prev.initial, data] }));
    }
  };

  const addExpense = async () => {
    if (newExpense.description && newExpense.value && newExpense.date) {
      const { data } = await supabase.from('despesas').insert([{
        description: newExpense.description,
        value: parseFloat(newExpense.value),
        date: newExpense.date
      }]).select().single();
      
      if (data) {
        setExpenses([data, ...expenses]);
        setNewExpense({ description: '', value: '', date: '' });
      }
    }
  };

  const addRevenue = async () => {
    if (newRevenue.description && newRevenue.value && newRevenue.date) {
      const { data } = await supabase.from('receitas').insert([{
        description: newRevenue.description,
        value: parseFloat(newRevenue.value),
        date: newRevenue.date
      }]).select().single();
      
      if (data) {
        setRevenues([data, ...revenues]);
        setNewRevenue({ description: '', value: '', date: '' });
      }
    }
  };

  const deleteExpense = async (expenseId) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      await supabase.from('despesas').delete().eq('id', expenseId);
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
    }
  };

  const deleteRevenue = async (revenueId) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      await supabase.from('receitas').delete().eq('id', revenueId);
      setRevenues(revenues.filter(rev => rev.id !== revenueId));
    }
  };

  // Funções para Editor
  const saveEditorContent = async () => {
    const editorContent = {
      content: editorText,
      font_size: editorFontSize,
      color: editorColor,
      font_family: editorFontFamily,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase.from('editor_notes').select('id').limit(1).single();
    
    if (existing) {
      await supabase.from('editor_notes').update(editorContent).eq('id', existing.id);
    } else {
      await supabase.from('editor_notes').insert([editorContent]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentTab === 'notes') {
      const timer = setTimeout(() => {
        saveEditorContent();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editorText, editorFontSize, editorColor, editorFontFamily]);

  // Funções para Calendário
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const addCalendarEvent = async () => {
    if (newEvent.title && selectedDate) {
      const { data } = await supabase.from('calendar_events').insert([{
        title: newEvent.title,
        time: newEvent.time,
        description: newEvent.description,
        date: selectedDate
      }]).select().single();
      
      if (data) {
        setCalendarEvents([...calendarEvents, data]);
        setNewEvent({ title: '', time: '', description: '' });
        setShowEventModal(false);
        setSelectedDate(null);
      }
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      await supabase.from('calendar_events').delete().eq('id', eventId);
      setCalendarEvents(calendarEvents.filter(evt => evt.id !== eventId));
    }
  };

  const getEventsForDate = (dateStr) => {
    return calendarEvents.filter(evt => evt.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);
  const totalRevenues = revenues.reduce((sum, rev) => sum + rev.value, 0);
  const profit = totalRevenues - totalExpenses;
  const roi = totalExpenses > 0 ? ((profit / totalExpenses) * 100).toFixed(2) : 0;

  const columns = [
    { id: 'initial', title: 'Contato Inicial', color: '#3b82f6' },
    { id: 'negotiation', title: 'Em Negociação', color: '#f59e0b' },
    { id: 'closed', title: 'Fechados', color: '#10b981' },
    { id: 'denied', title: 'Negados', color: '#ef4444' },
    { id: 'remarketing', title: 'Remarketing', color: '#8b5cf6' },
    { id: 'finished', title: 'Finalizados', color: '#6b7280' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#181816' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="images/logo.png" alt="Logo" className="h-24 w-auto object-contain mx-auto mb-4" onError={(e) => e.target.style.display = 'none'} />
            <h1 className="text-3xl font-bold" style={{ color: '#f6c500' }}>CRM Dashboard</h1>
          </div>

          <div className="rounded-2xl p-8 backdrop-blur-lg" style={{ background: 'rgba(246, 197, 0, 0.05)', border: '1px solid rgba(246, 197, 0, 0.3)', boxShadow: '0 8px 32px rgba(246, 197, 0, 0.1)' }}>
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full" style={{ backgroundColor: 'rgba(246, 197, 0, 0.1)' }}>
                <Lock className="w-8 h-8" style={{ color: '#f6c500' }} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-6">Acesso Restrito</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2 transition-all" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full pl-10 pr-12 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2 transition-all" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="••••••••" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                  {error}
                </motion.div>
              )}

              <button onClick={handleLogin} className="w-full py-3 rounded-lg font-bold text-black transition-all" style={{ backgroundColor: '#f6c500' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(246, 197, 0, 0.9)'} onMouseLeave={(e) => e.target.style.backgroundColor = '#f6c500'}>
                Entrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#181816' }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#f6c500', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-400">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src="images/logo.png" alt="Logo" className="h-12 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                <h1 className="text-3xl font-bold text-white">
                  {currentTab === 'pipeline' && 'Pipeline de Vendas'}
                  {currentTab === 'financeiro' && 'Dashboard Financeiro'}
                  {currentTab === 'notes' && 'Bloco de Notas'}
                  {currentTab === 'calendar' && 'Calendário'}
                </h1>
              </div>
              {currentTab === 'pipeline' && (
                <button onClick={addNewClient} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-black transition-all" style={{ backgroundColor: '#f6c500' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(246, 197, 0, 0.9)'} onMouseLeave={(e) => e.target.style.backgroundColor = '#f6c500'}>
                  <Plus className="w-5 h-5" />
                  Novo Cliente
                </button>
              )}
            </div>

            <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <button onClick={() => setCurrentTab('pipeline')} className="flex-1 py-3 px-6 rounded-lg font-bold transition-all" style={{ backgroundColor: currentTab === 'pipeline' ? '#f6c500' : 'transparent', color: currentTab === 'pipeline' ? '#000' : '#fff' }}>PIPELINE</button>
              <button onClick={() => setCurrentTab('financeiro')} className="flex-1 py-3 px-6 rounded-lg font-bold transition-all" style={{ backgroundColor: currentTab === 'financeiro' ? '#f6c500' : 'transparent', color: currentTab === 'financeiro' ? '#000' : '#fff' }}>FINANCEIRO</button>
              <button onClick={() => setCurrentTab('notes')} className="flex-1 py-3 px-6 rounded-lg font-bold transition-all" style={{ backgroundColor: currentTab === 'notes' ? '#f6c500' : 'transparent', color: currentTab === 'notes' ? '#000' : '#fff' }}>NOTAS</button>
              <button onClick={() => setCurrentTab('calendar')} className="flex-1 py-3 px-6 rounded-lg font-bold transition-all" style={{ backgroundColor: currentTab === 'calendar' ? '#f6c500' : 'transparent', color: currentTab === 'calendar' ? '#000' : '#fff' }}>CALENDÁRIO</button>
            </div>
          </div>

          {currentTab === 'pipeline' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {columns.map(column => (
                <div key={column.id} onDragOver={handleDragOver} onDrop={() => handleDrop(column.id)} className="rounded-xl p-4 min-h-[500px]" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-bold text-white">{column.title}</h3>
                    <span className="ml-auto text-sm text-gray-400">{clients[column.id].length}</span>
                  </div>
                  <div className="space-y-3">
                    {clients[column.id].map(client => (
                      <motion.div key={client.id} layout draggable onDragStart={() => handleDragStart(client, column.id)} onClick={() => setSelectedClient(client)} className="p-4 rounded-lg cursor-pointer hover:scale-105 transition-all" style={{ background: 'rgba(246, 197, 0, 0.05)', border: '1px solid rgba(246, 197, 0, 0.2)' }} whileHover={{ scale: 1.02 }}>
                        <h4 className="font-bold text-white mb-2">{client.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <Phone className="w-4 h-4" />
                          {client.phone || 'Sem telefone'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {client.updated_at ? new Date(client.updated_at).toLocaleDateString('pt-BR') : 'Sem data'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : currentTab === 'financeiro' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <p className="text-sm text-gray-400 mb-2">Total Receitas</p>
                  <p className="text-3xl font-bold text-green-400">R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <p className="text-sm text-gray-400 mb-2">Total Despesas</p>
                  <p className="text-3xl font-bold text-red-400">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(246, 197, 0, 0.1), rgba(246, 197, 0, 0.05))', border: '1px solid rgba(246, 197, 0, 0.3)' }}>
                  <p className="text-sm text-gray-400 mb-2">Lucro</p>
                  <p className="text-3xl font-bold" style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <p className="text-sm text-gray-400 mb-2">ROI</p>
                  <p className="text-3xl font-bold text-purple-400">{roi}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                  <h3 className="text-xl font-bold text-white mb-4">Adicionar Receita</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Descrição" value={newRevenue.description} onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <input type="number" placeholder="Valor (R$)" value={newRevenue.value} onChange={(e) => setNewRevenue({ ...newRevenue, value: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <input type="date" value={newRevenue.date} onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <button onClick={addRevenue} className="w-full py-3 rounded-lg font-bold text-black transition-all" style={{ backgroundColor: '#10b981' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.9)'} onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}>Adicionar Receita</button>
                  </div>
                </div>

                <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                  <h3 className="text-xl font-bold text-white mb-4">Adicionar Despesa</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Descrição" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <input type="number" placeholder="Valor (R$)" value={newExpense.value} onChange={(e) => setNewExpense({ ...newExpense, value: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <button onClick={addExpense} className="w-full py-3 rounded-lg font-bold text-white transition-all" style={{ backgroundColor: '#ef4444' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'} onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}>Adicionar Despesa</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <h3 className="text-xl font-bold text-green-400 mb-4">Receitas</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {revenues.map(rev => (
                      <div key={rev.id} className="p-3 rounded-lg bg-[#0d0d0c] border border-green-500/20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-medium">{rev.description}</p>
                            <p className="text-sm text-gray-400">{rev.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-green-400 font-bold">R$ {rev.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <button onClick={() => deleteRevenue(rev.id)} className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <h3 className="text-xl font-bold text-red-400 mb-4">Despesas</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expenses.map(exp => (
                      <div key={exp.id} className="p-3 rounded-lg bg-[#0d0d0c] border border-red-500/20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-medium">{exp.description}</p>
                            <p className="text-sm text-gray-400">{exp.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-red-400 font-bold">R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <button onClick={() => deleteExpense(exp.id)} className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : currentTab === 'notes' ? (
            <div className="space-y-6">
              {/* Barra de Ferramentas do Editor */}
              <div className="p-4 rounded-xl flex items-center gap-6 flex-wrap" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5" style={{ color: '#f6c500' }} />
                  <select value={editorFontFamily} onChange={(e) => setEditorFontFamily(e.target.value)} className="px-4 py-2 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }}>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <TextQuote className="w-5 h-5" style={{ color: '#f6c500' }} />
                  <select value={editorFontSize} onChange={(e) => setEditorFontSize(Number(e.target.value))} className="px-4 py-2 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }}>
                    {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map(size => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5" style={{ color: '#f6c500' }} />
                  <div className="flex items-center gap-2">
                    <input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer bg-[#0d0d0c] border" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    <span className="text-white text-sm">{editorColor}</span>
                  </div>
                </div>

                <div className="ml-auto text-sm text-gray-400">
                  Salvamento automático ativo
                </div>
              </div>

              {/* Área de Texto */}
              <div className="rounded-xl p-6" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)', minHeight: '600px' }}>
                <textarea value={editorText} onChange={(e) => setEditorText(e.target.value)} className="w-full h-full min-h-[560px] bg-transparent border-none focus:outline-none resize-none" style={{ color: editorColor, fontSize: `${editorFontSize}px`, fontFamily: editorFontFamily }} placeholder="Comece a escrever suas notas aqui..."></textarea>
              </div>
            </div>
          ) : currentTab === 'calendar' ? (
            <div className="space-y-6">
              {/* Cabeçalho do Calendário */}
              <div className="p-6 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                <button onClick={previousMonth} className="p-2 rounded-lg transition-all hover:bg-[#f6c500]/10">
                  <ChevronLeft className="w-6 h-6" style={{ color: '#f6c500' }} />
                </button>
                
                <h2 className="text-2xl font-bold text-white">
                  {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h2>
                
                <button onClick={nextMonth} className="p-2 rounded-lg transition-all hover:bg-[#f6c500]/10">
                  <ChevronRight className="w-6 h-6" style={{ color: '#f6c500' }} />
                </button>
              </div>

              {/* Grid do Calendário */}
              <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                {/* Dias da Semana */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                    <div key={day} className="text-center font-bold text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dias do Mês */}
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                    const days = [];
                    
                    // Células vazias antes do primeiro dia
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                    }
                    
                    // Dias do mês
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayEvents = getEventsForDate(dateStr);
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      
                      days.push(
                        <div key={day} onClick={() => { setSelectedDate(dateStr); setShowEventModal(true); }} className="aspect-square p-2 rounded-lg cursor-pointer transition-all hover:scale-105" style={{ background: isToday ? 'rgba(246, 197, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: `1px solid ${isToday ? '#f6c500' : 'rgba(246, 197, 0, 0.1)'}` }}>
                          <div className="text-white font-bold mb-1">{day}</div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((evt, idx) => (
                              <div key={idx} className="text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: '#f6c500', color: '#000' }}>
                                {evt.time} {evt.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-400">+{dayEvents.length - 2} mais</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>

              {/* Lista de Eventos */}
              <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(246, 197, 0, 0.2)' }}>
                <h3 className="text-xl font-bold text-white mb-4">Próximos Eventos</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {calendarEvents
                    .filter(evt => new Date(evt.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(evt => (
                      <div key={evt.id} className="p-4 rounded-lg bg-[#0d0d0c] border border-[#f6c500]/20 flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-4 h-4" style={{ color: '#f6c500' }} />
                            <span className="text-white font-bold">{evt.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mb-1">
                            <Clock className="w-4 h-4" />
                            {new Date(evt.date).toLocaleDateString('pt-BR')} {evt.time && `- ${evt.time}`}
                          </div>
                          {evt.description && (
                            <p className="text-sm text-gray-300 mt-2">{evt.description}</p>
                          )}
                        </div>
                        <button onClick={() => deleteCalendarEvent(evt.id)} className="text-red-400 hover:text-red-300 transition-colors ml-4">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Modal para Adicionar Evento no Calendário */}
          <AnimatePresence>
            {showEventModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { setShowEventModal(false); setSelectedDate(null); setNewEvent({ title: '', time: '', description: '' }); }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 max-w-md w-full" style={{ background: 'rgba(24, 24, 22, 0.98)', border: '1px solid rgba(246, 197, 0, 0.3)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Novo Evento</h2>
                    <button onClick={() => { setShowEventModal(false); setSelectedDate(null); setNewEvent({ title: '', time: '', description: '' }); }} className="text-gray-400 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                      <input type="text" value={selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : ''} disabled className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-gray-500 cursor-not-allowed" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Título do Evento</label>
                      <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="Ex: Reunião com cliente" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Horário</label>
                      <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                      <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2 resize-none" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="Detalhes do evento..."></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => { setShowEventModal(false); setSelectedDate(null); setNewEvent({ title: '', time: '', description: '' }); }} className="flex-1 py-3 rounded-lg font-bold text-white bg-gray-600 hover:bg-gray-700 transition-all">
                        Cancelar
                      </button>
                      <button onClick={addCalendarEvent} className="flex-1 py-3 rounded-lg font-bold text-black transition-all" style={{ backgroundColor: '#f6c500' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(246, 197, 0, 0.9)'} onMouseLeave={(e) => e.target.style.backgroundColor = '#f6c500'}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedClient && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedClient(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(24, 24, 22, 0.98)', border: '1px solid rgba(246, 197, 0, 0.3)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Detalhes do Cliente</h2>
                    <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Cliente</label>
                      <input type="text" value={selectedClient.name} onChange={(e) => updateClient({ ...selectedClient, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                      <input type="text" value={selectedClient.phone} onChange={(e) => updateClient({ ...selectedClient, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="11 98765-4321" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Última Atualização</label>
                      <input type="text" value={selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleString('pt-BR') : 'Sem data'} disabled className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-gray-500 cursor-not-allowed" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Anotações</label>
                      <textarea value={selectedClient.notes || ''} onChange={(e) => updateClient({ ...selectedClient, notes: e.target.value })} rows={6} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2 resize-none" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="Adicione notas sobre o cliente..."></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setSelectedClient(null)} className="flex-1 py-3 rounded-lg font-bold text-white bg-gray-600 hover:bg-gray-700 transition-all">
                        Fechar
                      </button>
                      <button onClick={() => deleteClient(selectedClient.id)} className="flex-1 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Excluir Cliente
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
