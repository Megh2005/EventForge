<script lang="ts">
  import { onMount } from 'svelte';
  import type { EventItem } from './lib/types';
  import { 
    events, 
    vaultConfig, 
    fetchVaultConfig, 
    loadEventsFromDisk, 
    isSaving, 
    lastSavedAt,
    openFolderInExplorer 
  } from './lib/storage';
  import { playClick, playSuccess } from './lib/sound';
  import Navbar from './lib/components/Navbar.svelte';
  import EventList from './lib/components/EventList.svelte';
  import EventDetail from './lib/components/EventDetail.svelte';
  import OnboardingModal from './lib/components/OnboardingModal.svelte';
  import ApiKeyModal from './lib/components/ApiKeyModal.svelte';
  import NewEventModal from './lib/components/NewEventModal.svelte';
  import { HardDrive, Check, ExternalLink } from '@lucide/svelte';

  let selectedEvent: EventItem | null = null;
  let showOnboarding = false;
  let isFirstTimeOnboarding = false;
  let showApiModal = false;
  let showNewEventModal = false;
  let isLoading = true;

  onMount(async () => {
    try {
      const config = await fetchVaultConfig();
      if (!config.isConfigured) {
        isFirstTimeOnboarding = true;
        showOnboarding = true;
      }
      await loadEventsFromDisk();
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      isLoading = false;
    }
  });

  function handleSelectEvent(event: EventItem) {
    selectedEvent = event;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToDashboard() {
    playClick();
    selectedEvent = null;
    loadEventsFromDisk();
  }

  function handleOpenNewEvent() {
    playClick();
    showNewEventModal = true;
  }

  function handleEventCreated(newEvent: EventItem) {
    showNewEventModal = false;
    selectedEvent = newEvent;
  }

  function handleOpenStorageSettings() {
    playClick();
    isFirstTimeOnboarding = false;
    showOnboarding = true;
  }

  function handleOpenApiConfig() {
    playClick();
    showApiModal = true;
  }
</script>

<div class="app-root">
  <!-- Top Neo-Brutalist Navbar -->
  <Navbar 
    onNewEvent={handleOpenNewEvent}
    onOpenSettings={handleOpenStorageSettings}
    onOpenApiConfig={handleOpenApiConfig}
    onBackToDashboard={handleBackToDashboard}
    currentEventTitle={selectedEvent ? selectedEvent.title : null}
  />

  <main class="app-container">
    {#if isLoading}
      <div class="loading-state neo-card">
        <div class="stripes-pattern loading-bar"></div>
        <div class="loading-inner font-mono">
          <HardDrive size={36} class="loading-spin" strokeWidth={2.5} />
          <strong>INITIALIZING INTERNAL COMPUTER STORAGE VAULT...</strong>
          <p>Mounting persistent JSON directory & checking Gemini 3.5 Flash engine.</p>
        </div>
      </div>
    {:else if selectedEvent}
      <EventDetail 
        event={selectedEvent} 
        onBack={handleBackToDashboard} 
      />
    {:else}
      <EventList 
        onSelectEvent={handleSelectEvent} 
        onNewEvent={handleOpenNewEvent} 
      />
    {/if}
  </main>

  <!-- Bottom Floating Disk Persistence Toast / Indicator -->
  <footer class="vault-footer-strip font-mono">
    <div class="footer-inner">
      <div class="footer-left">
        <HardDrive size={15} class="pulse-disk-icon" strokeWidth={2.5} />
        <span>
          PERSISTENCE: <strong>ROM / COMPUTER STORAGE</strong>
        </span>
        <span class="sep">|</span>
        <span class="path-display" title={$vaultConfig.storagePath}>
          ACTIVE PATH: {$vaultConfig.storagePath}
        </span>
      </div>

      <div class="footer-right">
        {#if $isSaving}
          <span class="sync-pill syncing">● PERSISTING TO DISK...</span>
        {:else}
          <span class="sync-pill synced">
            <Check size={13} strokeWidth={3} />
            <span>DISK UP TO DATE ({$lastSavedAt})</span>
          </span>
        {/if}
        <button class="footer-link-btn" on:click={openFolderInExplorer}>
          <ExternalLink size={12} strokeWidth={2.5} />
          <span>OPEN IN EXPLORER</span>
        </button>
      </div>
    </div>
  </footer>

  <!-- Modals -->
  {#if showOnboarding}
    <OnboardingModal 
      isFirstTime={isFirstTimeOnboarding} 
      onClose={() => showOnboarding = false} 
    />
  {/if}

  {#if showApiModal}
    <ApiKeyModal 
      onClose={() => showApiModal = false} 
    />
  {/if}

  {#if showNewEventModal}
    <NewEventModal 
      onClose={() => showNewEventModal = false} 
      onEventCreated={handleEventCreated} 
    />
  {/if}
</div>

<style>
  .app-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 55px; /* space for sticky footer */
  }

  .loading-state {
    padding: 3px;
    margin-top: 2rem;
  }

  .loading-bar {
    height: 12px;
    border-bottom: var(--neo-border);
  }

  .loading-inner {
    background: #fff;
    padding: 2.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .loading-spin {
    font-size: 2.5rem;
    animation: bounce 0.6s infinite alternate;
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-8px); }
  }

  /* Vault Footer Strip */
  .vault-footer-strip {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--neo-dark);
    color: #fff;
    border-top: var(--neo-border);
    padding: 0.5rem 1.25rem;
    font-size: 0.75rem;
    z-index: 90;
    box-shadow: 0 -3px 0 var(--neo-yellow);
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1380px;
    margin: 0 auto;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
  }

  .pulse-disk-icon {
    color: var(--neo-cyan);
  }

  .sep {
    color: #666;
  }

  .path-display {
    max-width: 450px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--neo-yellow);
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .sync-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.15rem 0.45rem;
    font-weight: 800;
    font-size: 0.7rem;
  }

  .sync-pill.synced {
    background: var(--neo-green);
    color: var(--neo-dark);
  }

  .sync-pill.syncing {
    background: var(--neo-pink);
    color: #fff;
    animation: flash 0.8s infinite;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .footer-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    color: var(--neo-cyan);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    text-decoration: underline;
  }

  .footer-link-btn:hover {
    color: var(--neo-yellow);
  }
</style>
