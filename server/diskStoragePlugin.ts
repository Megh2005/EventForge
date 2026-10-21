import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StorageConfig {
  storagePath: string;
  isConfigured: boolean;
  geminiApiKey?: string;
  geminiModel?: string;
  currency: string;
  currencySymbol: string;
}

const CONFIG_FILE = path.resolve(process.cwd(), '.event_vault_config.json');

function getDefaultStoragePath(): string {
  return path.resolve(process.cwd(), 'local_storage_vault');
}

function loadConfig(): StorageConfig {
  let config: StorageConfig = {
    storagePath: getDefaultStoragePath(),
    isConfigured: false,
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash',
    currency: 'USD',
    currencySymbol: '$',
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      config = { ...config, ...parsed };
    }
  } catch (err) {
    console.error('[Vault] Error reading config file:', err);
  }

  // Also check if settings.json exists inside the storagePath
  try {
    const vaultSettingsFile = path.join(config.storagePath, 'config.json');
    if (fs.existsSync(vaultSettingsFile)) {
      const content = fs.readFileSync(vaultSettingsFile, 'utf-8');
      const parsed = JSON.parse(content);
      config = { ...config, ...parsed };
    }
  } catch (err) {
    // ignore
  }

  return config;
}

function saveConfig(config: StorageConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Vault] Error writing main config file:', err);
  }

  // Mirror save into user's designated computer folder
  try {
    if (fs.existsSync(config.storagePath)) {
      const vaultSettingsFile = path.join(config.storagePath, 'config.json');
      fs.writeFileSync(vaultSettingsFile, JSON.stringify(config, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Vault] Error writing config to local storage directory:', err);
  }
}

function ensureDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const testFile = path.join(dirPath, '.perm_test');
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    return true;
  } catch (err) {
    console.error('[Vault] Directory access error:', err);
    return false;
  }
}

function getEventsFilePath(storagePath: string): string {
  return path.join(storagePath, 'events.json');
}

function readEventsFromDisk(storagePath: string): any[] {
  try {
    ensureDirectory(storagePath);
    const filePath = getEventsFilePath(storagePath);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('[Vault] Error reading events from disk:', err);
    return [];
  }
}

function writeEventsToDisk(storagePath: string, events: any[]): boolean {
  try {
    ensureDirectory(storagePath);
    const filePath = getEventsFilePath(storagePath);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf-8');

    // Also persist individual event files for transparency and direct inspection in user's OS
    for (const event of events) {
      if (event && event.id) {
        const singlePath = path.join(storagePath, `event-${event.id}.json`);
        fs.writeFileSync(singlePath, JSON.stringify(event, null, 2), 'utf-8');
      }
    }

    // Append to audit log
    const auditPath = path.join(storagePath, 'vault_audit.log');
    const logLine = `[${new Date().toISOString()}] SYNCHRONIZED ${events.length} events to disk.\n`;
    fs.appendFileSync(auditPath, logLine, 'utf-8');

    return true;
  } catch (err) {
    console.error('[Vault] Error writing events to disk:', err);
    return false;
  }
}

