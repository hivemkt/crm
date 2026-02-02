import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, X, Calendar, Phone, Plus } from 'lucide-react';
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
                <h1 className="text-3xl font-bold text-white">{currentTab === 'pipeline' ? 'Pipeline de Vendas' : 'Dashboard Financeiro'}</h1>
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
          ) : (
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
                          <div>
                            <p className="text-white font-medium">{rev.description}</p>
                            <p className="text-sm text-gray-400">{rev.date}</p>
                          </div>
                          <p className="text-green-400 font-bold">R$ {rev.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                          <div>
                            <p className="text-white font-medium">{exp.description}</p>
                            <p className="text-sm text-gray-400">{exp.date}</p>
                          </div>
                          <p className="text-red-400 font-bold">R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <textarea value={selectedClient.notes} onChange={(e) => updateClient({ ...selectedClient, notes: e.target.value })} rows={6} className="w-full px-4 py-3 rounded-lg bg-[#0d0d0c] border text-white focus:outline-none focus:ring-2 resize-none" style={{ borderColor: 'rgba(246, 197, 0, 0.3)' }} placeholder="Adicione
