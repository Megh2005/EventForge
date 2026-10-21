<script lang="ts">
  import { vaultConfig, updateVaultConfig, seedStarterEvents } from '../storage';
  import { playClick, playSuccess } from '../sound';
  import { POPULAR_CURRENCIES, getCurrencySymbol } from '../currency';
  import { HardDrive, Layers, Folder, CheckCircle2, AlertTriangle, Coins } from '@lucide/svelte';

  export let onClose: () => void;
  export let isFirstTime: boolean = false;

  let chosenPath = $vaultConfig.storagePath || '';
  let selectedCurrency = $vaultConfig.currency || 'USD';
  let isSavingPath = false;
  let statusMessage = '';
  let statusError = '';

  const quickPaths = [
    { label: 'Project Vault Folder', path: $vaultConfig.storagePath },
    { label: 'My Documents Folder', path: '~/Documents/EventPlannerVault' },
    { label: 'Desktop Folder', path: '~/Desktop/EventPlannerVault' }
  ];

  function selectQuickPath(p: string) {
    playClick();
    chosenPath = p;
  }

  async function handleConfirmPath() {
    if (!chosenPath.trim()) {
      statusError = 'Please specify a folder path on your computer.';
      return;
    }
    isSavingPath = true;
    statusError = '';
    statusMessage = 'Initializing storage on your computer disk...';

    const symbol = getCurrencySymbol(selectedCurrency);
    const ok = await updateVaultConfig(
      chosenPath.trim(),
      $vaultConfig.geminiApiKey,
      $vaultConfig.geminiModel,
      selectedCurrency,
      symbol
    );
    isSavingPath = false;

    if (ok) {
      statusMessage = 'Storage path & currency saved to your computer disk!';
      playSuccess();
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      statusError = 'Failed to initialize folder. Please verify path permissions.';
    }
  }

  async function handleSeedAndClose() {
    playClick();
    const symbol = getCurrencySymbol(selectedCurrency);
    await updateVaultConfig(
      chosenPath.trim(),
      $vaultConfig.geminiApiKey,
      $vaultConfig.geminiModel,
      selectedCurrency,
      symbol
    );
    await seedStarterEvents();
    onClose();
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
        <span class="neo-badge neo-badge-pink">ZERO CLOUD LOCK-IN</span>
      </div>
      <h2 class="modal-title">
        {isFirstTime ? 'LOCAL STORAGE SETUP' : 'STORAGE & CURRENCY CONFIGURATION'}
      </h2>
      <p class="modal-subtitle">
        Your computer storage (ROM) serves as the database. Choose where data is stored and select your preferred currency.
      </p>
    </div>

    <div class="modal-body">
      <!-- Currency Selection -->
      <div class="form-group">
        <label class="neo-label label-with-icon" for="onboarding-currency">
          <Coins size={16} strokeWidth={2.5} />
          <span>SELECT PRIMARY CURRENCY:</span>
        </label>
        <select 
          id="onboarding-currency" 
          class="neo-select font-mono" 
          bind:value={selectedCurrency}
        >
          {#each POPULAR_CURRENCIES as c}
            <option value={c.code}>{c.label}</option>
          {/each}
        </select>
        <span class="form-hint font-mono">
          Currency symbol ({getCurrencySymbol(selectedCurrency)}) will be used for budget tracking and AI estimations.
        </span>
      </div>

      <!-- Directory Path Input -->
      <div class="form-group">
        <label class="neo-label label-with-icon" for="storage-path-input">
          <HardDrive size={16} strokeWidth={2.5} />
          <span>COMPUTER STORAGE DIRECTORY PATH:</span>
        </label>
        <input 
          id="storage-path-input" 
          type="text" 
          class="neo-input font-mono" 
          bind:value={chosenPath} 
        />
        <span class="form-hint font-mono">
          Events and settings are saved as JSON files in this directory.
        </span>
      </div>

      <!-- Quick Preset Paths -->
      <div class="presets-section">
        <span class="preset-label font-mono label-with-icon">
          <Folder size={14} strokeWidth={2.5} />
          <span>RECOMMENDED FOLDERS:</span>
        </span>
        <div class="presets-grid">
          {#each quickPaths as q}
            <button 
              type="button" 
              class="quick-pill {chosenPath === q.path ? 'selected' : ''}" 
              on:click={() => selectQuickPath(q.path)}
            >
              <span>{q.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Status or Error message -->
      {#if statusMessage}
        <div class="msg-box success font-mono">
          <CheckCircle2 size={16} strokeWidth={2.5} />
          <span>{statusMessage}</span>
        </div>
      {/if}
      {#if statusError}
        <div class="msg-box error font-mono">
          <AlertTriangle size={16} strokeWidth={2.5} />
          <span>{statusError}</span>
        </div>
      {/if}
    </div>

    <!-- Modal Footer Actions -->
    <div class="modal-footer">
      {#if isFirstTime}
        <button 
          type="button" 
          class="neo-btn neo-btn-green modal-action-btn" 
          on:click={handleSeedAndClose}
          disabled={isSavingPath}
        >
          <Layers size={16} strokeWidth={2.5} />
          <span>CONFIRM & LOAD STARTER CELEBRATIONS</span>
        </button>
      {/if}

      <button 
        type="button" 
        class="neo-btn neo-btn-cyan modal-action-btn" 
        on:click={handleConfirmPath}
        disabled={isSavingPath}
      >
        {#if isSavingPath}
          <span>SAVING...</span>
        {:else}
          <HardDrive size={16} strokeWidth={2.5} />
          <span>SAVE STORAGE PATH</span>
        {/if}
      </button>

      {#if !isFirstTime}
        <button type="button" class="neo-btn neo-btn-white" on:click={onClose}>
          CLOSE
        </button>
      {/if}
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
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .modal-title {
    font-size: 1.5rem;
    margin-bottom: 0.4rem;
    color: var(--neo-dark);
  }

  .modal-subtitle {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.35;
    color: #222;
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-hint {
    font-size: 0.75rem;
    color: #555;
    margin-top: 0.35rem;
  }

  .presets-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .preset-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #555;
  }

  .presets-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .quick-pill {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    background: #fff;
    border: var(--neo-border-thin);
    box-shadow: 2px 2px 0 var(--neo-dark);
    padding: 0.35rem 0.65rem;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .quick-pill:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--neo-dark);
    background-color: var(--neo-cyan);
  }

  .quick-pill.selected {
    background-color: var(--neo-yellow);
    border-color: var(--neo-dark);
  }

  .label-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .msg-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.85rem;
    font-weight: 800;
    border: var(--neo-border-thin);
  }

  .modal-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .msg-box.success {
    background: var(--neo-green);
    color: var(--neo-dark);
  }

  .msg-box.error {
    background: var(--neo-pink);
    color: #fff;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-top: var(--neo-border);
    background-color: var(--neo-muted);
    flex-wrap: wrap;
  }
</style>
