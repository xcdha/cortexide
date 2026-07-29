/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt in the project root.
 *
 *  CortexIDE Internationalisation (i18n) Service
 *  -----------------------------------------------
 *  Provides translated UI strings for CortexIDE panels.  Works within VS Code's
 *  existing localisation infrastructure:
 *
 *  - Locale is read from VS Code's configured display language (same mechanism the
 *    editor itself uses, set via "Configure Display Language").
 *  - English (en) is the canonical locale.  Missing keys in any other locale fall
 // allow-any-unicode-next-line
 *    back to the English value — no UI string is ever undefined.
 *  - Translations live in `locales/<locale>.json`.  Adding a new language requires
 *    only dropping a new JSON file into that directory; no code change is needed.
 *  - React components consume translations via the `useTranslation()` hook which
 *    returns a stable `t(key, fallback?)` function.
 *
 *  Supported locales (initial set):
 // allow-any-unicode-next-line
 *    en  — English (canonical)
 // allow-any-unicode-next-line
 *    zh  — 简体中文 (Simplified Chinese)
 // allow-any-unicode-next-line
 *    es  — Español
 // allow-any-unicode-next-line
 *    fr  — Français
 // allow-any-unicode-next-line
 *    de  — Deutsch
 // allow-any-unicode-next-line
 *    ja  — 日本語
 // allow-any-unicode-next-line
 *    ko  — 한국어
 // allow-any-unicode-next-line
 *    pt  — Português (Brazilian)
 // allow-any-unicode-next-line
 *    ar  — العربية
 // allow-any-unicode-next-line
 *    ru  — Русский
 // allow-any-unicode-next-line
 *    hi  — हिन्दी
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../../platform/instantiation/common/extensions.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../../platform/storage/common/storage.js';
import { Emitter, Event } from '../../../../../base/common/event.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';

export const ICortexideI18nService = createDecorator<ICortexideI18nService>('cortexideI18nService');

export type SupportedLocale =
	| 'en' | 'zh' | 'es' | 'fr' | 'de'
	| 'ja' | 'ko' | 'pt' | 'ar' | 'ru' | 'hi';

export const SUPPORTED_LOCALES: Record<SupportedLocale, string> = {
	en: 'English',
	// allow-any-unicode-next-line
	zh: '简体中文',
	// allow-any-unicode-next-line
	es: 'Español',
	// allow-any-unicode-next-line
	fr: 'Français',
	de: 'Deutsch',
	// allow-any-unicode-next-line
	ja: '日本語',
	// allow-any-unicode-next-line
	ko: '한국어',
	// allow-any-unicode-next-line
	pt: 'Português',
	// allow-any-unicode-next-line
	ar: 'العربية',
	// allow-any-unicode-next-line
	ru: 'Русский',
	// allow-any-unicode-next-line
	hi: 'हिन्दी',
};

export type TranslationKey = keyof typeof EN_TRANSLATIONS;
export type TranslationDict = Record<string, string>;

export interface ICortexideI18nService {
	readonly _serviceBrand: undefined;

	/** Currently active locale */
	readonly locale: SupportedLocale;

	/** Fires when the locale changes */
	readonly onDidChangeLocale: Event<SupportedLocale>;

	/**
	 * Translate a key.  If the key is missing in the current locale, returns
	 * the English value.  If the key is missing entirely, returns `fallback`
	 * (or the key itself if no fallback is provided).
	 */
	t(key: TranslationKey, fallback?: string): string;

	/** Change the active locale and persist the selection */
	setLocale(locale: SupportedLocale): void;
}

// allow-any-unicode-next-line
// ─── English master dictionary ────────────────────────────────────────────────
// allow-any-unicode-next-line
// All keys must be defined here.  Other locales are a subset — missing keys
// automatically fall back to these values.

