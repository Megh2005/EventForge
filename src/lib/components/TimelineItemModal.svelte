<script lang="ts">
  import type { TimelineItem } from '../types';
  import { playClick, playSuccess } from '../sound';
  import { Check, Clock, HardDrive } from '@lucide/svelte';

  export let item: TimelineItem | null = null;
  export let onSave: (item: TimelineItem) => void;
  export let onClose: () => void;

  let title = item?.title || '';
  let phase = item?.phase || 'day-of';
  let dueDate = item?.dueDate || new Date().toISOString().slice(0, 10);
  let completed = item?.completed || false;
  let notes = item?.notes || '';

  const phases = [
    { id: '6-months', label: '6 Months Out' },
    { id: '3-months', label: '3 Months Out' },
    { id: '1-month', label: '1 Month Out' },
    { id: '2-weeks', label: '2 Weeks Out' },
    { id: '1-week', label: 'Final Week Countdown' },
    { id: 'day-of', label: 'Day of Event (Run of Show)' },
    { id: 'post-event', label: 'Post-Event Wrap-up' }
  ];

  function handleSubmit() {
    playClick();
    if (!title.trim()) return;

    const saved: TimelineItem = {
      id: item?.id || `t-${Date.now().toString(36)}`,
      title: title.trim(),
      phase,
      dueDate,
      completed,
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
      <h3 class="modal-title">{item ? 'EDIT TIMELINE MILESTONE' : 'ADD TIMELINE / RUN-OF-SHOW TASK'}</h3>
      <p class="modal-sub font-mono">DIRECT DISK WRITE // LOCAL STORAGE PERSISTENCE</p>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label class="neo-label" for="t-title">TASK OR SCHEDULE TITLE:</label>
        <input 
          id="t-title" 
          type="text" 
          class="neo-input" 
          bind:value={title} 
        />
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="t-phase">PHASE:</label>
          <select id="t-phase" class="neo-select font-mono" bind:value={phase}>
            {#each phases as p}
              <option value={p.id}>{p.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="t-date">TARGET DATE / TIME:</label>
          <input 
            id="t-date" 
            type="text" 
            class="neo-input font-mono" 
            bind:value={dueDate} 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="neo-label" for="t-notes">COORDINATOR CUES / LOGISTICS NOTES:</label>
        <textarea 
          id="t-notes" 
          class="neo-textarea" 
          rows="3" 
          bind:value={notes}
        ></textarea>
      </div>

      <div class="completed-box">
        <label class="neo-checkbox-container">
          <input type="checkbox" class="neo-checkbox" bind:checked={completed} />
          <span class="c-label font-mono">
            {#if completed}
              <Check size={14} strokeWidth={3} />
              <span>MARKED AS COMPLETED</span>
            {:else}
              <Clock size={14} strokeWidth={2.5} />
              <span>PENDING / IN PROGRESS</span>
            {/if}
          </span>
        </label>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="neo-btn neo-btn-white" on:click={onClose}>
        CANCEL
      </button>
      <button type="button" class="neo-btn neo-btn-cyan modal-save-btn" on:click={handleSubmit}>
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
    background-color: var(--neo-cyan);
    border-bottom: var(--neo-border);
  }
  .modal-title { font-size: 1.4rem; }
  .modal-sub { font-size: 0.75rem; font-weight: 800; color: #04383f; }
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group { display: flex; flex-direction: column; }
  .form-row { display: flex; gap: 1rem; }
  .flex-1 { flex: 1; }
  .completed-box {
    background-color: #FFFDF5;
    border: var(--neo-border-thin);
    padding: 0.75rem;
    box-shadow: 2px 2px 0 var(--neo-dark);
  }
  .c-label { 
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
