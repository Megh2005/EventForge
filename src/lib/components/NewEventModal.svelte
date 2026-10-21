<script lang="ts">
  import type { EventItem, EventType } from '../types';
  import { generateFullBlueprint } from '../ai';
  import { saveSingleEvent, vaultConfig } from '../storage';
  import { playClick, playSuccess } from '../sound';
  import { POPULAR_CURRENCIES, getCurrencySymbol } from '../currency';
  import confetti from 'canvas-confetti';
  import { Heart, Cake, Users, Compass, Bot, Cpu, FileEdit, HardDrive, Zap } from '@lucide/svelte';

  export let onClose: () => void;
  export let onEventCreated: (event: EventItem) => void;

  let mode: 'ai' | 'manual' = 'ai';
  let isGenerating = false;
  let errorMsg = '';

  let eventType: EventType = 'wedding';
  let title = '';
  let themeVibe = '';
  let date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let budget = 15000;
  let guestCount = 80;
  let location = '';
  let notes = '';
  let selectedCurrency = $vaultConfig.currency || 'USD';

  const typeOptions = [
    { id: 'wedding' as EventType, label: 'Wedding', icon: Heart },
    { id: 'birthday' as EventType, label: 'Birthday', icon: Cake },
    { id: 'community' as EventType, label: 'Community Event', icon: Users },
    { id: 'custom' as EventType, label: 'Custom Celebration', icon: Compass }
  ];

  function handleSelectType(t: EventType) {
    playClick();
    eventType = t;
  }

  async function handleCreate() {
    playClick();
    if (!title.trim()) {
      errorMsg = 'Event title is required.';
      return;
    }

    const currencySymbol = getCurrencySymbol(selectedCurrency);
    const newId = `${eventType}-${Date.now().toString(36)}`;

    let newEvent: EventItem = {
      id: newId,
      title: title.trim(),
      type: eventType,
      date,
      location: location.trim(),
      guestCount: Number(guestCount) || 0,
      budget: Number(budget) || 0,
      spent: 0,
      currency: selectedCurrency,
      currencySymbol,
      themeVibe: themeVibe.trim(),
      notes: notes.trim(),
      colorScheme: ['#FFE600', '#FF2E93', '#25F482', '#0A0A0A'],
      budgetItems: [],
      timeline: [],
      vendors: [],
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (mode === 'ai') {
      if (!$vaultConfig.hasApiKey) {
        errorMsg = 'Google Gemini API key required for AI generation. Please add your API key in the top navigation bar.';
        return;
      }

      isGenerating = true;
      errorMsg = '';

      try {
        const blueprint = await generateFullBlueprint({
          title: newEvent.title,
          type: newEvent.type,
          themeVibe: newEvent.themeVibe,
          budget: newEvent.budget,
          guestCount: newEvent.guestCount,
          location: newEvent.location,
          currency: newEvent.currency,
          currencySymbol: newEvent.currencySymbol,
          notes: newEvent.notes
        });

        if (blueprint) {
          if (blueprint.colorScheme) newEvent.colorScheme = blueprint.colorScheme;
          if (blueprint.themeVibe) newEvent.themeVibe = blueprint.themeVibe;
          if (blueprint.overview) newEvent.notes = `${blueprint.overview}\n\n${newEvent.notes || ''}`.trim();

          if (Array.isArray(blueprint.budgetBreakdown)) {
            newEvent.budgetItems = blueprint.budgetBreakdown.map((b: any, i: number) => ({
              id: `b-${i}-${Date.now().toString(36)}`,
              category: b.category || 'General',
              title: b.title || `Item ${i+1}`,
              estimated: Number(b.estimated) || 0,
              actual: 0,
              paid: false,
              priority: b.priority || 'medium'
            }));
          }

          if (Array.isArray(blueprint.timeline)) {
            newEvent.timeline = blueprint.timeline.map((t: any, i: number) => ({
              id: `t-${i}-${Date.now().toString(36)}`,
              title: t.title || `Milestone ${i+1}`,
              phase: t.phase || 'Planning',
              dueDate: t.dueDate || newEvent.date,
              completed: false,
              notes: t.notes || ''
            }));
          }

          if (Array.isArray(blueprint.vendorChecklist)) {
            newEvent.vendors = blueprint.vendorChecklist.map((v: any, i: number) => ({
              id: `v-${i}-${Date.now().toString(36)}`,
              name: `Prospective ${v.category || 'Vendor'}`,
              category: v.category || 'Service',
              contact: '',
              status: 'Researching',
              cost: 0,
              notes: Array.isArray(v.questions) ? v.questions.join('\n• ') : ''
            }));
          }

          if (Array.isArray(blueprint.personalizedIdeas)) {
            newEvent.ideas = blueprint.personalizedIdeas.map((idea: any, i: number) => ({
              id: `i-${i}-${Date.now().toString(36)}`,
              title: idea.title || `Idea ${i+1}`,
              category: idea.category || 'Creative',
              description: idea.description || '',
              votes: 1,
              tag: 'AI Spark'
            }));
          }
        }
      } catch (err: any) {
        errorMsg = `AI Generation failed: ${err.message}`;
        isGenerating = false;
        return;
      }
    }

    // Persist immediately to internal computer storage (ROM)
    await saveSingleEvent(newEvent);
    isGenerating = false;
    playSuccess();

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    onEventCreated(newEvent);
  }
</script>

<div 
  class="neo-modal-backdrop" 
  on:click={(e) => { if (e.target === e.currentTarget) onClose(); }} 
  on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
  role="dialog" 
  aria-modal="true" 
  tabindex="-1"
>
  <div class="neo-modal-content">
    <div class="modal-top-bar stripes-pattern"></div>
    
    <div class="modal-header">
      <div class="header-badge-row">
        <span class="neo-badge neo-badge-green">LOCAL DISK DATABASE</span>
        <span class="neo-badge neo-badge-cyan">GEMINI 3.5 FLASH</span>
      </div>
      <h2 class="modal-title">PLAN A NEW EVENT</h2>
      <p class="modal-subtitle">
        Set up budgets, timelines, vendor checklists, and creative ideas. Stored directly on your computer disk.
      </p>

      <!-- Mode Switcher -->
      <div class="mode-tabs">
        <button 
          type="button" 
          class="mode-btn {mode === 'ai' ? 'active-ai' : ''}" 
          on:click={() => { playClick(); mode = 'ai'; }}
        >
          <Bot size={16} strokeWidth={2.5} />
          <span>GEMINI 3.5 FLASH AUTO-PLANNER</span>
        </button>
        <button 
          type="button" 
          class="mode-btn {mode === 'manual' ? 'active-manual' : ''}" 
          on:click={() => { playClick(); mode = 'manual'; }}
        >
          <FileEdit size={16} strokeWidth={2.5} />
          <span>BLANK EVENT TEMPLATE</span>
        </button>
      </div>
    </div>

    <div class="modal-body">
      <!-- Event Type Selector -->
      <div class="form-group">
        <span class="neo-label">1. CELEBRATION CATEGORY:</span>
        <div class="types-grid">
          {#each typeOptions as opt}
            <button 
              type="button" 
              class="type-btn {eventType === opt.id ? 'active' : ''}" 
              on:click={() => handleSelectType(opt.id)}
            >
              <span class="type-icon-wrapper">
                <svelte:component this={opt.icon} size={22} strokeWidth={2.5} />
              </span>
              <span class="type-label">{opt.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Title & Date -->
      <div class="form-row">
        <div class="form-group flex-2">
          <label class="neo-label" for="event-title">2. EVENT TITLE:</label>
          <input 
            id="event-title"
            type="text" 
            class="neo-input" 
            bind:value={title} 
          />
        </div>
        <div class="form-group flex-1">
          <label class="neo-label" for="event-date">3. DATE:</label>
          <input 
            id="event-date"
            type="date" 
            class="neo-input font-mono" 
            bind:value={date} 
          />
        </div>
      </div>

      <!-- Currency & Budget -->
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="event-currency">4. CURRENCY:</label>
          <select id="event-currency" class="neo-select font-mono" bind:value={selectedCurrency}>
            {#each POPULAR_CURRENCIES as c}
              <option value={c.code}>{c.code} ({c.symbol})</option>
            {/each}
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="event-budget">
            5. TARGET BUDGET ({getCurrencySymbol(selectedCurrency)}):
          </label>
          <input 
            id="event-budget"
            type="number" 
            class="neo-input font-mono" 
            bind:value={budget} 
            step="100" 
          />
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="event-guests">6. GUEST COUNT:</label>
          <input 
            id="event-guests"
            type="number" 
            class="neo-input font-mono" 
            bind:value={guestCount} 
            step="5" 
          />
        </div>
      </div>

      <!-- Location & Theme -->
      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="event-location">7. LOCATION / CITY:</label>
          <input 
            id="event-location"
            type="text" 
            class="neo-input" 
            bind:value={location} 
          />
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="event-theme">8. THEME & AESTHETIC VIBE:</label>
          <input 
            id="event-theme"
            type="text" 
            class="neo-input" 
            bind:value={themeVibe} 
          />
        </div>
      </div>

      <!-- Notes / Vision -->
      <div class="form-group">
        <label class="neo-label" for="event-notes">9. SPECIAL REQUIREMENTS & VISION (OPTIONAL):</label>
        <textarea 
          id="event-notes"
          class="neo-textarea" 
          rows="2" 
          bind:value={notes} 
        ></textarea>
      </div>

      {#if errorMsg}
        <div class="error-banner font-mono">{errorMsg}</div>
      {/if}

      {#if isGenerating}
        <div class="generating-box stripes-pattern">
          <div class="generating-inner">
            <Zap size={22} strokeWidth={2.5} class="gen-spinner" />
            <strong>GEMINI 3.5 FLASH IS DYNAMICALLY ARCHITECTING YOUR PLAN...</strong>
            <p>Calculating category budgets in {selectedCurrency}, generating timeline milestones, and curating vendor scope of work.</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button type="button" class="neo-btn neo-btn-white" on:click={onClose} disabled={isGenerating}>
        CANCEL
      </button>

      <button 
        type="button" 
        class="neo-btn neo-btn-cyan create-submit-btn" 
        on:click={handleCreate} 
        disabled={isGenerating}
      >
        {#if isGenerating}
          <span>GENERATING...</span>
        {:else if mode === 'ai'}
          <Cpu size={16} strokeWidth={2.5} />
          <span>GENERATE WITH GEMINI</span>
        {:else}
          <HardDrive size={16} strokeWidth={2.5} />
          <span>SAVE EVENT TO DISK</span>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .modal-top-bar {
    height: 12px;
    width: 100%;
    border-bottom: var(--neo-border);
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: var(--neo-border);
    background-color: var(--neo-yellow);
  }

  .header-badge-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .modal-title {
    font-size: 1.55rem;
    margin-bottom: 0.35rem;
  }

  .modal-subtitle {
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    margin-bottom: 0.85rem;
  }

  .mode-tabs {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .mode-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.8rem;
    padding: 0.5rem;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    background: #fff;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .mode-btn.active-ai {
    background: var(--neo-green);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }

  .mode-btn.active-manual {
    background: var(--neo-pink);
    color: #fff;
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .flex-1 { flex: 1; }
  .flex-2 { flex: 2; }

  .types-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.65rem 0.4rem;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .type-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--neo-dark);
    background-color: var(--neo-muted);
  }

  .type-btn.active {
    background-color: var(--neo-yellow);
    border: var(--neo-border);
    box-shadow: 4px 4px 0 var(--neo-dark);
    transform: translate(-1px, -1px);
  }

  .type-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    color: var(--neo-dark);
  }

  .type-label {
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .create-submit-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .generating-box {
    padding: 3px;
    border: var(--neo-border);
    box-shadow: var(--neo-shadow);
  }

  .generating-inner {
    background: #fff;
    padding: 1rem;
    text-align: center;
  }

  .gen-spinner {
    display: inline-block;
    font-size: 2rem;
    animation: bounce 0.6s infinite alternate;
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-8px); }
  }

  .error-banner {
    background: var(--neo-pink);
    color: #fff;
    padding: 0.65rem;
    font-size: 0.85rem;
    font-weight: 800;
    border: var(--neo-border-thin);
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-top: var(--neo-border);
    background-color: var(--neo-muted);
  }
</style>