export const EN_TRANSLATIONS = {
	// allow-any-unicode-next-line
	// ── Onboarding ──────────────────────────────────────────────────────────
	'onboarding.title': 'Welcome to CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'Open-source AI IDE — works 100% offline',
	'onboarding.chooseLocal': 'Set up local AI (runs on your machine)',
	'onboarding.chooseCloud': 'Connect a cloud provider (OpenAI, Anthropic, etc.)',
	'onboarding.chooseLater': 'Skip for now',
	'onboarding.localDescription': 'Your code never leaves your computer. Requires ~8 GB RAM minimum.',
	'onboarding.cloudDescription': 'Use powerful cloud models. Requires an API key.',
	'onboarding.systemCheck': 'Checking your system…',
	'onboarding.installingOllama': 'Installing Ollama…',
	'onboarding.downloadingModel': 'Downloading model…',
	'onboarding.setupComplete': 'Setup complete!',
	'onboarding.recommendedModel': 'Recommended for your hardware',
	'onboarding.vramDetected': 'Detected GPU memory',
	'onboarding.selectModelPack': 'Choose a model pack',
	// allow-any-unicode-next-line
	'onboarding.modelPack.fast': 'Fast (7B) — Best for 8 GB RAM/VRAM',
	// allow-any-unicode-next-line
	'onboarding.modelPack.balanced': 'Balanced (14B) — Best for 16 GB RAM/VRAM',
	// allow-any-unicode-next-line
	'onboarding.modelPack.powerful': 'Powerful (22B) — Best for 24 GB+ VRAM',
	// allow-any-unicode-next-line
	'onboarding.modelPack.reasoning': 'Reasoning (16B MoE) — Deep thinking, 12 GB VRAM',
	'onboarding.startGuided': 'Start guided setup',
	'onboarding.startApp': 'Start with CortexIDE',
	'onboarding.settingsAndThemes': 'Settings and Themes',
	'onboarding.transferSettings': 'Transfer your settings from an existing editor?',
	'onboarding.welcome': 'Welcome',
	'onboarding.headline': 'Build with the editor AI actually ships in',

	// allow-any-unicode-next-line
	// ── Express onboarding (zero-friction path) ───────────────────────────────
	'express.title': 'Setting up local AI…',
	'express.subtitle': 'CortexIDE is preparing your private, on-device coding assistant.',
	'express.detecting': 'Detecting your hardware…',
	'express.detected': 'Detected {0} GB of GPU memory.',
	'express.detectedNoGPU': 'No discrete GPU detected — using a small model.',
	'express.installPromptTitle': 'Install Ollama?',
	'express.installPromptBody': 'CortexIDE will install Ollama, the local AI runtime, to run models privately on your computer. No data leaves your device.',
	'express.installConfirm': 'Install Ollama',
	'express.installDecline': 'Use a free cloud key instead',
	'express.installing': 'Installing Ollama…',
	'express.pulling': 'Downloading {0}…',
	'express.pullingPercent': 'Downloading {0} ({1}%)',
	'express.ready': 'Ready! Local AI is set up.',
	'express.startChatting': 'Start chatting',
	'express.customize': 'Customize setup',
	'express.fallbackTitle': 'Use a free cloud model',
	'express.fallbackBody': 'No local install needed. Groq offers a free API tier with fast Llama models. Get a key (takes 60 seconds), paste it below, and you are ready.',
	'express.openGroqKeyPage': 'Open Groq key page',
	'express.pasteKeyPlaceholder': 'Paste your Groq API key here (starts with gsk_…)',
	'express.useGroqKey': 'Continue with Groq',
	'express.invalidKey': 'That key does not look right. Groq keys start with "gsk_".',
	'express.error.installFailed': 'Ollama install failed. You can use a free cloud key instead.',
	'express.error.pullFailed': 'Model download failed. You can retry or use a free cloud key instead.',
	'express.retry': 'Retry',
	'express.useCloudInstead': 'Use a free cloud key instead',
	'express.dismiss': 'Skip for now',

	// allow-any-unicode-next-line
	// ── Chat / Sidebar ───────────────────────────────────────────────────────
	'chat.placeholder': 'Ask CortexIDE anything…',
	'chat.placeholderAgent': 'Describe a task for the agent…',
	'chat.newThread': 'New chat',
	'chat.history': 'Chat history',
	'chat.branchFromHere': 'Branch from here',
	'chat.copyMessage': 'Copy',
	'chat.deleteThread': 'Delete thread',
	'chat.duplicateThread': 'Duplicate thread',
	'chat.thinking': 'Thinking…',
	'chat.generating': 'Generating…',
	'chat.stop': 'Stop',
	'chat.send': 'Send',
	'chat.attachFile': 'Attach file',
	'chat.attachImage': 'Attach image',
	'chat.contextFiles': 'Context files',
	'chat.addContext': 'Add context',
	'chat.mode.chat': 'Chat',
	'chat.mode.ask': 'Ask',
	'chat.mode.agent': 'Agent',
	'chat.mode.plan': 'Plan',
	'chat.mode.edit': 'Edit',
	'chat.mode.gather': 'Gather',
	'chat.model': 'Model',
	'chat.previousThreads': 'Previous Threads',
	'chat.suggestions': 'Suggestions',

	// allow-any-unicode-next-line
	// ── Agent Mode ────────────────────────────────────────────────────────────
	'agent.planStep': 'Planning',
	'agent.executeStep': 'Executing',
	'agent.approvalRequired': 'Approval required',
	'agent.approve': 'Approve',
	'agent.reject': 'Reject',
	'agent.toolCall': 'Tool call',
	'agent.readingFile': 'Reading file',
	'agent.editingFile': 'Editing file',
	'agent.runningCommand': 'Running command',
	'agent.searchingCodebase': 'Searching codebase',
	'agent.steps': 'Steps',
	'agent.done': 'Done',
	'agent.failed': 'Failed',

	// allow-any-unicode-next-line
	// ── Diff / Code edits ─────────────────────────────────────────────────────
	'diff.acceptAll': 'Accept all',
	'diff.rejectAll': 'Reject all',
	'diff.acceptHunk': 'Accept hunk',
	'diff.rejectHunk': 'Reject hunk',
	'diff.nextHunk': 'Next change',
	'diff.prevHunk': 'Previous change',

	// allow-any-unicode-next-line
	// ── Settings ──────────────────────────────────────────────────────────────
	'settings.title': 'CortexIDE Settings',
	'settings.providers': 'Providers',
	'settings.models': 'Models',
	'settings.local': 'Local Setup',
	'settings.localProviders': 'Local Providers',
	'settings.mainProviders': 'Main Providers',
	'settings.featureOptions': 'Feature Options',
	'settings.allSettings': 'All Settings',
	'settings.mcp': 'MCP Servers',
	'settings.mcpShort': 'MCP',
	'settings.general': 'General',
	'settings.language': 'Display language',
	'settings.languageDesc': 'Choose the display language for CortexIDE interface.',
	'settings.save': 'Save',
	'settings.saved': 'Saved',
	'settings.apiKey': 'API Key',
	'settings.endpoint': 'Endpoint URL',
	'settings.addModel': 'Add model',
	'settings.removeModel': 'Remove',
	'settings.enableProvider': 'Enable provider',
	'settings.localProvidersDesc': 'CortexIDE can access any model that you host locally. We automatically detect your local models by default.',
	'settings.mainProvidersDesc': 'CortexIDE can access models from Anthropic, OpenAI, OpenRouter, and more.',
	'settings.autocompleteDesc': 'Experimental.',
	'settings.autocompleteHint': 'Only works with FIM models.*',
	'settings.applyDesc': 'Settings that control the behavior of the Apply button.',
	'settings.tools': 'Tools',
	'settings.toolsDesc': 'Tools are functions that LLMs can call. Some tools require user approval.',
	'settings.enabled': 'Enabled',
	'settings.disabled': 'Disabled',
	'settings.sameAsChat': 'Same as Chat model',
	'settings.differentModel': 'Different model',
	'settings.fixLintErrors': 'Fix lint errors',
	'settings.autoAcceptLLMChanges': 'Auto-accept LLM changes',
	'settings.routingPolicy': 'Routing policy',
	'settings.noServersFound': 'No servers found',
	'settings.showInDropdown': 'Show in Dropdown',
	'settings.hideFromDropdown': 'Hide from Dropdown',
	'settings.customModel': 'Custom model',
	'settings.advancedSettings': 'Advanced Settings',
	'settings.delete': 'Delete',
	'settings.added': 'Added',
	'settings.providerName': 'Provider Name',
	'settings.modelName': 'Model Name',
	'settings.fastApply': 'Fast Apply',
	'settings.slowApply': 'Slow Apply',
	'settings.fastApplyDesc': 'Output Search/Replace blocks',
	'settings.slowApplyDesc': 'Rewrite whole files',
	'settings.codeModels': 'Code Models',
	'settings.visionModels': 'Vision Models (Image Analysis)',
	'settings.generalPurpose': 'General Purpose',
	'settings.showSuggestionsOnSelect': 'Show suggestions on select',
	'settings.enableYOLOMode': 'YOLO Mode',
	'settings.installOllama': 'Install Ollama',
	'settings.installing': 'Installing…',
	'settings.healthy': 'Healthy',
	'settings.waiting': 'Waiting',
	'settings.installMethod': 'Install method',
	'common.add': 'Add',

	// allow-any-unicode-next-line
	// ── Rules ─────────────────────────────────────────────────────────────────
	'rules.title': 'Project Rules',
	'rules.description': 'Rules defined in .cortexide/rules/*.md are injected into every agent session.',
	'rules.noRules': 'No rules defined yet',
	'rules.createRule': 'Create rule file',
	'rules.openRulesDir': 'Open rules directory',

	// allow-any-unicode-next-line
	// ── Local models ──────────────────────────────────────────────────────────
	'local.ollama.notRunning': 'Ollama is not running',
	'local.ollama.start': 'Start Ollama',
	'local.ollama.install': 'Install Ollama',
	'local.model.downloading': 'Downloading',
	'local.model.ready': 'Ready',
	'local.model.notFound': 'Model not found',
	'local.model.pull': 'Download model',

	// allow-any-unicode-next-line
	// ── Common ────────────────────────────────────────────────────────────────
	'common.cancel': 'Cancel',
	'common.confirm': 'Confirm',
	'common.loading': 'Loading…',
	'common.error': 'Error',
	'common.retry': 'Retry',
	'common.close': 'Close',
	'common.back': 'Back',
	'common.next': 'Next',
	'common.skip': 'Skip',
	'common.done': 'Done',
	'common.copy': 'Copy',
	'common.copied': 'Copied!',
	'common.open': 'Open',

	// allow-any-unicode-next-line
	// ── Routing / free-tier router ───────────────────────────────────────────
	'routing.policy.label': 'Routing policy',
	'routing.policy.description': 'Controls how CortexIDE picks between configured model providers.',
	'routing.policy.autoCheapest': 'Auto (cheapest viable)',
	'routing.policy.freeTier': 'Free-tier ladder',
	'routing.policy.localOnly': 'Local only',
	'routing.statusBar.label': 'Free-tier quota',
	'routing.statusBar.none': 'No free-tier providers',
	'routing.statusBar.entry': '{0}: {1}/{2} RPD',
	'routing.statusBar.entryRpm': '{0}: {1}/{2} RPM',
	'routing.statusBar.exhausted': '{0}: exhausted',
	'routing.statusBar.uncapped': '{0}: uncapped',
	'routing.statusBar.tooltipTitle': 'Free-tier provider quotas',
	'routing.statusBar.tooltipNoProviders': 'No free-tier providers are configured. Add a free-tier API key (Groq, Gemini, OpenRouter, Mistral) to see live quota tracking.',
	'routing.statusBar.allExhausted': 'Free quota exhausted',
	'routing.statusBar.allExhaustedHint': 'All free-tier quotas exhausted — switch to a local model or add an API key.',

	// ── Settings page additional translations ────────────────────────────────
	'settings.confirmReset': 'Confirm Reset',
	'settings.invalidJson': 'Invalid JSON',
	'settings.overrideDefaults': 'Override model defaults',
	'settings.jsonAdvancedDesc': 'See the [sourcecode]({0}) for a reference on how to set this JSON (advanced).',
	'settings.changeDefaultsFor': 'Change Defaults for {0} ({1})',
	'settings.cancel': 'Cancel',
	'settings.confirm': 'Confirm',
	'settings.seeOnboarding': 'See onboarding screen?',

	// ── Refresh buttons ──────────────────────────────────────────────────────
	'settings.modelsUpToDate': '{0} Models are up-to-date!',
	'settings.providerNotFound': '{0} not found!',
	'settings.manualRefresh': 'Manually refresh {0} models.',
	'settings.foundOnline': '{0}: found {1} model{2} online',
	'settings.noOnlineCatalog': '{0}: no online catalog — using the built-in list',
	'settings.refreshCatalogFailed': 'Failed to refresh {0} catalog',
	'settings.refreshModelCatalog': 'Refresh {0} model catalog',

	// ── Ollama setup ─────────────────────────────────────────────────────────
	'settings.ollamaSetup': 'Ollama Setup',
	'settings.installOllamaBtn': 'Install Ollama',
	'settings.installingOllama': 'Installing…',
	'settings.retry': 'Retry',
	'settings.pullModel': 'Pull model:',
	'settings.pull': 'Pull',
	'settings.deleteModel': 'Delete',
	'settings.copyLog': 'Copy log',
	'settings.clear': 'Clear',
	'settings.installMethod.auto': 'Auto',
	'settings.installMethod.brew': 'Homebrew (macOS)',
	'settings.installMethod.curl': 'Curl Script (macOS/Linux)',
	'settings.installMethod.winget': 'Winget (Windows)',
	'settings.installMethod.choco': 'Chocolatey (Windows)',
	'settings.autoTuneAfterPull': 'Auto-tune after pull',
	'settings.enableRepoIndexer': 'Enable repo indexer',
	'settings.autoCompact': 'Auto-compact long agent runs',
	'settings.lifecycleHooks': 'Lifecycle hooks',
	'settings.useHeadlessBrowsing': 'Use headless browsing',

	// ── Routing policy ──────────────────────────────────────────────────────
	'settings.routingPolicyDesc': 'Controls how CortexIDE picks between configured model providers. Free-tier ladder tracks per-provider quotas and auto-fails-over on 429.',
	'settings.routingPolicy.autoCheapest': 'Auto (cheapest viable)',
	'settings.routingPolicy.freeTier': 'Free-tier ladder',
	'settings.routingPolicy.localOnly': 'Local only',

	// ── YOLO Mode ───────────────────────────────────────────────────────────
	'settings.yoloMode': 'YOLO Mode',
	'settings.yoloModeDesc': 'Automatically apply low-risk edits without approval. High-risk edits always require approval.',
	'settings.yoloRiskThreshold': 'Risk Threshold',
	'settings.yoloRiskDesc': 'Edits with risk below this threshold will auto-apply (0.0 = safe, 1.0 = dangerous)',
	'settings.yoloConfidenceThreshold': 'Confidence Threshold',
	'settings.yoloConfidenceDesc': 'Edits with confidence above this threshold will auto-apply (0.0 = uncertain, 1.0 = confident)',

	// ── Editor ──────────────────────────────────────────────────────────────
	'settings.editor': 'Editor',
	'settings.editorDesc': 'Settings that control the visibility of CortexIDE suggestions in the code editor.',

	// ── One-Click Switch ────────────────────────────────────────────────────
	'settings.oneClickSwitch': 'One-Click Switch',
	'settings.oneClickSwitchDesc': 'Transfer your editor settings into CortexIDE.',

	// ── Import/Export ───────────────────────────────────────────────────────
	'settings.importExport': 'Import/Export',
	'settings.importExportDesc': 'Transfer CortexIDE\'s settings and chats in and out of CortexIDE.',
	'settings.importSettings': 'Import Settings',
	'settings.exportSettings': 'Export Settings',
	'settings.resetSettings': 'Reset Settings',
	'settings.importChats': 'Import Chats',
	'settings.exportChats': 'Export Chats',
	'settings.resetChats': 'Reset Chats',

	// ── Built-in Settings ───────────────────────────────────────────────────
	'settings.builtinSettings': 'Built-in Settings',
	'settings.builtinSettingsDesc': 'IDE settings, keyboard settings, and theme customization.',
	'settings.generalSettings': 'General Settings',
	'settings.keyboardSettings': 'Keyboard Settings',
	'settings.themeSettings': 'Theme Settings',
	'settings.openLogs': 'Open Logs',

	// ── Metrics ─────────────────────────────────────────────────────────────
	'settings.metrics': 'Metrics',
	'settings.metricsDesc': 'Very basic anonymous usage tracking helps us keep CortexIDE running smoothly. You may opt out below. Regardless of this setting, CortexIDE never sees your code, messages, or API keys.',

	// ── Auto-approve tools ──────────────────────────────────────────────────
	'settings.autoApprove': 'Auto-approve {0}',

	// ── Misc ────────────────────────────────────────────────────────────────
	'settings.noToolsAvailable': 'No tools available',
	'settings.command': 'Command:',
	'settings.detectedLocally': 'Detected locally',
	'settings.installOllamaModel': 'Please install an Ollama model. We\'ll auto-detect it.',
	'settings.addModelFor': 'Please add a model for {0} (Models section).',

	// ── Onboarding additional ───────────────────────────────────────────────
	'onboarding.highlights.chatQuickEdit': 'Chat + Quick Edit',
	'onboarding.highlights.fastApply': 'Fast Apply diffs',
	'onboarding.highlights.pdfImage': 'PDF & image uploads',
	'onboarding.highlights.localCloud': 'Local & cloud models',
	'onboarding.stats.uploads.label': 'Uploads',
	'onboarding.stats.uploads.value': 'PDFs + Images',
	'onboarding.stats.uploads.detail': 'Drop specs, screenshots, and research straight into chat',
	'onboarding.stats.fastApply.label': 'Fast Apply',
	'onboarding.stats.fastApply.value': 'Line-by-line',
	'onboarding.stats.fastApply.detail': 'Approve every change from the diff that generated it',
	'onboarding.stats.modelRouter.label': 'Model router',
	'onboarding.stats.modelRouter.value': 'Auto-switch',
	'onboarding.stats.modelRouter.detail': 'Chooses Anthropic, GPT-4o, Gemini, DeepSeek, or Ollama per task',
	'onboarding.stats.agentTools.label': 'Agent tools',
	'onboarding.stats.agentTools.value': '{0} built-ins',
	'onboarding.stats.agentTools.detail': 'File edits, terminal, web search, LSP navigation, code review, and more',
	'onboarding.tab.free': 'Free',
	'onboarding.tab.paid': 'Paid',
	'onboarding.tab.local': 'Local',
	'onboarding.tab.cloudOther': 'Cloud/Other',
	'onboarding.tab.free.desc': 'Providers with a 100% free tier. Add as many as you\'d like!',
	'onboarding.tab.paid.desc': 'Connect directly with any provider (bring your own key).',
	'onboarding.tab.local.desc': 'Active providers should appear automatically. Add as many as you\'d like!',
	'onboarding.tab.cloudOther.desc': 'Add as many as you\'d like! Reach out for custom configuration requests.',
	'onboarding.feature.chat': 'Chat',
	'onboarding.feature.quickEdit': 'Quick Edit',
	'onboarding.feature.autocomplete': 'Autocomplete',
	'onboarding.feature.fastApply': 'Fast Apply',
	'onboarding.feature.sourceControl': 'Source Control',
	'onboarding.step02': 'Step 02',
	'onboarding.chooseProviders': 'Choose your model providers',
	'onboarding.chooseProvidersDesc': 'Load multiple providers at once. CortexIDE can route Chat, Quick Edit, and Autocomplete to the strongest model on every request.',
	'onboarding.featureCoverage': 'Feature coverage',
	'onboarding.connected': 'Connected',
	'onboarding.pending': 'Pending',
	'onboarding.setupLocalAuto': 'Set up local AI automatically',
	'onboarding.setupLocalAutoDesc': 'Install Ollama + download the best model for your hardware - guided setup in 2 minutes',
	'onboarding.addProvider': 'Add {0}',
	'onboarding.details': 'Details',
	'onboarding.localLabel': 'Local',
	'onboarding.modelsLabel': 'Models',
	'onboarding.localModelsDesc': 'Local models auto-detect when possible. Add custom entries to fine tune routing.',
	'onboarding.connectOneModel': 'Please connect at least one Chat-capable model before moving on.',
	'onboarding.tooltip.gemini': 'Gemini 2.5 Pro offers 25 free chats daily, Flash offers ~500. Upgrade later if you exhaust credits.',
	'onboarding.tooltip.openRouter': 'OpenRouter grants 50 free chats a day (1000 with a $10 deposit) on models tagged :free.',
	'onboarding.tooltip.pollinations': 'Cheap API with many models (Pollen credits). Get your key at enter.pollinations.ai.',
	'onboarding.fillRequired': 'Please enter all required fields or choose another provider',
	'onboarding.welcomeDesc': 'CortexIDE keeps Chat, Quick Edit, Fast Apply, and source control in the same dark workspace-and it adds native PDF + image uploads so product specs and design mocks travel with every conversation.',
	'onboarding.yes': 'Yes',
	'onboarding.no': 'No',
	'onboarding.yesStar': 'Yes*',
	'onboarding.wantToUse.smart.basic': 'Models with the best performance on benchmarks.',
	'onboarding.wantToUse.private.basic': 'Host on your computer or local network for full data privacy.',
	'onboarding.wantToUse.cheap.basic': 'Free and affordable options.',
	'onboarding.wantToUse.smart.detailed': 'Most intelligent and best for agent mode.',
	'onboarding.wantToUse.private.detailed': 'Private-hosted so your data never leaves your computer or network.',
	'onboarding.wantToUse.cheap.detailed': 'Use great deals like Gemini 2.5 Pro, or self-host a model with Ollama or vLLM for free.',

	// ── Local Setup Wizard ──────────────────────────────────────────────────
	'localWizard.error.notRunning': 'Ollama installation completed but service is not running. Please start Ollama manually.',
	'localWizard.error.installFailed': 'Failed to install Ollama. Please install it manually from https://ollama.com',
	'localWizard.error.downloadFailed': 'Failed to download models. Please check your internet connection and try again.',
	'localWizard.error.verifyFailed': 'Failed to verify model capabilities. Please check that your models are properly installed.',
	'localWizard.error.skipped': 'Verification skipped',
	'localWizard.error.defaultsFailed': 'Failed to set default models. You can configure them manually in settings.',
	'localWizard.setupError': 'Setup Error',
	'localWizard.failedWhileDownloading': 'Failed while downloading: {0}',
	'localWizard.required': 'Required: {0}',
	'localWizard.available': 'Available: {0}',
	'localWizard.startOver': 'Start Over',
	'localWizard.skipSetup': 'Skip Setup',
	'localWizard.stepProgress': 'Step {0} of {1}',
	'localWizard.chooseSetup': 'Choose your setup',
	'localWizard.chooseSetupDesc': 'Get started with CortexIDE. Choose local models for privacy, or use cloud providers.',
	'localWizard.useLocalModels': 'Use local models (no API keys)',
	'localWizard.useLocalModelsDesc': 'Run models on your computer for complete privacy. We\'ll help you set up Ollama.',
	'localWizard.useCloudProvider': 'Use cloud provider',
	'localWizard.useCloudProviderDesc': 'Connect to Anthropic, OpenAI, or other cloud providers with API keys.',
	'localWizard.decideLater': 'Decide later',
	'localWizard.systemCheck': 'System Check',
	'localWizard.ollamaInstalled': 'Ollama installed',
	'localWizard.ollamaRunning': 'Ollama running',
	'localWizard.diskSpace': 'Disk space: {0} GB available',
	'localWizard.chooseModelPack': 'Choose a model pack',
	'localWizard.detectedVram': 'Detected {0} GB GPU memory - best model pre-selected for your hardware.',
	'localWizard.selectModelPackDesc': 'Select a pre-configured set of models optimized for different use cases.',
	'localWizard.bestForHardware': 'Best for your hardware',
	'localWizard.recommended': 'Recommended',
	'localWizard.gb': '{0} GB',
	'localWizard.ram': '{0}+ GB RAM',
	'localWizard.downloadingModel': 'Downloading {0}...',
	'localWizard.modelsProgress': '{0} of {1} models',
	'localWizard.downloading': 'Downloading...',
	'localWizard.downloadModels': 'Download Models',
	'localWizard.verifyingCapabilities': 'Verifying Capabilities',
	'localWizard.verifyingDesc': 'Testing that your local models work correctly.',
	'localWizard.testing': 'Testing {0}...',
	'localWizard.runVerification': 'Run Verification',
	'localWizard.verificationResults': 'Verification Results',
	'localWizard.someTestsFailed': 'Some verification tests failed. You can still proceed, but some features may not work correctly.',
	'localWizard.continue': 'Continue',
	'localWizard.continueAnyway': 'Continue Anyway',
	'localWizard.skipped': '(skipped)',
	'localWizard.chat': 'Chat',
	'localWizard.toolCalling': 'Tool Calling',
	'localWizard.webCalling': 'Web Calling',
	'localWizard.setupComplete': 'Setup Complete!',
	'localWizard.setupCompleteDesc': 'Your local models are configured and ready to use. CortexIDE will use local models by default.',
	'localWizard.startUsingCortexIDE': 'Start using CortexIDE',
	'settings.addConnection': 'Add connection',
	'settings.connectionName': 'Connection name',
	'settings.connection': 'Connection',
	'settings.addAModel': 'Add a model',
	'settings.ollamaSetupRev': 'Ollama Setup (rev 2025-10-30-1)',
	'settings.autoCompactTooltip': 'When an agent run nears the model context window, send a compacted view (keep the task + recent messages) so it continues instead of overflowing. Non-destructive: the stored conversation is unchanged.',
	'settings.lifecycleHooksTooltip': 'Run your own commands from .cortexide/hooks.json at agent events (pre-tool, post-tool, agent-stop). Commands run quietly with no shell, fire-and-forget.',
	'settings.useHeadlessBrowsingTooltip': 'Use headless BrowserWindow for better content extraction from complex pages. Disable to use direct HTTP fetch instead.',
	'settings.vision': '(Vision)',
	'settings.visionBetterQuality': '(Vision, Better Quality)',
	'settings.visionFaster': '(Vision, Faster)',
	'settings.manuallyInstall1': '1. If the install does not start, download Ollama manually from [ollama.com/download](https://ollama.com/download).',
	'settings.manuallyInstall2': '2. Optionally, run `ollama pull llama3.1` to install a starter model.',
	'settings.autoDetectModels': 'CortexIDE automatically detects locally running models and enables them.',
	'settings.transferFrom': 'Transfer from {0}',
	'settings.transferring': 'Transferring',
	'settings.settingsTransferred': 'Settings Transferred',
	'settings.optOutRestart': 'Opt-out (requires restart)',
	'settings.aiInstructions': 'AI Instructions',
	'settings.aiInstructionsDesc': 'System instructions to include with all AI requests.',
	'settings.aiInstructionsDesc2': 'For project-scoped rules, use `.cortexide/rules/*.md` files - see Project Rules below.',
	'settings.disableSystemMessage': 'Disable system message',
	'settings.disableSystemMessageDesc': 'When disabled, CortexIDE will not include anything in the system message except for content you specified above.',
	'settings.scmDesc': 'Settings that control the behavior of the commit message generator.',
	'settings.addMcpServer': 'Add MCP Server',
	'settings.mcpDesc': 'Use Model Context Protocol to provide Agent mode with more tools.',
	'settings.playwrightAdded': 'Added the Playwright MCP server (browser automation) to mcp.json. It connects via npx on first use.',
	'settings.playwrightExists': 'A "playwright" MCP server is already in your mcp.json.',
	'settings.playwrightAddFailed': 'Could not add Playwright MCP: {0}',
	'settings.playwrightButton': '+ Playwright (browser automation)',
	'settings.importedSuccess': '{0} imported successfully!',
	'settings.importFailed': 'Failed to import {0}',
	'settings.confirmDeleteModel': 'Delete model "{0}" from Ollama?',
	'settings.selectModelPull': 'Please select a model to pull.',
	'settings.selectModelDelete': 'Please select a model to delete.',
	'settings.modelPulledSuccess': 'Model "{0}" pulled successfully.',
	'settings.modelDeletedSuccess': 'Model "{0}" deleted successfully.',
	'settings.pullStarted': 'Started pulling "{0}". This may take a while for large models. Check terminal for progress.',
	'settings.warmingIndex': 'Warming project index...',
	'settings.indexWarmed': 'Project index warmed.',
	'settings.modelPullFailed': 'Failed to pull model "{0}". See terminal for details.',
	'settings.modelDeleteFailed': 'Failed to delete model "{0}". See terminal for details.',
	'settings.deleteTimeout': 'Delete command for "{0}" timed out. Check terminal to see if it completed.',
	'settings.pullFailedShort': 'Failed to pull {0}. Check terminal for details.',
	'settings.pullSuccess': 'Successfully pulled {0}',
	'settings.pullFailedExit': 'Failed to pull {0} (exit code {1}). Check terminal for details.',
	'settings.pullInProgress': 'Pulling {0}...',
	'settings.pullInProgressLong': 'Pulling {0}... (may take time for large models)',
	'settings.pullError': 'Error pulling {0}: {1}',
	'settings.pullStartFailed': 'Failed to start pull: {0}',
	'settings.deleteStarted': 'Deleting {0}...',
	'settings.deleteSuccess': 'Successfully deleted {0}',
	'settings.deleteFailedExit': 'Failed to delete {0} (exit code {1}). Check terminal for details.',
	'settings.deleteTimeoutShort': 'Delete command timed out for {0}. The command may still be running.',
	'settings.deleteError': 'Error deleting {0}: {1}',
	'settings.deleteStartFailed': 'Failed to start delete: {0}',
	'settings.installStarted': 'Ollama install started in the integrated terminal. Models will appear when ready.',
	'settings.installStartFailedNotif': 'Failed to start Ollama install. Please try again or install manually.',
	'settings.installerRunning': 'Running installer in terminal...',
	'settings.installStartFailed': 'Failed to start install. See terminal or try manual install.',
	'settings.ollamaRunning': 'Ollama is running. Models will appear shortly.',
	'settings.noWorkspace': 'No workspace folder open.',
	'settings.newRule': '# New Rule',
	'settings.ruleDesc': 'Describe the rule here.',
	'settings.clickToOpen': 'Click to open rule file',
	'settings.aiInstructionsPlaceholder': 'Do not change my indentation or delete my comments. When writing TS or JS, do not add ;\'s. Write new code using Rust if possible. ',
	'settings.autoDetectLocal': 'Automatically detect local providers and models ({0}).',
	'settings.addTooltip': 'Add {0} to enable',
	'settings.recommendOllama': 'We recommend using the largest qwen2.5-coder model you can with Ollama (try qwen2.5-coder:3b).',
	'settings.modelNotFound': 'Model not recognized by CortexIDE.',
	'settings.modelPackaged': '{0} comes packaged with CortexIDE, so you shouldn\'t need to change these settings.',
	'settings.modelRecognized': 'CortexIDE recognizes {0} ("{1}").',
	'settings.thisModelExists': 'This model already exists.',
	'settings.selectProvider': 'Please select a provider.',
	'settings.enterModelName': 'Please enter a model name.',

	// ── Feature names (displayInfoOfFeatureName) ────────────────────────────
	'settings.feature.Autocomplete': 'Autocomplete',
	'settings.feature.Ctrl+K': 'Quick Edit',
	'settings.feature.Chat': 'Chat',
	'settings.feature.Apply': 'Apply',
	'settings.feature.SCM': 'Commit Message Generator',

	// ── Provider descriptions (subTextMdOfProviderName, Markdown) ───────────
	'settings.providerDesc.anthropic': 'Get your [API Key here](https://console.anthropic.com/settings/keys).',
	'settings.providerDesc.openAI': 'Get your [API Key here](https://platform.openai.com/api-keys).',
	'settings.providerDesc.deepseek': 'Get your [API Key here](https://platform.deepseek.com/api_keys).',
	'settings.providerDesc.openRouter': 'Get your [API Key here](https://openrouter.ai/settings/keys). Read about [rate limits here](https://openrouter.ai/docs/api-reference/limits).',
	'settings.providerDesc.gemini': 'Get your [API Key here](https://aistudio.google.com/apikey). Read about [rate limits here](https://ai.google.dev/gemini-api/docs/rate-limits#current-rate-limits).',
	'settings.providerDesc.groq': 'Get your [API Key here](https://console.groq.com/keys).',
	'settings.providerDesc.xAI': 'Get your [API Key here](https://console.x.ai).',
	'settings.providerDesc.mistral': 'Get your [API Key here](https://console.mistral.ai/api-keys).',
	'settings.providerDesc.openAICompatible': 'Use any provider that\'s OpenAI-compatible (use this for llama.cpp and more).',
	'settings.providerDesc.googleVertex': 'You must authenticate before using Vertex with Void. Read more about endpoints [here](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library), and regions [here](https://cloud.google.com/vertex-ai/docs/general/locations#available-regions).',
	'settings.providerDesc.microsoftAzure': 'Read more about endpoints [here](https://learn.microsoft.com/en-us/rest/api/aifoundry/model-inference/get-chat-completions/get-chat-completions?view=rest-aifoundry-model-inference-2024-05-01-preview&tabs=HTTP), and get your API key [here](https://learn.microsoft.com/en-us/azure/search/search-security-api-keys?tabs=rest-use%2Cportal-find%2Cportal-query#find-existing-keys).',
	'settings.providerDesc.awsBedrock': 'Connect via a LiteLLM proxy or the AWS [Bedrock-Access-Gateway](https://github.com/aws-samples/bedrock-access-gateway). LiteLLM Bedrock setup docs are [here](https://docs.litellm.ai/docs/providers/bedrock).',
	'settings.providerDesc.ollama': 'Read more about custom [Endpoints here](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-expose-ollama-on-my-network).',
	'settings.providerDesc.vLLM': 'Read more about custom [Endpoints here](https://docs.vllm.ai/en/latest/getting_started/quickstart.html#openai-compatible-server).',
	'settings.providerDesc.lmStudio': 'Read more about custom [Endpoints here](https://lmstudio.ai/docs/app/api/endpoints/openai).',
	'settings.providerDesc.liteLLM': 'Read more about endpoints [here](https://docs.litellm.ai/docs/providers/openai_compatible).',
	'settings.providerDesc.pollinations': 'Get your [API Key here](https://enter.pollinations.ai/). [API Docs](https://enter.pollinations.ai/api/docs).',
	'settings.providerDesc.moonshot': 'Get your free [API Key here](https://platform.moonshot.ai/console/api-keys). Kimi K2 has a generous free tier. [Pricing](https://platform.moonshot.ai/docs/pricing).',
	'settings.providerDesc.cerebras': 'Get your free [API Key here](https://cloud.cerebras.ai/). Free tier includes 1M tokens/day with no card required. [Docs](https://inference-docs.cerebras.ai/).',

	// ── Setting titles (displayInfoOfSettingName.title) ─────────────────────
	'settings.settingTitle.apiKey': 'API Key',
	'settings.settingTitle.endpoint': 'Endpoint',
	'settings.settingTitle.baseURL': 'baseURL',
	'settings.settingTitle.customHeaders': 'Custom Headers',
	'settings.settingTitle.region': 'Region',
	'settings.settingTitle.apiVersion': 'API Version',
	'settings.settingTitle.resource': 'Resource',
	'settings.settingTitle.project': 'Project',

	// ── Provider description extras (displayInfoOfProviderName.desc) ─────────
	'settings.providerDescExtra.moonshot': 'Kimi K2 - #1 SWE-bench agentic coding. Free tier available.',
	'settings.providerDescExtra.cerebras': 'Free tier: 1M tokens/day, ~2,600 tok/s, 8K context cap.',
} as const;

