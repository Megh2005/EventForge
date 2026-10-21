<script lang="ts">
  import { vaultConfig, updateVaultConfig } from "../storage";
  import { callGeminiAI } from "../ai";
  import { playClick, playSuccess } from "../sound";
  import { Bot, Key, Zap, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink } from '@lucide/svelte';

  export let onClose: () => void;

  let apiKeyInput = "";
  let selectedModel = $vaultConfig.geminiModel || "gemini-3.5-flash";
  let isTesting = false;
  let testResult = "";
  let testError = "";
  let showKey = false;

  const availableModels = [
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (User Target Model)" },
  ];

  async function handleSaveKey() {
    playClick();
    const ok = await updateVaultConfig(
      $vaultConfig.storagePath,
      apiKeyInput.trim(),
      selectedModel,
    );
    if (ok) {
      playSuccess();
      testResult = "Configuration saved successfully to your computer disk!";
      setTimeout(() => {
        onClose();
      }, 700);
    }
  }

  async function handleTestConnection() {
    playClick();
    isTesting = true;
    testResult = "";
    testError = "";

    try {
      // Temporarily update config so test uses the input
      if (apiKeyInput.trim()) {
        await updateVaultConfig(
          $vaultConfig.storagePath,
          apiKeyInput.trim(),
          selectedModel,
        );
      }

      const res = await callGeminiAI({
        task: "brainstorm",
        prompt:
          'Say "HELLO NEO-BRUTALIST EVENT ARCHITECT!" and list 1 quick rule of great party planning.',
        eventContext: { type: "birthday", title: "Test Celebration" },
      });

      isTesting = false;
      if (res.success) {
        testResult = `CONNECTED! Model: ${res.modelUsed || selectedModel}\n${res.rawText || "Test prompt received."}`;
        playSuccess();
      } else {
        testError =
          res.warning || "Connection failed. Please verify your API key.";
      }
    } catch (err: any) {
      isTesting = false;
      testError =
        err.message || "Error communicating with Google Generative AI";
    }
  }
</script>

