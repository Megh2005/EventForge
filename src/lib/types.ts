export type EventType = 'wedding' | 'birthday' | 'community' | 'custom';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type VendorStatus = 'Researching' | 'Inquired' | 'Quoted' | 'Booked' | 'Declined';

export interface BudgetItem {
  id: string;
  category: string;
  title: string;
  estimated: number;
  actual: number;
  paid: boolean;
  priority: PriorityLevel;
}

export interface TimelineItem {
  id: string;
  title: string;
  phase: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone?: string;
  status: VendorStatus;
  cost: number;
  rating?: number;
  notes?: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  category: string;
  description: string;
  votes: number;
  tag: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string;
  guestCount: number;
  budget: number;
  spent: number;
  currency: string;
  currencySymbol: string;
  themeVibe: string;
  notes?: string;
  colorScheme?: string[];
  budgetItems: BudgetItem[];
  timeline: TimelineItem[];
  vendors: VendorItem[];
  ideas: IdeaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultConfig {
  storagePath: string;
  isConfigured: boolean;
  geminiApiKey?: string;
  hasApiKey?: boolean;
  geminiModel?: string;
  currency: string;
  currencySymbol: string;
  totalEvents?: number;
  system?: {
    platform: string;
    hostname: string;
    homeDir: string;
    isWritable: boolean;
  };
}