// allow-any-unicode-next-line
// ─── locale bundles ───────────────────────────────────────────────────────────
// allow-any-unicode-next-line
// Partial translations — missing keys fall back to EN_TRANSLATIONS at runtime.

const ZH_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': '欢迎使用 CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': '开源 AI IDE — 完全离线运行',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': '设置本地 AI（在您的设备上运行）',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': '连接云服务提供商（OpenAI、Anthropic 等）',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': '稍后设置',
	// allow-any-unicode-next-line
	'chat.placeholder': '向 CortexIDE 提问…',
	// allow-any-unicode-next-line
	'chat.newThread': '新建对话',
	// allow-any-unicode-next-line
	'chat.thinking': '正在思考…',
	// allow-any-unicode-next-line
	'chat.stop': '停止',
	// allow-any-unicode-next-line
	'chat.send': '发送',
	// allow-any-unicode-next-line
	'chat.mode.chat': '对话',
	// allow-any-unicode-next-line
	'chat.mode.agent': '智能体',
	// allow-any-unicode-next-line
	'chat.mode.edit': '编辑',
	// allow-any-unicode-next-line
	'diff.acceptAll': '接受全部',
	// allow-any-unicode-next-line
	'diff.rejectAll': '拒绝全部',
	// allow-any-unicode-next-line
	'settings.title': 'CortexIDE 设置',
	// allow-any-unicode-next-line
	'settings.language': '显示语言',
	// allow-any-unicode-next-line
	'common.cancel': '取消',
	// allow-any-unicode-next-line
	'common.loading': '加载中…',
	// allow-any-unicode-next-line
	'common.error': '错误',
	// allow-any-unicode-next-line
	'common.close': '关闭',
	// allow-any-unicode-next-line
	'common.done': '完成',
	// allow-any-unicode-next-line
	'common.copy': '复制',
	// allow-any-unicode-next-line
	'common.copied': '已复制！',
	// allow-any-unicode-next-line
	'settings.models': '模型',
	// allow-any-unicode-next-line
	'settings.localProviders': '本地提供商',
	// allow-any-unicode-next-line
	'settings.mainProviders': '主要提供商',
	// allow-any-unicode-next-line
	'settings.featureOptions': '功能选项',
	// allow-any-unicode-next-line
	'settings.allSettings': '所有设置',
	// allow-any-unicode-next-line
	'settings.mcpShort': 'MCP',
	// allow-any-unicode-next-line
	'settings.general': '常规',
	// allow-any-unicode-next-line
	'settings.apiKey': 'API 密钥',
	// allow-any-unicode-next-line
	'settings.addModel': '添加模型',
	// allow-any-unicode-next-line
	'settings.removeModel': '移除',
	// allow-any-unicode-next-line
	'settings.enableProvider': '启用提供商',
	// allow-any-unicode-next-line
	'settings.localProvidersDesc': 'CortexIDE 可以访问您本地托管的任何模型。我们默认自动检测本地模型。',
	// allow-any-unicode-next-line
	'settings.mainProvidersDesc': 'CortexIDE 可以访问 Anthropic、OpenAI、OpenRouter 等提供商的模型。',
	// allow-any-unicode-next-line
	'settings.autocompleteDesc': '实验性功能。',
	// allow-any-unicode-next-line
	'settings.autocompleteHint': '仅适用于 FIM 模型。*',
	// allow-any-unicode-next-line
	'settings.applyDesc': '控制 Apply 按钮行为的设置。',
	// allow-any-unicode-next-line
	'settings.tools': '工具',
	// allow-any-unicode-next-line
	'settings.toolsDesc': '工具是大语言模型可以调用的函数。部分工具需要用户确认。',
	// allow-any-unicode-next-line
	'settings.enabled': '已启用',
	// allow-any-unicode-next-line
	'settings.disabled': '已禁用',
	// allow-any-unicode-next-line
	'settings.sameAsChat': '与对话模型相同',
	// allow-any-unicode-next-line
	'settings.differentModel': '不同模型',
	// allow-any-unicode-next-line
	'settings.fixLintErrors': '修复 lint 错误',
	// allow-any-unicode-next-line
	'settings.autoAcceptLLMChanges': '自动接受 LLM 修改',
	// allow-any-unicode-next-line
	'settings.routingPolicy': '路由策略',
	// allow-any-unicode-next-line
	'settings.noServersFound': '未找到服务器',
	// allow-any-unicode-next-line
	'settings.showInDropdown': '在下拉菜单中显示',
	// allow-any-unicode-next-line
	'settings.hideFromDropdown': '在下拉菜单中隐藏',
	// allow-any-unicode-next-line
	'settings.customModel': '自定义模型',
	// allow-any-unicode-next-line
	'settings.advancedSettings': '高级设置',
	// allow-any-unicode-next-line
	'settings.delete': '删除',
	// allow-any-unicode-next-line
	'settings.added': '已添加',
	// allow-any-unicode-next-line
	'settings.providerName': '提供商名称',
	// allow-any-unicode-next-line
	'settings.modelName': '模型名称',
	// allow-any-unicode-next-line
	'settings.fastApply': '快速应用',
	// allow-any-unicode-next-line
	'settings.slowApply': '慢速应用',
	// allow-any-unicode-next-line
	'settings.fastApplyDesc': '输出搜索/替换块',
	// allow-any-unicode-next-line
	'settings.slowApplyDesc': '重写整个文件',
	// allow-any-unicode-next-line
	'settings.codeModels': '代码模型',
	// allow-any-unicode-next-line
	'settings.visionModels': '视觉模型（图像分析）',
	// allow-any-unicode-next-line
	'settings.generalPurpose': '通用模型',
	// allow-any-unicode-next-line
	'settings.showSuggestionsOnSelect': '选中时显示建议',
	// allow-any-unicode-next-line
	'settings.enableYOLOMode': 'YOLO 模式',
	// allow-any-unicode-next-line
	'settings.installOllama': '安装 Ollama',
	// allow-any-unicode-next-line
	'settings.installing': '安装中…',
	// allow-any-unicode-next-line
	'settings.healthy': '正常运行',
	// allow-any-unicode-next-line
	'settings.waiting': '等待中',
	// allow-any-unicode-next-line
	'settings.installMethod': '安装方式',
	// allow-any-unicode-next-line
	'rules.title': '项目规则',
	// allow-any-unicode-next-line
	'rules.description': '在 .cortexide/rules/*.md 中定义的规则会注入到每个智能体会话中。',
	// allow-any-unicode-next-line
	'rules.noRules': '尚未定义规则',
	// allow-any-unicode-next-line
	'rules.createRule': '创建规则文件',
	// allow-any-unicode-next-line
	'rules.openRulesDir': '打开规则目录',
	// allow-any-unicode-next-line
	'common.add': '添加',
	// allow-any-unicode-next-line
	// ── Settings page additional translations ────────────────────────────────
	'settings.confirmReset': '确认重置',
	'settings.invalidJson': '无效的 JSON',
	'settings.overrideDefaults': '覆盖模型默认值',
	'settings.jsonAdvancedDesc': '查看 [源代码]({0}) 了解如何设置此 JSON（高级）。',
	'settings.changeDefaultsFor': '修改 {0} 的默认值 ({1})',
	'settings.save': '保存',
	'settings.cancel': '取消',
	'settings.confirm': '确认',
	'settings.seeOnboarding': '查看引导界面？',
	// allow-any-unicode-next-line
	// ── Refresh buttons ──────────────────────────────────────────────────────
	'settings.modelsUpToDate': '{0} 模型已是最新！',
	'settings.providerNotFound': '{0} 未找到！',
	'settings.manualRefresh': '手动刷新 {0} 模型。',
	'settings.foundOnline': '{0}: 在线找到 {1} 个模型',
	'settings.noOnlineCatalog': '{0}: 无在线目录 — 使用内置列表',
	'settings.refreshCatalogFailed': '刷新 {0} 目录失败',
	'settings.refreshModelCatalog': '刷新 {0} 模型目录',
	// allow-any-unicode-next-line
	// ── Ollama setup ─────────────────────────────────────────────────────────
	'settings.ollamaSetup': 'Ollama 设置',
	'settings.installOllamaBtn': '安装 Ollama',
	'settings.installingOllama': '安装中…',
	'settings.retry': '重试',
	'settings.pullModel': '拉取模型：',
	'settings.pull': '拉取',
	'settings.deleteModel': '删除',
	'settings.copyLog': '复制日志',
	'settings.clear': '清除',
	'settings.installMethod.auto': '自动',
	'settings.installMethod.brew': 'Homebrew (macOS)',
	'settings.installMethod.curl': 'Curl 脚本 (macOS/Linux)',
	'settings.installMethod.winget': 'Winget (Windows)',
	'settings.installMethod.choco': 'Chocolatey (Windows)',
	'settings.autoTuneAfterPull': '拉取后自动调优',
	'settings.enableRepoIndexer': '启用仓库索引器',
	'settings.autoCompact': '自动压缩长时间的智能体运行',
	'settings.lifecycleHooks': '生命周期钩子',
	'settings.useHeadlessBrowsing': '使用无头浏览',
	// allow-any-unicode-next-line
	// ── Routing policy ──────────────────────────────────────────────────────
	'settings.routingPolicyDesc': '控制 CortexIDE 如何在已配置的模型提供商之间选择。免费层级会跟踪每个提供商的配额，并在 429 错误时自动故障转移。',
	'settings.routingPolicy.autoCheapest': '自动（最便宜可行）',
	'settings.routingPolicy.freeTier': '免费层级',
	'settings.routingPolicy.localOnly': '仅本地',
	// allow-any-unicode-next-line
	// ── YOLO Mode ───────────────────────────────────────────────────────────
	'settings.yoloMode': 'YOLO 模式',
	'settings.yoloModeDesc': '自动应用低风险编辑，无需确认。高风险编辑始终需要确认。',
	'settings.yoloRiskThreshold': '风险阈值',
	'settings.yoloRiskDesc': '风险低于此阈值的编辑将自动应用（0.0 = 安全，1.0 = 危险）',
	'settings.yoloConfidenceThreshold': '置信度阈值',
	'settings.yoloConfidenceDesc': '置信度高于此阈值的编辑将自动应用（0.0 = 不确定，1.0 = 确定）',
	// allow-any-unicode-next-line
	// ── Editor ──────────────────────────────────────────────────────────────
	'settings.editor': '编辑器',
	'settings.editorDesc': '控制 CortexIDE 建议在代码编辑器中的可见性设置。',
	// allow-any-unicode-next-line
	// ── One-Click Switch ────────────────────────────────────────────────────
	'settings.oneClickSwitch': '一键切换',
	'settings.oneClickSwitchDesc': '将您的编辑器设置迁移到 CortexIDE。',
	// allow-any-unicode-next-line
	// ── Import/Export ───────────────────────────────────────────────────────
	'settings.importExport': '导入/导出',
	'settings.importExportDesc': '在 CortexIDE 内外迁移设置和聊天记录。',
	'settings.importSettings': '导入设置',
	'settings.exportSettings': '导出设置',
	'settings.resetSettings': '重置设置',
	'settings.importChats': '导入聊天',
	'settings.exportChats': '导出聊天',
	'settings.resetChats': '重置聊天',
	// allow-any-unicode-next-line
	// ── Built-in Settings ───────────────────────────────────────────────────
	'settings.builtinSettings': '内置设置',
	'settings.builtinSettingsDesc': 'IDE 设置、键盘设置和主题自定义。',
	'settings.generalSettings': '常规设置',
	'settings.keyboardSettings': '键盘设置',
	'settings.themeSettings': '主题设置',
	'settings.openLogs': '打开日志',
	// allow-any-unicode-next-line
	// ── Metrics ─────────────────────────────────────────────────────────────
	'settings.metrics': '指标',
	'settings.metricsDesc': '基本的匿名使用情况跟踪帮助我们保持 CortexIDE 平稳运行。您可以在下方选择退出。无论此设置如何，CortexIDE 永远不会看到您的代码、消息或 API 密钥。',
	// allow-any-unicode-next-line
	// ── Auto-approve tools ──────────────────────────────────────────────────
	'settings.autoApprove': '自动批准 {0}',
	// allow-any-unicode-next-line
	// ── Misc ────────────────────────────────────────────────────────────────
	'settings.noToolsAvailable': '暂无工具可用',
	'settings.command': '命令：',
	'settings.detectedLocally': '本地检测到',
	'settings.installOllamaModel': '请安装 Ollama 模型。我们会自动检测。',
	'settings.addModelFor': '请为 {0} 添加模型（在模型部分）。',

	'onboarding.localDescription': '您的代码永远不会离开本机。至少需要约 8 GB 内存。',
	'onboarding.cloudDescription': '使用更强大的云端模型。需要 API 密钥。',
	'onboarding.systemCheck': '正在检查系统…',
	'onboarding.installingOllama': '正在安装 Ollama…',
	'onboarding.downloadingModel': '正在下载模型…',
	'onboarding.setupComplete': '设置完成！',
	'onboarding.recommendedModel': '推荐用于您的硬件',
	'onboarding.vramDetected': '已检测到 GPU 显存',
	'onboarding.selectModelPack': '选择模型包',
	'onboarding.modelPack.fast': '快速 (7B) — 适合 8 GB 内存/显存',
	'onboarding.modelPack.balanced': '均衡 (14B) — 适合 16 GB 内存/显存',
	'onboarding.modelPack.powerful': '强大 (22B) — 适合 24 GB+ 显存',
	'onboarding.modelPack.reasoning': '推理 (16B MoE) — 深度思考,12 GB 显存',
	'onboarding.startGuided': '开始引导设置',
	'onboarding.startApp': '使用 CortexIDE 开始',
	'onboarding.settingsAndThemes': '设置和主题',
	'onboarding.transferSettings': '是否从现有编辑器导入您的设置?',
	'onboarding.welcome': '欢迎',
	'onboarding.headline': '使用真正内置 AI 的编辑器构建',
	'express.title': '正在设置本地 AI…',
	'express.subtitle': 'CortexIDE 正在准备您的私有设备端编程助手。',
	'express.detecting': '正在检测您的硬件…',
	'express.detected': '已检测到 {0} GB 显存。',
	'express.detectedNoGPU': '未检测到独立 GPU — 使用小模型。',
	'express.installPromptTitle': '是否安装 Ollama?',
	'express.installPromptBody': 'CortexIDE 将安装 Ollama(本地 AI 运行时)以在您的电脑上私有运行模型。数据不会离开您的设备。',
	'express.installConfirm': '安装 Ollama',
	'express.installDecline': '改用免费云密钥',
	'express.installing': '正在安装 Ollama…',
	'express.pulling': '正在下载 {0}…',
	'express.pullingPercent': '正在下载 {0} ({1}%)',
	'express.ready': '就绪!本地 AI 已设置好。',
	'express.startChatting': '开始对话',
	'express.customize': '自定义设置',
	'express.fallbackTitle': '使用免费云模型',
	'express.fallbackBody': '无需本地安装。Groq 提供免费的 API 层级和快速的 Llama 模型。获取密钥(60 秒),粘贴在下面即可使用。',
	'express.openGroqKeyPage': '打开 Groq 密钥页面',
	'express.pasteKeyPlaceholder': '在此粘贴您的 Groq API 密钥(以 gsk_ 开头)',
	'express.useGroqKey': '使用 Groq 继续',
	'express.invalidKey': '密钥格式不正确。Groq 密钥以 "gsk_" 开头。',
	'express.error.installFailed': 'Ollama 安装失败。您可以改用免费云密钥。',
	'express.error.pullFailed': '模型下载失败。您可以重试或使用免费云密钥。',
	'express.retry': '重试',
	'express.useCloudInstead': '改用免费云密钥',
	'express.dismiss': '暂时跳过',
	'chat.placeholderAgent': '描述一项任务给智能体…',
	'chat.history': '对话历史',
	'chat.branchFromHere': '从此处分支',
	'chat.copyMessage': '复制',
	'chat.deleteThread': '删除对话',
	'chat.duplicateThread': '复制对话',
	'chat.generating': '正在生成…',
	'chat.attachFile': '附加文件',
	'chat.attachImage': '附加图片',
	'chat.contextFiles': '上下文文件',
	'chat.addContext': '添加上下文',
	'chat.mode.ask': '询问',
	'chat.mode.plan': '计划',
	'chat.mode.gather': '收集',
	'chat.model': '模型',
	'chat.previousThreads': '历史对话',
	'chat.suggestions': '建议',
	'agent.planStep': '规划中',
	'agent.executeStep': '执行中',
	'agent.approvalRequired': '需要批准',
	'agent.approve': '批准',
	'agent.reject': '拒绝',
	'agent.toolCall': '工具调用',
	'agent.readingFile': '正在读取文件',
	'agent.editingFile': '正在编辑文件',
	'agent.runningCommand': '正在运行命令',
	'agent.searchingCodebase': '正在搜索代码库',
	'agent.steps': '步骤',
	'agent.done': '完成',
	'agent.failed': '失败',
	'diff.acceptHunk': '接受此块',
	'diff.rejectHunk': '拒绝此块',
	'diff.nextHunk': '下一处更改',
	'diff.prevHunk': '上一处更改',
	'settings.providers': '提供商',
	'settings.local': '本地设置',
	'settings.mcp': 'MCP 服务器',
	'settings.saved': '已保存',
	'settings.endpoint': '端点 URL',
	'local.ollama.notRunning': 'Ollama 未运行',
	'local.ollama.start': '启动 Ollama',
	'local.ollama.install': '安装 Ollama',
	'local.model.downloading': '下载中',
	'local.model.ready': '就绪',
	'local.model.notFound': '未找到模型',
	'local.model.pull': '下载模型',
	'common.confirm': '确认',
	'common.retry': '重试',
	'common.back': '返回',
	'common.next': '下一步',
	'common.skip': '跳过',
	'common.open': '打开',
	'routing.policy.label': '路由策略',
	'routing.policy.description': '控制 CortexIDE 如何在已配置的模型提供商之间进行选择。',
	'routing.policy.autoCheapest': '自动(最便宜的可行选项)',
	'routing.policy.freeTier': '免费层级阶梯',
	'routing.policy.localOnly': '仅本地',
	'routing.statusBar.label': '免费层级配额',
	'routing.statusBar.none': '无免费层级提供商',
	'routing.statusBar.entry': '{0}: {1}/{2} 每日请求数',
	'routing.statusBar.entryRpm': '{0}: {1}/{2} 每分钟请求数',
	'routing.statusBar.exhausted': '{0}: 已用尽',
	'routing.statusBar.uncapped': '{0}: 无限制',
	'routing.statusBar.tooltipTitle': '免费层级提供商配额',
	'routing.statusBar.tooltipNoProviders': '未配置免费层级提供商。添加免费层级 API 密钥(Groq、Gemini、OpenRouter、Mistral)以查看实时配额跟踪。',
	'routing.statusBar.allExhausted': '免费配额已用尽',
	'routing.statusBar.allExhaustedHint': '所有免费层级配额已用尽 - 切换到本地模型或添加 API 密钥。',

	// allow-any-unicode-next-line
	'onboarding.highlights.chatQuickEdit': '聊天 + 快速编辑',
	// allow-any-unicode-next-line
	'onboarding.highlights.fastApply': 'Fast Apply 差异',
	// allow-any-unicode-next-line
	'onboarding.highlights.pdfImage': 'PDF 和图片上传',
	// allow-any-unicode-next-line
	'onboarding.highlights.localCloud': '本地和云模型',
	// allow-any-unicode-next-line
	'onboarding.stats.uploads.label': '上传',
	// allow-any-unicode-next-line
	'onboarding.stats.uploads.value': 'PDF + 图片',
	// allow-any-unicode-next-line
	'onboarding.stats.uploads.detail': '将规格说明、截图和研究资料直接拖入对话',
	'onboarding.stats.fastApply.label': 'Fast Apply',
	// allow-any-unicode-next-line
	'onboarding.stats.fastApply.value': '逐行',
	// allow-any-unicode-next-line
	'onboarding.stats.fastApply.detail': '从生成的差异中审批每个更改',
	// allow-any-unicode-next-line
	'onboarding.stats.modelRouter.label': '模型路由',
	// allow-any-unicode-next-line
	'onboarding.stats.modelRouter.value': '自动切换',
	// allow-any-unicode-next-line
	'onboarding.stats.modelRouter.detail': '根据任务选择 Anthropic、GPT-4o、Gemini、DeepSeek 或 Ollama',
	// allow-any-unicode-next-line
	'onboarding.stats.agentTools.label': '智能体工具',
	// allow-any-unicode-next-line
	'onboarding.stats.agentTools.value': '{0} 个内置',
	// allow-any-unicode-next-line
	'onboarding.stats.agentTools.detail': '文件编辑、终端、网页搜索、LSP 导航、代码审查等',
	// allow-any-unicode-next-line
	'onboarding.tab.free': '免费',
	// allow-any-unicode-next-line
	'onboarding.tab.paid': '付费',
	// allow-any-unicode-next-line
	'onboarding.tab.local': '本地',
	// allow-any-unicode-next-line
	'onboarding.tab.cloudOther': '云/其他',
	// allow-any-unicode-next-line
	'onboarding.tab.free.desc': '提供 100% 免费额度的提供商。可添加任意多个！',
	// allow-any-unicode-next-line
	'onboarding.tab.paid.desc': '直接连接任意提供商（自带密钥）。',
	// allow-any-unicode-next-line
	'onboarding.tab.local.desc': '已激活的提供商应自动出现。可添加任意多个！',
	// allow-any-unicode-next-line
	'onboarding.tab.cloudOther.desc': '可添加任意多个！如需自定义配置请联系我们。',
	// allow-any-unicode-next-line
	'onboarding.feature.chat': '聊天',
	// allow-any-unicode-next-line
	'onboarding.feature.quickEdit': '快速编辑',
	// allow-any-unicode-next-line
	'onboarding.feature.autocomplete': '自动补全',
	'onboarding.feature.fastApply': 'Fast Apply',
	// allow-any-unicode-next-line
	'onboarding.feature.sourceControl': '源代码管理',
	// allow-any-unicode-next-line
	'onboarding.step02': '步骤 02',
	// allow-any-unicode-next-line
	'onboarding.chooseProviders': '选择您的模型提供商',
	// allow-any-unicode-next-line
	'onboarding.chooseProvidersDesc': '同时加载多个提供商。CortexIDE 可以将聊天、快速编辑和自动补全路由到每次请求中最强的模型。',
	// allow-any-unicode-next-line
	'onboarding.featureCoverage': '功能覆盖',
	// allow-any-unicode-next-line
	'onboarding.connected': '已连接',
	// allow-any-unicode-next-line
	'onboarding.pending': '待连接',
	// allow-any-unicode-next-line
	'onboarding.setupLocalAuto': '自动设置本地 AI',
	// allow-any-unicode-next-line
	'onboarding.setupLocalAutoDesc': '安装 Ollama + 下载适合您硬件的最佳模型 - 2 分钟引导设置',
	// allow-any-unicode-next-line
	'onboarding.addProvider': '添加 {0}',
	// allow-any-unicode-next-line
	'onboarding.details': '详情',
	// allow-any-unicode-next-line
	'onboarding.localLabel': '本地',
	// allow-any-unicode-next-line
	'onboarding.modelsLabel': '模型',
	// allow-any-unicode-next-line
	'onboarding.localModelsDesc': '本地模型会自动检测。添加自定义条目以精细调整路由。',
	// allow-any-unicode-next-line
	'onboarding.connectOneModel': '请至少连接一个支持聊天的模型再继续。',
	// allow-any-unicode-next-line
	'onboarding.tooltip.gemini': 'Gemini 2.5 Pro 每天提供 25 次免费聊天，Flash 约 500 次。额度用完成后可升级。',
	// allow-any-unicode-next-line
	'onboarding.tooltip.openRouter': 'OpenRouter 每天提供 50 次免费聊天（存入 $10 后 1000 次），适用于标记为 :free 的模型。',
	// allow-any-unicode-next-line
	'onboarding.tooltip.pollinations': '便宜的 API，支持多种模型（Pollen 积分）。在 enter.pollinations.ai 获取密钥。',
	// allow-any-unicode-next-line
	'onboarding.fillRequired': '请填写所有必填字段或选择其他提供商',
	// allow-any-unicode-next-line
	'onboarding.welcomeDesc': 'CortexIDE 将聊天、快速编辑、Fast Apply 和源代码管理保持在同一个深色工作区中 - 并添加了原生 PDF 和图片上传功能，让产品规格和设计稿伴随每次对话。',
	// allow-any-unicode-next-line
	'onboarding.yes': '是',
	// allow-any-unicode-next-line
	'onboarding.no': '否',
	// allow-any-unicode-next-line
	'onboarding.yesStar': '是*',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.smart.basic': '在基准测试中表现最佳的模型。',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.private.basic': '在您的计算机或本地网络上托管，实现完全的数据隐私。',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.cheap.basic': '免费和经济实惠的选项。',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.smart.detailed': '最智能，最适合智能体模式。',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.private.detailed': '私有托管，您的数据不会离开您的计算机或网络。',
	// allow-any-unicode-next-line
	'onboarding.wantToUse.cheap.detailed': '使用 Gemini 2.5 Pro 等优惠，或使用 Ollama 或 vLLM 免费自托管模型。',
	// allow-any-unicode-next-line
	'localWizard.error.notRunning': 'Ollama 安装完成但服务未运行。请手动启动 Ollama。',
	// allow-any-unicode-next-line
	'localWizard.error.installFailed': '安装 Ollama 失败。请从 https://ollama.com 手动安装',
	// allow-any-unicode-next-line
	'localWizard.error.downloadFailed': '下载模型失败。请检查网络连接后重试。',
	// allow-any-unicode-next-line
	'localWizard.error.verifyFailed': '验证模型能力失败。请检查模型是否正确安装。',
	// allow-any-unicode-next-line
	'localWizard.error.skipped': '验证已跳过',
	// allow-any-unicode-next-line
	'localWizard.error.defaultsFailed': '设置默认模型失败。您可以在设置中手动配置。',
	// allow-any-unicode-next-line
	'localWizard.setupError': '设置错误',
	// allow-any-unicode-next-line
	'localWizard.failedWhileDownloading': '下载失败：{0}',
	// allow-any-unicode-next-line
	'localWizard.required': '需要：{0}',
	// allow-any-unicode-next-line
	'localWizard.available': '可用：{0}',
	// allow-any-unicode-next-line
	'localWizard.startOver': '重新开始',
	// allow-any-unicode-next-line
	'localWizard.skipSetup': '跳过设置',
	// allow-any-unicode-next-line
	'localWizard.stepProgress': '步骤 {0}/{1}',
	// allow-any-unicode-next-line
	'localWizard.chooseSetup': '选择您的设置',
	// allow-any-unicode-next-line
	'localWizard.chooseSetupDesc': '开始使用 CortexIDE。选择本地模型以保护隐私，或使用云提供商。',
	// allow-any-unicode-next-line
	'localWizard.useLocalModels': '使用本地模型（无需 API 密钥）',
	// allow-any-unicode-next-line
	'localWizard.useLocalModelsDesc': '在您的计算机上运行模型以获得完全的隐私。我们将帮助您设置 Ollama。',
	// allow-any-unicode-next-line
	'localWizard.useCloudProvider': '使用云提供商',
	// allow-any-unicode-next-line
	'localWizard.useCloudProviderDesc': '通过 API 密钥连接 Anthropic、OpenAI 或其他云提供商。',
	// allow-any-unicode-next-line
	'localWizard.decideLater': '稍后决定',
	// allow-any-unicode-next-line
	'localWizard.systemCheck': '系统检查',
	// allow-any-unicode-next-line
	'localWizard.ollamaInstalled': 'Ollama 已安装',
	// allow-any-unicode-next-line
	'localWizard.ollamaRunning': 'Ollama 运行中',
	// allow-any-unicode-next-line
	'localWizard.diskSpace': '磁盘空间：{0} GB 可用',
	// allow-any-unicode-next-line
	'localWizard.chooseModelPack': '选择模型包',
	// allow-any-unicode-next-line
	'localWizard.detectedVram': '检测到 {0} GB GPU 显存 - 已为您的硬件预选最佳模型。',
	// allow-any-unicode-next-line
	'localWizard.selectModelPackDesc': '选择针对不同用例优化的预配置模型集。',
	// allow-any-unicode-next-line
	'localWizard.bestForHardware': '最适合您的硬件',
	// allow-any-unicode-next-line
	'localWizard.recommended': '推荐',
	'localWizard.gb': '{0} GB',
	// allow-any-unicode-next-line
	'localWizard.ram': '{0}+ GB 内存',
	// allow-any-unicode-next-line
	'localWizard.downloadingModel': '正在下载 {0}...',
	// allow-any-unicode-next-line
	'localWizard.modelsProgress': '{0}/{1} 个模型',
	// allow-any-unicode-next-line
	'localWizard.downloading': '下载中...',
	// allow-any-unicode-next-line
	'localWizard.downloadModels': '下载模型',
	// allow-any-unicode-next-line
	'localWizard.verifyingCapabilities': '验证能力',
	// allow-any-unicode-next-line
	'localWizard.verifyingDesc': '测试您的本地模型是否正常工作。',
	// allow-any-unicode-next-line
	'localWizard.testing': '正在测试 {0}...',
	// allow-any-unicode-next-line
	'localWizard.runVerification': '运行验证',
	// allow-any-unicode-next-line
	'localWizard.verificationResults': '验证结果',
	// allow-any-unicode-next-line
	'localWizard.someTestsFailed': '部分验证测试失败。您仍可以继续，但某些功能可能无法正常工作。',
	// allow-any-unicode-next-line
	'localWizard.continue': '继续',
	// allow-any-unicode-next-line
	'localWizard.continueAnyway': '仍然继续',
	// allow-any-unicode-next-line
	'localWizard.skipped': '(已跳过)',
	// allow-any-unicode-next-line
	'localWizard.chat': '聊天',
	// allow-any-unicode-next-line
	'localWizard.toolCalling': '工具调用',
	// allow-any-unicode-next-line
	'localWizard.webCalling': '网页调用',
	// allow-any-unicode-next-line
	'localWizard.setupComplete': '设置完成！',
	// allow-any-unicode-next-line
	'localWizard.setupCompleteDesc': '您的本地模型已配置完毕，随时可用。CortexIDE 将默认使用本地模型。',
	// allow-any-unicode-next-line
	'localWizard.startUsingCortexIDE': '开始使用 CortexIDE',

	// ── Feature names (displayInfoOfFeatureName) ────────────────────────────
	// allow-any-unicode-next-line
	'settings.feature.Autocomplete': '自动补全',
	// allow-any-unicode-next-line
	'settings.feature.Ctrl+K': '快速编辑',
	// allow-any-unicode-next-line
	'settings.feature.Chat': '聊天',
	// allow-any-unicode-next-line
	'settings.feature.Apply': '应用',
	// allow-any-unicode-next-line
	'settings.feature.SCM': '提交信息生成器',

	// ── Provider descriptions (subTextMdOfProviderName, Markdown) ───────────
	// allow-any-unicode-next-line
	'settings.providerDesc.anthropic': '在[此处获取 API 密钥](https://console.anthropic.com/settings/keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.openAI': '在[此处获取 API 密钥](https://platform.openai.com/api-keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.deepseek': '在[此处获取 API 密钥](https://platform.deepseek.com/api_keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.openRouter': '在[此处获取 API 密钥](https://openrouter.ai/settings/keys)。阅读[速率限制说明](https://openrouter.ai/docs/api-reference/limits)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.gemini': '在[此处获取 API 密钥](https://aistudio.google.com/apikey)。阅读[速率限制说明](https://ai.google.dev/gemini-api/docs/rate-limits#current-rate-limits)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.groq': '在[此处获取 API 密钥](https://console.groq.com/keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.xAI': '在[此处获取 API 密钥](https://console.x.ai)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.mistral': '在[此处获取 API 密钥](https://console.mistral.ai/api-keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.openAICompatible': '使用任何 OpenAI 兼容的提供商（可用于 llama.cpp 等）。',
	// allow-any-unicode-next-line
	'settings.providerDesc.googleVertex': '使用 Vertex 前必须先进行身份验证。了解更多[端点信息](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library)和[区域信息](https://cloud.google.com/vertex-ai/docs/general/locations#available-regions)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.microsoftAzure': '了解更多[端点信息](https://learn.microsoft.com/en-us/rest/api/aifoundry/model-inference/get-chat-completions/get-chat-completions?view=rest-aifoundry-model-inference-2024-05-01-preview&tabs=HTTP)，在[此处获取 API 密钥](https://learn.microsoft.com/en-us/azure/search/search-security-api-keys?tabs=rest-use%2Cportal-find%2Cportal-query#find-existing-keys)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.awsBedrock': '通过 LiteLLM 代理或 AWS [Bedrock-Access-Gateway](https://github.com/aws-samples/bedrock-access-gateway) 连接。LiteLLM Bedrock 设置文档在[此处](https://docs.litellm.ai/docs/providers/bedrock)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.ollama': '了解更多自定义[端点信息](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-expose-ollama-on-my-network)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.vLLM': '了解更多自定义[端点信息](https://docs.vllm.ai/en/latest/getting_started/quickstart.html#openai-compatible-server)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.lmStudio': '了解更多自定义[端点信息](https://lmstudio.ai/docs/app/api/endpoints/openai)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.liteLLM': '了解更多[端点信息](https://docs.litellm.ai/docs/providers/openai_compatible)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.pollinations': '在[此处获取 API 密钥](https://enter.pollinations.ai/)。[API 文档](https://enter.pollinations.ai/api/docs)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.moonshot': '在[此处免费获取 API 密钥](https://platform.moonshot.ai/console/api-keys)。Kimi K2 提供丰厚的免费额度。[定价信息](https://platform.moonshot.ai/docs/pricing)。',
	// allow-any-unicode-next-line
	'settings.providerDesc.cerebras': '在[此处免费获取 API 密钥](https://cloud.cerebras.ai/)。免费额度包含每天 100 万 token，无需信用卡。[文档](https://inference-docs.cerebras.ai/)。',

	// ── Setting titles (displayInfoOfSettingName.title) ─────────────────────
	// allow-any-unicode-next-line
	'settings.settingTitle.apiKey': 'API 密钥',
	// allow-any-unicode-next-line
	'settings.settingTitle.endpoint': '端点',
	'settings.settingTitle.baseURL': 'baseURL',
	// allow-any-unicode-next-line
	'settings.settingTitle.customHeaders': '自定义请求头',
	// allow-any-unicode-next-line
	'settings.settingTitle.region': '区域',
	// allow-any-unicode-next-line
	'settings.settingTitle.apiVersion': 'API 版本',
	// allow-any-unicode-next-line
	'settings.settingTitle.resource': '资源',
	// allow-any-unicode-next-line
	'settings.settingTitle.project': '项目',

	// ── Provider description extras (displayInfoOfProviderName.desc) ─────────
	// allow-any-unicode-next-line
	'settings.providerDescExtra.moonshot': 'Kimi K2 — SWE-bench 第一的智能编程。提供免费额度。',
	// allow-any-unicode-next-line
	'settings.providerDescExtra.cerebras': '免费额度：每天 100 万 token，约 2,600 tok/s，8K 上下文上限。',
};

