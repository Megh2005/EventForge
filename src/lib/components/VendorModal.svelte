<script lang="ts">
  import type { VendorItem, VendorStatus } from '../types';
  import { playClick, playSuccess } from '../sound';
  import { HardDrive } from '@lucide/svelte';

  export let item: VendorItem | null = null;
  export let currencySymbol: string = '$';
  export let onSave: (item: VendorItem) => void;
  export let onClose: () => void;

  let name = item?.name || '';
  let category = item?.category || 'Photography & Cinema';
  let contact = item?.contact || '';
  let phone = item?.phone || '';
  let status: VendorStatus = item?.status || 'Researching';
  let cost = item?.cost || 0;
  let rating = item?.rating || 5;
  let notes = item?.notes || '';

  const categories = [
    'Venue & Facilities',
    'Catering & Bar',
    'Photography & Cinema',
    'DJ, Band & Sound',
    'Floral Design & Decor',
    'Lighting & AV Production',
    'Event Coordinator / Day-Of',
    'Hair & Makeup',
    'Transportation & Valet',
    'Bakehouse & Cake Art',
    'Security & Permits'
  ];

  const statuses: VendorStatus[] = ['Researching', 'Inquired', 'Quoted', 'Booked', 'Declined'];

  function handleSubmit() {
    playClick();
    if (!name.trim()) return;

    const saved: VendorItem = {
      id: item?.id || `v-${Date.now().toString(36)}`,
      name: name.trim(),
      category,
      contact: contact.trim(),
      phone: phone.trim(),
      status,
      cost: Number(cost) || 0,
      rating: Number(rating) || 5,
      notes: notes.trim()
    };

    playSuccess();
    onSave(saved);
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
      <h3 class="modal-title">{item ? 'EDIT VENDOR PROFILE' : 'ADD NEW VENDOR'}</h3>
      <p class="modal-sub font-mono">AUTOSAVES TO INTERNAL COMPUTER STORAGE</p>
    </div>

    <div class="modal-body">
      <div class="form-row">
        <div class="form-group flex-2">
          <label class="neo-label" for="v-name">VENDOR / BUSINESS NAME:</label>
          <input 
            id="v-name" 
            type="text" 
            class="neo-input" 
            bind:value={name} 
          />
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="v-cat">CATEGORY:</label>
          <select id="v-cat" class="neo-select font-mono" bind:value={category}>
            {#each categories as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="v-status">STATUS:</label>
          <select id="v-status" class="neo-select font-mono" bind:value={status}>
            {#each statuses as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="v-cost">QUOTED / AGREED PRICE ({currencySymbol}):</label>
          <input 
            id="v-cost" 
            type="number" 
            class="neo-input font-mono" 
            bind:value={cost} 
            step="50" 
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="v-contact">EMAIL / WEBSITE:</label>
          <input 
            id="v-contact" 
            type="text" 
            class="neo-input font-mono" 
            bind:value={contact} 
          />
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="v-phone">PHONE NUMBER:</label>
          <input 
            id="v-phone" 
            type="text" 
            class="neo-input font-mono" 
            bind:value={phone} 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="neo-label" for="v-notes">CONTRACT SCOPE & VENDOR QUESTIONS:</label>
        <textarea 
          id="v-notes" 
          class="neo-textarea" 
          rows="3" 
          placeholder="e.g. Inquired about raw image deliverable, requires 30% deposit upon signature, meal provided during reception." 
          bind:value={notes}
        ></textarea>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="neo-btn neo-btn-white" on:click={onClose}>
        CANCEL
      </button>
      <button type="button" class="neo-btn neo-btn-purple modal-save-btn" on:click={handleSubmit}>
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
    background-color: var(--neo-purple);
    color: #fff;
    border-bottom: var(--neo-border);
  }
  .modal-title { font-size: 1.4rem; color: #fff; }
  .modal-sub { font-size: 0.75rem; font-weight: 800; color: #f3e8ff; }
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group { display: flex; flex-direction: column; }
  .form-row { display: flex; gap: 1rem; }
  .flex-1 { flex: 1; }
  .flex-2 { flex: 2; }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: var(--neo-border);
    background-color: var(--neo-muted);
  }
  .modal-save-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
</style>
