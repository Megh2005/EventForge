<script lang="ts">
  import type { EventItem, EventType } from '../types';
  import { events, vaultConfig, deleteEventFromDisk, saveSingleEvent, seedStarterEvents, exportVaultJSON } from '../storage';
  import { playClick, playSuccess } from '../sound';
  import { formatMoney, getCurrencySymbol } from '../currency';
  import { 
    Heart, 
    Cake, 
    Users, 
    Search, 
    Download, 
    FolderOpen, 
    Plus, 
    Layers, 
    Palette, 
    Flame, 
    Clock, 
    Calendar, 
    MapPin, 
    CheckSquare, 
    Briefcase, 
    Lightbulb, 
    Copy, 
    Trash2, 
    ArrowRight 
  } from '@lucide/svelte';

  export let onSelectEvent: (event: EventItem) => void;
  export let onNewEvent: () => void;

  let activeFilter: 'all' | EventType = 'all';
  let searchQuery = '';

  $: filteredEvents = $events.filter(e => {
    const matchesFilter = activeFilter === 'all' || e.type === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      e.title.toLowerCase().includes(q) || 
      (e.location && e.location.toLowerCase().includes(q)) || 
      (e.themeVibe && e.themeVibe.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Aggregate stats in current selected global currency
  $: globalSymbol = $vaultConfig.currencySymbol || '$';
  $: totalBudget = $events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0);
  $: totalSpent = $events.reduce((sum, e) => {
    const fromItems = e.budgetItems ? e.budgetItems.reduce((acc, i) => acc + (Number(i.actual) || 0), 0) : 0;
    return sum + (fromItems > 0 ? fromItems : (Number(e.spent) || 0));
  }, 0);
  $: totalVendors = $events.reduce((sum, e) => sum + (e.vendors ? e.vendors.length : 0), 0);
  $: totalTasks = $events.reduce((sum, e) => sum + (e.timeline ? e.timeline.length : 0), 0);

  function getDaysRemaining(dateStr: string): number {
    const target = new Date(dateStr).getTime();
    const now = new Date().setHours(0,0,0,0);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function handleFilterClick(f: 'all' | EventType) {
    playClick();
    activeFilter = f;
  }

  async function handleDuplicate(event: EventItem, e: MouseEvent) {
    e.stopPropagation();
    playClick();
    const cloned: EventItem = {
      ...JSON.parse(JSON.stringify(event)),
      id: `${event.type}-copy-${Date.now().toString(36)}`,
      title: `${event.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveSingleEvent(cloned);
    playSuccess();
  }

  async function handleDelete(id: string, title: string, e: MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete "${title}" from your computer disk?`)) {
      await deleteEventFromDisk(id);
    }
  }

  async function handleSeedStarter() {
    playClick();
    await seedStarterEvents();
  }
</script>

<div class="dashboard-wrap">
  <!-- Top Stat Metrics Bar -->
  <section class="metrics-grid">
    <div class="metric-card neo-card-flat metric-yellow">
      <span class="metric-label font-mono">TOTAL EVENTS SAVED</span>
      <div class="metric-val">{$events.length}</div>
      <span class="metric-sub font-mono">STORED IN LOCAL ROM</span>
    </div>

    <div class="metric-card neo-card-flat metric-green">
      <span class="metric-label font-mono">AGGREGATE BUDGET</span>
      <div class="metric-val">{formatMoney(totalBudget, globalSymbol)}</div>
      <span class="metric-sub font-mono">PRIMARY CURRENCY: {$vaultConfig.currency || 'USD'}</span>
    </div>

    <div class="metric-card neo-card-flat metric-pink">
      <span class="metric-label font-mono">TOTAL COMMITTED</span>
      <div class="metric-val">{formatMoney(totalSpent, globalSymbol)}</div>
      <span class="metric-sub font-mono">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% OF ALLOCATED</span>
    </div>

    <div class="metric-card neo-card-flat metric-cyan">
      <span class="metric-label font-mono">VENDORS & TASKS</span>
      <div class="metric-val">{totalVendors} / {totalTasks}</div>
      <span class="metric-sub font-mono">IN PROGRESS PIPELINE</span>
    </div>
  </section>

  <!-- Controls Bar: Filter tabs + Search + Actions -->
  <section class="controls-bar">
    <div class="filter-pills">
      <button 
        class="filter-pill {activeFilter === 'all' ? 'active' : ''}" 
        on:click={() => handleFilterClick('all')}
        type="button"
      >
        <span>ALL ({$events.length})</span>
      </button>

      <button 
        class="filter-pill {activeFilter === 'wedding' ? 'active' : ''}" 
        on:click={() => handleFilterClick('wedding')}
        type="button"
      >
        <Heart size={14} strokeWidth={2.5} />
        <span>WEDDINGS ({$events.filter(e => e.type === 'wedding').length})</span>
      </button>

      <button 
        class="filter-pill {activeFilter === 'birthday' ? 'active' : ''}" 
        on:click={() => handleFilterClick('birthday')}
        type="button"
      >
        <Cake size={14} strokeWidth={2.5} />
        <span>BIRTHDAYS ({$events.filter(e => e.type === 'birthday').length})</span>
      </button>

      <button 
        class="filter-pill {activeFilter === 'community' ? 'active' : ''}" 
        on:click={() => handleFilterClick('community')}
        type="button"
      >
        <Users size={14} strokeWidth={2.5} />
        <span>COMMUNITY ({$events.filter(e => e.type === 'community').length})</span>
      </button>
    </div>

    <div class="actions-group">
      <div class="search-box">
        <span class="search-icon">
          <Search size={16} strokeWidth={2.5} />
        </span>
        <input 
          type="text" 
          class="neo-input search-input font-mono" 
          bind:value={searchQuery} 
          aria-label="Filter events by keyword"
        />
      </div>

      <button class="neo-btn neo-btn-sm neo-btn-white" on:click={exportVaultJSON} type="button">
        <Download size={14} strokeWidth={2.5} />
        <span>EXPORT BACKUP</span>
      </button>
    </div>
  </section>

  <!-- Events Grid -->
  {#if filteredEvents.length === 0}
    <div class="empty-state neo-card">
      <div class="empty-icon stripes-pattern">
        <FolderOpen size={36} strokeWidth={2.5} />
      </div>
      <h3 class="empty-title">NO EVENTS FOUND IN STORAGE</h3>
      <p class="empty-desc">
        {searchQuery ? 'No events match the search filter.' : 'Your local computer database currently has zero events saved.'}
      </p>
      <div class="empty-actions">
        <button class="neo-btn neo-btn-cyan" on:click={onNewEvent} type="button">
          <Plus size={16} strokeWidth={2.5} />
          <span>PLAN YOUR FIRST EVENT</span>
        </button>
        <button class="neo-btn neo-btn-green" on:click={handleSeedStarter} type="button">
          <Layers size={16} strokeWidth={2.5} />
          <span>LOAD STARTER TEMPLATES</span>
        </button>
      </div>
    </div>
  {:else}
    <div class="events-grid">
      {#each filteredEvents as event (event.id)}
        {@const eventSymbol = event.currencySymbol || getCurrencySymbol(event.currency || $vaultConfig.currency || 'USD')}
        {@const daysLeft = getDaysRemaining(event.date)}
        {@const eventSpent = event.budgetItems && event.budgetItems.length > 0 
          ? event.budgetItems.reduce((acc, b) => acc + (Number(b.actual) || 0), 0)
          : Number(event.spent) || 0}
        {@const spendPct = event.budget > 0 ? Math.min(100, Math.round((eventSpent / event.budget) * 100)) : 0}
        {@const isOver = eventSpent > event.budget}
        {@const tasksTotal = event.timeline ? event.timeline.length : 0}
        {@const tasksDone = event.timeline ? event.timeline.filter(t => t.completed).length : 0}

        <div 
          class="event-card neo-card" 
          on:click={() => { playClick(); onSelectEvent(event); }} 
          role="button" 
          tabindex="0"
          on:keydown={(e) => { if (e.key === 'Enter') onSelectEvent(event); }}
        >
          <!-- Top Row: Type & Countdown -->
          <div class="card-top-row">
            <span class="neo-badge 
              {event.type === 'wedding' ? 'neo-badge-pink' : 
               event.type === 'birthday' ? 'neo-badge-yellow' : 
               event.type === 'community' ? 'neo-badge-green' : 'neo-badge-cyan'}"
            >
              {event.type.toUpperCase()}
            </span>

            <span class="days-badge font-mono {daysLeft < 0 ? 'passed' : daysLeft <= 14 ? 'urgent' : ''}">
              {#if daysLeft < 0}
                PASSED
              {:else if daysLeft === 0}
                <Flame size={12} strokeWidth={2.5} />
                <span>TODAY!</span>
              {:else}
                <Clock size={12} strokeWidth={2.5} />
                <span>{daysLeft} DAYS LEFT</span>
              {/if}
            </span>
          </div>

          <!-- Title & Theme -->
          <h3 class="event-title">{event.title}</h3>
          
          {#if event.themeVibe}
            <div class="theme-box">
              <span class="theme-icon">
                <Palette size={14} strokeWidth={2.5} />
              </span>
              <span class="theme-text">{event.themeVibe}</span>
            </div>
          {/if}

          <!-- Metadata row: Date, Location, Guests -->
          <div class="meta-row font-mono">
            <span>
              <Calendar size={13} strokeWidth={2.5} />
              <span>{event.date}</span>
            </span>
            {#if event.location}
              <span>
                <MapPin size={13} strokeWidth={2.5} />
                <span>{event.location}</span>
              </span>
            {/if}
            <span>
              <Users size={13} strokeWidth={2.5} />
              <span>{event.guestCount || 0} GUESTS</span>
            </span>
            <span class="currency-tag font-mono">{event.currency || 'USD'}</span>
          </div>

          <!-- Budget Progress Bar -->
          <div class="budget-section">
            <div class="budget-info-row font-mono">
              <span class="b-label">BUDGET TRACKER:</span>
              <strong class="{isOver ? 'text-over' : ''}">
                {formatMoney(eventSpent, eventSymbol)} / {formatMoney(event.budget, eventSymbol)} ({spendPct}%)
              </strong>
            </div>
            <div class="neo-progress-wrap">
              <div 
                class="neo-progress-fill {isOver ? 'overbudget' : ''}" 
                style="width: {spendPct}%"
              ></div>
            </div>
          </div>

          <!-- Timeline & Vendor Quick Chips -->
          <div class="chips-row font-mono">
            <span class="chip">
              <CheckSquare size={13} strokeWidth={2.5} />
              <span>TASKS: {tasksDone}/{tasksTotal}</span>
            </span>
            <span class="chip">
              <Briefcase size={13} strokeWidth={2.5} />
              <span>VENDORS: {event.vendors ? event.vendors.length : 0}</span>
            </span>
            <span class="chip">
              <Lightbulb size={13} strokeWidth={2.5} />
              <span>IDEAS: {event.ideas ? event.ideas.length : 0}</span>
            </span>
          </div>

          <!-- Card Bottom Action Row -->
          <div class="card-bottom-row">
            <button class="neo-btn neo-btn-sm neo-btn-cyan planner-cta-btn" on:click|stopPropagation={() => { playClick(); onSelectEvent(event); }} type="button">
              <span>OPEN PLANNER</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>

            <div class="sub-actions">
              <button 
                class="icon-action-btn" 
                title="Duplicate event" 
                on:click={(e) => handleDuplicate(event, e)}
                type="button"
              >
                <Copy size={15} strokeWidth={2.5} />
              </button>
              <button 
                class="icon-action-btn delete-btn" 
                title="Delete event from disk" 
                on:click={(e) => handleDelete(event.id, event.title, e)}
                type="button"
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dashboard-wrap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1.25rem;
    transition: transform 0.1s ease;
  }

  .metric-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 var(--neo-dark);
  }

  .metric-yellow { background-color: var(--neo-yellow); }
  .metric-green { background-color: var(--neo-green); }
  .metric-pink { background-color: var(--neo-pink); color: #fff; }
  .metric-pink .metric-label, .metric-pink .metric-sub { color: #ffe4e6; }
  .metric-cyan { background-color: var(--neo-cyan); }

  .metric-label {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .metric-val {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 900;
    line-height: 1;
  }

  .metric-sub {
    font-size: 0.7rem;
    font-weight: 700;
  }

  /* Controls Bar */
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background-color: var(--neo-surface);
    border: var(--neo-border);
    box-shadow: var(--neo-shadow);
    padding: 0.85rem 1.25rem;
  }

  .filter-pills {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.45rem 0.85rem;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .filter-pill:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
    background-color: var(--neo-muted);
  }

  .filter-pill.active {
    background-color: var(--neo-yellow);
    border-color: var(--neo-dark);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }

  .actions-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.65rem;
    pointer-events: none;
    color: #475569;
  }

  .search-input {
    padding-left: 2.2rem;
    font-size: 0.85rem;
    width: 250px;
    height: 38px;
  }

  /* Events Grid */
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.5rem;
  }

  .event-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    cursor: pointer;
    background: #fff;
    user-select: none;
    text-align: left;
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .days-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 800;
    background: #f1f5f9;
    border: 1px solid var(--neo-dark);
    padding: 0.2rem 0.5rem;
  }

  .days-badge.urgent {
    background: var(--neo-yellow);
    color: var(--neo-dark);
  }

  .days-badge.passed {
    background: #e2e8f0;
    color: #64748b;
  }

  .event-title {
    font-size: 1.35rem;
    letter-spacing: -0.02em;
    color: var(--neo-dark);
  }

  .theme-box {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #FFFDF5;
    border: 1px dashed var(--neo-dark);
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #333;
  }

  .theme-icon {
    color: var(--neo-pink);
  }

  .meta-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    font-weight: 700;
    color: #555;
    align-items: center;
  }

  .meta-row span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .currency-tag {
    background: var(--neo-yellow);
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--neo-dark);
    font-size: 0.7rem;
    font-weight: 900;
  }

  .budget-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .budget-info-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
  }

  .b-label {
    color: #666;
    font-weight: 800;
  }

  .text-over {
    color: var(--neo-pink);
  }

  .chips-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 800;
    background: #f8fafc;
    border: 1px solid var(--neo-dark);
    padding: 0.2rem 0.45rem;
  }

  .planner-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .card-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: var(--neo-border-thin);
    padding-top: 0.75rem;
    margin-top: 0.25rem;
  }

  .sub-actions {
    display: flex;
    gap: 0.4rem;
  }

  .icon-action-btn {
    width: 32px;
    height: 32px;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
  }

  .icon-action-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
    background-color: var(--neo-yellow);
  }

  .icon-action-btn.delete-btn:hover {
    background-color: var(--neo-pink);
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background: #fff;
  }

  .empty-icon {
    width: 70px;
    height: 70px;
    border: var(--neo-border);
    box-shadow: 4px 4px 0 var(--neo-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
  }

  .empty-title {
    font-size: 1.5rem;
  }

  .empty-desc {
    max-width: 480px;
    font-size: 0.95rem;
    color: #555;
    line-height: 1.4;
  }

  .empty-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.5rem;
  }
</style>
