/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import '../styles.css';
import { useEffect, useState, useMemo } from 'react';
import { useAccessor, useIsDark, useSettingsState } from '../util/services.js';
import { useTranslation } from '../util/useTranslation.js';
import { Brain, Check, ChevronRight, DollarSign, ExternalLink, Lock, X } from 'lucide-react';
import { displayInfoOfProviderName, ProviderName, providerNames, localProviderNames, nonlocalProviderNames, featureNames, FeatureName, isFeatureNameDisabled } from '../../../../common/cortexideSettingsTypes.js';
import { isCapableLocalCoder } from '../../../../common/routing/codingModelScore.js';
import { builtinToolCount } from '../../../../common/builtinToolNames.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { OllamaSetupInstructions, OneClickSwitchButton, SettingsForProvider, ModelDump } from '../settings/Settings.js';
import { ColorScheme } from '../../../../../../../platform/theme/common/theme.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { FileAccess } from '../../../../../../../base/common/network.js';
import { LocalSetupWizard } from './LocalSetupWizard.js';
import { ExpressOnboardingFlow } from './ExpressOnboardingFlow.js';

const OVERRIDE_VALUE = false

const getHeroLogoUri = () => FileAccess.asBrowserUri('vs/workbench/browser/media/cortexide-main.png').toString(true)

export const VoidOnboarding = () => {

	const accessor = useAccessor()
	const settingsService = accessor.get('ICortexideSettingsService')

	const voidSettingsState = useSettingsState()
	const isOnboardingComplete = voidSettingsState.globalSettings.isOnboardingComplete || OVERRIDE_VALUE

	const isDark = useIsDark()

	// "Use the full guided wizard" escape hatch — flips the express UI off
	// for power users who want the legacy multi-step flow.
	const [useExpressFlow, setUseExpressFlow] = useState<boolean>(true)

	// "Capable setup" = the user already has something that can do agentic coding out of the box: a
	// configured cloud provider, OR a local coder big enough for agentic work (>= 7B). We show the
	// express flow (which, when ollama is running, auto-pulls the hardware-recommended coder) not only
	// on a genuine first launch, but also when ollama is running with only tiny/general models and no
	// capable coder — so a fresh user is never left with a local setup that can't actually do agentic
	// coding. A user WITH a capable setup skips express; selection is then handled by Auto + the router.
	const hasCloudProvider = nonlocalProviderNames.some((p) => voidSettingsState.settingsOfProvider[p]?._didFillInProviderSettings)
	const hasCapableLocalCoder = localProviderNames.some((p) => {
		const ps = voidSettingsState.settingsOfProvider[p] as { _didFillInProviderSettings?: boolean; models?: { modelName: string }[] } | undefined
		return !!ps?._didFillInProviderSettings && (ps?.models ?? []).some((m) => isCapableLocalCoder((m.modelName || '').toLowerCase()))
	})
	const hasCapableSetup = hasCloudProvider || hasCapableLocalCoder

	// Express path is the default when onboarding is incomplete, the user hasn't opted into the legacy
	// wizard, and they don't yet have a capable setup for agentic coding.
	const showExpressFlow = useExpressFlow && !isOnboardingComplete && !hasCapableSetup

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''}`}>
			<style>{`
				.void-onboarding-scroll {
					scrollbar-width: none !important;
				}
				.void-onboarding-scroll:hover {
					scrollbar-width: thin !important;
					scrollbar-color: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} transparent !important;
				}
				.void-onboarding-scroll::-webkit-scrollbar {
					width: 6px !important;
					height: 6px !important;
				}
				.void-onboarding-scroll::-webkit-scrollbar-track {
					background: transparent !important;
				}
				.void-onboarding-scroll::-webkit-scrollbar-thumb {
					background-color: transparent !important;
					border-radius: 3px !important;
				}
				.void-onboarding-scroll:hover::-webkit-scrollbar-thumb {
					background-color: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} !important;
				}
			`}</style>
			<div
				className={`
					fixed inset-0 z-[99999] flex items-center justify-center px-6 py-12
					bg-transparent
					overflow-y-auto onboarding-scroll
					transition-all duration-300 ease-in-out
					${isOnboardingComplete ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
				`}
			>
				<ErrorBoundary>
					{showExpressFlow ? (
						<ExpressOnboardingFlow
							onCustomize={() => setUseExpressFlow(false)}
							onDismiss={() => {
								settingsService.setGlobalSetting('isOnboardingComplete', true)
							}}
						/>
					) : (
						<div className="w-full max-w-[1000px]">
							<VoidOnboardingContent />
						</div>
					)}
				</ErrorBoundary>
			</div>
		</div>
	)
}

const VoidIcon = () => {
	const heroLogoUri = useMemo(() => getHeroLogoUri(), []);
	const isDark = useIsDark();
	return (
		<div className={`w-full max-w-[220px] aspect-square rounded-full border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'} shadow-[0_45px_120px_rgba(0,0,0,0.95)] overflow-hidden`}>
			<img
				src={heroLogoUri}
				alt="CortexIDE logo"
				className="w-full h-full object-contain opacity-95"
				draggable={false}
				onError={(e) => {
					console.error('Failed to load CortexIDE logo:', heroLogoUri);
					// Fallback: try direct path
					const fallbackUri = FileAccess.asBrowserUri('vs/workbench/browser/media/cortexide-main.png').toString(true);
					if (fallbackUri !== heroLogoUri) {
						(e.target as HTMLImageElement).src = fallbackUri;
					}
				}}
			/>
		</div>
	)
}

