<script lang="ts">
  import type { EventItem, BudgetItem, TimelineItem, VendorItem, IdeaItem } from '../types';
  import { saveSingleEvent, vaultConfig } from '../storage';
  import { 
    optimizeBudgetWithAI, 
    generateVendorGuideAI, 
    generateTimelineRunOfShowAI, 
    brainstormIdeasWithAI,
    generateFullBlueprint,
    callGeminiAI 
  } from '../ai';
  import { playClick, playSuccess, playDelete, playPop } from '../sound';
  import { POPULAR_CURRENCIES, getCurrencySymbol, formatMoney } from '../currency';
  import BudgetItemModal from './BudgetItemModal.svelte';
  import TimelineItemModal from './TimelineItemModal.svelte';
  import VendorModal from './VendorModal.svelte';
  import IdeaModal from './IdeaModal.svelte';
  import confetti from 'canvas-confetti';
  import { 
    ArrowLeft, 
    HardDrive, 
    Palette, 
    Layers, 
    Bot, 
    Coins, 
    Clock, 
    Briefcase, 
    Lightbulb, 
    Zap, 
    Check, 
    Pencil, 
    Trash2, 
    Plus, 
    Calendar, 
    MapPin, 
    Users, 
    Mail, 
    Phone, 
    Flame, 
    Copy, 
    Send, 
    User, 
    GlassWater, 
    Mic 
  } from '@lucide/svelte';

  export let event: EventItem;
  export let onBack: () => void;

  // Active Tab
  type TabType = 'budget' | 'timeline' | 'vendors' | 'ideas' | 'copilot';
  let activeTab: TabType = 'budget';

  // Dynamic currency for this event
  $: currentSymbol = event.currencySymbol || getCurrencySymbol(event.currency || $vaultConfig.currency || 'USD');

  // Modals state
  let showBudgetModal = false;
  let editingBudgetItem: BudgetItem | null = null;

  let showTimelineModal = false;
  let editingTimelineItem: TimelineItem | null = null;

  let showVendorModal = false;
  let editingVendorItem: VendorItem | null = null;

  let showIdeaModal = false;
  let editingIdeaItem: IdeaItem | null = null;

  // AI Assistant states
  let isAiWorking = false;
  let aiNotice = '';
  let aiOutputTitle = '';
  let aiOutputContent = '';
  let showAiOutputModal = false;
  let aiError = '';

  // Copilot Chat
  let copilotMessages: { role: 'user' | 'assistant'; text: string; time: string }[] = [
    {
      role: 'assistant',
      text: `Hello! I am your Gemini 3.5 Flash Planning Copilot for "${event.title}". Ask me to draft vendor contracts, optimize costs in ${event.currency || 'USD'}, write speeches, or refine schedules!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
  let copilotInput = '';
  let isCopilotThinking = false;

  // Financial calculations
  $: totalSpent = (event.budgetItems || []).reduce((acc, item) => acc + (Number(item.actual) || 0), 0);
  $: totalEstimated = (event.budgetItems || []).reduce((acc, item) => acc + (Number(item.estimated) || 0), 0);
  $: remainingBudget = (Number(event.budget) || 0) - totalSpent;
  $: isOverBudget = totalSpent > (Number(event.budget) || 0);

  // Timeline completion
  $: completedTasks = (event.timeline || []).filter(t => t.completed).length;
  $: totalTasks = (event.timeline || []).length;
  $: taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function switchTab(t: TabType) {
    playClick();
    activeTab = t;
  }

  async function persistEvent() {
    event.spent = totalSpent;
    await saveSingleEvent(event);
  }

  async function handleCurrencyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const selectedCode = target.value;
    event.currency = selectedCode;
    event.currencySymbol = getCurrencySymbol(selectedCode);
    playClick();
    await persistEvent();
  }

  // --- BUDGET ACTIONS ---
  function openAddBudget() {
    editingBudgetItem = null;
    showBudgetModal = true;
  }

  function openEditBudget(item: BudgetItem) {
    editingBudgetItem = item;
    showBudgetModal = true;
  }

  async function handleSaveBudget(item: BudgetItem) {
    if (!event.budgetItems) event.budgetItems = [];
    const idx = event.budgetItems.findIndex(b => b.id === item.id);
    if (idx >= 0) {
      event.budgetItems[idx] = item;
    } else {
      event.budgetItems.push(item);
    }
    showBudgetModal = false;
    await persistEvent();
  }

  async function handleDeleteBudget(id: string) {
    playDelete();
    event.budgetItems = event.budgetItems.filter(b => b.id !== id);
    await persistEvent();
  }

  async function togglePaid(item: BudgetItem) {
    playPop();
    item.paid = !item.paid;
    event.budgetItems = [...event.budgetItems];
    await persistEvent();
  }

  async function handleAiOptimizeBudget() {
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }
    playClick();
    isAiWorking = true;
    aiNotice = `Gemini 3.5 Flash is dynamically analyzing your budget in ${event.currency || 'USD'}...`;
    try {
      const res = await optimizeBudgetWithAI(event);
      aiOutputTitle = `GEMINI BUDGET ANALYSIS (${event.currency || 'USD'})`;
      aiOutputContent = res;
      showAiOutputModal = true;
      playSuccess();
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      isAiWorking = false;
    }
  }

  // --- TIMELINE ACTIONS ---
  function openAddTimeline() {
    editingTimelineItem = null;
    showTimelineModal = true;
  }

  function openEditTimeline(item: TimelineItem) {
    editingTimelineItem = item;
    showTimelineModal = true;
  }

  async function handleSaveTimeline(item: TimelineItem) {
    if (!event.timeline) event.timeline = [];
    const idx = event.timeline.findIndex(t => t.id === item.id);
    if (idx >= 0) {
      event.timeline[idx] = item;
    } else {
      event.timeline.push(item);
    }
    showTimelineModal = false;
    await persistEvent();
  }

  async function handleDeleteTimeline(id: string) {
    playDelete();
    event.timeline = event.timeline.filter(t => t.id !== id);
    await persistEvent();
  }

  async function toggleTimelineComplete(item: TimelineItem) {
    playPop();
    item.completed = !item.completed;
    event.timeline = [...event.timeline];
    await persistEvent();

    if (item.completed && completedTasks === totalTasks) {
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        playSuccess();
      } catch (e) {}
    }
  }

  async function handleAiGenerateTimeline() {
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }
    playClick();
    isAiWorking = true;
    aiNotice = 'Gemini 3.5 Flash is dynamically generating your minute-by-minute run-of-show...';
    try {
      const res = await generateTimelineRunOfShowAI(event);
      aiOutputTitle = '⏳ GEMINI DAY-OF MASTER RUN-OF-SHOW';
      aiOutputContent = res;
      showAiOutputModal = true;
      playSuccess();
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      isAiWorking = false;
    }
  }

  // --- VENDOR ACTIONS ---
  function openAddVendor() {
    editingVendorItem = null;
    showVendorModal = true;
  }

  function openEditVendor(item: VendorItem) {
    editingVendorItem = item;
    showVendorModal = true;
  }

  async function handleSaveVendor(item: VendorItem) {
    if (!event.vendors) event.vendors = [];
    const idx = event.vendors.findIndex(v => v.id === item.id);
    if (idx >= 0) {
      event.vendors[idx] = item;
    } else {
      event.vendors.push(item);
    }
    showVendorModal = false;
    await persistEvent();
  }

  async function handleDeleteVendor(id: string) {
    playDelete();
    event.vendors = event.vendors.filter(v => v.id !== id);
    await persistEvent();
  }

  async function handleAiVendorGuide(category: string) {
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }
    playClick();
    isAiWorking = true;
    aiNotice = `Gemini is generating contract negotiation questions for ${category}...`;
    try {
      const res = await generateVendorGuideAI(event, category);
      aiOutputTitle = `VENDOR RFP & QUESTIONS: ${category.toUpperCase()}`;
      aiOutputContent = res;
      showAiOutputModal = true;
      playSuccess();
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      isAiWorking = false;
    }
  }

  // --- IDEAS ACTIONS ---
  function openAddIdea() {
    editingIdeaItem = null;
    showIdeaModal = true;
  }

  function openEditIdea(item: IdeaItem) {
    editingIdeaItem = item;
    showIdeaModal = true;
  }

  async function handleSaveIdea(item: IdeaItem) {
    if (!event.ideas) event.ideas = [];
    const idx = event.ideas.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      event.ideas[idx] = item;
    } else {
      event.ideas.push(item);
    }
    showIdeaModal = false;
    await persistEvent();
  }

  async function handleDeleteIdea(id: string) {
    playDelete();
    event.ideas = event.ideas.filter(i => i.id !== id);
    await persistEvent();
  }

  async function handleUpvoteIdea(idea: IdeaItem) {
    playPop();
    idea.votes = (idea.votes || 0) + 1;
    event.ideas = [...event.ideas];
    await persistEvent();
  }

  async function handleAiBrainstormIdeas() {
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }
    playClick();
    isAiWorking = true;
    aiNotice = 'Gemini 3.5 Flash is dynamically brainstorming personalized creative concepts...';
    try {
      const res = await brainstormIdeasWithAI(event, 'Creative Experience');
      aiOutputTitle = 'GEMINI PERSONALIZED IDEAS';
      aiOutputContent = res;
      showAiOutputModal = true;
      playSuccess();
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      isAiWorking = false;
    }
  }

  // --- FULL RE-BLUEPRINT ---
  async function handleRegenerateBlueprint() {
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }
    if (!confirm('Run Gemini 3.5 Flash AI to generate and append fresh blueprint items?')) return;
    playClick();
    isAiWorking = true;
    aiNotice = 'Gemini 3.5 Flash is synthesizing complete event blueprint dynamically...';
    try {
      const blueprint = await generateFullBlueprint(event);
      if (blueprint) {
        if (blueprint.budgetBreakdown && Array.isArray(blueprint.budgetBreakdown)) {
          for (const b of blueprint.budgetBreakdown) {
            event.budgetItems.push({
              id: `b-ai-${Date.now().toString(36)}-${Math.random().toString(36).substr(2,4)}`,
              category: b.category || 'General',
              title: b.title || 'AI Expense',
              estimated: Number(b.estimated) || 0,
              actual: 0,
              paid: false,
              priority: b.priority || 'medium'
            });
          }
        }
        if (blueprint.timeline && Array.isArray(blueprint.timeline)) {
          for (const t of blueprint.timeline) {
            event.timeline.push({
              id: `t-ai-${Date.now().toString(36)}-${Math.random().toString(36).substr(2,4)}`,
              title: t.title || 'AI Task',
              phase: t.phase || 'Planning',
              dueDate: t.dueDate || event.date,
              completed: false,
              notes: t.notes || ''
            });
          }
        }
        await persistEvent();
        playSuccess();
        alert('Blueprint generated and saved directly to your local computer disk!');
      }
    } catch (err: any) {
      alert(`AI Blueprint Error: ${err.message}`);
    } finally {
      isAiWorking = false;
    }
  }

  // --- COPILOT CHAT ---
  async function handleSendCopilot() {
    if (!copilotInput.trim()) return;
    if (!$vaultConfig.hasApiKey) {
      alert('Google Gemini API key required. Please enter your API key in the top navigation bar.');
      return;
    }

    playClick();
    const query = copilotInput.trim();
    copilotInput = '';

    copilotMessages = [
      ...copilotMessages,
      {
        role: 'user',
        text: query,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    isCopilotThinking = true;

    try {
      const res = await callGeminiAI({
        task: 'chat',
        prompt: `The user asks about their event "${event.title}": "${query}".\nEvent summary: ${JSON.stringify(event)}. Respond with clear, actionable advice, drafts, or suggestions.`
      });

      copilotMessages = [
        ...copilotMessages,
        {
          role: 'assistant',
          text: res.rawText || 'Analysis completed.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      playSuccess();
    } catch (err: any) {
      copilotMessages = [
        ...copilotMessages,
        {
          role: 'assistant',
          text: `Error: ${err.message}. Please check your Gemini API key in the top navigation bar.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    } finally {
      isCopilotThinking = false;
    }
  }