const ES_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	'onboarding.title': 'Bienvenido a CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'IDE de IA de código abierto — funciona 100% sin conexión',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'Configurar IA local (se ejecuta en tu máquina)',
	'onboarding.chooseCloud': 'Conectar un proveedor en la nube',
	'onboarding.chooseLater': 'Omitir por ahora',
	// allow-any-unicode-next-line
	'chat.placeholder': 'Pregúntale algo a CortexIDE…',
	'chat.newThread': 'Nuevo chat',
	'chat.thinking': 'Pensando…',
	'chat.stop': 'Detener',
	'chat.send': 'Enviar',
	'diff.acceptAll': 'Aceptar todo',
	'diff.rejectAll': 'Rechazar todo',
	// allow-any-unicode-next-line
	'settings.title': 'Configuración de CortexIDE',
	'settings.language': 'Idioma de la interfaz',
	'common.cancel': 'Cancelar',
	'common.loading': 'Cargando…',
	'common.error': 'Error',
	'common.close': 'Cerrar',
	'common.done': 'Hecho',
};

const FR_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	'onboarding.title': 'Bienvenue dans CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'IDE IA open source — fonctionne 100% hors ligne',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'Configurer l\'IA locale (s\'exécute sur votre machine)',
	'onboarding.chooseCloud': 'Connecter un fournisseur cloud',
	'onboarding.chooseLater': 'Ignorer pour l\'instant',
	// allow-any-unicode-next-line
	'chat.placeholder': 'Demandez quelque chose à CortexIDE…',
	'chat.newThread': 'Nouveau chat',
	// allow-any-unicode-next-line
	'chat.thinking': 'Réflexion en cours…',
	// allow-any-unicode-next-line
	'chat.stop': 'Arrêter',
	'chat.send': 'Envoyer',
	'diff.acceptAll': 'Tout accepter',
	'diff.rejectAll': 'Tout rejeter',
	// allow-any-unicode-next-line
	'settings.title': 'Paramètres de CortexIDE',
	'settings.language': 'Langue d\'affichage',
	'common.cancel': 'Annuler',
	'common.loading': 'Chargement…',
	'common.error': 'Erreur',
	'common.close': 'Fermer',
	// allow-any-unicode-next-line
	'common.done': 'Terminé',
};