export function diskStoragePlugin(): Plugin {
  let config = loadConfig();

  return {
    name: 'vite-plugin-disk-storage-and-genai',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // 1. GET /api/storage/config
        if (url === '/api/storage/config' && req.method === 'GET') {
          config = loadConfig();
          const exists = fs.existsSync(config.storagePath);
          const events = readEventsFromDisk(config.storagePath);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            storagePath: config.storagePath,
            isConfigured: config.isConfigured,
            geminiApiKey: config.geminiApiKey ? '••••••••' + config.geminiApiKey.slice(-4) : '',
            hasApiKey: Boolean(config.geminiApiKey || process.env.GEMINI_API_KEY),
            geminiModel: config.geminiModel || 'gemini-3.5-flash',
            currency: config.currency || 'USD',
            currencySymbol: config.currencySymbol || '$',
            totalEvents: events.length,
            system: {
              platform: os.platform(),
              hostname: os.hostname(),
              homeDir: os.homedir(),
              isWritable: exists ? ensureDirectory(config.storagePath) : false
            }
          }));
          return;
        }

        // 2. POST /api/storage/config - update local disk path, currency, & settings
        if (url === '/api/storage/config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              let targetPath = data.storagePath ? data.storagePath.trim() : config.storagePath;

              if (targetPath.startsWith('~')) {
                targetPath = path.join(os.homedir(), targetPath.slice(1));
              }
              targetPath = path.resolve(targetPath);

              const canWrite = ensureDirectory(targetPath);
              if (!canWrite) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Cannot write to path: ${targetPath}. Please check permissions.` }));
                return;
              }

              config.storagePath = targetPath;
              config.isConfigured = true;

              if (data.geminiApiKey && typeof data.geminiApiKey === 'string' && !data.geminiApiKey.includes('•') && data.geminiApiKey.trim().length > 0) {
                config.geminiApiKey = data.geminiApiKey.trim();
              }
              if (data.geminiModel) {
                config.geminiModel = data.geminiModel.trim();
              }
              if (data.currency) {
                config.currency = data.currency.trim();
              }
              if (data.currencySymbol) {
                config.currencySymbol = data.currencySymbol.trim();
              }

              saveConfig(config);
              const existingEvents = readEventsFromDisk(config.storagePath);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                storagePath: config.storagePath,
                currency: config.currency,
                currencySymbol: config.currencySymbol,
                totalEvents: existingEvents.length,
                hasApiKey: Boolean(config.geminiApiKey || process.env.GEMINI_API_KEY)
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. GET /api/storage/events
        if (url === '/api/storage/events' && req.method === 'GET') {
          config = loadConfig();
          const events = readEventsFromDisk(config.storagePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            events,
            storagePath: config.storagePath,
            source: 'LOCAL_MACHINE_ROM',
            fetchedAt: new Date().toISOString()
          }));
          return;
        }

        // 4. POST /api/storage/events - persist to disk
        if (url === '/api/storage/events' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              config = loadConfig();
              let events: any[] = [];

              if (Array.isArray(data.events)) {
                events = data.events;
              } else if (data.event) {
                const current = readEventsFromDisk(config.storagePath);
                const idx = current.findIndex((e: any) => e.id === data.event.id);
                if (idx >= 0) {
                  current[idx] = { ...data.event, updatedAt: new Date().toISOString() };
                } else {
                  current.unshift({ ...data.event, updatedAt: new Date().toISOString() });
                }
                events = current;
              } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Expected { events: [...] } or { event: {...} }' }));
                return;
              }

              const ok = writeEventsToDisk(config.storagePath, events);
              if (!ok) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to write events to computer disk' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                savedTo: config.storagePath,
                count: events.length,
                timestamp: new Date().toISOString()
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 5. DELETE /api/storage/events/:id
        if (url.startsWith('/api/storage/events/') && req.method === 'DELETE') {
          const id = url.split('/').pop();
          config = loadConfig();
          const current = readEventsFromDisk(config.storagePath);
          const filtered = current.filter((e: any) => e.id !== id);
          writeEventsToDisk(config.storagePath, filtered);

          try {
            const singleFile = path.join(config.storagePath, `event-${id}.json`);
            if (fs.existsSync(singleFile)) {
              fs.unlinkSync(singleFile);
            }
          } catch (e) {
            // ignore
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, deletedId: id, remaining: filtered.length }));
          return;
        }

        // 6. POST /api/storage/open-folder
        if (url === '/api/storage/open-folder' && req.method === 'POST') {
          config = loadConfig();
          ensureDirectory(config.storagePath);

          const cmd = process.platform === 'win32'
            ? `explorer.exe "${config.storagePath}"`
            : process.platform === 'darwin'
            ? `open "${config.storagePath}"`
            : `xdg-open "${config.storagePath}"`;

          exec(cmd, (err) => {
            if (err) {
              console.error('[Vault] Error opening folder:', err);
            }
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, openedPath: config.storagePath }));
          return;
        }

        // 7. POST /api/ai/generate - Pure Google Generative AI (Gemini 3.5 Flash)
        if (url === '/api/ai/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              const { prompt, task = 'blueprint', eventContext, systemInstruction } = payload;

              let apiKey = payload.apiKey;
              if (!apiKey || typeof apiKey !== 'string' || apiKey.includes('•')) {
                const headerKey = req.headers['x-gemini-key'];
                apiKey = (headerKey && !headerKey.includes('•') ? headerKey : null) ||
                  config.geminiApiKey;
              }

              if (!apiKey || apiKey.trim().length < 5) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'Personal Google Gemini API key required. Please enter your API key in the top navigation bar. Your key is stored solely on your local computer disk and will never be stored in any remote database.'
                }));
                return;
              }

              const requestedModel = payload.model || config.geminiModel || 'gemini-3.5-flash';
              let modelId = requestedModel;
              

              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({
                model: modelId,
                systemInstruction: systemInstruction ||
                  `You are an elite, modern Event Planning AI assistant powered by Google Gemini.
You analyze weddings, birthdays, and community gatherings with precise budgeting in the user's chosen currency (${eventContext?.currency || config.currency || 'USD'} / ${eventContext?.currencySymbol || config.currencySymbol || '$'}), timeline milestones, vendor vetting, and creative concepts.
Respond with structured JSON when requested, or clear, actionable advice.`
              });

              let fullPrompt = prompt;
              const currSymbol = eventContext?.currencySymbol || config.currencySymbol || '$';
              const currCode = eventContext?.currency || config.currency || 'USD';

              if (task === 'blueprint') {
                fullPrompt = `Generate a comprehensive, custom event plan for:
Event Title: ${eventContext?.title}
Event Type: ${eventContext?.type}
Theme/Vibe: ${eventContext?.themeVibe}
Target Budget: ${currSymbol}${eventContext?.budget} (${currCode})
Guest Count: ${eventContext?.guestCount}
Location: ${eventContext?.location}
Specific Notes/Requirements: ${eventContext?.notes || 'None'}

Return ONLY valid JSON matching this exact structure:
{
  "overview": "clear 2-sentence creative and logistical summary",
  "themeVibe": "aesthetic summary",
  "colorScheme": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"],
  "budgetBreakdown": [
    { "category": "Venue & Facilities", "title": "Expense item", "estimated": 5000, "actual": 0, "priority": "critical" }
  ],
  "timeline": [
    { "phase": "Planning Phase", "title": "Milestone action", "dueDate": "YYYY-MM-DD", "notes": "advice" }
  ],
  "vendorChecklist": [
    { "category": "Photography", "service": "Coverage", "questions": ["Question 1", "Question 2"] }
  ],
  "personalizedIdeas": [
    { "title": "Unique idea title", "category": "Guest Experience", "description": "Creative description" }
  ]
}`;
              } else if (task === 'optimize_budget') {
                fullPrompt = `Analyze this event budget and provide recommendations in currency ${currCode} (${currSymbol}):
Event: ${JSON.stringify(eventContext)}
Prompt: ${prompt}
Provide category allocation percentages, potential cost savings, and overlooked fees (taxes, service gratuities, power/permits).`;
              } else if (task === 'vendor_rfp') {
                fullPrompt = `Create a vendor interview guide and scope-of-work for category: ${payload.category || 'General'}
Event: ${JSON.stringify(eventContext)}
Currency: ${currCode} (${currSymbol})
Include 5 critical questions to ask, contract red-flags to avoid, and realistic price expectations.`;
              } else if (task === 'timeline_sync') {
                fullPrompt = `Generate a detailed minute-by-minute Day-of Run-of-Show timeline for this event:
Event: ${JSON.stringify(eventContext)}
Include setup cues, guest arrival, key milestones, vendor transitions, and buffer times.`;
              }

              const result = await model.generateContent(fullPrompt);
              const responseText = result.response.text();

              let parsedData = null;
              if (task === 'blueprint') {
                try {
                  const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                  parsedData = JSON.parse(cleaned);
                } catch (parseErr) {
                  console.warn('[Gemini] JSON parsing error, returning raw response:', parseErr);
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                modelUsed: modelId,
                requestedModel,
                data: parsedData,
                rawText: responseText,
                mode: 'LIVE_GEMINI_AI'
              }));
            } catch (err: any) {
              console.error('[Gemini API Error]', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: `Gemini API Error: ${err.message || 'Failed to generate dynamic response'}`
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
