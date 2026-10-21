<script lang="ts">
  import type { BudgetItem, PriorityLevel } from '../types';
  import { playClick, playSuccess } from '../sound';
  import { Check, Clock, HardDrive } from '@lucide/svelte';

  export let item: BudgetItem | null = null;
  export let currencySymbol: string = '$';
  export let onSave: (item: BudgetItem) => void;
  export let onClose: () => void;

  let title = item?.title || '';
  let category = item?.category || 'Venue & Rentals';
  let estimated = item?.estimated || 0;
  let actual = item?.actual || 0;
  let paid = item?.paid || false;
  let priority: PriorityLevel = item?.priority || 'high';

  const categories = [
    'Venue & Rentals',
    'Catering & Drinks',
    'Photo & Video',
    'Music & Entertainment',
    'Florals & Decor',
    'Attire & Beauty',
    'Invitations & Print',
    'Favors & Gifts',
    'Permits & Security',
    'Contingency Buffer'
  ];

  function handleSubmit() {
    playClick();
    if (!title.trim()) return;

    const savedItem: BudgetItem = {
      id: item?.id || `b-${Date.now().toString(36)}`,
      title: title.trim(),
      category,
      estimated: Number(estimated) || 0,
      actual: Number(actual) || 0,
      paid,
      priority
    };

    playSuccess();
    onSave(savedItem);
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
      <h3 class="modal-title">{item ? 'EDIT BUDGET EXPENSE' : 'ADD NEW BUDGET EXPENSE'}</h3>
      <p class="modal-sub font-mono">ALL CHANGES SAVE DIRECTLY TO YOUR COMPUTER DISK</p>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label class="neo-label" for="b-title">EXPENSE DESCRIPTION:</label>
        <input 
          id="b-title" 
          type="text" 
          class="neo-input" 
          bind:value={title} 
        />
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="b-cat">CATEGORY:</label>
          <select id="b-cat" class="neo-select font-mono" bind:value={category}>
            {#each categories as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="b-priority">PRIORITY TIER:</label>
          <select id="b-priority" class="neo-select font-mono" bind:value={priority}>
            <option value="critical">Critical (Must Have)</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Nice to Have</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="b-est">ESTIMATED COST ({currencySymbol}):</label>
          <input 
            id="b-est" 
            type="number" 
            class="neo-input font-mono" 
            bind:value={estimated} 
            step="10" 
          />
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="b-act">ACTUAL COMMITTED ({currencySymbol}):</label>
          <input 
            id="b-act" 
            type="number" 
            class="neo-input font-mono" 
            bind:value={actual} 
            step="10" 
          />
        </div>
      </div>

      <div class="paid-toggle-box">
        <label class="neo-checkbox-container">
          <input type="checkbox" class="neo-checkbox" bind:checked={paid} />
          <span class="paid-label font-mono">
            {#if paid}
              <Check size={14} strokeWidth={3} />
              <span>FULLY PAID & SETTLED</span>
            {:else}
              <Clock size={14} strokeWidth={2.5} />
              <span>UNPAID / DEPOSIT PENDING</span>
            {/if}
          </span>
        </label>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="neo-btn neo-btn-white" on:click={onClose}>
        CANCEL
      </button>
      <button type="button" class="neo-btn neo-btn-green modal-save-btn" on:click={handleSubmit}>
        <HardDrive size={15} strokeWidth={2.5} />
        <span>SAVE TO DISK</span>
      </button>
    </div>
  </div>
</div>

<style>
  .modal-top-bar { height: 10px; border-bottom: var(--neo-border); }
  .modal-header {
    padding: 1.25rem 1.5rem;
    background-color: var(--neo-green);
    border-bottom: var(--neo-border);
  }
  .modal-title { font-size: 1.4rem; }
  .modal-sub { font-size: 0.75rem; font-weight: 800; color: #1e3a1e; }
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group { display: flex; flex-direction: column; }
  .form-row { display: flex; gap: 1rem; }
  .flex-1 { flex: 1; }
  .paid-toggle-box {
    background-color: #FFFDF5;
    border: var(--neo-border-thin);
    padding: 0.75rem;
    box-shadow: 2px 2px 0 var(--neo-dark);
  }
  .paid-label { 
    font-weight: 800; 
    font-size: 0.85rem; 
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .modal-save-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: var(--neo-border);
    background-color: var(--neo-muted);
  }
</style>