const DE_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	'onboarding.title': 'Willkommen bei CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'Open-Source KI-IDE — funktioniert 100% offline',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'Lokale KI einrichten (läuft auf Ihrem Gerät)',
	'onboarding.chooseCloud': 'Cloud-Anbieter verbinden',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': 'Jetzt überspringen',
	'chat.placeholder': 'Stellen Sie CortexIDE eine Frage…',
	'chat.newThread': 'Neuer Chat',
	'chat.thinking': 'Denke nach…',
	'chat.stop': 'Stoppen',
	'chat.send': 'Senden',
	'diff.acceptAll': 'Alle akzeptieren',
	'diff.rejectAll': 'Alle ablehnen',
	'settings.title': 'CortexIDE Einstellungen',
	'settings.language': 'Anzeigesprache',
	'common.cancel': 'Abbrechen',
	'common.loading': 'Wird geladen…',
	'common.error': 'Fehler',
	// allow-any-unicode-next-line
	'common.close': 'Schließen',
	'common.done': 'Fertig',
};

const JA_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': 'CortexIDE へようこそ',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'オープンソース AI IDE — 完全オフラインで動作',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'ローカル AI を設定する（お使いのマシンで実行）',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': 'クラウドプロバイダーに接続する',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': '後で設定する',
	// allow-any-unicode-next-line
	'chat.placeholder': 'CortexIDE に質問してください…',
	// allow-any-unicode-next-line
	'chat.newThread': '新しいチャット',
	// allow-any-unicode-next-line
	'chat.thinking': '考え中…',
	// allow-any-unicode-next-line
	'chat.stop': '停止',
	// allow-any-unicode-next-line
	'chat.send': '送信',
	// allow-any-unicode-next-line
	'diff.acceptAll': 'すべて承認',
	// allow-any-unicode-next-line
	'diff.rejectAll': 'すべて拒否',
	// allow-any-unicode-next-line
	'settings.title': 'CortexIDE 設定',
	// allow-any-unicode-next-line
	'settings.language': '表示言語',
	// allow-any-unicode-next-line
	'common.cancel': 'キャンセル',
	// allow-any-unicode-next-line
	'common.loading': '読み込み中…',
	// allow-any-unicode-next-line
	'common.error': 'エラー',
	// allow-any-unicode-next-line
	'common.close': '閉じる',
	// allow-any-unicode-next-line
	'common.done': '完了',
};