const FADE_DURATION_MS = 2000

const FadeIn = ({ children, className, delayMs = 0, durationMs, ...props }: { children: React.ReactNode, delayMs?: number, durationMs?: number, className?: string } & React.HTMLAttributes<HTMLDivElement>) => {

	const [opacity, setOpacity] = useState(0)

	const effectiveDurationMs = durationMs ?? FADE_DURATION_MS

	useEffect(() => {

		const timeout = setTimeout(() => {
			setOpacity(1)
		}, delayMs)

		return () => clearTimeout(timeout)
	}, [setOpacity, delayMs])


	return (
		<div className={className} style={{ opacity, transition: `opacity ${effectiveDurationMs}ms ease-in-out` }} {...props}>
			{children}
		</div>
	)
}

// Onboarding

// =============================================
//  New AddProvidersPage Component and helpers
// =============================================

const tabNames = ['Free', 'Paid', 'Local'] as const;

type TabName = typeof tabNames[number] | 'Cloud/Other';

// Data for cloud providers tab
const cloudProviders: ProviderName[] = ['googleVertex', 'liteLLM', 'microsoftAzure', 'awsBedrock', 'openAICompatible'];

const freeProviders: ProviderName[] = ['gemini', 'openRouter', 'pollinations', 'moonshot'];

// Data structures for provider tabs
const providerNamesOfTab: Record<TabName, ProviderName[]> = {
	Free: freeProviders,
	Local: localProviderNames,
	Paid: providerNames.filter(pn => !([...freeProviders, ...localProviderNames, ...cloudProviders] as string[]).includes(pn)) as ProviderName[],
	'Cloud/Other': cloudProviders,
};


const featureNameMap: { featureName: FeatureName }[] = [
	{ featureName: 'Chat' },
	{ featureName: 'Ctrl+K' },
	{ featureName: 'Autocomplete' },
	{ featureName: 'Apply' },
	{ featureName: 'SCM' },
];

const featureDisplayName = (featureName: FeatureName, t: (key: any) => string): string => {
	switch (featureName) {
		case 'Chat': return t('onboarding.feature.chat');
		case 'Ctrl+K': return t('onboarding.feature.quickEdit');
		case 'Autocomplete': return t('onboarding.feature.autocomplete');
		case 'Apply': return t('onboarding.feature.fastApply');
		case 'SCM': return t('onboarding.feature.sourceControl');
	}
};

const tabDisplayName = (tab: TabName, t: (key: any) => string): string => {
	switch (tab) {
		case 'Free': return t('onboarding.tab.free');
		case 'Paid': return t('onboarding.tab.paid');
		case 'Local': return t('onboarding.tab.local');
		case 'Cloud/Other': return t('onboarding.tab.cloudOther');
	}
};

