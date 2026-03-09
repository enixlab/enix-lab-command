export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  city: string
  dept: string
  address?: string
  rating?: number
  reviews?: number
  website?: string
  landingUrl?: string
  status: 'nouveau' | 'mail1_envoyé' | 'mail2_envoyé' | 'mail3_envoyé' | 'réponse' | 'converti' | 'stop'
  date: string
  lastContact?: string
  mailsSent: number
  notes?: string
}

export interface Article {
  id: string
  tag: string
  title: string
  excerpt: string
  content: string
  source: string
  sourceUrl?: string
  lang?: string
  status: 'queue' | 'published' | 'rejected'
  createdAt: string
  publishedAt?: string
  correctionNote?: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'prospect' | 'lead' | 'client' | 'perdu'
  service?: string
  budget?: number
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface DevisItem {
  label: string
  qty: number
  price: number
}

export interface Devis {
  id: string
  number: string
  clientId?: string
  clientName: string
  clientEmail: string
  items: DevisItem[]
  total: number
  tva: number
  status: 'brouillon' | 'envoyé' | 'accepté' | 'refusé'
  createdAt: string
  validUntil: string
  notes?: string
}

export interface Appointment {
  id: string
  contactName: string
  email: string
  phone?: string
  date: string
  time: string
  service: string
  status: 'confirmé' | 'en_attente' | 'annulé'
  notes?: string
  createdAt: string
}

export interface NewsItem {
  title: string
  description: string
  link: string
  source: string
  lang: string
  pubDate: string
}

export interface DashboardStats {
  totalLeads: number
  articlesQueue: number
  totalContacts: number
  mailsSent: number
  convertedLeads: number
  publishedArticles: number
}