const KO_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': 'CortexIDE에 오신 것을 환영합니다',
	// allow-any-unicode-next-line
	'onboarding.subtitle': '오픈소스 AI IDE — 완전 오프라인 작동',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': '로컬 AI 설정 (내 컴퓨터에서 실행)',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': '클라우드 제공업체 연결',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': '나중에 설정',
	// allow-any-unicode-next-line
	'chat.placeholder': 'CortexIDE에 무엇이든 물어보세요…',
	// allow-any-unicode-next-line
	'chat.newThread': '새 채팅',
	// allow-any-unicode-next-line
	'chat.thinking': '생각 중…',
	// allow-any-unicode-next-line
	'chat.stop': '중지',
	// allow-any-unicode-next-line
	'chat.send': '전송',
	// allow-any-unicode-next-line
	'diff.acceptAll': '모두 승인',
	// allow-any-unicode-next-line
	'diff.rejectAll': '모두 거부',
	// allow-any-unicode-next-line
	'settings.title': 'CortexIDE 설정',
	// allow-any-unicode-next-line
	'settings.language': '표시 언어',
	// allow-any-unicode-next-line
	'common.cancel': '취소',
	// allow-any-unicode-next-line
	'common.loading': '로딩 중…',
	// allow-any-unicode-next-line
	'common.error': '오류',
	// allow-any-unicode-next-line
	'common.close': '닫기',
	// allow-any-unicode-next-line
	'common.done': '완료',
};