</script>

<div class="event-detail-wrap">
  <!-- Top Navigation & Summary Banner -->
  <section class="banner-card neo-card">
    <div class="banner-top-row">
      <button class="neo-btn neo-btn-sm neo-btn-white" on:click={onBack} type="button">
        ← BACK TO DASHBOARD
      </button>

      <div class="banner-controls-group">
        <!-- Event Currency Selector -->
        <div class="event-currency-box" title="Change currency for this event">
          <span class="ec-label font-mono">CURRENCY:</span>
          <select 
            class="ec-select font-mono" 
            value={event.currency || $vaultConfig.currency || 'USD'} 
            on:change={handleCurrencyChange}
          >
            {#each POPULAR_CURRENCIES as c}
              <option value={c.code}>{c.code} ({c.symbol})</option>
            {/each}
          </select>
        </div>

        <span class="neo-badge 
          {event.type === 'wedding' ? 'neo-badge-pink' : 
           event.type === 'birthday' ? 'neo-badge-yellow' : 
           event.type === 'community' ? 'neo-badge-green' : 'neo-badge-cyan'}"
        >
          {event.type.toUpperCase()}
        </span>

        <span class="neo-badge neo-badge-dark font-mono badge-with-icon">
          <HardDrive size={13} strokeWidth={2.5} />
          <span>SAVED TO DISK</span>
        </span>
      </div>
    </div>

    <div class="banner-main-grid">
      <div class="banner-info">
        <h2 class="detail-title">{event.title}</h2>
        {#if event.themeVibe}
          <p class="theme-callout">
            <Palette size={16} strokeWidth={2.5} />
            <strong>THEME:</strong> {event.themeVibe}
          </p>
        {/if}
        <div class="meta-strip font-mono">
          <span>
            <Calendar size={14} strokeWidth={2.5} />
            <span>{event.date}</span>
          </span>
          {#if event.location}
            <span>
              <MapPin size={14} strokeWidth={2.5} />
              <span>{event.location}</span>
            </span>
          {/if}
          <span>
            <Users size={14} strokeWidth={2.5} />
            <span>{event.guestCount} GUESTS</span>
          </span>
          <span>
            <Coins size={14} strokeWidth={2.5} />
            <span>BUDGET: {formatMoney(event.budget, currentSymbol)}</span>
          </span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="banner-actions">
        <button 
          class="neo-btn neo-btn-sm neo-btn-yellow" 
          on:click={handleRegenerateBlueprint}
          disabled={isAiWorking}
          type="button"
          title="Run Gemini 3.5 Flash to expand blueprint"
        >
          <Layers size={16} strokeWidth={2.5} />
          <span>EXPAND BLUEPRINT</span>
        </button>

        <button 
          class="neo-btn neo-btn-sm neo-btn-purple" 
          on:click={() => switchTab('copilot')}
          type="button"
        >
          <Bot size={16} strokeWidth={2.5} />
          <span>GEMINI COPILOT</span>
        </button>

        <button 
          class="neo-btn neo-btn-sm neo-btn-cyan" 
          on:click={persistEvent}
          type="button"
          title="Save all changes to disk"
        >
          <HardDrive size={16} strokeWidth={2.5} />
          <span>SAVE TO DISK</span>
        </button>
      </div>
    </div>
  </section>

  <!-- AI Working Notification Strip -->
  {#if isAiWorking}
    <div class="ai-strip stripes-pattern">
      <div class="ai-strip-inner font-mono">
        <Zap size={16} strokeWidth={2.5} class="spin-icon" />
        <strong>{aiNotice}</strong>
      </div>
    </div>
  {/if}

  <!-- Tactile Tabs Navigation -->
  <nav class="tactile-tabs-nav">
    <button 
      class="tab-btn {activeTab === 'budget' ? 'active-budget' : ''}" 
      on:click={() => switchTab('budget')}
      type="button"
    >
      <Coins size={18} strokeWidth={2.5} class="tab-icon" />
      <span class="tab-text">BUDGET & EXPENSES</span>
      <span class="tab-counter font-mono">{formatMoney(totalSpent, currentSymbol)}</span>
    </button>

    <button 
      class="tab-btn {activeTab === 'timeline' ? 'active-timeline' : ''}" 
      on:click={() => switchTab('timeline')}
      type="button"
    >
      <Clock size={18} strokeWidth={2.5} class="tab-icon" />
      <span class="tab-text">TIMELINE & SCHEDULE</span>
      <span class="tab-counter font-mono">{completedTasks}/{totalTasks}</span>
    </button>

    <button 
      class="tab-btn {activeTab === 'vendors' ? 'active-vendors' : ''}" 
      on:click={() => switchTab('vendors')}
      type="button"
    >
      <Briefcase size={18} strokeWidth={2.5} class="tab-icon" />
      <span class="tab-text">VENDOR CHECKLIST</span>
      <span class="tab-counter font-mono">{(event.vendors || []).length}</span>
    </button>

    <button 
      class="tab-btn {activeTab === 'ideas' ? 'active-ideas' : ''}" 
      on:click={() => switchTab('ideas')}
      type="button"
    >
      <Lightbulb size={18} strokeWidth={2.5} class="tab-icon" />
      <span class="tab-text">CREATIVE IDEAS</span>
      <span class="tab-counter font-mono">{(event.ideas || []).length}</span>
    </button>

    <button 
      class="tab-btn {activeTab === 'copilot' ? 'active-copilot' : ''}" 
      on:click={() => switchTab('copilot')}
      type="button"
    >
      <Bot size={18} strokeWidth={2.5} class="tab-icon" />
      <span class="tab-text">GEMINI COPILOT</span>
      <span class="tab-counter font-mono">AI</span>
    </button>
  </nav>

  <!-- TAB 1: BUDGET & EXPENSES -->
  {#if activeTab === 'budget'}
    <div class="tab-content">
      <div class="budget-summary-grid">
        <div class="b-stat-card neo-card-flat bg-white">
          <span class="b-stat-label font-mono">TARGET BUDGET</span>
          <div class="b-stat-val font-mono">{formatMoney(event.budget, currentSymbol)}</div>
          <span class="b-stat-sub font-mono">CURRENCY: {event.currency || 'USD'}</span>
        </div>

        <div class="b-stat-card neo-card-flat {isOverBudget ? 'bg-pink' : 'bg-green'}">
          <span class="b-stat-label font-mono">TOTAL COMMITTED</span>
          <div class="b-stat-val font-mono">{formatMoney(totalSpent, currentSymbol)}</div>
          <span class="b-stat-sub font-mono">
            {event.budget > 0 ? Math.round((totalSpent / event.budget) * 100) : 0}% OF ALLOCATION
          </span>
        </div>

        <div class="b-stat-card neo-card-flat bg-yellow">
          <span class="b-stat-label font-mono">REMAINING BUFFER</span>
          <div class="b-stat-val font-mono">{formatMoney(remainingBudget, currentSymbol)}</div>
          <span class="b-stat-sub font-mono">
            {remainingBudget >= 0 ? 'AVAILABLE FOR SPEND' : 'OVER BUDGET ALERT'}
          </span>
        </div>
      </div>

      <div class="tab-actions-row">
        <div class="tab-section-title">
          <h3>ITEMIZED EXPENSE BREAKDOWN</h3>
          <p>Track all payments, estimates, and priorities in {event.currency || 'USD'}.</p>
        </div>

        <div class="tab-action-btns">
          <button 
            class="neo-btn neo-btn-sm neo-btn-purple" 
            on:click={handleAiOptimizeBudget}
            disabled={isAiWorking}
            type="button"
          >
            <Zap size={15} strokeWidth={2.5} />
            <span>AI OPTIMIZE BUDGET</span>
          </button>

          <button class="neo-btn neo-btn-sm neo-btn-green" on:click={openAddBudget} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD EXPENSE</span>
          </button>
        </div>
      </div>

      {#if !event.budgetItems || event.budgetItems.length === 0}
        <div class="empty-tab-box neo-card-flat">
          <p>No expenses added yet.</p>
          <button class="neo-btn neo-btn-sm neo-btn-green" on:click={openAddBudget} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD FIRST EXPENSE</span>
          </button>
        </div>
      {:else}
        <div class="table-container neo-card-flat">
          <table class="neo-table">
            <thead>
              <tr>
                <th>STATUS</th>
                <th>EXPENSE / ITEM</th>
                <th>CATEGORY</th>
                <th>PRIORITY</th>
                <th>ESTIMATED</th>
                <th>ACTUAL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {#each event.budgetItems as b (b.id)}
                <tr>
                  <td>
                    <button 
                      class="paid-badge-btn {b.paid ? 'paid' : 'unpaid'} font-mono" 
                      on:click={() => togglePaid(b)}
                      type="button"
                    >
                      {#if b.paid}
                        <Check size={12} strokeWidth={3} />
                        <span>PAID</span>
                      {:else}
                        <Clock size={12} strokeWidth={2.5} />
                        <span>UNPAID</span>
                      {/if}
                    </button>
                  </td>
                  <td>
                    <strong class="item-name">{b.title}</strong>
                  </td>
                  <td>
                    <span class="cat-pill font-mono">{b.category}</span>
                  </td>
                  <td>
                    <span class="priority-pill font-mono priority-{b.priority}">
                      {b.priority.toUpperCase()}
                    </span>
                  </td>
                  <td class="font-mono">{formatMoney(b.estimated, currentSymbol)}</td>
                  <td class="font-mono">
                    <strong class="{b.actual > b.estimated ? 'over-actual' : ''}">
                      {formatMoney(b.actual, currentSymbol)}
                    </strong>
                  </td>
                  <td>
                    <div class="row-btns">
                      <button class="row-btn" on:click={() => openEditBudget(b)} title="Edit" type="button">
                        <Pencil size={13} strokeWidth={2.5} />
                      </button>
                      <button class="row-btn del" on:click={() => handleDeleteBudget(b.id)} title="Delete" type="button">
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 2: TIMELINE & RUN OF SHOW -->
  {#if activeTab === 'timeline'}
    <div class="tab-content">
      <div class="timeline-progress-card neo-card-flat">
        <div class="tp-header font-mono">
          <span>PROGRESS:</span>
          <strong>{completedTasks} OF {totalTasks} COMPLETED ({taskProgressPct}%)</strong>
        </div>
        <div class="neo-progress-wrap">
          <div class="neo-progress-fill" style="width: {taskProgressPct}%"></div>
        </div>
      </div>

      <div class="tab-actions-row">
        <div class="tab-section-title">
          <h3>TIMELINE & DAY-OF SCHEDULE</h3>
          <p>Chronological tasks and run-of-show cues.</p>
        </div>

        <div class="tab-action-btns">
          <button 
            class="neo-btn neo-btn-sm neo-btn-purple" 
            on:click={handleAiGenerateTimeline}
            disabled={isAiWorking}
            type="button"
          >
            <Zap size={15} strokeWidth={2.5} />
            <span>AI GENERATE RUN-OF-SHOW</span>
          </button>

          <button class="neo-btn neo-btn-sm neo-btn-cyan" on:click={openAddTimeline} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD MILESTONE</span>
          </button>
        </div>
      </div>

      {#if !event.timeline || event.timeline.length === 0}
        <div class="empty-tab-box neo-card-flat">
          <p>No timeline milestones recorded yet.</p>
          <button class="neo-btn neo-btn-sm neo-btn-cyan" on:click={openAddTimeline} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD FIRST MILESTONE</span>
          </button>
        </div>
      {:else}
        <div class="timeline-list">
          {#each event.timeline as t (t.id)}
            <div class="timeline-card neo-card-flat {t.completed ? 'task-done' : ''}">
              <div class="tl-left">
                <input 
                  type="checkbox" 
                  class="neo-checkbox" 
                  checked={t.completed} 
                  on:change={() => toggleTimelineComplete(t)} 
                />
                <div class="tl-text">
                  <div class="tl-top">
                    <span class="phase-pill font-mono">{t.phase}</span>
                    <span class="due-badge font-mono">
                      <Calendar size={12} strokeWidth={2.5} />
                      <span>{t.dueDate}</span>
                    </span>
                  </div>
                  <h4 class="tl-title {t.completed ? 'strike' : ''}">{t.title}</h4>
                  {#if t.notes}
                    <p class="tl-notes font-mono">
                      <Lightbulb size={13} strokeWidth={2.5} />
                      <span>{t.notes}</span>
                    </p>
                  {/if}
                </div>
              </div>

              <div class="row-btns">
                <button class="row-btn" on:click={() => openEditTimeline(t)} title="Edit" type="button">
                  <Pencil size={13} strokeWidth={2.5} />
                </button>
                <button class="row-btn del" on:click={() => handleDeleteTimeline(t.id)} title="Delete" type="button">
                  <Trash2 size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 3: VENDOR CHECKLIST -->
  {#if activeTab === 'vendors'}
    <div class="tab-content">
      <div class="tab-actions-row">
        <div class="tab-section-title">
          <h3>VENDOR CONTRACTS & CHECKLIST</h3>
          <p>Quotes, deliverables, and booking statuses.</p>
        </div>

        <div class="tab-action-btns">
          <button class="neo-btn neo-btn-sm neo-btn-purple" on:click={openAddVendor} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD VENDOR</span>
          </button>
        </div>
      </div>

      {#if !event.vendors || event.vendors.length === 0}
        <div class="empty-tab-box neo-card-flat">
          <p>No vendors listed yet.</p>
          <button class="neo-btn neo-btn-sm neo-btn-purple" on:click={openAddVendor} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD FIRST VENDOR</span>
          </button>
        </div>
      {:else}
        <div class="vendors-grid">
          {#each event.vendors as v (v.id)}
            <div class="vendor-card neo-card-flat">
              <div class="v-card-header">
                <span class="v-cat-pill font-mono">{v.category}</span>
                <span class="v-status-pill status-{v.status.toLowerCase()} font-mono">
                  {v.status.toUpperCase()}
                </span>
              </div>

              <h4 class="v-name">{v.name}</h4>

              <div class="v-cost-row font-mono">
                <span>QUOTED / ESTIMATE:</span>
                <strong>{formatMoney(v.cost, currentSymbol)}</strong>
              </div>

              <div class="v-contact-box font-mono">
                {#if v.contact}
                  <div class="contact-line">
                    <Mail size={13} strokeWidth={2.5} />
                    <span>{v.contact}</span>
                  </div>
                {/if}
                {#if v.phone}
                  <div class="contact-line">
                    <Phone size={13} strokeWidth={2.5} />
                    <span>{v.phone}</span>
                  </div>
                {/if}
              </div>

              {#if v.notes}
                <div class="v-notes-box">
                  <span class="v-notes-label font-mono">SCOPE & QUESTIONS:</span>
                  <p>{v.notes}</p>
                </div>
              {/if}

              <div class="v-footer">
                <button 
                  class="neo-btn neo-btn-sm neo-btn-yellow" 
                  on:click={() => handleAiVendorGuide(v.category)}
                  disabled={isAiWorking}
                  type="button"
                >
                  <Zap size={14} strokeWidth={2.5} />
                  <span>AI QUESTIONS</span>
                </button>

                <div class="row-btns">
                  <button class="row-btn" on:click={() => openEditVendor(v)} title="Edit" type="button">
                    <Pencil size={13} strokeWidth={2.5} />
                  </button>
                  <button class="row-btn del" on:click={() => handleDeleteVendor(v.id)} title="Delete" type="button">
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 4: PERSONALIZED IDEAS -->
  {#if activeTab === 'ideas'}
    <div class="tab-content">
      <div class="tab-actions-row">
        <div class="tab-section-title">
          <h3>CREATIVE IDEAS & MOODBOARD</h3>
          <p>Interactive guest experiences, signature drinks, and unique concepts.</p>
        </div>

        <div class="tab-action-btns">
          <button 
            class="neo-btn neo-btn-sm neo-btn-yellow" 
            on:click={handleAiBrainstormIdeas}
            disabled={isAiWorking}
            type="button"
          >
            <Zap size={15} strokeWidth={2.5} />
            <span>AI BRAINSTORM IDEAS</span>
          </button>

          <button class="neo-btn neo-btn-sm neo-btn-pink" on:click={openAddIdea} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>ADD IDEA</span>
          </button>
        </div>
      </div>

      {#if !event.ideas || event.ideas.length === 0}
        <div class="empty-tab-box neo-card-flat">
          <p>No personalized ideas pinned yet.</p>
          <button class="neo-btn neo-btn-sm neo-btn-pink" on:click={openAddIdea} type="button">
            <Plus size={15} strokeWidth={2.5} />
            <span>PIN FIRST IDEA</span>
          </button>
        </div>
      {:else}
        <div class="ideas-grid">
          {#each event.ideas as idea (idea.id)}
            <div class="idea-card neo-card-flat">
              <div class="idea-header">
                <span class="idea-tag-pill font-mono">{idea.tag || 'Idea'}</span>
                <button 
                  class="vote-pill-btn font-mono" 
                  on:click={() => handleUpvoteIdea(idea)} 
                  title="Upvote this idea"
                  type="button"
                >
                  <Flame size={13} strokeWidth={2.5} />
                  <span>{idea.votes || 0}</span>
                </button>
              </div>

              <h4 class="idea-title">{idea.title}</h4>
              <p class="idea-desc">{idea.description}</p>

              <div class="idea-footer">
                <span class="idea-cat font-mono">{idea.category}</span>
                <div class="row-btns">
                  <button class="row-btn" on:click={() => openEditIdea(idea)} title="Edit" type="button">
                    <Pencil size={13} strokeWidth={2.5} />
                  </button>
                  <button class="row-btn del" on:click={() => handleDeleteIdea(idea.id)} title="Delete" type="button">
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- TAB 5: GEMINI COPILOT -->
  {#if activeTab === 'copilot'}
    <div class="tab-content">
      <div class="copilot-container neo-card-flat">
        <div class="copilot-header">
          <div class="copilot-title-group">
            <div class="copilot-avatar-box">
              <Bot size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3>GEMINI 3.5 FLASH PLANNING COPILOT</h3>
              <p class="font-mono">ACTIVE EVENT: {event.title} (BUDGET: {formatMoney(event.budget, currentSymbol)}, {event.guestCount} GUESTS)</p>
            </div>
          </div>
          <span class="neo-badge neo-badge-green font-mono">LIVE AI CHAT</span>
        </div>

        <div class="copilot-messages">
          {#each copilotMessages as msg}
            <div class="message-bubble {msg.role}">
              <div class="msg-meta font-mono">
                <span class="sender-label">
                  {#if msg.role === 'assistant'}
                    <Bot size={13} strokeWidth={2.5} />
                    <span>GEMINI 3.5 FLASH</span>
                  {:else}
                    <User size={13} strokeWidth={2.5} />
                    <span>YOU</span>
                  {/if}
                </span>
                <span>{msg.time}</span>
              </div>
              <div class="msg-text">{msg.text}</div>
            </div>
          {/each}

          {#if isCopilotThinking}
            <div class="message-bubble assistant thinking font-mono">
              <Zap size={14} strokeWidth={2.5} class="spin-icon" />
              <span>GEMINI 3.5 FLASH IS REASONING...</span>
            </div>
          {/if}
        </div>

        <!-- Quick Prompt Chips -->
        <div class="quick-prompts">
          <span class="qp-label font-mono">SUGGESTED PROMPTS:</span>
          <button 
            type="button" 
            class="qp-btn" 
            on:click={() => { copilotInput = `Draft a polite negotiation email to a vendor asking for a discount in ${event.currency || 'USD'}.`; }}
          >
            <Mail size={13} strokeWidth={2.5} />
            <span>Vendor Discount Email</span>
          </button>
          <button 
            type="button" 
            class="qp-btn" 
            on:click={() => { copilotInput = 'Suggest 3 signature drink recipes that match our theme.'; }}
          >
            <GlassWater size={13} strokeWidth={2.5} />
            <span>Signature Drinks</span>
          </button>
          <button 
            type="button" 
            class="qp-btn" 
            on:click={() => { copilotInput = 'Write an unforgettable 3-minute welcome speech for this event.'; }}
          >
            <Mic size={13} strokeWidth={2.5} />
            <span>3-Minute Welcome Speech</span>
          </button>
        </div>

        <form class="copilot-form" on:submit|preventDefault={handleSendCopilot}>
          <input 
            type="text" 
            class="neo-input copilot-input font-mono" 
            bind:value={copilotInput} 
          />
          <button type="submit" class="neo-btn neo-btn-cyan copilot-send-btn" disabled={isCopilotThinking}>
            {#if isCopilotThinking}
              <span>SENDING...</span>
            {:else}
              <span>SEND</span>
              <Send size={15} strokeWidth={2.5} />
            {/if}
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>

<!-- AI Output Modal -->
{#if showAiOutputModal}
  <div 
    class="neo-modal-backdrop" 
    on:click={(e) => { if (e.target === e.currentTarget) showAiOutputModal = false; }} 
    on:keydown={(e) => { if (e.key === 'Escape') showAiOutputModal = false; }}
    role="dialog" 
    aria-modal="true" 
    tabindex="-1"
  >
    <div class="neo-modal-content">
      <div class="modal-top-bar stripes-pattern"></div>
      <div class="modal-header">
        <h3 class="modal-title">{aiOutputTitle}</h3>
        <p class="modal-sub font-mono">POWERED BY GOOGLE GENERATIVE AI (GEMINI 3.5 FLASH)</p>
      </div>

      <div class="modal-body">
        <div class="ai-rendered-output">
          <pre>{aiOutputContent}</pre>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="neo-btn neo-btn-sm neo-btn-white" 
          type="button"
          on:click={() => {
            navigator.clipboard.writeText(aiOutputContent);
            playSuccess();
            alert('Copied to clipboard!');
          }}
        >
          <Copy size={15} strokeWidth={2.5} />
          <span>COPY TEXT</span>
        </button>
        <button class="neo-btn neo-btn-dark" on:click={() => showAiOutputModal = false} type="button">
          CLOSE
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modals -->
{#if showBudgetModal}
  <BudgetItemModal 
    item={editingBudgetItem} 
    currencySymbol={currentSymbol}
    onSave={handleSaveBudget} 
    onClose={() => showBudgetModal = false} 
  />
{/if}

{#if showTimelineModal}
  <TimelineItemModal 
    item={editingTimelineItem} 
    onSave={handleSaveTimeline} 
    onClose={() => showTimelineModal = false} 
  />
{/if}

{#if showVendorModal}
  <VendorModal 
    item={editingVendorItem} 
    currencySymbol={currentSymbol}
    onSave={handleSaveVendor} 
    onClose={() => showVendorModal = false} 
  />
{/if}

{#if showIdeaModal}
  <IdeaModal 
    item={editingIdeaItem} 
    onSave={handleSaveIdea} 
    onClose={() => showIdeaModal = false} 
  />
{/if}

<style>
  .event-detail-wrap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Banner Card */
  .banner-card {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: #fff;
  }

  .banner-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .banner-controls-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .event-currency-box {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--neo-yellow);
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.25rem 0.5rem;
  }

  .ec-label {
    font-size: 0.65rem;
    font-weight: 800;
  }

  .ec-select {
    border: none;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    outline: none;
  }

  .banner-main-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .detail-title {
    font-size: 2.2rem;
    letter-spacing: -0.02em;
    margin-bottom: 0.35rem;
  }

  .theme-callout {
    font-size: 1rem;
    color: #333;
    margin-bottom: 0.65rem;
  }

  .star-accent {
    color: var(--neo-pink);
    font-size: 1.2rem;
    font-weight: 900;
  }

  .meta-strip {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
    font-weight: 700;
    color: #555;
  }

  .banner-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  /* AI Strip */
  .ai-strip {
    padding: 3px;
    border: var(--neo-border);
  }

  .ai-strip-inner {
    background: #fff;
    padding: 0.65rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }

  .spin-icon {
    font-size: 1.3rem;
    animation: pulse 0.7s infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 0.4; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1.1); }
  }

  /* Tactile Tabs Nav */
  .tactile-tabs-nav {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    border-bottom: var(--neo-border);
    padding-bottom: 0.5rem;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 800;
    padding: 0.65rem 1rem;
    background: #fff;
    border: var(--neo-border);
    box-shadow: 3px 3px 0 var(--neo-dark);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .tab-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--neo-dark);
    background-color: var(--neo-muted);
  }

  .tab-counter {
    background: var(--neo-dark);
    color: #fff;
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    border-radius: 2px;
  }

  .tab-btn.active-budget { background: var(--neo-green); transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--neo-dark); }
  .tab-btn.active-timeline { background: var(--neo-cyan); transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--neo-dark); }
  .tab-btn.active-vendors { background: var(--neo-purple); color: #fff; transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--neo-dark); }
  .tab-btn.active-vendors .tab-counter { background: #fff; color: var(--neo-dark); }
  .tab-btn.active-ideas { background: var(--neo-pink); color: #fff; transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--neo-dark); }
  .tab-btn.active-ideas .tab-counter { background: #fff; color: var(--neo-dark); }
  .tab-btn.active-copilot { background: var(--neo-yellow); transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--neo-dark); }

  /* Tab Content */
  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Budget Summary Cards */
  .budget-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .b-stat-card {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .bg-white { background: #fff; }
  .bg-green { background: var(--neo-green); }
  .bg-pink { background: var(--neo-pink); color: #fff; }
  .bg-yellow { background: var(--neo-yellow); }

  .b-stat-label { font-size: 0.75rem; font-weight: 800; }
  .b-stat-val { font-size: 1.9rem; font-weight: 900; }
  .b-stat-sub { font-size: 0.7rem; font-weight: 700; }

  /* Tab Actions Row */
  .tab-actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: #fff;
    border: var(--neo-border);
    box-shadow: var(--neo-shadow-sm);
    padding: 1rem 1.25rem;
  }

  .tab-section-title h3 {
    font-size: 1.25rem;
    margin-bottom: 0.2rem;
  }

  .tab-section-title p {
    font-size: 0.85rem;
    color: #666;
  }

  .tab-action-btns {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  /* Table styling */
  .table-container {
    background: #fff;
    overflow-x: auto;
    padding: 0;
  }

  .neo-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.88rem;
  }

  .neo-table th {
    background-color: var(--neo-yellow);
    border-bottom: var(--neo-border);
    padding: 0.75rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .neo-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }

  .neo-table tbody tr:hover {
    background-color: #FFFDF5;
  }

  .paid-badge-btn {
    border: var(--neo-border-thin);
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--neo-dark);
    transition: transform 0.1s ease;
  }

  .paid-badge-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }

  .paid-badge-btn.paid {
    background-color: var(--neo-green);
    color: var(--neo-dark);
  }

  .paid-badge-btn.unpaid {
    background-color: #f1f5f9;
    color: #64748b;
  }

  .cat-pill {
    background: #f8fafc;
    border: 1px solid var(--neo-dark);
    padding: 0.2rem 0.45rem;
    font-size: 0.75rem;
  }

  .priority-pill {
    padding: 0.2rem 0.45rem;
    font-size: 0.75rem;
    border: 1px solid var(--neo-dark);
  }

  .priority-critical { background: var(--neo-pink); color: #fff; }
  .priority-high { background: var(--neo-orange); color: #fff; }
  .priority-medium { background: var(--neo-yellow); color: var(--neo-dark); }
  .priority-low { background: #e2e8f0; color: #475569; }

  .over-actual { color: var(--neo-pink); font-weight: 900; }

  .row-btns {
    display: flex;
    gap: 0.35rem;
  }

  .row-btn {
    width: 28px;
    height: 28px;
    background: #fff;
    border: 1.5px solid var(--neo-dark);
    box-shadow: 1.5px 1.5px 0 var(--neo-dark);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: all 0.1s ease;
  }

  .row-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2.5px 2.5px 0 var(--neo-dark);
    background-color: var(--neo-yellow);
  }

  .row-btn.del:hover {
    background-color: var(--neo-pink);
  }

  /* Timeline */
  .timeline-progress-card {
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
  }

  .tp-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }

  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-card {
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    transition: all 0.1s ease;
  }

  .timeline-card.task-done {
    background: #f8fafc;
    opacity: 0.75;
  }

  .tl-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .tl-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tl-top {
    display: flex;
    gap: 0.5rem;
  }

  .phase-pill {
    background: var(--neo-yellow);
    border: 1px solid var(--neo-dark);
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.15rem 0.4rem;
  }

  .due-badge {
    font-size: 0.75rem;
    color: #555;
    font-weight: 700;
  }

  .tl-title {
    font-size: 1.05rem;
    letter-spacing: -0.01em;
  }

  .tl-title.strike {
    text-decoration: line-through;
    color: #64748b;
  }

  .tl-notes {
    font-size: 0.8rem;
    color: #555;
  }

  /* Vendors Grid */
  .vendors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .vendor-card {
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
  }

  .v-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .v-cat-pill {
    font-size: 0.75rem;
    font-weight: 800;
    background: #f1f5f9;
    border: 1px solid var(--neo-dark);
    padding: 0.2rem 0.5rem;
  }

  .v-status-pill {
    font-size: 0.7rem;
    font-weight: 900;
    padding: 0.2rem 0.5rem;
    border: 1.5px solid var(--neo-dark);
  }

  .status-booked { background: var(--neo-green); }
  .status-quoted { background: var(--neo-yellow); }
  .status-inquired { background: var(--neo-cyan); }
  .status-researching { background: #e2e8f0; color: #475569; }
  .status-declined { background: var(--neo-pink); color: #fff; }

  .v-name {
    font-size: 1.3rem;
  }

  .v-cost-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 0.35rem;
  }

  .v-contact-box {
    font-size: 0.75rem;
    color: #555;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .v-notes-box {
    background: #FFFDF5;
    border: 1px dashed var(--neo-dark);
    padding: 0.65rem;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .v-notes-label {
    font-weight: 800;
    font-size: 0.65rem;
    color: #777;
    display: block;
    margin-bottom: 0.25rem;
  }

  .v-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: var(--neo-border-thin);
    padding-top: 0.65rem;
    margin-top: auto;
  }

  /* Ideas Grid */
  .ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .idea-card {
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    position: relative;
  }

  .idea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .idea-tag-pill {
    background: var(--neo-yellow);
    border: 1.5px solid var(--neo-dark);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 800;
  }

  .vote-pill-btn {
    background: #fff;
    border: 1.5px solid var(--neo-dark);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .vote-pill-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
    background-color: var(--neo-pink);
    color: #fff;
  }

  .idea-title {
    font-size: 1.25rem;
  }

  .idea-desc {
    font-size: 0.88rem;
    color: #333;
    line-height: 1.4;
  }

  .idea-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: var(--neo-border-thin);
    padding-top: 0.65rem;
    margin-top: auto;
  }

  .idea-cat {
    font-size: 0.75rem;
    font-weight: 700;
    color: #666;
  }

  /* Copilot Tab */
  .copilot-container {
    background: #fff;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 550px;
  }

  .copilot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: var(--neo-border);
    padding-bottom: 0.75rem;
  }

  .copilot-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .copilot-avatar-box {
    width: 38px;
    height: 38px;
    background-color: var(--neo-purple);
    color: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .copilot-title-group h3 {
    font-size: 1.25rem;
  }

  .copilot-title-group p {
    font-size: 0.75rem;
    color: #666;
  }

  .copilot-messages {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .message-bubble {
    padding: 1rem;
    border: var(--neo-border-thin);
    box-shadow: var(--neo-shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .message-bubble.assistant {
    background-color: #FFFDF5;
    border-left: 6px solid var(--neo-purple);
  }

  .message-bubble.user {
    background-color: var(--neo-cyan);
    align-self: flex-end;
    max-width: 85%;
  }

  .message-bubble.thinking {
    background-color: var(--neo-yellow);
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .msg-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    font-weight: 800;
    color: #666;
  }

  .sender-label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .contact-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .badge-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .msg-text {
    font-size: 0.92rem;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .quick-prompts {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .qp-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #666;
  }

  .qp-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    background: #f1f5f9;
    border: 1px solid var(--neo-dark);
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .qp-btn:hover {
    background: var(--neo-yellow);
  }

  .copilot-form {
    display: flex;
    gap: 0.6rem;
  }

  .copilot-input {
    flex: 1;
  }

  .copilot-send-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* Empty Tab Box */
  .empty-tab-box {
    background: #fff;
    padding: 2.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: #666;
  }

  /* AI Output Modal text */
  .ai-rendered-output {
    background: #FFFDF5;
    border: var(--neo-border-thin);
    padding: 1rem;
    max-height: 480px;
    overflow-y: auto;
  }

  .ai-rendered-output pre {
    font-family: var(--font-body);
    white-space: pre-wrap;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .modal-top-bar { height: 10px; border-bottom: var(--neo-border); }
  .modal-header {
    padding: 1.25rem 1.5rem;
    background-color: var(--neo-yellow);
    border-bottom: var(--neo-border);
  }
  .modal-title { font-size: 1.4rem; }
  .modal-sub { font-size: 0.75rem; font-weight: 800; color: #555; }
  .modal-body { padding: 1.5rem; }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: var(--neo-border);
    background-color: var(--neo-muted);
  }
</style>
