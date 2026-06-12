import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Wallets
export const walletsApi = {
  getAll: (limit = 50) => api.get(`/wallets?limit=${limit}`).then((r) => r.data),
  getByAddress: (address: string) => api.get(`/wallets/${address}`).then((r) => r.data),
  getEvents: (address: string, limit = 50) => api.get(`/wallets/${address}/events?limit=${limit}`).then((r) => r.data),
  getStats: () => api.get('/wallets/stats').then((r) => r.data),
  getExiting: () => api.get('/wallets/exiting').then((r) => r.data),
}

// Signals
export const signalsApi = {
  getAll: (limit = 50) => api.get(`/signals?limit=${limit}`).then((r) => r.data),
  getById: (id: string) => api.get(`/signals/${id}`).then((r) => r.data),
  getHighRisk: () => api.get('/signals/high-risk').then((r) => r.data),
  getStats: () => api.get('/signals/stats').then((r) => r.data),
}

// MEV
export const mevApi = {
  getRecent: (limit = 50) => api.get(`/mev?limit=${limit}`).then((r) => r.data),
  getStats: () => api.get('/mev/stats').then((r) => r.data),
  getPoolRisks: () => api.get('/mev/pool-risks').then((r) => r.data),
  getSummary: () => api.get('/mev/summary').then((r) => r.data),
}

// Agents
export const agentsApi = {
  getStatuses: () => api.get('/agents/status').then((r) => r.data),
  getVerdicts: () => api.get('/agents/verdicts').then((r) => r.data),
  getVerdictStats: () => api.get('/agents/verdicts/stats').then((r) => r.data),
  getActiveHunts: () => api.get('/agents/hunter/hunts').then((r) => r.data),
}

// Contracts
export const contractsApi = {
  getInfo: () => api.get('/contracts/info').then((r) => r.data),
  getVerdicts: () => api.get('/contracts/verdicts').then((r) => r.data),
  getVerdict: (id: number) => api.get(`/contracts/verdicts/${id}`).then((r) => r.data),
  getTotal: () => api.get('/contracts/verdicts/total').then((r) => r.data),
}

// Blockchain
export const blockchainApi = {
  getStatus: () => api.get('/blockchain/status').then((r) => r.data),
}

// AI Chat
export const aiApi = {
  chat: (message: string) => api.post('/ai/chat', { message }).then((r) => r.data),
  getSuggestions: () => api.get('/ai/chat/suggestions').then((r) => r.data),
}