const PT_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	'onboarding.title': 'Bem-vindo ao CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'IDE de IA de código aberto — funciona 100% offline',
	'onboarding.chooseLocal': 'Configurar IA local (executa no seu computador)',
	'onboarding.chooseCloud': 'Conectar um provedor cloud',
	'onboarding.chooseLater': 'Pular por enquanto',
	'chat.placeholder': 'Pergunte algo ao CortexIDE…',
	'chat.newThread': 'Novo chat',
	'chat.thinking': 'Pensando…',
	'chat.stop': 'Parar',
	'chat.send': 'Enviar',
	'diff.acceptAll': 'Aceitar tudo',
	'diff.rejectAll': 'Rejeitar tudo',
	// allow-any-unicode-next-line
	'settings.title': 'Configurações do CortexIDE',
	// allow-any-unicode-next-line
	'settings.language': 'Idioma de exibição',
	'common.cancel': 'Cancelar',
	'common.loading': 'Carregando…',
	'common.error': 'Erro',
	'common.close': 'Fechar',
	// allow-any-unicode-next-line
	'common.done': 'Concluído',
};

const AR_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': 'مرحبًا بك في CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'بيئة تطوير مفتوحة المصدر — تعمل بالكامل دون اتصال',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'إعداد الذكاء الاصطناعي المحلي',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': 'الاتصال بمزود سحابي',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': 'تخطي الآن',
	// allow-any-unicode-next-line
	'chat.placeholder': 'اسأل CortexIDE أي شيء…',
	// allow-any-unicode-next-line
	'chat.newThread': 'محادثة جديدة',
	// allow-any-unicode-next-line
	'chat.thinking': 'جارٍ التفكير…',
	// allow-any-unicode-next-line
	'chat.stop': 'إيقاف',
	// allow-any-unicode-next-line
	'chat.send': 'إرسال',
	// allow-any-unicode-next-line
	'common.cancel': 'إلغاء',
	// allow-any-unicode-next-line
	'common.loading': 'جارٍ التحميل…',
	// allow-any-unicode-next-line
	'common.error': 'خطأ',
	// allow-any-unicode-next-line
	'common.close': 'إغلاق',
	// allow-any-unicode-next-line
	'common.done': 'تم',
};

const RU_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': 'Добро пожаловать в CortexIDE',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'ИИ-IDE с открытым исходным кодом — работает полностью офлайн',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'Настроить локальный ИИ',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': 'Подключить облачного провайдера',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': 'Пропустить',
	// allow-any-unicode-next-line
	'chat.placeholder': 'Спросите что-нибудь у CortexIDE…',
	// allow-any-unicode-next-line
	'chat.newThread': 'Новый чат',
	// allow-any-unicode-next-line
	'chat.thinking': 'Думаю…',
	// allow-any-unicode-next-line
	'chat.stop': 'Стоп',
	// allow-any-unicode-next-line
	'chat.send': 'Отправить',
	// allow-any-unicode-next-line
	'common.cancel': 'Отмена',
	// allow-any-unicode-next-line
	'common.loading': 'Загрузка…',
	// allow-any-unicode-next-line
	'common.error': 'Ошибка',
	// allow-any-unicode-next-line
	'common.close': 'Закрыть',
	// allow-any-unicode-next-line
	'common.done': 'Готово',
};

