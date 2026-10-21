<script lang="ts">
  import type { IdeaItem } from '../types';
  import { playClick, playSuccess } from '../sound';
  import { Lightbulb } from '@lucide/svelte';

  export let item: IdeaItem | null = null;
  export let onSave: (item: IdeaItem) => void;
  export let onClose: () => void;

  let title = item?.title || '';
  let category = item?.category || 'Guest Experience';
  let description = item?.description || '';
  let tag = item?.tag || 'Viral Idea';
  let votes = item?.votes || 1;

  const categories = [
    'Guest Experience & Games',
    'Cocktails & Signature Bar',
    'DIY Decor & Visuals',
    'Custom Favors & Gifts',
    'Interactive Tech & Photo Ops',
    'Music, Playlist & Sound',
    'Food Presentation & Late-Night Bites'
  ];

  const tagPresets = ['Must Have', 'Viral Idea', 'Budget Friendly', 'Aesthetic AF', 'DIY Craft', 'Legendary'];

  function handleSubmit() {
    playClick();
    if (!title.trim()) return;

    const saved: IdeaItem = {
      id: item?.id || `i-${Date.now().toString(36)}`,
      title: title.trim(),
      category,
      description: description.trim(),
      tag,
      votes: Number(votes) || 1
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
      <h3 class="modal-title">{item ? 'EDIT CREATIVE IDEA' : 'SPARK NEW PERSONALIZED IDEA'}</h3>
      <p class="modal-sub font-mono">SAVED TO USER ROM // LOCAL DISK DATABASE</p>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label class="neo-label" for="i-title">IDEA CONCEPT:</label>
        <input 
          id="i-title" 
          type="text" 
          class="neo-input" 
          bind:value={title} 
        />
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="neo-label" for="i-cat">CATEGORY:</label>
          <select id="i-cat" class="neo-select font-mono" bind:value={category}>
            {#each categories as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>

        <div class="form-group flex-1">
          <label class="neo-label" for="i-tag">BADGE / TAG:</label>
          <input 
            id="i-tag" 
            type="text" 
            class="neo-input font-mono" 
            bind:value={tag} 
          />
        </div>
      </div>

      <!-- Quick Tag Presets -->
      <div class="tag-presets-row">
        {#each tagPresets as t}
          <button 
            type="button" 
            class="tag-pill {tag === t ? 'active' : ''}" 
            on:click={() => { playClick(); tag = t; }}
          >
            {t}
          </button>
        {/each}
      </div>

      <div class="form-group">
        <label class="neo-label" for="i-desc">HOW IT WORKS & EXECUTION DETAILS:</label>
        <textarea 
          id="i-desc" 
          class="neo-textarea" 
          rows="3" 
          bind:value={description}
        ></textarea>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="neo-btn neo-btn-white" on:click={onClose}>
        CANCEL
      </button>
      <button type="button" class="neo-btn neo-btn-pink modal-save-btn" on:click={handleSubmit}>
        <Lightbulb size={16} strokeWidth={2.5} />
        <span>PIN TO MOODBOARD</span>
      </button>
    </div>
  </div>
</div>

<style>
  .modal-top-bar { height: 10px; border-bottom: var(--neo-border); }
  .modal-header {
    padding: 1.25rem 1.5rem;
    background-color: var(--neo-pink);
    color: #fff;
    border-bottom: var(--neo-border);
  }
  .modal-title { font-size: 1.4rem; color: #fff; }
  .modal-sub { font-size: 0.75rem; font-weight: 800; color: #ffe4e6; }
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group { display: flex; flex-direction: column; }
  .form-row { display: flex; gap: 1rem; }
  .flex-1 { flex: 1; }
  .tag-presets-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .tag-pill {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  .tag-pill.active {
    background-color: var(--neo-yellow);
    border-color: var(--neo-dark);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }
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
