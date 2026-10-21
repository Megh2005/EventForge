<script lang="ts">
  import { events, vaultConfig, updateVaultConfig, isSaving, lastSavedAt, openFolderInExplorer } from '../storage';
  import { isSoundEnabled, toggleSound, playClick } from '../sound';
  import { POPULAR_CURRENCIES } from '../currency';
  import { CalendarCheck, ArrowLeft, Coins, HardDrive, Cpu, Volume2, VolumeX, Plus } from '@lucide/svelte';

  export let onNewEvent: () => void;
  export let onOpenSettings: () => void;
  export let onOpenApiConfig: () => void;
  export let onBackToDashboard: () => void;
  export let currentEventTitle: string | null = null;

  let soundActive = isSoundEnabled();

  function handleSoundToggle() {
    soundActive = toggleSound();
  }

  function handleOpenFolder() {
    playClick();
    openFolderInExplorer();
  }

  async function handleCurrencyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const selectedCode = target.value;
    const matched = POPULAR_CURRENCIES.find(c => c.code === selectedCode);
    const symbol = matched ? matched.symbol : '$';

    playClick();
    await updateVaultConfig(
      $vaultConfig.storagePath,
      $vaultConfig.geminiApiKey,
      $vaultConfig.geminiModel,
      selectedCode,
      symbol
    );
  }
</script>

<header class="neo-header">
  <div class="header-main">
    <!-- Brand / Title -->
    <button class="brand-group" on:click={onBackToDashboard} type="button">
      <div class="brand-badge-box">
        <CalendarCheck size={22} strokeWidth={2.75} />
      </div>
      <div class="brand-text">
        <h1 class="brand-title">EVENTFORGE</h1>
        <span class="brand-subtitle font-mono">LOCAL-FIRST EVENT ARCHITECT</span>
      </div>
    </button>

    <!-- Active Event Breadcrumb if inside event -->
    {#if currentEventTitle}
      <div class="current-event-pill">
        <button class="crumb-back-btn" on:click={onBackToDashboard} type="button">
          <ArrowLeft size={14} strokeWidth={2.5} />
          <span>DASHBOARD</span>
        </button>
        <span class="crumb-divider">/</span>
        <span class="event-title-text" title={currentEventTitle}>{currentEventTitle}</span>
      </div>
    {/if}

    <!-- Right Controls -->
    <div class="header-actions">
      <!-- Dynamic Currency Selector -->
      <div class="currency-picker-wrap" title="Global Currency: saved to internal computer storage">
        <span class="currency-icon">
          <Coins size={16} strokeWidth={2.5} />
        </span>
        <select 
          class="currency-select font-mono" 
          value={$vaultConfig.currency || 'USD'} 
          on:change={handleCurrencyChange}
        >
          {#each POPULAR_CURRENCIES as c}
            <option value={c.code}>{c.code} ({c.symbol})</option>
          {/each}
        </select>
      </div>

      <!-- Live Disk Storage Status Badge -->
      <button 
        class="storage-status-badge" 
        on:click={onOpenSettings} 
        type="button"
        title="Local Computer Disk Storage Settings"
      >
        <HardDrive size={18} strokeWidth={2.5} class="disk-icon" />
        <div class="storage-text">
          <span class="storage-label">ROM DATABASE</span>
          <span class="storage-path-trunc">
            {$vaultConfig.storagePath.split(/[/\\]/).pop() || 'local_vault'}
          </span>
        </div>
        {#if $isSaving}
          <span class="saving-indicator">SYNCING</span>
        {:else}
          <span class="synced-indicator">LIVE</span>
        {/if}
      </button>

      <!-- Gemini AI Model Indicator / Config -->
      <button 
        class="neo-btn neo-btn-sm {$vaultConfig.hasApiKey ? 'neo-btn-green' : 'neo-btn-pink'}" 
        on:click={onOpenApiConfig} 
        type="button"
        title="Configure Gemini 3.5 Flash Model & API Key"
      >
        <Cpu size={15} strokeWidth={2.5} />
        <span>{$vaultConfig.geminiModel || 'GEMINI 3.5 FLASH'}</span>
        {#if !$vaultConfig.hasApiKey}
          <span class="api-needed-tag">ADD KEY</span>
        {/if}
      </button>

      <!-- Tactile Sound Toggle -->
      <button 
        class="sound-toggle-btn {soundActive ? 'active' : ''}" 
        on:click={handleSoundToggle} 
        type="button"
        title={soundActive ? 'Mute audio' : 'Enable tactile audio'}
      >
        {#if soundActive}
          <Volume2 size={16} strokeWidth={2.5} />
          <span>SOUND</span>
        {:else}
          <VolumeX size={16} strokeWidth={2.5} />
          <span>MUTE</span>
        {/if}
      </button>

      <!-- New Event Button -->
      <button class="neo-btn neo-btn-yellow" on:click={onNewEvent} type="button">
        <Plus size={18} strokeWidth={2.75} />
        <span>PLAN EVENT</span>
      </button>
    </div>
  </div>
</header>

<style>
  .neo-header {
    background-color: var(--neo-surface);
    border-bottom: var(--neo-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
  }

  .brand-badge-box {
    width: 42px;
    height: 42px;
    background-color: var(--neo-yellow);
    border: var(--neo-border);
    box-shadow: 3px 3px 0px var(--neo-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 900;
    transform: rotate(-3deg);
    transition: transform 0.15s ease;
  }

  .brand-group:hover .brand-badge-box {
    transform: rotate(4deg) scale(1.05);
  }

  .brand-title {
    font-size: 1.4rem;
    letter-spacing: -0.03em;
    color: var(--neo-dark);
  }

  .brand-subtitle {
    font-size: 0.65rem;
    font-weight: 800;
    color: #555;
    letter-spacing: 0.08em;
  }

  .current-event-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--neo-yellow);
    border: var(--neo-border-thin);
    box-shadow: var(--neo-shadow-sm);
    padding: 0.4rem 0.8rem;
    font-weight: 800;
    font-size: 0.85rem;
  }

  .crumb-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--neo-dark);
    color: #fff;
    border: none;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .crumb-back-btn:hover {
    background: var(--neo-pink);
  }

  .crumb-divider {
    font-weight: 900;
    color: #444;
  }

  .event-title-text {
    max-width: 240px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Currency selector */
  .currency-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.3rem 0.6rem;
  }

  .currency-icon {
    display: flex;
    align-items: center;
  }

  .currency-select {
    border: none;
    background: transparent;
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--neo-dark);
    cursor: pointer;
    outline: none;
  }

  .storage-status-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #F8F5EE;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0px var(--neo-dark);
    padding: 0.35rem 0.65rem;
    cursor: pointer;
    text-align: left;
    transition: transform 0.1s ease;
  }

  .storage-status-badge:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px var(--neo-dark);
  }

  .storage-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .storage-label {
    font-family: var(--font-mono);
    font-size: 0.55rem;
    font-weight: 800;
    color: #666;
  }

  .storage-path-trunc {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--neo-dark);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .synced-indicator {
    background: var(--neo-green);
    color: var(--neo-dark);
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 800;
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--neo-dark);
  }

  .saving-indicator {
    background: var(--neo-pink);
    color: #fff;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    font-weight: 800;
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--neo-dark);
  }

  .api-needed-tag {
    background: #fff;
    color: var(--neo-pink);
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
    font-weight: 800;
    border: 1px solid var(--neo-dark);
  }

  .sound-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.45rem 0.65rem;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .sound-toggle-btn.active {
    background: var(--neo-yellow);
  }

  .sound-toggle-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
  }
</style>