const HI_TRANSLATIONS: Partial<Record<TranslationKey, string>> = {
	// allow-any-unicode-next-line
	'onboarding.title': 'CortexIDE में आपका स्वागत है',
	// allow-any-unicode-next-line
	'onboarding.subtitle': 'ओपन-सोर्स AI IDE — 100% ऑफलाइन काम करता है',
	// allow-any-unicode-next-line
	'onboarding.chooseLocal': 'लोकल AI सेटअप करें',
	// allow-any-unicode-next-line
	'onboarding.chooseCloud': 'क्लाउड प्रदाता से जुड़ें',
	// allow-any-unicode-next-line
	'onboarding.chooseLater': 'अभी छोड़ें',
	// allow-any-unicode-next-line
	'chat.placeholder': 'CortexIDE से कुछ भी पूछें…',
	// allow-any-unicode-next-line
	'chat.newThread': 'नई चैट',
	// allow-any-unicode-next-line
	'chat.thinking': 'सोच रहा हूँ…',
	// allow-any-unicode-next-line
	'chat.stop': 'रोकें',
	// allow-any-unicode-next-line
	'chat.send': 'भेजें',
	// allow-any-unicode-next-line
	'common.cancel': 'रद्द करें',
	// allow-any-unicode-next-line
	'common.loading': 'लोड हो रहा है…',
	// allow-any-unicode-next-line
	'common.error': 'त्रुटि',
	// allow-any-unicode-next-line
	'common.close': 'बंद करें',
	// allow-any-unicode-next-line
	'common.done': 'हो गया',
	// allow-any-unicode-next-line
	'settings.addConnection': '添加连接',
	// allow-any-unicode-next-line
	'settings.connectionName': '连接名称',
	// allow-any-unicode-next-line
	'settings.connection': '连接',
	// allow-any-unicode-next-line
	'settings.addAModel': '添加模型',
	// allow-any-unicode-next-line
	'settings.ollamaSetupRev': 'Ollama 设置 (rev 2025-10-30-1)',
	// allow-any-unicode-next-line
	'settings.autoCompactTooltip': '当智能体运行接近模型上下文窗口时，发送压缩视图（保留任务和最近消息）以继续运行而非溢出。非破坏性：存储的对话不变。',
	// allow-any-unicode-next-line
	'settings.lifecycleHooksTooltip': '在智能体事件（工具前、工具后、智能体停止）时从 .cortexide/hooks.json 运行自定义命令。命令静默运行，无 shell，即发即忘。',
	// allow-any-unicode-next-line
	'settings.useHeadlessBrowsingTooltip': '使用无头 BrowserWindow 从复杂页面提取更好的内容。禁用以使用直接 HTTP 获取。',
	// allow-any-unicode-next-line
	'settings.vision': '(视觉)',
	// allow-any-unicode-next-line
	'settings.visionBetterQuality': '(视觉，更高质量)',
	// allow-any-unicode-next-line
	'settings.visionFaster': '(视觉，更快)',
	// allow-any-unicode-next-line
	'settings.manuallyInstall1': '1. 如果安装未开始，请从 [ollama.com/download](https://ollama.com/download) 手动下载 Ollama。',
	// allow-any-unicode-next-line
	'settings.manuallyInstall2': '2. 可选：运行 `ollama pull llama3.1` 安装入门模型。',
	// allow-any-unicode-next-line
	'settings.autoDetectModels': 'CortexIDE 自动检测本地运行的模型并启用它们。',
	// allow-any-unicode-next-line
	'settings.transferFrom': '从 {0} 迁移',
	// allow-any-unicode-next-line
	'settings.transferring': '正在迁移',
	// allow-any-unicode-next-line
	'settings.settingsTransferred': '设置已迁移',
	// allow-any-unicode-next-line
	'settings.optOutRestart': '退出（需重启）',
	// allow-any-unicode-next-line
	'settings.aiInstructions': 'AI 指令',
	// allow-any-unicode-next-line
	'settings.aiInstructionsDesc': '包含在所有 AI 请求中的系统指令。',
	// allow-any-unicode-next-line
	'settings.aiInstructionsDesc2': '对于项目范围的规则，使用 `.cortexide/rules/*.md` 文件 - 见下方的项目规则。',
	// allow-any-unicode-next-line
	'settings.disableSystemMessage': '禁用系统消息',
	// allow-any-unicode-next-line
	'settings.disableSystemMessageDesc': '禁用后，CortexIDE 不会在系统消息中包含除您上方指定的内容之外的任何内容。',
	// allow-any-unicode-next-line
	'settings.scmDesc': '控制提交消息生成器行为的设置。',
	// allow-any-unicode-next-line
	'settings.addMcpServer': '添加 MCP 服务器',
	// allow-any-unicode-next-line
	'settings.mcpDesc': '使用模型上下文协议为智能体模式提供更多工具。',
	// allow-any-unicode-next-line
	'settings.playwrightAdded': '已将 Playwright MCP 服务器（浏览器自动化）添加到 mcp.json。首次使用时通过 npx 连接。',
	// allow-any-unicode-next-line
	'settings.playwrightExists': 'mcp.json 中已存在 "playwright" MCP 服务器。',
	// allow-any-unicode-next-line
	'settings.startingInstall': '正在启动 Ollama 安装并打开终端...',
	// allow-any-unicode-next-line
	'settings.installerLaunched': '安装器已启动。正在检测模型...',
	// allow-any-unicode-next-line
	'settings.playwrightAddFailed': '无法添加 Playwright MCP：{0}',
	// allow-any-unicode-next-line
	'settings.playwrightButton': '+ Playwright（浏览器自动化）',
	// allow-any-unicode-next-line
	'settings.importedSuccess': '{0} 导入成功！',
	// allow-any-unicode-next-line
	'settings.importFailed': '导入 {0} 失败',
	// allow-any-unicode-next-line
	'settings.confirmDeleteModel': '从 Ollama 删除模型 "{0}"？',
	// allow-any-unicode-next-line
	'settings.selectModelPull': '请选择要拉取的模型。',
	// allow-any-unicode-next-line
	'settings.selectModelDelete': '请选择要删除的模型。',
	// allow-any-unicode-next-line
	'settings.modelPulledSuccess': '模型 "{0}" 拉取成功。',
	// allow-any-unicode-next-line
	'settings.modelDeletedSuccess': '模型 "{0}" 删除成功。',
	// allow-any-unicode-next-line
	'settings.pullStarted': '已开始拉取 "{0}"。大模型可能需要一些时间。请查看终端进度。',
	// allow-any-unicode-next-line
	'settings.warmingIndex': '正在预热项目索引...',
	// allow-any-unicode-next-line
	'settings.indexWarmed': '项目索引已预热。',
	// allow-any-unicode-next-line
	'settings.modelPullFailed': '拉取模型 "{0}" 失败。请查看终端详情。',
	// allow-any-unicode-next-line
	'settings.modelDeleteFailed': '删除模型 "{0}" 失败。请查看终端详情。',
	// allow-any-unicode-next-line
	'settings.deleteTimeout': '删除 "{0}" 的命令超时。请检查终端查看是否完成。',
	// allow-any-unicode-next-line
	'settings.pullFailedShort': '拉取 {0} 失败。请查看终端详情。',
	// allow-any-unicode-next-line
	'settings.pullSuccess': '成功拉取 {0}',
	// allow-any-unicode-next-line
	'settings.pullFailedExit': '拉取 {0} 失败（退出码 {1}）。请查看终端详情。',
	// allow-any-unicode-next-line
	'settings.pullInProgress': '正在拉取 {0}...',
	// allow-any-unicode-next-line
	'settings.pullInProgressLong': '正在拉取 {0}...（大模型可能需要时间）',
	// allow-any-unicode-next-line
	'settings.pullError': '拉取 {0} 出错：{1}',
	// allow-any-unicode-next-line
	'settings.pullStartFailed': '开始拉取失败：{0}',
	// allow-any-unicode-next-line
	'settings.deleteStarted': '正在删除 {0}...',
	// allow-any-unicode-next-line
	'settings.deleteSuccess': '成功删除 {0}',
	// allow-any-unicode-next-line
	'settings.deleteFailedExit': '删除 {0} 失败（退出码 {1}）。请查看终端详情。',
	// allow-any-unicode-next-line
	'settings.deleteTimeoutShort': '删除 {0} 的命令超时。命令可能仍在运行。',
	// allow-any-unicode-next-line
	'settings.deleteError': '删除 {0} 出错：{1}',
	// allow-any-unicode-next-line
	'settings.deleteStartFailed': '开始删除失败：{0}',
	// allow-any-unicode-next-line
	'settings.installStarted': 'Ollama 安装已在集成终端中开始。模型就绪后将出现。',
	// allow-any-unicode-next-line
	'settings.installStartFailedNotif': '开始安装 Ollama 失败。请重试或手动安装。',
	// allow-any-unicode-next-line
	'settings.installerRunning': '正在终端中运行安装程序...',
	// allow-any-unicode-next-line
	'settings.installStartFailed': '开始安装失败。请查看终端或尝试手动安装。',
	// allow-any-unicode-next-line
	'settings.ollamaRunning': 'Ollama 正在运行。模型即将出现。',
	// allow-any-unicode-next-line
	'settings.noWorkspace': '未打开工作区文件夹。',
	// allow-any-unicode-next-line
	'settings.newRule': '# 新规则',
	// allow-any-unicode-next-line
	'settings.ruleDesc': '在此描述规则。',
	// allow-any-unicode-next-line
	'settings.clickToOpen': '点击打开规则文件',
	// allow-any-unicode-next-line
	'settings.aiInstructionsPlaceholder': '不要更改我的缩进或删除我的注释。编写 TS 或 JS 时，不要添加分号。尽可能使用 Rust 编写新代码。',
	// allow-any-unicode-next-line
	'settings.autoDetectLocal': '自动检测本地提供商和模型（{0}）。',
	// allow-any-unicode-next-line
	'settings.addTooltip': '添加 {0} 以启用',
	// allow-any-unicode-next-line
	'settings.recommendOllama': '我们建议您使用 Ollama 中最大的 qwen2.5-coder 模型（试试 qwen2.5-coder:3b）。',
	// allow-any-unicode-next-line
	'settings.modelNotFound': 'CortexIDE 未识别该模型。',
	// allow-any-unicode-next-line
	'settings.modelPackaged': '{0} 随 CortexIDE 打包，您无需更改这些设置。',
	// allow-any-unicode-next-line
	'settings.modelRecognized': 'CortexIDE 识别 {0}（"{1}"）。',
	// allow-any-unicode-next-line
	'settings.thisModelExists': '该模型已存在。',
	// allow-any-unicode-next-line
	'settings.selectProvider': '请选择提供商。',
	// allow-any-unicode-next-line
	'settings.enterModelName': '请输入模型名称。',
	// allow-any-unicode-next-line
	'settings.language': '语言',
	// allow-any-unicode-next-line
	'settings.languageDesc': '选择 CortexIDE 界面的显示语言。',
};

const LOCALE_BUNDLES: Record<SupportedLocale, Partial<Record<TranslationKey, string>>> = {
	en: EN_TRANSLATIONS,
	zh: ZH_TRANSLATIONS,
	es: ES_TRANSLATIONS,
	fr: FR_TRANSLATIONS,
	de: DE_TRANSLATIONS,
	ja: JA_TRANSLATIONS,
	ko: KO_TRANSLATIONS,
	pt: PT_TRANSLATIONS,
	ar: AR_TRANSLATIONS,
	ru: RU_TRANSLATIONS,
	hi: HI_TRANSLATIONS,
};

const STORAGE_KEY = 'cortexide.i18n.locale';

// allow-any-unicode-next-line
// ─── service implementation ───────────────────────────────────────────────────

class CortexideI18nService extends Disposable implements ICortexideI18nService {
	declare readonly _serviceBrand: undefined;

	private _locale: SupportedLocale;
	private readonly _onDidChangeLocale = this._register(new Emitter<SupportedLocale>());
	readonly onDidChangeLocale: Event<SupportedLocale> = this._onDidChangeLocale.event;

	constructor(
		@IStorageService private readonly storageService: IStorageService,
	) {
		super();

		// Resolve locale: user preference → VS Code locale → English
		const stored = storageService.get(STORAGE_KEY, StorageScope.PROFILE) as SupportedLocale | undefined;
		this._locale = stored && LOCALE_BUNDLES[stored] ? stored : this._detectLocale();
	}

	get locale(): SupportedLocale {
		return this._locale;
	}

	t(key: TranslationKey, fallback?: string): string {
		const bundle = LOCALE_BUNDLES[this._locale];
		if (bundle && key in bundle) {
			return (bundle as Record<string, string>)[key];
		}
		// Fall back to English
		if (key in EN_TRANSLATIONS) {
			return EN_TRANSLATIONS[key];
		}
		return fallback ?? key;
	}

	setLocale(locale: SupportedLocale): void {
		if (locale === this._locale) return;
		this._locale = locale;
		this.storageService.store(STORAGE_KEY, locale, StorageScope.PROFILE, StorageTarget.USER);
		this._onDidChangeLocale.fire(locale);
	}

	private _detectLocale(): SupportedLocale {
		// 1. Check VS Code NLS language (set by --locale or --lang)
		try {
			const nlsLang = (globalThis as any)._VSCODE_NLS_LANGUAGE;
			if (typeof nlsLang === 'string') {
				const short = nlsLang.split('-')[0].toLowerCase() as SupportedLocale;
				if (short in LOCALE_BUNDLES) return short;
			}
		} catch { /* ignore */ }

		// 2. Check navigator.language
		try {
			const lang = (globalThis as any).navigator?.language ?? 'en';
			const short = lang.split('-')[0].toLowerCase() as SupportedLocale;
			if (short in LOCALE_BUNDLES) return short;
		} catch { /* non-browser environment */ }
		return 'en';
	}
}

registerSingleton(ICortexideI18nService, CortexideI18nService, InstantiationType.Delayed);