const tabDescription = (tab: TabName, t: (key: any) => string): string => {
	switch (tab) {
		case 'Free': return t('onboarding.tab.free.desc');
		case 'Paid': return t('onboarding.tab.paid.desc');
		case 'Local': return t('onboarding.tab.local.desc');
		case 'Cloud/Other': return t('onboarding.tab.cloudOther.desc');
	}
};

const AddProvidersPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	const { t } = useTranslation();
	const isDark = useIsDark();
	const [currentTab, setCurrentTab] = useState<TabName>('Free');
	const settingsState = useSettingsState();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showLocalWizard, setShowLocalWizard] = useState(false);

	// Clear error message after 5 seconds
	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (errorMessage) {
			timeoutId = setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}

		// Cleanup function to clear the timeout if component unmounts or error changes
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [errorMessage]);

	return (
		<div className="flex flex-col gap-8 w-full min-h-[75vh] max-w-[1000px] mx-auto">
			<div className="space-y-2 text-center md:text-left">
				<p className="text-xs uppercase tracking-[0.35em] text-void-fg-4">{t('onboarding.step02')}</p>
				<h2 className="text-4xl font-light text-void-fg-0">{t('onboarding.chooseProviders')}</h2>
				<p className="text-base text-void-fg-3 max-w-2xl mx-auto md:mx-0">
					{t('onboarding.chooseProvidersDesc')}
				</p>
			</div>

			<div className="flex flex-col md:flex-row flex-1 gap-6">
				{/* Left rail */}
				<div className={`md:w-1/3 w-full flex flex-col gap-6 p-5 rounded-[28px] border border-void-border-3 bg-void-bg-2 shadow-[0_20px_60px_rgba(0,0,0,${isDark ? 0.25 : 0.1})] h-full overflow-y-auto onboarding-scroll`}>
					<div className="flex flex-wrap md:flex-col gap-2">
						{[...tabNames, 'Cloud/Other'].map(tab => (
							<button
								key={tab}
								className={`
									w-full rounded-2xl px-4 py-3 text-left text-sm font-medium tracking-wide transition-all duration-200
									${currentTab === tab
										? 'bg-gradient-to-r from-[#0e70c0] to-[#6b5bff] text-white shadow-[0_18px_40px_rgba(28,107,219,0.35)]'
										: 'bg-void-bg-3 text-void-fg-2 border border-void-border-3 hover:border-void-border-1'}
								`}
								onClick={() => {
									setCurrentTab(tab as TabName);
									setErrorMessage(null);
								}}
							>
								{tabDisplayName(tab, t)}
							</button>
						))}
					</div>

					<div className="grid gap-3 mt-2 text-sm">
						<p className="uppercase text-[11px] tracking-[0.4em] text-void-fg-4">{t('onboarding.featureCoverage')}</p>
						{featureNameMap.map(({ featureName }) => {
							const display = featureDisplayName(featureName, t);
							const hasModel = settingsState.modelSelectionOfFeature[featureName] !== null;
							return (
								<div key={featureName} className="flex items-center justify-between rounded-2xl border border-void-border-4 bg-void-bg-3 px-4 py-3">
									<span>{display}</span>
									{hasModel ? (
										<span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
											<Check className="w-4 h-4" /> {t('onboarding.connected')}
										</span>
									) : (
										<span className="text-xs text-void-fg-4">{t('onboarding.pending')}</span>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Content */}
				<div className={`flex-1 flex flex-col rounded-[28px] border border-void-border-3 bg-void-bg-1 shadow-[0_20px_60px_rgba(0,0,0,${isDark ? 0.25 : 0.1})] p-5`}>
					<div className="w-full max-w-xl mx-auto text-center mb-6 space-y-2">
					<div className="text-3xl font-light text-void-fg-0">{tabDisplayName(currentTab, t)}</div>
					<div className="text-sm text-void-fg-3">{tabDescription(currentTab, t)}</div>
				</div>

				<div className="space-y-4 overflow-y-auto onboarding-scroll pr-3 flex-1 rounded-2xl border border-void-border-4 bg-void-bg-2 p-5">
						{currentTab === 'Local' && !showLocalWizard && (
							<button
								className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-void-border-2 bg-void-bg-3 hover:border-void-border-1 transition-colors text-left"
								onClick={() => setShowLocalWizard(true)}
							>
								<div>
									<div className="font-semibold text-sm text-void-fg-0">{t('onboarding.setupLocalAuto')}</div>
									// allow-any-unicode-next-line
									<div className="text-xs text-void-fg-3 mt-0.5">{t('onboarding.setupLocalAutoDesc')}</div>
								</div>
								<ChevronRight size={16} className="text-void-fg-3 flex-shrink-0 ml-4" />
							</button>
						)}
						{currentTab === 'Local' && showLocalWizard && (
							<ErrorBoundary>
								<LocalSetupWizard
									onComplete={() => setShowLocalWizard(false)}
									onSkip={() => setShowLocalWizard(false)}
								/>
							</ErrorBoundary>
						)}
						{(!showLocalWizard) && providerNamesOfTab[currentTab].map((providerName) => (
							<div key={providerName} className="rounded-xl border border-void-border-3 bg-void-bg-3 p-5 transition-all duration-200 hover:border-void-border-1">
								<div className="flex items-center justify-between mb-3">
									<div className="text-xl font-medium text-void-fg-0 flex items-center gap-2">
										{t('onboarding.addProvider').replace('{0}', displayInfoOfProviderName(providerName).title)}
										{(providerName === 'gemini' || providerName === 'openRouter' || providerName === 'pollinations') && (
											<span
												data-tooltip-id="cortex-tooltip-provider-info"
												data-tooltip-place="right"
												className="text-xs text-blue-400"
												data-tooltip-content={providerName === 'gemini'
													? t('onboarding.tooltip.gemini')
													: providerName === 'openRouter'
														? t('onboarding.tooltip.openRouter')
														: t('onboarding.tooltip.pollinations')}
											>
												{t('onboarding.details')}
											</span>
										)}
									</div>
									{providerName === 'ollama' && (
										<span className="inline-flex items-center gap-1 text-xs text-void-fg-3">
											<Lock size={12} /> {t('onboarding.localLabel')}
										</span>
									)}
								</div>

								<SettingsForProvider providerName={providerName} showProviderTitle={false} showProviderSuggestions={true} />

								{providerName === 'ollama' && (
									<div className="mt-5 rounded-xl border border-void-border-4 bg-void-bg-4 p-5">
										<OllamaSetupInstructions />
									</div>
								)}
							</div>
						))}
					</div>

					{(currentTab === 'Local' || currentTab === 'Cloud/Other') && !showLocalWizard && (
						<div className="w-full mt-6 rounded-2xl border border-void-border-4 bg-void-bg-2 p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="text-xl font-medium">{t('onboarding.modelsLabel')}</div>
							</div>
							{currentTab === 'Local' && (
								<div className="text-sm text-void-fg-3 mb-4">{t('onboarding.localModelsDesc')}</div>
							)}
							{currentTab === 'Local' && <ModelDump filteredProviders={localProviderNames} />}
							{currentTab === 'Cloud/Other' && <ModelDump filteredProviders={cloudProviders} />}
						</div>
					)}

					<div className="flex flex-col gap-3 items-end w-full mt-6">
						{errorMessage && (
							<div className="w-full text-sm rounded-2xl border border-void-warning/30 bg-void-warning/15 text-void-warning px-4 py-3 text-right">
								{errorMessage}
							</div>
						)}
						<div className="flex items-center gap-2">
							<PreviousButton onClick={() => setPageIndex(pageIndex - 1)} />
							<NextButton
								onClick={() => {
									const isDisabled = isFeatureNameDisabled('Chat', settingsState)
									if (!isDisabled) {
										setPageIndex(pageIndex + 1);
										setErrorMessage(null);
									} else {
										setErrorMessage(t('onboarding.connectOneModel'));
									}
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
// =============================================
// 	OnboardingPage
// 		title:
// 			div
// 				"Welcome to Void"
// 			image
// 		content:<></>
// 		title
// 		content
// 		prev/next

// 	OnboardingPage
// 		title:
// 			div
// 				"How would you like to use Void?"
// 		content:
// 			ModelQuestionContent
// 				|
// 					div
// 						"I want to:"
// 					div
// 						"Use the smartest models"
// 						"Keep my data fully private"
// 						"Save money"
// 						"I don't know"
// 				| div
// 					| div
// 						"We recommend using "
// 						"Set API"
// 					| div
// 						""
// 					| div
//
// 		title
// 		content
// 		prev/next
//
// 	OnboardingPage
// 		title
// 		content
// 		prev/next

const NextButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	const { t } = useTranslation();
	const { disabled, className = '', ...buttonProps } = props;
	const isDark = useIsDark();

	return (
		<button
			type="button"
			onClick={disabled ? undefined : onClick}
			onDoubleClick={onClick}
			className={`
				inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold tracking-tight transition-all duration-300 border border-void-border-2
				${disabled
					? 'bg-void-bg-3 text-void-fg-4 cursor-not-allowed'
					: `bg-gradient-to-r from-[#2a2c34] via-[#1b1c23] to-[#101117] text-white shadow-[0_25px_55px_rgba(0,0,0,${isDark ? 0.55 : 0.2})] hover:translate-y-[-1px] hover:shadow-[0_30px_70px_rgba(0,0,0,${isDark ? 0.65 : 0.25})]`}
				${className}
			`}
			{...disabled && {
				'data-tooltip-id': 'cortex-tooltip',
				"data-tooltip-content": t('onboarding.fillRequired'),
				"data-tooltip-place": 'top',
			}}
			{...buttonProps}
		>
			{t('common.next')}
			<ChevronRight className="w-4 h-4" />
		</button>
	)
}

const PreviousButton = ({ onClick, ...props }: { onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	const { t } = useTranslation();
	const isDark = useIsDark();
	return (
		<button
			type="button"
			onClick={onClick}
			className={`px-5 py-2.5 rounded-2xl border border-void-border-2 bg-void-bg-3 text-void-fg-2 hover:text-void-fg-0 hover:border-void-border-1 transition-all duration-200`}
			{...props}
		>
			{t('common.back')}
		</button>
	)
}



const OnboardingPageShell = ({ top, bottom, content, hasMaxWidth = true, className = '', }: {
	top?: React.ReactNode,
	bottom?: React.ReactNode,
	content?: React.ReactNode,
	hasMaxWidth?: boolean,
	className?: string,
}) => {
	const isDark = useIsDark()
	return (
		<div className={`min-h-[50vh] w-full ${className}`}>
				<div className={`
						text-lg flex flex-col gap-6 w-full h-full mx-auto
						rounded-[32px] border border-void-border-3 bg-void-bg-2
						shadow-[0_30px_90px_rgba(0,0,0,${isDark ? 0.45 : 0.15})]
						${hasMaxWidth ? 'max-w-[720px]' : ''}
							max-h-[calc(100vh-6rem)]
							overflow-hidden
					`}>
							<div className="overflow-y-auto onboarding-scroll h-full px-10 py-10 pr-5">
									{top && <FadeIn className='w-full mb-auto'>{top}</FadeIn>}
									{content && <FadeIn className='w-full my-auto'>{content}</FadeIn>}
									{bottom && <div className='w-full pt-6'>{bottom}</div>}
							</div>
					</div>
			</div>
	)
}

const WelcomePage = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => {
	const { t } = useTranslation()
	const isDark = useIsDark()

	const welcomeHighlights = [
		t('onboarding.highlights.chatQuickEdit'),
		t('onboarding.highlights.fastApply'),
		t('onboarding.highlights.pdfImage'),
		t('onboarding.highlights.localCloud'),
	];

	const welcomeStats = [
		{ label: t('onboarding.stats.uploads.label'), value: t('onboarding.stats.uploads.value'), detail: t('onboarding.stats.uploads.detail') },
		{ label: t('onboarding.stats.fastApply.label'), value: t('onboarding.stats.fastApply.value'), detail: t('onboarding.stats.fastApply.detail') },
		{ label: t('onboarding.stats.modelRouter.label'), value: t('onboarding.stats.modelRouter.value'), detail: t('onboarding.stats.modelRouter.detail') },
		{ label: t('onboarding.stats.agentTools.label'), value: t('onboarding.stats.agentTools.value').replace('{0}', String(builtinToolCount)), detail: t('onboarding.stats.agentTools.detail') },
	];

	return (
		<div className="space-y-8">
			<div className={`rounded-[32px] border border-void-border-2 bg-void-bg-2 shadow-[0_60px_140px_rgba(0,0,0,${isDark ? 0.75 : 0.2})] px-10 py-12`}>
				<div className="flex flex-col lg:flex-row gap-10 items-center">
					<div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
						<p className="text-xs uppercase tracking-[0.45em] text-void-fg-4">{t('onboarding.welcome')}</p>
						<div>
							<h1 className="text-5xl font-light text-void-fg-0">{t('onboarding.headline')}</h1>
							<p className="text-base text-void-fg-2 mt-3 max-w-xl mx-auto lg:mx-0">
								{t('onboarding.welcomeDesc')}
							</p>
						</div>
						<div className="flex flex-wrap gap-3 justify-center lg:justify-start">
							{welcomeHighlights.map((highlight) => (
								<span key={highlight} className="px-3 py-1.5 rounded-full border border-void-border-3 bg-void-bg-3 text-xs tracking-[0.3em] uppercase text-void-fg-3">
									{highlight}
								</span>
							))}
						</div>
						<div className="flex flex-wrap gap-3 justify-center lg:justify-start">
							<PrimaryActionButton ringSize='xl' onClick={onNext}>{t('onboarding.startGuided')}</PrimaryActionButton>
							<SecondaryActionButton onClick={onSkip}>{t('onboarding.chooseLater')}</SecondaryActionButton>
						</div>
					</div>
					<div className="flex-1 w-full flex flex-col items-center gap-6">
						<div className="relative w-full max-w-sm aspect-square">
							<div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-white/10' : 'from-black/5'} via-transparent to-transparent blur-3xl rounded-[32px]`} />
							<div className={`relative w-full h-full rounded-[28px] border border-void-border-2 bg-void-bg-3 shadow-[0_45px_110px_rgba(0,0,0,${isDark ? 0.7 : 0.15})] flex items-center justify-center p-6`}>
								<VoidIcon />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 w-full max-w-sm">
							{welcomeStats.map(({ label, value, detail }) => (
								<div key={label} className="rounded-2xl border border-void-border-3 bg-void-bg-3 p-4 text-center text-void-fg-2">
									<p className="text-[11px] uppercase tracking-[0.4em] text-void-fg-4">{label}</p>
									<p className="text-lg font-medium text-void-fg-0 mt-2">{value}</p>
									<p className="text-xs text-void-fg-3 mt-1">{detail}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

const OllamaDownloadOrRemoveModelButton = ({ modelName, isModelInstalled, sizeGb }: { modelName: string, isModelInstalled: boolean, sizeGb: number | false | 'not-known' }) => {
	// for now just link to the ollama download page
	return <a
		href={`https://ollama.com/library/${modelName}`}
		target="_blank"
		rel="noopener noreferrer"
		className="flex items-center justify-center text-void-fg-2 hover:text-void-fg-1"
	>
		<ExternalLink className="w-3.5 h-3.5" />
	</a>

}


const YesNoText = ({ val }: { val: boolean | null }) => {
	const { t } = useTranslation();

	return <div
		className={
			val === true ? "text text-emerald-500"
				: val === false ? 'text-rose-600'
					: "text text-amber-300"
		}
	>
		{
			val === true ? t('onboarding.yes')
				: val === false ? t('onboarding.no')
					: t('onboarding.yesStar')
		}
	</div>

}



const abbreviateNumber = (num: number): string => {
	if (num >= 1000000) {
		// For millions
		return Math.floor(num / 1000000) + 'M';
	} else if (num >= 1000) {
		// For thousands
		return Math.floor(num / 1000) + 'K';
	} else {
		// For numbers less than 1000
		return num.toString();
	}
}





const PrimaryActionButton = ({ children, className = '', ringSize, ...props }: { children: React.ReactNode, ringSize?: undefined | 'xl' | 'screen' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	const isDark = useIsDark();
	const sizingClass = ringSize === 'xl'
		? 'px-10 py-4 text-lg'
		: ringSize === 'screen'
			? 'px-16 py-8 text-2xl w-full'
			: 'px-5 py-2.5 text-base';

	return (
		<button
			type='button'
			className={`
				inline-flex items-center justify-center gap-2 rounded-[18px] font-semibold tracking-tight
				text-white border border-void-border-2
				bg-gradient-to-r from-[#3a3d47] via-[#23252c] to-[#111216]
				shadow-[0_35px_80px_rgba(0,0,0,${isDark ? 0.6 : 0.2})]
				hover:shadow-[0_45px_100px_rgba(0,0,0,${isDark ? 0.7 : 0.25})] hover:translate-y-[-1px]
				focus-visible:ring-2 focus-visible:ring-offset-2 ${isDark ? 'focus-visible:ring-white/20' : 'focus-visible:ring-black/20'}
				${isDark ? 'focus-visible:ring-offset-[#050612]' : 'focus-visible:ring-offset-[#f5f5f5]'}
				transition-all duration-300 group
				${sizingClass}
				${className}
			`}
			{...props}
		>
			{children}
			<ChevronRight
				className="transition-transform duration-300 ease-in-out group-hover:translate-x-1 group-active:translate-x-1"
			/>
		</button>
	)
}

const SecondaryActionButton = ({ children, className = '', ...props }: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		type="button"
		className={`
			inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5
			border border-void-border-2 text-void-fg-2
			hover:text-void-fg-0 hover:border-void-border-1
			transition-all duration-200
			${className}
		`}
		{...props}
	>
		{children}
	</button>
)


type WantToUseOption = 'smart' | 'private' | 'cheap' | 'all'

const VoidOnboardingContent = () => {

	const { t } = useTranslation()
	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const voidMetricsService = accessor.get('IMetricsService')

	const voidSettingsState = useSettingsState()

	const [pageIndex, setPageIndex] = useState(0)


	// page 1 state
	const [wantToUseOption, setWantToUseOption] = useState<WantToUseOption>('smart')

	// Replace the single selectedProviderName with four separate states
	// page 2 state - each tab gets its own state
	const [selectedIntelligentProvider, setSelectedIntelligentProvider] = useState<ProviderName>('anthropic');
	const [selectedPrivateProvider, setSelectedPrivateProvider] = useState<ProviderName>('ollama');
	const [selectedAffordableProvider, setSelectedAffordableProvider] = useState<ProviderName>('gemini');
	const [selectedAllProvider, setSelectedAllProvider] = useState<ProviderName>('anthropic');

	// Helper function to get the current selected provider based on active tab
	const getSelectedProvider = (): ProviderName => {
		switch (wantToUseOption) {
			case 'smart': return selectedIntelligentProvider;
			case 'private': return selectedPrivateProvider;
			case 'cheap': return selectedAffordableProvider;
			case 'all': return selectedAllProvider;
		}
	}

	// Helper function to set the selected provider for the current tab
	const setSelectedProvider = (provider: ProviderName) => {
		switch (wantToUseOption) {
			case 'smart': setSelectedIntelligentProvider(provider); break;
			case 'private': setSelectedPrivateProvider(provider); break;
			case 'cheap': setSelectedAffordableProvider(provider); break;
			case 'all': setSelectedAllProvider(provider); break;
		}
	}

	const providerNamesOfWantToUseOption: { [wantToUseOption in WantToUseOption]: ProviderName[] } = {
		smart: ['anthropic', 'openAI', 'gemini', 'openRouter'],
		private: ['ollama', 'vLLM', 'openAICompatible', 'lmStudio'],
		cheap: ['gemini', 'deepseek', 'openRouter', 'pollinations', 'ollama', 'vLLM'],
		all: providerNames,
	}


	const selectedProviderName = getSelectedProvider();
	const didFillInProviderSettings = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName]._didFillInProviderSettings
	const isApiKeyLongEnoughIfApiKeyExists = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName].apiKey ? voidSettingsState.settingsOfProvider[selectedProviderName].apiKey.length > 15 : true
	const isAtLeastOneModel = selectedProviderName && voidSettingsState.settingsOfProvider[selectedProviderName].models.length >= 1

	const didFillInSelectedProviderSettings = !!(didFillInProviderSettings && isApiKeyLongEnoughIfApiKeyExists && isAtLeastOneModel)

	const skipOnboarding = (reason: string) => {
		cortexideSettingsService.setGlobalSetting('isOnboardingComplete', true);
		voidMetricsService.capture('Skipped Onboarding', { reason, pageIndex, wantToUseOption, selectedProviderName });
	}

	const prevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PreviousButton
				onClick={() => { setPageIndex(pageIndex - 1) }}
			/>
			<NextButton
				onClick={() => { setPageIndex(pageIndex + 1) }}
			/>
		</div>
	</div>


	const lastPagePrevAndNextButtons = <div className="max-w-[600px] w-full mx-auto flex flex-col items-end">
		<div className="flex items-center gap-2">
			<PreviousButton
				onClick={() => { setPageIndex(pageIndex - 1) }}
			/>
			<SecondaryActionButton onClick={() => skipOnboarding('final-step-skip')}>{t('onboarding.chooseLater')}</SecondaryActionButton>
			<PrimaryActionButton
				onClick={() => {
					cortexideSettingsService.setGlobalSetting('isOnboardingComplete', true);
					voidMetricsService.capture('Completed Onboarding', { selectedProviderName, wantToUseOption })
				}}
				ringSize={voidSettingsState.globalSettings.isOnboardingComplete ? 'screen' : undefined}
			>{t('onboarding.startApp')}</PrimaryActionButton>
		</div>
	</div>


	// cannot be md
	const basicDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: t('onboarding.wantToUse.smart.basic'),
		private: t('onboarding.wantToUse.private.basic'),
		cheap: t('onboarding.wantToUse.cheap.basic'),
		all: "",
	}

	// can be md
	const detailedDescOfWantToUseOption: { [wantToUseOption in WantToUseOption]: string } = {
		smart: t('onboarding.wantToUse.smart.detailed'),
		private: t('onboarding.wantToUse.private.detailed'),
		cheap: t('onboarding.wantToUse.cheap.detailed'),
		all: "",
	}

	// Modified: initialize separate provider states on initial render instead of watching wantToUseOption changes
	useEffect(() => {
		if (selectedIntelligentProvider === undefined) {
			setSelectedIntelligentProvider(providerNamesOfWantToUseOption['smart'][0]);
		}
		if (selectedPrivateProvider === undefined) {
			setSelectedPrivateProvider(providerNamesOfWantToUseOption['private'][0]);
		}
		if (selectedAffordableProvider === undefined) {
			setSelectedAffordableProvider(providerNamesOfWantToUseOption['cheap'][0]);
		}
		if (selectedAllProvider === undefined) {
			setSelectedAllProvider(providerNamesOfWantToUseOption['all'][0]);
		}
	}, []);

	// reset the page to page 0 if the user redos onboarding
	useEffect(() => {
		if (!voidSettingsState.globalSettings.isOnboardingComplete) {
			setPageIndex(0)
		}
	}, [setPageIndex, voidSettingsState.globalSettings.isOnboardingComplete])


	const contentOfIdx: { [pageIndex: number]: React.ReactNode } = {
		0: <WelcomePage onNext={() => setPageIndex(1)} onSkip={() => skipOnboarding('welcome-skip')} />,

		1: <OnboardingPageShell hasMaxWidth={false}
			content={
				<AddProvidersPage pageIndex={pageIndex} setPageIndex={setPageIndex} />
			}
		/>,
		2: <OnboardingPageShell
			content={
				<div className="flex flex-col items-center justify-center py-8">
					<div className="text-3xl font-light text-center text-void-fg-0">{t('onboarding.settingsAndThemes')}</div>

					<div className="mt-6 text-center flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
						<h4 className="text-sm text-void-fg-3 mb-2">{t('onboarding.transferSettings')}</h4>
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="VS Code" />
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Cursor" />
						<OneClickSwitchButton className='w-full px-4 py-2' fromEditor="Windsurf" />
					</div>
				</div>
			}
			bottom={lastPagePrevAndNextButtons}
		/>,
	}


	return <div key={pageIndex} className="w-full h-[80vh] text-left mx-auto flex flex-col items-center justify-center">
		<ErrorBoundary>
			{contentOfIdx[pageIndex]}
		</ErrorBoundary>
	</div>

}