<div
  class="neo-modal-backdrop"
  on:click={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  on:keydown={(e) => {
    if (e.key === "Escape") onClose();
  }}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="neo-modal-content">
    <div class="modal-top-bar stripes-pattern"></div>
    <div class="modal-header">
      <div class="header-badge-row">
        <span class="neo-badge neo-badge-purple">GOOGLE GENERATIVE AI</span>
        <span class="neo-badge neo-badge-yellow">GEMINI 3.5 FLASH</span>
      </div>
      <h2 class="modal-title">AI ENGINE & API KEY CONFIG</h2>
      <p class="modal-subtitle">
        Power your event blueprints, budget optimizations, vendor questions, and
        timelines using Google Gemini.
      </p>
    </div>

    <div class="modal-body">
      <!-- Model selector -->
      <div class="form-group">
        <label class="neo-label label-with-icon" for="model-select">
          <Bot size={16} strokeWidth={2.5} />
          <span>GEMINI MODEL TIER:</span>
        </label>
        <select
          id="model-select"
          class="neo-select font-mono"
          bind:value={selectedModel}
        >
          {#each availableModels as m}
            <option value={m.id}>{m.label}</option>
          {/each}
        </select>
      </div>

      <!-- Privacy & Local Machine Storage Guarantee Banner -->
      <div class="privacy-notice-box">
        <div class="privacy-header font-mono">
          <ShieldCheck size={16} strokeWidth={2.5} class="privacy-shield-icon" />
          <span>ZERO DATABASE RETENTION — LOCAL MACHINE ONLY</span>
        </div>
        <p class="privacy-notice-text">
          Your API key is <strong>never stored in any cloud database</strong> or external server. It is saved <strong>strictly on your local machine only</strong> and is used solely to execute requests directly with Google Gemini for your event plans.
        </p>
      </div>

      <!-- API Key input -->
      <div class="form-group">
        <div class="label-row">
          <label class="neo-label label-with-icon" for="api-key-input">
            <Key size={16} strokeWidth={2.5} />
            <span>YOUR PERSONAL GEMINI API KEY:</span>
          </label>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            class="key-help-link"
          >
            <span>Get Free API Key</span>
            <ExternalLink size={12} strokeWidth={2.5} />
          </a>
        </div>
        <div class="input-wrapper">
          <input
            id="api-key-input"
            type={showKey ? "text" : "password"}
            class="neo-input font-mono"
            placeholder={$vaultConfig.hasApiKey
              ? "••••••••••••••••••••••••"
              : "Enter your personal Gemini API key here..."}
            bind:value={apiKeyInput}
          />
          <button
            type="button"
            class="key-toggle-btn"
            on:click={() => (showKey = !showKey)}
          >
            {showKey ? "HIDE" : "SHOW"}
          </button>
        </div>
        <span class="input-hint font-mono">
          {$vaultConfig.hasApiKey
            ? "Your API key is securely saved on your local computer machine only."
            : "Enter your personal Gemini API key. Stored exclusively on your local machine."}
        </span>
      </div>

      <!-- AI Guidelines & Capabilities Callout -->
      <div class="guidelines-card">
        <span class="guidelines-title label-with-icon">
          <ShieldCheck size={14} strokeWidth={2.5} />
          <span>BUILT-IN AI ETHICS & GUIDELINES:</span>
        </span>
        <ul class="guidelines-list">
          <li>
            <strong>Zero Over-estimation:</strong> Realistic price brackets derived
            from real market norms.
          </li>
          <li>
            <strong>Vendor Neutrality:</strong> Evaluates vendors objectively without
            brand bias.
          </li>
          <li>
            <strong>Safety & Inclusivity:</strong> Emphasizes accessible venues,
            allergy-safe menus, and safety buffers.
          </li>
        </ul>
      </div>

      <!-- Status feedback -->
      {#if testResult}
        <div class="feedback-box success font-mono">
          <CheckCircle2 size={16} strokeWidth={2.5} />
          <span>{testResult}</span>
        </div>
      {/if}
      {#if testError}
        <div class="feedback-box error font-mono">
          <AlertTriangle size={16} strokeWidth={2.5} />
          <span>{testError}</span>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button
        type="button"
        class="neo-btn neo-btn-white footer-action-btn"
        on:click={handleTestConnection}
        disabled={isTesting}
      >
        <Zap size={15} strokeWidth={2.5} />
        <span>{isTesting ? "TESTING..." : "TEST CONNECTION"}</span>
      </button>

      <button
        type="button"
        class="neo-btn neo-btn-green footer-action-btn"
        on:click={handleSaveKey}
      >
        <HardDrive size={15} strokeWidth={2.5} />
        <span>SAVE SETTINGS</span>
      </button>

      <button type="button" class="neo-btn neo-btn-dark" on:click={onClose}>
        CLOSE
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
    background-color: var(--neo-purple);
    color: #fff;
  }

  .header-badge-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .modal-title {
    font-size: 1.45rem;
    margin-bottom: 0.35rem;
    color: #fff;
  }

  .modal-subtitle {
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.35;
    color: #f3e8ff;
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

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .key-help-link {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--neo-pink);
    text-decoration: underline;
  }

  .input-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  .key-toggle-btn {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    background: #fff;
    border: var(--neo-border);
    box-shadow: var(--neo-shadow-sm);
    padding: 0 0.75rem;
    cursor: pointer;
  }

  .input-hint {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.35rem;
  }

  .privacy-notice-box {
    background: #E8FFF4;
    border: var(--neo-border);
    box-shadow: var(--neo-shadow-sm);
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .privacy-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
    color: #05603A;
  }

  .privacy-shield-icon {
    color: #05603A;
  }

  .privacy-notice-text {
    font-size: 0.82rem;
    line-height: 1.45;
    color: #1a1a1a;
    margin: 0;
  }

  .guidelines-card {
    background-color: #fffdf5;
    border: var(--neo-border-thin);
    box-shadow: var(--neo-shadow-sm);
    padding: 1rem;
  }

  .guidelines-title {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    display: block;
    margin-bottom: 0.5rem;
    color: var(--neo-dark);
  }

  .guidelines-list {
    padding-left: 1.25rem;
    font-size: 0.82rem;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .key-help-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--neo-pink);
    text-decoration: underline;
  }

  .feedback-box {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.8rem;
    border: var(--neo-border-thin);
    white-space: pre-wrap;
  }

  .footer-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .feedback-box.success {
    background-color: var(--neo-green);
    color: var(--neo-dark);
  }

  .feedback-box.error {
    background-color: var(--neo-pink);
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
