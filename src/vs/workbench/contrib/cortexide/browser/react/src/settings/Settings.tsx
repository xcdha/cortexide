/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'; // Added useRef import just in case it was missed, though likely already present
import { ProviderName, SettingName, displayInfoOfSettingName, providerNames, CortexideStatefulModelInfo, customSettingNamesOfProvider, RefreshableProviderName, refreshableProviderNames, displayInfoOfProviderName, nonlocalProviderNames, localProviderNames, GlobalSettingName, featureNames, displayInfoOfFeatureName, isProviderNameDisabled, FeatureName, hasDownloadButtonsOnModelsProviderNames, subTextMdOfProviderName } from '../../../../common/cortexideSettingsTypes.js'
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js'
import { VoidButtonBgDarken, VoidCustomDropdownBox, VoidInputBox2, VoidSimpleInputBox, VoidSwitch } from '../util/inputs.js'
import { useAccessor, useIsDark, useIsOptedOut, useRefreshModelListener, useRefreshModelState, useSettingsState } from '../util/services.js'
import { X, RefreshCw, Loader2, Check, Asterisk, Plus, Settings2, ChevronRight, ChevronDown } from 'lucide-react'
import { URI } from '../../../../../../../base/common/uri.js'
import { ModelDropdown } from './ModelDropdown.js'
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js'
import { WarningBox } from './WarningBox.js'
import { os } from '../../../../common/helpers/systemInfo.js'
import { IconLoading } from '../sidebar-tsx/SidebarChat.js'
import { ToolApprovalType, toolApprovalTypes } from '../../../../common/toolsServiceTypes.js'
import Severity from '../../../../../../../base/common/severity.js'
import { getModelCapabilities, modelOverrideKeys, ModelOverrides } from '../../../../common/modelCapabilities.js';
import { TransferEditorType, TransferFilesInfo } from '../../../extensionTransferTypes.js';
import { MCPServer } from '../../../../common/mcpServiceTypes.js';
import { useMCPServiceState } from '../util/services.js';
import { OPT_OUT_KEY } from '../../../../common/storageKeys.js';
import { StorageScope, StorageTarget } from '../../../../../../../platform/storage/common/storage.js';
import { generateUuid } from '../../../../../../../base/common/uuid.js'
import { useTranslation } from '../util/useTranslation.js'
import { TranslationKey } from '../../../../common/i18n/i18nService.js'
import { useRulesState } from '../util/services.js'
import { ProjectRule } from '../../../../common/cortexideRulesService.js'
import { VSBuffer } from '../../../../../../../base/common/buffer.js'

type Tab =
	| 'models'
	| 'localProviders'
	| 'providers'
	| 'featureOptions'
	| 'mcp'
	| 'general'
	| 'all';


const ButtonLeftTextRightOption = ({ text, leftButton }: { text: string, leftButton?: React.ReactNode }) => {

	return <div className='flex items-center text-void-fg-3 px-3 py-0.5 rounded-sm overflow-hidden gap-2'>
		{leftButton ? leftButton : null}
		<span>
			{text}
		</span>
	</div>
}

// models
const RefreshModelButton = ({ providerName }: { providerName: RefreshableProviderName }) => {
	const { t } = useTranslation()
	const refreshModelState = useRefreshModelState()

	const accessor = useAccessor()
	const refreshModelService = accessor.get('IRefreshModelService')
	const metricsService = accessor.get('IMetricsService')

	const [justFinished, setJustFinished] = useState<null | 'finished' | 'error'>(null)

	useRefreshModelListener(
		useCallback((providerName2, refreshModelState) => {
			if (providerName2 !== providerName) return
			const { state } = refreshModelState[providerName]
			if (!(state === 'finished' || state === 'error')) return
			// now we know we just entered 'finished' state for this providerName
			setJustFinished(state)
			const tid = setTimeout(() => { setJustFinished(null) }, 2000)
			return () => clearTimeout(tid)
		}, [providerName])
	)

	const { state } = refreshModelState[providerName]

	const { title: providerTitle } = displayInfoOfProviderName(providerName)

	return <ButtonLeftTextRightOption

		leftButton={
			<button
				className='flex items-center'
				disabled={state === 'refreshing' || justFinished !== null}
				onClick={() => {
					refreshModelService.startRefreshingModels(providerName, { enableProviderOnSuccess: false, doNotFire: false })
					metricsService.capture('Click', { providerName, action: 'Refresh Models' })
				}}
			>
				{justFinished === 'finished' ? <Check className='stroke-green-500 size-3' />
					: justFinished === 'error' ? <X className='stroke-red-500 size-3' />
						: state === 'refreshing' ? <Loader2 className='size-3 animate-spin' />
							: <RefreshCw className='size-3' />}
			</button>
		}

		text={justFinished === 'finished' ? t('settings.modelsUpToDate').replace('{0}', providerTitle)
			: justFinished === 'error' ? t('settings.providerNotFound').replace('{0}', providerTitle)
				: t('settings.manualRefresh').replace('{0}', providerTitle)}
	/>
}

const RefreshableModels = () => {
	const settingsState = useSettingsState()


	const buttons = refreshableProviderNames.map(providerName => {
		if (!settingsState.settingsOfProvider[providerName]._didFillInProviderSettings) return null
		return <RefreshModelButton key={providerName} providerName={providerName} />
	})

	return <>
		{buttons}
	</>

}

// Refresh button for remote provider catalogs
const RefreshRemoteCatalogButton = ({ providerName }: { providerName: ProviderName }) => {
	const { t } = useTranslation()
	const accessor = useAccessor()
	const refreshModelService = accessor.get('IRefreshModelService')
	const metricsService = accessor.get('IMetricsService')
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [justFinished, setJustFinished] = useState<null | 'finished' | 'error'>(null)
	const [foundCount, setFoundCount] = useState<number | null>(null)

	const { title: providerTitle } = displayInfoOfProviderName(providerName)

	const handleRefresh = async () => {
		if (isRefreshing) return
		setIsRefreshing(true)
		setJustFinished(null)
		setFoundCount(null)

		try {
			const count = await refreshModelService.refreshRemoteCatalog(providerName, true)
			setFoundCount(count)
			setJustFinished('finished')
			metricsService.capture('Click', { providerName, action: 'Refresh Remote Catalog', count })
		} catch (error) {
			console.error('Failed to refresh remote catalog:', error)
			setJustFinished('error')
		} finally {
			setIsRefreshing(false)
			const tid = setTimeout(() => { setJustFinished(null) }, 3000)
			return () => clearTimeout(tid)
		}
	}

	return <ButtonLeftTextRightOption
		leftButton={
			<button
				className='flex items-center'
				disabled={isRefreshing || justFinished !== null}
				onClick={handleRefresh}
			>
				{justFinished === 'finished' ? <Check className='stroke-green-500 size-3' />
					: justFinished === 'error' ? <X className='stroke-red-500 size-3' />
						: isRefreshing ? <Loader2 className='size-3 animate-spin' />
							: <RefreshCw className='size-3' />}
			</button>
		}
		text={justFinished === 'finished'
			? (foundCount && foundCount > 0
				? t('settings.foundOnline').replace('{0}', providerTitle).replace('{1}', String(foundCount)).replace('{2}', foundCount === 1 ? '' : 's')
				: t('settings.noOnlineCatalog').replace('{0}', providerTitle))
			: justFinished === 'error' ? t('settings.refreshCatalogFailed').replace('{0}', providerTitle)
				: t('settings.refreshModelCatalog').replace('{0}', providerTitle)}
	/>
}

const RefreshableRemoteCatalogs = () => {
	const settingsState = useSettingsState()

	// Show refresh buttons for remote providers that are configured
	const buttons = nonlocalProviderNames.map(providerName => {
		if (!settingsState.settingsOfProvider[providerName]._didFillInProviderSettings) return null
		return <RefreshRemoteCatalogButton key={providerName} providerName={providerName} />
	})

	// Filter out nulls
	const validButtons = buttons.filter(Boolean)
	if (validButtons.length === 0) return null

	return <>
		{validButtons}
	</>
}



export const AnimatedCheckmarkButton = ({ text, className }: { text?: string, className?: string }) => {
	const [dashOffset, setDashOffset] = useState(40);

	useEffect(() => {
		const startTime = performance.now();
		const duration = 500; // 500ms animation

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const newOffset = 40 - (progress * 40);

			setDashOffset(newOffset);

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		const animationId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationId);
	}, []);

	return <div
		className={`flex items-center gap-1.5 w-fit
			${className ? className : `px-2 py-0.5 text-xs text-zinc-900 bg-zinc-100 rounded-sm`}
		`}
	>
		<svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M5 13l4 4L19 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{
					strokeDasharray: 40,
					strokeDashoffset: dashOffset
				}}
			/>
		</svg>
		{text}
	</div>
}


const AddButton = ({ disabled, text = 'Add', ...props }: { disabled?: boolean, text?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {

	return <button
		disabled={disabled}
		className={`bg-[var(--cortex-brand)] px-3 py-1 text-white rounded-sm ${!disabled ? 'hover:bg-[var(--cortex-brand-dim)] cursor-pointer' : 'opacity-50 cursor-not-allowed bg-opacity-70'}`}
		{...props}
	>{text}</button>

}

// ConfirmButton prompts for a second click to confirm an action, cancels if clicking outside
const ConfirmButton = ({ children, onConfirm, className }: { children: React.ReactNode, onConfirm: () => void, className?: string }) => {
	const { t } = useTranslation()
	const [confirm, setConfirm] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!confirm) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setConfirm(false);
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [confirm]);
	return (
		<div ref={ref} className={`inline-block`}>
			<VoidButtonBgDarken className={className} onClick={() => {
				if (!confirm) {
					setConfirm(true);
				} else {
					onConfirm();
					setConfirm(false);
				}
			}}>
				{confirm ? t('settings.confirmReset') : children}
			</VoidButtonBgDarken>
		</div>
	);
};

// ---------------- Simplified Model Settings Dialog ------------------

// keys of ModelOverrides we allow the user to override



// This new dialog replaces the verbose UI with a single JSON override box.
const SimpleModelSettingsDialog = ({
	isOpen,
	onClose,
	modelInfo,
}: {
	isOpen: boolean;
	onClose: () => void;
	modelInfo: { modelName: string; providerName: ProviderName; type: 'autodetected' | 'custom' | 'default' } | null;
}) => {
	if (!isOpen || !modelInfo) return null;

	const { modelName, providerName, type } = modelInfo;
	const accessor = useAccessor()
	const settingsState = useSettingsState()
	const mouseDownInsideModal = useRef(false); // Ref to track mousedown origin
	const { t } = useTranslation()
	const settingsStateService = accessor.get('ICortexideSettingsService')

	// current overrides and defaults
	const defaultModelCapabilities = getModelCapabilities(providerName, modelName, undefined);
	const currentOverrides = settingsState.overridesOfModel?.[providerName]?.[modelName] ?? undefined;
	const { recognizedModelName, isUnrecognizedModel } = defaultModelCapabilities

	// Create the placeholder with the default values for allowed keys
	const partialDefaults: Partial<ModelOverrides> = {};
	for (const k of modelOverrideKeys) { if (defaultModelCapabilities[k]) partialDefaults[k] = defaultModelCapabilities[k] as any; }
	const placeholder = JSON.stringify(partialDefaults, null, 2);

	const [overrideEnabled, setOverrideEnabled] = useState<boolean>(() => !!currentOverrides);

	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

	// reset when dialog toggles
	useEffect(() => {
		if (!isOpen) return;
		const cur = settingsState.overridesOfModel?.[providerName]?.[modelName];
		setOverrideEnabled(!!cur);
		setErrorMsg(null);
	}, [isOpen, providerName, modelName, settingsState.overridesOfModel, placeholder]);

	const onSave = async () => {
		// if disabled override, reset overrides
		if (!overrideEnabled) {
			await settingsStateService.setOverridesOfModel(providerName, modelName, undefined);
			onClose();
			return;
		}

		// enabled overrides
		// parse json
		let parsedInput: Record<string, unknown>

		if (textAreaRef.current?.value) {
			try {
				parsedInput = JSON.parse(textAreaRef.current.value);
			} catch (e) {
				setErrorMsg(t('settings.invalidJson'));
				return;
			}
		} else {
			setErrorMsg(t('settings.invalidJson'));
			return;
		}

		// only keep allowed keys
		const cleaned: Partial<ModelOverrides> = {};
		for (const k of modelOverrideKeys) {
			if (!(k in parsedInput)) continue
			const isEmpty = parsedInput[k] === '' || parsedInput[k] === null || parsedInput[k] === undefined;
			if (!isEmpty) {
				cleaned[k] = parsedInput[k] as any;
			}
		}
		await settingsStateService.setOverridesOfModel(providerName, modelName, cleaned);
		onClose();
	};

	const sourcecodeOverridesLink = `https://github.com/cortexide/cortexide/blob/main/src/vs/workbench/contrib/cortexide/common/modelCapabilities.ts#L146-L172`

	return (
		<div // Backdrop
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999999]"
			onMouseDown={() => {
				mouseDownInsideModal.current = false;
			}}
			onMouseUp={() => {
				if (!mouseDownInsideModal.current) {
					onClose();
				}
				mouseDownInsideModal.current = false;
			}}
		>
			{/* MODAL */}
			<div
				className="bg-void-bg-1 rounded-md p-4 max-w-xl w-full shadow-xl overflow-y-auto max-h-[90vh]"
				onClick={(e) => e.stopPropagation()} // Keep stopping propagation for normal clicks inside
				onMouseDown={(e) => {
					mouseDownInsideModal.current = true;
					e.stopPropagation();
				}}
			>
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-medium">
						{t('settings.changeDefaultsFor').replace('{0}', modelName).replace('{1}', displayInfoOfProviderName(providerName).title)}
					</h3>
					<button
						onClick={onClose}
						className="text-void-fg-3 hover:text-void-fg-1"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Display model recognition status */}
				<div className="text-sm text-void-fg-3 mb-4">
					{type === 'default' ? t('settings.modelPackaged').replace('{0}', modelName)
						: isUnrecognizedModel
						? t('settings.modelNotFound')
						: t('settings.modelRecognized').replace('{0}', modelName).replace('{1}', recognizedModelName)}
				</div>


				{/* override toggle */}
				<div className="flex items-center gap-2 mb-4">
					<VoidSwitch size='xs' value={overrideEnabled} onChange={setOverrideEnabled} />
					<span className="text-void-fg-3 text-sm">{t('settings.overrideDefaults')}</span>
				</div>

				{/* Informational link */}
				{overrideEnabled && <div className="text-sm text-void-fg-3 mb-4">
					<ChatMarkdownRender string={t('settings.jsonAdvancedDesc').replace('{0}', sourcecodeOverridesLink)} chatMessageLocation={undefined} />
				</div>}

				<textarea
					key={overrideEnabled + ''}
					ref={textAreaRef}
					className={`w-full min-h-[200px] p-2 rounded-sm border border-void-border-2 bg-void-bg-2 resize-none font-mono text-sm ${!overrideEnabled ? 'text-void-fg-3' : ''}`}
					defaultValue={overrideEnabled && currentOverrides ? JSON.stringify(currentOverrides, null, 2) : placeholder}
					placeholder={placeholder}
					readOnly={!overrideEnabled}
				/>
				{errorMsg && (
					<div className="text-red-500 mt-2 text-sm">{errorMsg}</div>
				)}


				<div className="flex justify-end gap-2 mt-4">
					<VoidButtonBgDarken onClick={onClose} className="px-3 py-1">
						{t('settings.cancel')}
					</VoidButtonBgDarken>
					<VoidButtonBgDarken
						onClick={onSave}
						className="px-3 py-1 bg-[var(--cortex-brand)] hover:bg-[var(--cortex-brand-dim)] text-white"
					>
						{t('settings.save')}
					</VoidButtonBgDarken>
				</div>
			</div>
		</div>
	);
};




export const ModelDump = ({ filteredProviders }: { filteredProviders?: ProviderName[] }) => {
	const accessor = useAccessor()
	const settingsStateService = accessor.get('ICortexideSettingsService')
	const settingsState = useSettingsState()
	const { t } = useTranslation()

	// State to track which model's settings dialog is open
	const [openSettingsModel, setOpenSettingsModel] = useState<{
		modelName: string,
		providerName: ProviderName,
		type: 'autodetected' | 'custom' | 'default'
	} | null>(null);

	// States for add model functionality
	const [isAddModelOpen, setIsAddModelOpen] = useState(false);
	const [showCheckmark, setShowCheckmark] = useState(false);
	const [userChosenProviderName, setUserChosenProviderName] = useState<ProviderName | null>(null);
	const [userChosenConnectionId, setUserChosenConnectionId] = useState<string | null>(null);
	const [modelName, setModelName] = useState<string>('');
	const [errorString, setErrorString] = useState('');

	// Use either filtered providers or all providers
	const providersToShow = filteredProviders || providerNames;

	// Collapse state: start with all providers collapsed, but auto-expand ones that have custom models
	const [collapsedProviders, setCollapsedProviders] = useState<Set<ProviderName>>(() => {
		const initial = new Set<ProviderName>(providersToShow)
		for (const pn of providersToShow) {
			const hasCustom = settingsState.settingsOfProvider[pn].models.some(m => m.type === 'custom')
			if (hasCustom) initial.delete(pn)
		}
		return initial
	})

	const toggleProvider = (pn: ProviderName) => {
		setCollapsedProviders(prev => {
			const next = new Set(prev)
			if (next.has(pn)) next.delete(pn)
			else next.add(pn)
			return next
		})
	}

	// Group models by provider for collapsible rendering
	const groupedModels = providersToShow.map(providerName => {
		const providerSettings = settingsState.settingsOfProvider[providerName]
		const models = providerSettings.models.map(model => ({
			...model,
			providerName,
			providerEnabled: !!providerSettings._didFillInProviderSettings,
		}))
		return { providerName, models, providerEnabled: !!providerSettings._didFillInProviderSettings }
	})

	// Add model handler
	const handleAddModel = () => {
		if (!userChosenProviderName) {
			setErrorString(t('settings.selectProvider'));
			return;
		}
		if (!modelName) {
			setErrorString(t('settings.enterModelName'));
			return;
		}

		// Check if model already exists
		if (settingsState.settingsOfProvider[userChosenProviderName].models.find(m => m.modelName === modelName)) {
			setErrorString(t('settings.thisModelExists'));
			return;
		}

		settingsStateService.addModel(userChosenProviderName, modelName, userChosenConnectionId || undefined);
		setShowCheckmark(true);
		setTimeout(() => {
			setShowCheckmark(false);
			setIsAddModelOpen(false);
			setUserChosenProviderName(null);
			setUserChosenConnectionId(null);
			setModelName('');
		}, 1500);
		setErrorString('');
	};

	return <div className=''>
		{groupedModels.map(({ providerName, models, providerEnabled }) => {
			const providerTitle = displayInfoOfProviderName(providerName).title
			const isCollapsed = collapsedProviders.has(providerName)
			const connectionName = (connId?: string) => {
				if (!connId || providerName !== 'openAICompatible') return ''
				const conn = (settingsState.settingsOfProvider.openAICompatible as any).connections?.find((c: any) => c.id === connId)
				return conn ? `[${conn.name}] ` : ''
			}

			return <div key={providerName} className="mb-1">
				<div
					className="flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-black/10 dark:hover:bg-gray-300/10 rounded-sm"
					onClick={() => toggleProvider(providerName)}
				>
					{isCollapsed
						? <ChevronRight size={14} className="text-void-fg-3" />
						: <ChevronDown size={14} className="text-void-fg-3" />}
					<span className="text-void-fg-2 text-sm font-medium flex-grow">{providerTitle}</span>
					<span className="text-void-fg-4 text-xs">{models.length}</span>
				</div>

				{!isCollapsed && models.map((m) => {
					const { isHidden, type, modelName, providerEnabled: pEnabled } = m
					const disabled = !pEnabled
					const value = disabled ? false : !isHidden
					const tooltipName = disabled ? t('settings.addTooltip').replace('{0}', providerTitle)
						: value ? t('settings.showInDropdown')
							: t('settings.hideFromDropdown')
					const detailAboutModel = type === 'autodetected'
						? <Asterisk size={14} className="inline-block align-text-top brightness-115 stroke-[2] text-[var(--cortex-brand)]" data-tooltip-id='cortex-tooltip' data-tooltip-place='right' data-tooltip-content={t('settings.detectedLocally')} />
						: type === 'custom'
							? <Asterisk size={14} className="inline-block align-text-top brightness-115 stroke-[2] text-[var(--cortex-brand)]" data-tooltip-id='cortex-tooltip' data-tooltip-place='right' data-tooltip-content={t('settings.customModel')} />
							: undefined
					const hasOverrides = !!settingsState.overridesOfModel?.[providerName]?.[modelName]

					return <div key={`${modelName}${providerName}`}
						className={`flex items-center justify-between gap-4 hover:bg-black/10 dark:hover:bg-gray-300/10 py-1 px-3 pl-8 rounded-sm overflow-hidden cursor-default truncate group`}
					>
						<div className={`flex flex-grow items-center gap-4`}>
							<span className='w-fit max-w-[400px] truncate'>
								{connectionName(m.connectionId)}{modelName}
							</span>
						</div>
						<div className="flex items-center gap-2 w-fit">
							{disabled ? null : (
								<div className="w-5 flex items-center justify-center">
									<button onClick={() => { setOpenSettingsModel({ modelName, providerName, type }) }} data-tooltip-id='cortex-tooltip' data-tooltip-place='right' data-tooltip-content={t('settings.advancedSettings')} className={`${hasOverrides ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
										<Plus size={12} className="text-void-fg-3 opacity-50" />
									</button>
								</div>
							)}
							{detailAboutModel}
							<VoidSwitch value={value} onChange={() => { settingsStateService.toggleModelHidden(providerName, modelName) }} disabled={disabled} size='sm' data-tooltip-id='cortex-tooltip' data-tooltip-place='right' data-tooltip-content={tooltipName} />
							<div className={`w-5 flex items-center justify-center`}>
								{type === 'default' || type === 'autodetected' ? null : <button onClick={() => { settingsStateService.deleteModel(providerName, modelName) }} data-tooltip-id='cortex-tooltip' data-tooltip-place='right' data-tooltip-content={t('settings.delete')} className={`${hasOverrides ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
									<X size={12} className="text-void-fg-3 opacity-50" />
								</button>}
							</div>
						</div>
					</div>
				})}
			</div>
		})}

		{/* Add Model Section */}
		{showCheckmark ? (
			<div className="mt-4">
				<AnimatedCheckmarkButton text={t('settings.added')} className="bg-[var(--cortex-brand)] text-white px-3 py-1 rounded-sm" />
			</div>
		) : isAddModelOpen ? (
			<div className="mt-4">
				<form className="flex items-center gap-2">

					{/* Provider dropdown */}
				<ErrorBoundary>
					<VoidCustomDropdownBox
						options={providersToShow}
						selectedOption={userChosenProviderName}
						onChangeOption={(pn) => setUserChosenProviderName(pn)}
						getOptionDisplayName={(pn) => pn ? displayInfoOfProviderName(pn).title : t('settings.providerName')}
						getOptionDropdownName={(pn) => pn ? displayInfoOfProviderName(pn).title : t('settings.providerName')}
						getOptionsEqual={(a, b) => a === b}
						className="max-w-32 mx-2 w-full resize-none bg-void-bg-1 text-void-fg-1 placeholder:text-void-fg-3 border border-void-border-2 focus:border-void-border-1 py-1 px-2 rounded"
						arrowTouchesText={false}
					/>
				</ErrorBoundary>

				{/* Connection dropdown (only for openAICompatible with connections) */}
				{userChosenProviderName === 'openAICompatible' && ((settingsState.settingsOfProvider.openAICompatible as any).connections || []).length > 0 && (
					<ErrorBoundary>
						<VoidCustomDropdownBox
							options={((settingsState.settingsOfProvider.openAICompatible as any).connections || []).map((c: any) => c.id)}
							selectedOption={userChosenConnectionId}
							onChangeOption={(id: string) => setUserChosenConnectionId(id)}
							getOptionDisplayName={(id: string) => {
								const conn = ((settingsState.settingsOfProvider.openAICompatible as any).connections || []).find((c: any) => c.id === id)
								return conn ? conn.name : ''
							}}
							getOptionDropdownName={(id: string) => {
								const conn = ((settingsState.settingsOfProvider.openAICompatible as any).connections || []).find((c: any) => c.id === id)
								return conn ? conn.name : t('settings.connection')
							}}
							getOptionsEqual={(a: string, b: string) => a === b}
							className="max-w-32 mx-2 w-full resize-none bg-void-bg-1 text-void-fg-1 placeholder:text-void-fg-3 border border-void-border-2 focus:border-void-border-1 py-1 px-2 rounded"
							arrowTouchesText={false}
						/>
					</ErrorBoundary>
				)}

				{/* Model name input */}
					<ErrorBoundary>
						<VoidSimpleInputBox
							value={modelName}
							compact={true}
							onChangeValue={setModelName}
							placeholder={t('settings.modelName')}
							className='max-w-32'
						/>
					</ErrorBoundary>

					{/* Add button */}
					<ErrorBoundary>
						<AddButton
							type='button'
							text={t('common.add')}
							disabled={!modelName || !userChosenProviderName}
							onClick={handleAddModel}
						/>
					</ErrorBoundary>

					{/* X button to cancel */}
				<button
					type="button"
					onClick={() => {
						setIsAddModelOpen(false);
						setErrorString('');
						setModelName('');
						setUserChosenProviderName(null);
						setUserChosenConnectionId(null);
					}}
					className='text-void-fg-4'
				>
					<X className='size-4' />
				</button>
				</form>

				{errorString && (
					<div className='text-red-500 truncate whitespace-nowrap mt-1'>
						{errorString}
					</div>
				)}
			</div>
		) : (
			<div
				className="text-void-fg-4 flex flex-nowrap text-nowrap items-center hover:brightness-110 cursor-pointer mt-4"
				onClick={() => setIsAddModelOpen(true)}
			>
				<div className="flex items-center gap-1">
					<Plus size={16} />
					<span>{t('settings.addAModel')}</span>
				</div>
			</div>
		)}

		{/* Model Settings Dialog */}
		<SimpleModelSettingsDialog
			isOpen={openSettingsModel !== null}
			onClose={() => setOpenSettingsModel(null)}
			modelInfo={openSettingsModel}
		/>
	</div>
}


// OpenAI-Compatible connection manager (CRUD UI for named connections)
const OpenAICompatibleConnectionManager = () => {
	const { t } = useTranslation()
	const accessor = useAccessor()
	const settingsStateService = accessor.get('ICortexideSettingsService')
	const settingsState = useSettingsState()

	const [isAdding, setIsAdding] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [formName, setFormName] = useState('')
	const [formEndpoint, setFormEndpoint] = useState('')
	const [formApiKey, setFormApiKey] = useState('')
	const [formHeaders, setFormHeaders] = useState('{}')

	const connections = (settingsState.settingsOfProvider.openAICompatible as any).connections || []

	const handleSave = () => {
		if (!formName || !formEndpoint) return
		if (editingId) {
			settingsStateService.updateOpenAICompatibleConnection(editingId, formName, formEndpoint, formApiKey, formHeaders)
		} else {
			settingsStateService.addOpenAICompatibleConnection(formName, formEndpoint, formApiKey, formHeaders)
		}
		setIsAdding(false)
		setEditingId(null)
		setFormName(''); setFormEndpoint(''); setFormApiKey(''); setFormHeaders('{}')
	}

	const handleEdit = (conn: any) => {
		setEditingId(conn.id)
		setFormName(conn.name); setFormEndpoint(conn.endpoint); setFormApiKey(conn.apiKey); setFormHeaders(conn.headersJSON)
		setIsAdding(true)
	}

	const handleDelete = (id: string) => {
		settingsStateService.deleteOpenAICompatibleConnection(id)
	}

	return <div className="mt-2 mb-4">
		{connections.map((conn: any) => (
			<div key={conn.id} className="flex items-center justify-between gap-2 py-1 px-3 rounded-sm hover:bg-black/10 dark:hover:bg-gray-300/10">
				<div className="flex flex-col flex-grow">
					<span className="text-void-fg-1 text-sm font-medium">{conn.name}</span>
					<span className="text-void-fg-3 text-xs truncate">{conn.endpoint}</span>
				</div>
				<div className="flex items-center gap-1">
					<button onClick={() => handleEdit(conn)} className="text-void-fg-3 hover:text-void-fg-1 p-1">
						<Settings2 size={12} />
					</button>
					<button onClick={() => handleDelete(conn.id)} className="text-void-fg-3 hover:text-red-500 p-1">
						<X size={12} />
					</button>
				</div>
			</div>
		))}

		{isAdding ? (
			<div className="mt-2 p-3 rounded-sm bg-void-bg-1 border border-void-border-2 flex flex-col gap-2">
				<input value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('settings.connectionName')} className="bg-void-bg-2 text-void-fg-1 border border-void-border-2 rounded px-2 py-1 text-sm w-full" />
				<input value={formEndpoint} onChange={e => setFormEndpoint(e.target.value)} placeholder="https://..." className="bg-void-bg-2 text-void-fg-1 border border-void-border-2 rounded px-2 py-1 text-sm w-full" />
				<input value={formApiKey} onChange={e => setFormApiKey(e.target.value)} placeholder={t('settings.apiKey')} type="password" className="bg-void-bg-2 text-void-fg-1 border border-void-border-2 rounded px-2 py-1 text-sm w-full" />
				<input value={formHeaders} onChange={e => setFormHeaders(e.target.value)} placeholder='{}' className="bg-void-bg-2 text-void-fg-1 border border-void-border-2 rounded px-2 py-1 text-sm w-full" />
				<div className="flex gap-2">
					<button onClick={handleSave} className="bg-[var(--cortex-brand)] text-white px-3 py-1 rounded text-sm">{editingId ? t('settings.save') : t('common.add')}</button>
					<button onClick={() => { setIsAdding(false); setEditingId(null) }} className="text-void-fg-3 px-3 py-1 text-sm">{t('settings.cancel')}</button>
				</div>
			</div>
		) : (
			<div className="text-void-fg-4 flex items-center gap-1 cursor-pointer mt-2" onClick={() => setIsAdding(true)}>
				<Plus size={16} />
				<span className="text-sm">{t('settings.addConnection')}</span>
			</div>
		)}
	</div>
}


// providers

const ProviderSetting = ({ providerName, settingName, subTextMd }: { providerName: ProviderName, settingName: SettingName, subTextMd: React.ReactNode }) => {

	const { t } = useTranslation()
	const { placeholder, isPasswordField } = displayInfoOfSettingName(providerName, settingName)
	const settingTitle = (() => {
		if (settingName === 'apiKey') return t('settings.settingTitle.apiKey')
		if (settingName === 'endpoint') {
			// endpoint title can be 'Endpoint' or 'baseURL' depending on provider
			const rawTitle = displayInfoOfSettingName(providerName, settingName).title
			return rawTitle === 'baseURL' ? t('settings.settingTitle.baseURL') : t('settings.settingTitle.endpoint')
		}
		if (settingName === 'headersJSON') return t('settings.settingTitle.customHeaders')
		if (settingName === 'region') return t('settings.settingTitle.region')
		if (settingName === 'azureApiVersion') return t('settings.settingTitle.apiVersion')
		if (settingName === 'project') {
			// project title can be 'Resource' or 'Project' depending on provider
			const rawTitle = displayInfoOfSettingName(providerName, settingName).title
			return rawTitle === 'Resource' ? t('settings.settingTitle.resource') : t('settings.settingTitle.project')
		}
		return displayInfoOfSettingName(providerName, settingName).title
	})()

	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const settingsState = useSettingsState()

	const settingValue = settingsState.settingsOfProvider[providerName][settingName] as string // this should always be a string in this component
	if (typeof settingValue !== 'string') {
		console.log('Error: Provider setting had a non-string value.')
		return
	}

	// Create a stable callback reference using useCallback with proper dependencies
	const handleChangeValue = useCallback((newVal: string) => {
		cortexideSettingsService.setSettingOfProvider(providerName, settingName, newVal)
	}, [cortexideSettingsService, providerName, settingName]);

	return <ErrorBoundary>
		<div className='my-1'>
			<VoidSimpleInputBox
				value={settingValue}
				onChangeValue={handleChangeValue}
				placeholder={`${settingTitle} (${placeholder})`}
				passwordBlur={isPasswordField}
				compact={true}
			/>
			{!subTextMd ? null : <div className='py-1 px-3 opacity-50 text-sm'>
				{subTextMd}
			</div>}
		</div>
	</ErrorBoundary>
}

// const OldSettingsForProvider = ({ providerName, showProviderTitle }: { providerName: ProviderName, showProviderTitle: boolean }) => {
// 	const voidSettingsState = useSettingsState()

// 	const needsModel = isProviderNameDisabled(providerName, voidSettingsState) === 'addModel'

// 	// const accessor = useAccessor()
// 	// const cortexideSettingsService = accessor.get('ICortexideSettingsService')

// 	// const { enabled } = voidSettingsState.settingsOfProvider[providerName]
// 	const settingNames = customSettingNamesOfProvider(providerName)

// 	const { title: providerTitle } = displayInfoOfProviderName(providerName)

// 	return <div className='my-4'>

// 		<div className='flex items-center w-full gap-4'>
// 			{showProviderTitle && <h3 className='text-xl truncate'>{providerTitle}</h3>}

// 			{/* enable provider switch */}
// 			{/* <VoidSwitch
// 				value={!!enabled}
// 				onChange={
// 					useCallback(() => {
// 						const enabledRef = cortexideSettingsService.state.settingsOfProvider[providerName].enabled
// 						cortexideSettingsService.setSettingOfProvider(providerName, 'enabled', !enabledRef)
// 					}, [cortexideSettingsService, providerName])}
// 				size='sm+'
// 			/> */}
// 		</div>

// 		<div className='px-0'>
// 			{/* settings besides models (e.g. api key) */}
// 			{settingNames.map((settingName, i) => {
// 				return <ProviderSetting key={settingName} providerName={providerName} settingName={settingName} />
// 			})}

// 			{needsModel ?
// 				providerName === 'ollama' ?
// 					<WarningBox text={`Please install an Ollama model. We'll auto-detect it.`} />
// 					: <WarningBox text={`Please add a model for ${providerTitle} (Models section).`} />
// 				: null}
// 		</div>
// 	</div >
// }


export const SettingsForProvider = ({ providerName, showProviderTitle, showProviderSuggestions }: { providerName: ProviderName, showProviderTitle: boolean, showProviderSuggestions: boolean }) => {
	const { t } = useTranslation()
	const voidSettingsState = useSettingsState()

	const needsModel = isProviderNameDisabled(providerName, voidSettingsState) === 'addModel'

	// const accessor = useAccessor()
	// const cortexideSettingsService = accessor.get('ICortexideSettingsService')

	// const { enabled } = voidSettingsState.settingsOfProvider[providerName]
	const settingNames = customSettingNamesOfProvider(providerName)

	const { title: providerTitle } = displayInfoOfProviderName(providerName)

	return <div>

		<div className='flex items-center w-full gap-4'>
			{showProviderTitle && <h3 className='text-xl truncate'>{providerTitle}</h3>}

			{/* enable provider switch */}
			{/* <VoidSwitch
				value={!!enabled}
				onChange={
					useCallback(() => {
						const enabledRef = cortexideSettingsService.state.settingsOfProvider[providerName].enabled
						cortexideSettingsService.setSettingOfProvider(providerName, 'enabled', !enabledRef)
					}, [cortexideSettingsService, providerName])}
				size='sm+'
			/> */}
		</div>

		<div className='px-0'>
			{/* settings besides models (e.g. api key) */}
			{settingNames.filter(sn => sn !== 'connections').map((settingName, i) => {

				return <ProviderSetting
					key={settingName}
					providerName={providerName}
					settingName={settingName}
					subTextMd={i !== settingNames.filter(sn => sn !== 'connections').length - 1 ? null
						: <ChatMarkdownRender string={t(('settings.providerDesc.' + providerName) as TranslationKey)} chatMessageLocation={undefined} />}
				/>
			})}

			{providerName === 'openAICompatible' && <OpenAICompatibleConnectionManager />}

			{showProviderSuggestions && needsModel ?
				providerName === 'ollama' ?
					<WarningBox className="pl-2 mb-4" text={t('settings.installOllamaModel')} />
					: <WarningBox className="pl-2 mb-4" text={t('settings.addModelFor').replace('{0}', providerTitle)} />
				: null}
		</div>
	</div >
}


export const VoidProviderSettings = ({ providerNames }: { providerNames: ProviderName[] }) => {
	return <>
		{providerNames.map(providerName =>
			<SettingsForProvider key={providerName} providerName={providerName} showProviderTitle={true} showProviderSuggestions={true} />
		)}
	</>
}


type TabName = 'models' | 'general'

const LanguageSelector = () => {
	const { t, locale, setLocale, supportedLocales } = useTranslation()
	return <div className='my-2'>
		<select
			className='text-sm bg-void-bg-1 text-void-fg-1 border border-void-border-1 rounded px-2 py-1'
			value={locale}
			onChange={(e) => setLocale(e.target.value as any)}
		>
			{Object.entries(supportedLocales).map(([code, name]) => (
				<option key={code} value={code}>{name}</option>
			))}
		</select>
	</div>
}

export const AutoDetectLocalModelsToggle = () => {
	const { t } = useTranslation()
	const settingName: GlobalSettingName = 'autoRefreshModels'

	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const metricsService = accessor.get('IMetricsService')

	const voidSettingsState = useSettingsState()

	// right now this is just `enabled_autoRefreshModels`
	const enabled = voidSettingsState.globalSettings[settingName]

	return <ButtonLeftTextRightOption
		leftButton={<VoidSwitch
			size='xxs'
			value={enabled}
			onChange={(newVal) => {
				cortexideSettingsService.setGlobalSetting(settingName, newVal)
				metricsService.capture('Click', { action: 'Autorefresh Toggle', settingName, enabled: newVal })
			}}
		/>}
		text={t('settings.autoDetectLocal').replace('{0}', refreshableProviderNames.map(providerName => displayInfoOfProviderName(providerName).title).join(', '))}
	/>


}

export const AIInstructionsBox = () => {
	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const voidSettingsState = useSettingsState()
	const { t } = useTranslation()
	return <VoidInputBox2
		className='min-h-[81px] p-3 rounded-sm'
		initValue={voidSettingsState.globalSettings.aiInstructions}
		placeholder={t('settings.aiInstructionsPlaceholder')}
		multiline
		onChangeText={(newText) => {
			cortexideSettingsService.setGlobalSetting('aiInstructions', newText)
		}}
	/>
}

const ProjectRulesSection = () => {
	const accessor = useAccessor()
	const rules = useRulesState()
	const commandService = accessor.get('ICommandService')
	const fileService = accessor.get('IFileService')
	const workspaceService = accessor.get('IWorkspaceContextService')
	const notificationService = accessor.get('INotificationService')
	const { t } = useTranslation()

	const openRulesDir = useCallback(async () => {
		const folders = workspaceService.getWorkspace().folders
		if (!folders.length) {
			notificationService.warn(t('settings.noWorkspace'))
			return
		}
		const rulesDirUri = folders[0].uri.with({ path: folders[0].uri.path + '/.cortexide/rules' })
		// Reveal in explorer; create the dir first if it doesn't exist
		try { await fileService.createFolder(rulesDirUri) } catch { /* already exists */ }
		commandService.executeCommand('revealInExplorer', rulesDirUri)
	}, [accessor, commandService, fileService, workspaceService, notificationService])

	const createRuleFile = useCallback(async () => {
		const folders = workspaceService.getWorkspace().folders
		if (!folders.length) {
			notificationService.warn(t('settings.noWorkspace'))
			return
		}
		const rulesDirUri = folders[0].uri.with({ path: folders[0].uri.path + '/.cortexide/rules' })
		try { await fileService.createFolder(rulesDirUri) } catch { /* already exists */ }
		const newRuleUri = rulesDirUri.with({ path: rulesDirUri.path + `/rule-${Date.now()}.md` })
		const template = `<!-- scope: **/* -->\n# New Rule\n\nDescribe the rule here.\n`
		await fileService.writeFile(newRuleUri, VSBuffer.fromString(template))
		commandService.executeCommand('vscode.open', newRuleUri)
	}, [accessor, commandService, fileService, workspaceService, notificationService])

	return (
		<div>
			<h2 className='text-3xl mb-2'>{t('rules.title')}</h2>
			<h4 className='text-void-fg-3 mb-4 text-sm'>
				{t('rules.description')}
			</h4>
			<div className='flex gap-2 mb-4'>
				<VoidButtonBgDarken className='px-4 py-1' onClick={openRulesDir}>
					{t('rules.openRulesDir')}
				</VoidButtonBgDarken>
				<VoidButtonBgDarken className='px-4 py-1' onClick={createRuleFile}>
					{t('rules.createRule')}
				</VoidButtonBgDarken>
			</div>
			{rules.length === 0 ? (
				<p className='text-void-fg-3 text-sm'>{t('rules.noRules')}</p>
			) : (
				<div className='flex flex-col gap-2'>
					{rules.map((rule: ProjectRule) => (
						<div
							key={rule.uri.toString()}
							className='p-3 rounded border border-void-border-2 bg-void-bg-2 cursor-pointer hover:bg-void-bg-2-alt transition-colors'
							onClick={() => commandService.executeCommand('vscode.open', rule.uri)}
							title={t('settings.clickToOpen')}
						>
							<div className='flex items-center justify-between'>
								<span className='text-void-fg-1 text-sm font-medium'>{rule.title}</span>
								{rule.scope && (
									<span className='text-void-fg-3 text-xs font-mono bg-void-bg-3 px-1.5 py-0.5 rounded'>{rule.scope}</span>
								)}
							</div>
							{rule.content.trim() && (
								<p className='text-void-fg-3 text-xs mt-1 line-clamp-2'>
									{rule.content.trim().replace(/^#+\s*/m, '').split('\n')[0]}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

const FastApplyMethodDropdown = () => {
	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const { t } = useTranslation()

	const options = useMemo(() => [true, false], [])

	const onChangeOption = useCallback((newVal: boolean) => {
		cortexideSettingsService.setGlobalSetting('enableFastApply', newVal)
	}, [cortexideSettingsService])

	return <VoidCustomDropdownBox
		className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1'
		options={options}
		selectedOption={cortexideSettingsService.state.globalSettings.enableFastApply}
		onChangeOption={onChangeOption}
		getOptionDisplayName={(val) => val ? t('settings.fastApply') : t('settings.slowApply')}
		getOptionDropdownName={(val) => val ? t('settings.fastApply') : t('settings.slowApply')}
		getOptionDropdownDetail={(val) => val ? t('settings.fastApplyDesc') : t('settings.slowApplyDesc')}
		getOptionsEqual={(a, b) => a === b}
	/>

}


export const OllamaSetupInstructions = ({ sayWeAutoDetect }: { sayWeAutoDetect?: boolean }) => {
    const accessor = useAccessor()
    const terminalToolService = accessor.get('ITerminalToolService')
    const nativeHostService = accessor.get('INativeHostService')
    const notificationService = accessor.get('INotificationService')
    const refreshModelService = accessor.get('IRefreshModelService')
    const repoIndexerService = accessor.get('IRepoIndexerService')
    const cortexideSettingsService = accessor.get('ICortexideSettingsService')
    const { t } = useTranslation()

    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
    const [statusText, setStatusText] = useState<string>('')
    const [method, setMethod] = useState<'auto' | 'brew' | 'curl' | 'winget' | 'choco'>('auto')
    const [currentTerminalId, setCurrentTerminalId] = useState<string | null>(null)
    const [terminalOutput, setTerminalOutput] = useState<string>('')
    const [modelTag, setModelTag] = useState<string>('llava') // Default to vision model for better UX
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null)

    // Auto-select sensible default per OS and filter options label hints
    useEffect(() => {
        (async () => {
            try {
                const osProps = await nativeHostService.getOSProperties()
                const osType = (osProps.type + '').toLowerCase()
                if (osType.includes('windows')) setMethod('winget')
                else if (osType.includes('darwin') || osType.includes('mac')) setMethod('brew')
                else setMethod('curl')
            } catch {}
        })()
    }, [nativeHostService])

    const onInstall = useCallback(async () => {
        try {
            const osProps = await nativeHostService.getOSProperties()
            const isWindows = (osProps.type + '').toLowerCase().includes('windows')
            setStatus('running')
            setStatusText(t('settings.startingInstall'))

            // open a visible persistent terminal to show progress
            const persistentTerminalId = await terminalToolService.createPersistentTerminal({ cwd: null })
            setCurrentTerminalId(persistentTerminalId)
            // Best-effort: ensure terminal panel is visible
            try {
                const commandService = accessor.get('ICommandService')
                await commandService.executeCommand('workbench.action.terminal.focus')
            } catch { }
            await terminalToolService.focusPersistentTerminal(persistentTerminalId)

            let installCmd = ''
            if (isWindows) {
                const m = method === 'choco' ? 'choco install ollama -y'
                    : method === 'winget' || method === 'auto' ? 'winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements'
                        : 'winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements'
                installCmd = `powershell -ExecutionPolicy Bypass -Command "${m}; Start-Sleep -Seconds 2; Start-Process -WindowStyle Hidden ollama serve"`
            } else {
                // Deterministic per-OS installers, independent of workspace cwd
                const osName = (osProps.type + '').toLowerCase()
                if (osName.includes('darwin') || osName.includes('mac')) {
                    // macOS: never use Linux curl. Prefer app or Homebrew cask, bootstrap brew if needed.
                    installCmd = 'bash -lc "set -e; \
                      if [ -d /Applications/Ollama.app ]; then \\\n+                        echo [CortexIDE] Found /Applications/Ollama.app; open -a Ollama; \\\n+                      else \\\n+                        if [ -x /opt/homebrew/bin/brew ] || [ -x /usr/local/bin/brew ]; then \\\n+                          eval \"$([ -x /opt/homebrew/bin/brew ] && /opt/homebrew/bin/brew shellenv || /usr/local/bin/brew shellenv)\"; \\\n+                        else \\\n+                          echo [CortexIDE] Bootstrapping Homebrew...; /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"; \\\n+                          eval \"$([ -x /opt/homebrew/bin/brew ] && /opt/homebrew/bin/brew shellenv || /usr/local/bin/brew shellenv)\"; \\\n+                        fi; \\\n+                        echo [CortexIDE] Installing Ollama via Homebrew Cask...; brew install --cask ollama || true; open -a Ollama; \\\n+                      fi; \\\n+                      echo [CortexIDE] Health check...; sleep 2; curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && echo [CortexIDE] Ollama running || echo [CortexIDE] Ollama not reachable yet; \
                    "'
                } else {
                    // Linux: official script only
                    installCmd = 'bash -lc "set -e; echo [CortexIDE] Installing Ollama (Linux); curl -fsSL https://ollama.com/install.sh | sh; (ollama serve >/dev/null 2>&1 &) || true; sleep 2; echo [CortexIDE] Health check; curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && echo [CortexIDE] Ollama running || echo [CortexIDE] Ollama not reachable yet;"'
                }
            }

            setStatusText(t('settings.installerRunning'))
            const { resPromise } = await terminalToolService.runCommand(installCmd, { type: 'persistent', persistentTerminalId })
            resPromise.catch(() => { /* ignore */ })

            // Configure default endpoint and refresh models
            cortexideSettingsService.setSettingOfProvider('ollama', 'endpoint', 'http://127.0.0.1:11434')
            refreshModelService.startRefreshingModels('ollama', { enableProviderOnSuccess: true, doNotFire: false })
            setStatus('running')
            setStatusText(t('settings.installerLaunched'))
            notificationService.info(t('settings.installStarted'))
        } catch (e) {
            notificationService.error(t('settings.installStartFailedNotif'))
            setStatus('error')
            setStatusText(t('settings.installStartFailed'))
        }
    }, [terminalToolService, nativeHostService, notificationService, refreshModelService, cortexideSettingsService, method])

    const onOpenTerminal = useCallback(async () => {
        if (currentTerminalId) {
            await terminalToolService.focusPersistentTerminal(currentTerminalId)
        } else {
            // Fallback: just open/focus terminal panel
            try {
                const commandService = accessor.get('ICommandService')
                await commandService.executeCommand('workbench.action.terminal.focus')
            } catch { }
        }
    }, [currentTerminalId, terminalToolService])

    // Poll terminal output to show embedded, read-only log under the button
    useEffect(() => {
        let tid: any
        const poll = async () => {
            if (!currentTerminalId) return
            try {
                const output = await terminalToolService.readTerminal(currentTerminalId)
                setTerminalOutput(output)
            } catch { }
        }
        if (currentTerminalId) {
            poll()
            tid = setInterval(poll, 1500)
        }
        return () => { if (tid) clearInterval(tid) }
    }, [currentTerminalId, terminalToolService])

    // Lightweight health poller for nicer UX
    useEffect(() => {
        let tid: any
        const ping = async () => {
            try {
                const res = await fetch('http://127.0.0.1:11434/api/tags', { method: 'GET' })
                setIsHealthy(res.ok)
                if (res.ok && status === 'running') {
                    setStatus('done')
                    setStatusText(t('settings.ollamaRunning'))
                }
            } catch {
                setIsHealthy(false)
            }
        }
        if (status === 'running' || status === 'done') {
            ping()
            tid = setInterval(ping, 3000)
        }
        return () => { if (tid) clearInterval(tid) }
    }, [status])

    return <div className='prose-p:my-0 prose-ol:list-decimal prose-p:py-0 prose-ol:my-0 prose-ol:py-0 prose-span:my-0 prose-span:py-0 text-void-fg-3 text-sm list-decimal select-text space-y-3'>
        <div className='flex items-center gap-4 flex-wrap'>
            <ChatMarkdownRender string={t('settings.ollamaSetupRev')} chatMessageLocation={undefined} />
            <select
                className='text-xs bg-void-bg-1 text-void-fg-1 border border-void-border-1 rounded px-1 py-0.5'
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                title={t('settings.installMethod')}
            >
                <option value='auto'>{t('settings.installMethod.auto')}</option>
                <option value='brew'>{t('settings.installMethod.brew')}</option>
                <option value='curl'>{t('settings.installMethod.curl')}</option>
                <option value='winget'>{t('settings.installMethod.winget')}</option>
                <option value='choco'>{t('settings.installMethod.choco')}</option>
            </select>
            <button
                className='px-2 py-1 bg-void-bg-2 text-void-fg-1 border border-void-border-1 rounded hover:brightness-110 disabled:opacity-60'
                onClick={onInstall}
                disabled={status === 'running'}
            >{status === 'running' ? t('settings.installingOllama') : t('settings.installOllamaBtn')}</button>
            {status === 'error' && (
                <button
                    className='px-2 py-1 bg-void-bg-1 text-void-fg-3 border border-void-border-2 rounded hover:brightness-110'
                    onClick={() => { setStatus('idle'); setStatusText(''); setTerminalOutput(''); setIsHealthy(null); }}
                >{t('settings.retry')}</button>
            )}
            {isHealthy !== null && (
                <span className={`text-xs px-2 py-0.5 rounded border ${isHealthy ? 'border-green-500 text-green-500' : 'border-void-border-2 text-void-fg-3'}`}>
                    {isHealthy ? t('settings.healthy') : t('settings.waiting')}
                </span>
            )}
        </div>
        {/* Inline Auto-tune toggle */}
        <div className=' pl-2 mt-3 flex items-center gap-3 flex-wrap'>
            <div className='flex items-center gap-2'>
                <VoidSwitch
                    size='xxs'
                    value={!!cortexideSettingsService.state.globalSettings.enableAutoTuneOnPull}
                    onChange={(v) => cortexideSettingsService.setGlobalSetting('enableAutoTuneOnPull', !!v)}
                />
                <span className='text-void-fg-3 text-xs'>{t('settings.autoTuneAfterPull')}</span>
            </div>
            <div className='flex items-center gap-2 ml-4'>
                <VoidSwitch
                    size='xxs'
                    value={!!cortexideSettingsService.state.globalSettings.enableRepoIndexer}
                    onChange={(v) => cortexideSettingsService.setGlobalSetting('enableRepoIndexer', !!v)}
                />
                <span className='text-void-fg-3 text-xs'>{t('settings.enableRepoIndexer')}</span>
            </div>
        </div>
        {/* Agent: auto-compaction + lifecycle hooks (opt-in) */}
        <div className=' pl-2 mt-3 flex items-center gap-3 flex-wrap'>
            <div className='flex items-center gap-2'>
                <VoidSwitch
                    size='xxs'
                    value={!!cortexideSettingsService.state.globalSettings.enableAutoCompaction}
                    onChange={(v) => cortexideSettingsService.setGlobalSetting('enableAutoCompaction', !!v)}
                />
                <span className='text-void-fg-3 text-xs'>{t('settings.autoCompact')}</span>
                <span className='text-void-fg-4 text-xs' title={t('settings.autoCompactTooltip')}>
                    (i)
                </span>
            </div>
            <div className='flex items-center gap-2 ml-4'>
                <VoidSwitch
                    size='xxs'
                    value={!!cortexideSettingsService.state.globalSettings.enableLifecycleHooks}
                    onChange={(v) => cortexideSettingsService.setGlobalSetting('enableLifecycleHooks', !!v)}
                />
                <span className='text-void-fg-3 text-xs'>{t('settings.lifecycleHooks')}</span>
                <span className='text-void-fg-4 text-xs' title={t('settings.lifecycleHooksTooltip')}>
                    (i)
                </span>
            </div>
        </div>
        {/* Web browsing settings */}
        <div className=' pl-2 mt-3 flex items-center gap-3 flex-wrap'>
            <div className='flex items-center gap-2'>
                <VoidSwitch
                    size='xxs'
                    value={cortexideSettingsService.state.globalSettings.useHeadlessBrowsing !== false}
                    onChange={(v) => cortexideSettingsService.setGlobalSetting('useHeadlessBrowsing', v)}
                />
                <span className='text-void-fg-3 text-xs'>{t('settings.useHeadlessBrowsing')}</span>
                <span className='text-void-fg-4 text-xs' title={t('settings.useHeadlessBrowsingTooltip')}>
                    (i)
                </span>
            </div>
        </div>
        {status !== 'idle' && (
            <div className=' pl-6 text-void-fg-3'>{statusText}</div>
        )}
        {!!terminalOutput && (
            <div className=' pl-6 mt-2'>
                <div className='flex items-center gap-2 mb-1'>
                    <button
                        className='px-2 py-0.5 bg-void-bg-1 text-void-fg-3 border border-void-border-2 rounded hover:brightness-110'
                        onClick={async () => { try { await navigator.clipboard.writeText(terminalOutput) } catch {} }}
                    >{t('settings.copyLog')}</button>
                    <button
                        className='px-2 py-0.5 bg-void-bg-1 text-void-fg-3 border border-void-border-2 rounded hover:brightness-110'
                        onClick={() => setTerminalOutput('')}
                    >{t('settings.clear')}</button>
                </div>
                <div className='border border-void-border-2 bg-void-bg-1 rounded p-2 max-h-48 overflow-auto text-xs whitespace-pre-wrap'>
                    {terminalOutput}
                </div>
            </div>
        )}
        <div className=' pl-6 mt-2 flex items-center gap-2 whitespace-nowrap'>
            <span className='text-void-fg-3 text-xs'>{t('settings.pullModel')}</span>
            <select
                className='text-xs bg-void-bg-1 text-void-fg-1 border border-void-border-1 rounded px-1 py-0.5 shrink-0'
                value={modelTag}
                onChange={(e) => setModelTag(e.target.value)}
            >
                <optgroup label={t('settings.codeModels')}>
                    <option value='llama3.1'>llama3.1</option>
                    <option value='llama3.2'>llama3.2</option>
                    <option value='qwen2.5-coder'>qwen2.5-coder</option>
                    <option value='deepseek-coder'>deepseek-coder</option>
                </optgroup>
                <optgroup label={t('settings.visionModels')}>
                    <option value='llava'>llava {t('settings.vision')}</option>
                    <option value='bakllava'>bakllava {t('settings.vision')}</option>
                    <option value='llava:13b'>llava:13b {t('settings.visionBetterQuality')}</option>
                    <option value='llava:7b'>llava:7b {t('settings.visionFaster')}</option>
                    <option value='bakllava:7b'>bakllava:7b {t('settings.vision')}</option>
                </optgroup>
                <optgroup label={t('settings.generalPurpose')}>
                    <option value='llama3'>llama3</option>
                    <option value='mistral'>mistral</option>
                    <option value='mixtral'>mixtral</option>
                    <option value='qwen'>qwen</option>
                </optgroup>
            </select>
            <button
                className='px-2 py-1 bg-void-bg-2 text-void-fg-1 border border-void-border-1 rounded hover:brightness-110 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={!modelTag || status === 'running'}
                onClick={async () => {
                    if (!modelTag) {
                        notificationService.warn(t('settings.selectModelPull'))
                        return
                    }

                    try {
                        setStatus('running')
                        setStatusText(t('settings.pullInProgress').replace('{0}', modelTag))

                        // Check if current terminal exists, create new one if not
                        let terminalId = currentTerminalId
                        if (!terminalId || !terminalToolService.persistentTerminalExists(terminalId)) {
                            terminalId = await terminalToolService.createPersistentTerminal({ cwd: null })
                            setCurrentTerminalId(terminalId)
                        }
                        await terminalToolService.focusPersistentTerminal(terminalId)

                        const { resPromise } = await terminalToolService.runCommand(`ollama pull ${modelTag}`, { type: 'persistent', persistentTerminalId: terminalId })

                        // Handle command result with proper error reporting
                        resPromise
                            .then(async ({ result, resolveReason }) => {
                                // Check if command completed successfully
                                if (resolveReason.type === 'done') {
                                    // Check exit code - 0 means success
                                    if (resolveReason.exitCode === 0) {
                                        // Also check result text for error indicators (ollama pull may exit with 0 but show errors)
                                        const resultText = result || ''
                                        if (resultText.toLowerCase().includes('error') || resultText.toLowerCase().includes('failed')) {
                                            setStatus('error')
                                            setStatusText(t('settings.pullFailedShort').replace('{0}', modelTag))
                                            notificationService.error(t('settings.modelPullFailed').replace('{0}', modelTag))
                                            return
                                        }

                                        // Success - update status and refresh models
                                        setStatus('done')
                                        setStatusText(t('settings.pullSuccess').replace('{0}', modelTag))
                                        notificationService.info(t('settings.modelPulledSuccess').replace('{0}', modelTag))

                                        // Refresh models after a short delay
                                        setTimeout(() => {
                                            refreshModelService.startRefreshingModels('ollama', { enableProviderOnSuccess: true, doNotFire: false })
                                            // Auto-tune: only if enabled in global settings
                                            try {
                                                if (cortexideSettingsService.state.globalSettings.enableAutoTuneOnPull) {
                                                    const mt = (modelTag || '').toLowerCase()
                                                    const looksFIM = mt.includes('coder') || mt.includes('starcoder') || mt.includes('code')
                                                    cortexideSettingsService.setOverridesOfModel('ollama', modelTag, {
                                                        supportsFIM: looksFIM,
                                                        contextWindow: looksFIM ? 128_000 : 64_000,
                                                        reservedOutputTokenSpace: 8_192,
                                                        supportsSystemMessage: 'system-role'
                                                    } as any)
                                                    if (looksFIM) {
                                                        // Autocomplete defaults to FIM model
                                                        cortexideSettingsService.setGlobalSetting('enableAutocomplete', true)
                                                        cortexideSettingsService.setModelSelectionOfFeature('Autocomplete', { providerName: 'ollama', modelName: modelTag } as any)
                                                        // Apply should use coder model by default
                                                        cortexideSettingsService.setModelSelectionOfFeature('Apply', { providerName: 'ollama', modelName: modelTag } as any)
                                                    } else {
                                                        // Non-coder: prefer for Chat
                                                        cortexideSettingsService.setModelSelectionOfFeature('Chat', { providerName: 'ollama', modelName: modelTag } as any)
                                                    }
                                                }
                                            } catch (e) {
                                                console.error('Auto-tune error:', e)
                                            }
                                            // Lightweight: warm project index placeholder (runs in background)
                                            try {
                                                if (cortexideSettingsService.state.globalSettings.enableRepoIndexer) {
                                                    notificationService.info(t('settings.warmingIndex'))
                                                    repoIndexerService.warmIndex(undefined).then(() => {
                                                        notificationService.info(t('settings.indexWarmed'))
                                                    }).catch(() => { })
                                                }
                                            } catch { }
                                        }, 3000)
                                    } else {
                                        // Non-zero exit code indicates failure
                                        const resultText = result || 'Unknown error'
                                        setStatus('error')
                                        setStatusText(t('settings.pullFailedExit').replace('{0}', modelTag).replace('{1}', String(resolveReason.exitCode)))
                                        notificationService.error(t('settings.modelPullFailed').replace('{0}', modelTag))
                                    }
                                } else if (resolveReason.type === 'timeout') {
                                    // Command timed out (pull can take a while, this is expected for large models)
                                    // Still try to refresh models - the pull might be continuing in background
                                    setStatus('done')
                                    setStatusText(t('settings.pullInProgressLong').replace('{0}', modelTag))
                                    notificationService.info(t('settings.pullStarted').replace('{0}', modelTag))
                                    // Refresh models after a delay - the model might appear when ready
                                    setTimeout(() => {
                                        refreshModelService.startRefreshingModels('ollama', { enableProviderOnSuccess: true, doNotFire: false })
                                    }, 5000)
                                }
                            })
                            .catch((error) => {
                                setStatus('error')
                                const errorMsg = error?.message || String(error) || 'Unknown error'
                                setStatusText(t('settings.pullError').replace('{0}', modelTag).replace('{1}', errorMsg))
                                notificationService.error(t('settings.modelPullFailed').replace('{0}', modelTag))
                                console.error('Pull error:', error)
                            })
                    } catch (error) {
                        setStatus('error')
                        const errorMsg = error?.message || String(error) || 'Unknown error'
                        setStatusText(t('settings.pullStartFailed').replace('{0}', errorMsg))
                        notificationService.error(t('settings.modelPullFailed').replace('{0}', modelTag))
                        console.error('Pull setup error:', error)
                    }
                }}
            >{t('settings.pull')}</button>
            <button
                className='px-2 py-1 bg-red-600/80 text-white border border-red-500/80 rounded hover:brightness-110 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={!modelTag || status === 'running'}
                onClick={async () => {
                    if (!modelTag) {
                        notificationService.warn(t('settings.selectModelDelete'))
                        return
                    }

                    const ok = window.confirm(t('settings.confirmDeleteModel').replace('{0}', modelTag))
                    if (!ok) return

                    try {
                        setStatus('running')
                        setStatusText(t('settings.deleteStarted').replace('{0}', modelTag))

                        // Check if current terminal exists, create new one if not
                        let terminalId = currentTerminalId
                        if (!terminalId || !terminalToolService.persistentTerminalExists(terminalId)) {
                            terminalId = await terminalToolService.createPersistentTerminal({ cwd: null })
                            setCurrentTerminalId(terminalId)
                        }
                        await terminalToolService.focusPersistentTerminal(terminalId)

                        const { resPromise } = await terminalToolService.runCommand(`ollama rm ${modelTag}`, { type: 'persistent', persistentTerminalId: terminalId })

                        // Handle command result with proper error reporting
                        resPromise
                            .then(async ({ result, resolveReason }) => {
                                // Check if command completed successfully
                                if (resolveReason.type === 'done') {
                                    // Check exit code - 0 means success
                                    if (resolveReason.exitCode === 0) {
                                        // Success - update status and refresh models
                                        setStatus('done')
                                        setStatusText(t('settings.deleteSuccess').replace('{0}', modelTag))
                                        notificationService.info(t('settings.modelDeletedSuccess').replace('{0}', modelTag))

                                        // Refresh models after a short delay
                                        setTimeout(() => {
                                            refreshModelService.startRefreshingModels('ollama', { enableProviderOnSuccess: true, doNotFire: false })
                                        }, 2000)
                                    } else {
                                        // Non-zero exit code indicates failure
                                        const resultText = result || 'Unknown error'
                                        setStatus('error')
                                        setStatusText(t('settings.deleteFailedExit').replace('{0}', modelTag).replace('{1}', String(resolveReason.exitCode)))
                                        notificationService.error(t('settings.modelDeleteFailed').replace('{0}', modelTag))
                                    }
                                } else if (resolveReason.type === 'timeout') {
                                    // Command timed out (shouldn't happen for delete, but handle it)
                                    setStatus('error')
                                    setStatusText(t('settings.deleteTimeoutShort').replace('{0}', modelTag))
                                    notificationService.warn(t('settings.deleteTimeout').replace('{0}', modelTag))
                                    // Still try to refresh models in case it did complete
                                    setTimeout(() => {
                                        refreshModelService.startRefreshingModels('ollama', { enableProviderOnSuccess: true, doNotFire: false })
                                    }, 2000)
                                }
                            })
                            .catch((error) => {
                                setStatus('error')
                                const errorMsg = error?.message || String(error) || 'Unknown error'
                                setStatusText(t('settings.deleteError').replace('{0}', modelTag).replace('{1}', errorMsg))
                                notificationService.error(t('settings.modelDeleteFailed').replace('{0}', modelTag))
                                console.error('Delete error:', error)
                            })
                    } catch (error) {
                        setStatus('error')
                        const errorMsg = error?.message || String(error) || 'Unknown error'
                        setStatusText(t('settings.deleteStartFailed').replace('{0}', errorMsg))
                        notificationService.error(t('settings.modelDeleteFailed').replace('{0}', modelTag))
                        console.error('Delete setup error:', error)
                    }
                }}
            >{t('settings.deleteModel')}</button>
        </div>
        <div className=' pl-6'><ChatMarkdownRender string={t('settings.manuallyInstall1')} chatMessageLocation={undefined} /></div>
        <div className=' pl-6'><ChatMarkdownRender string={t('settings.manuallyInstall2')} chatMessageLocation={undefined} /></div>
        {sayWeAutoDetect && <div className=' pl-6'><ChatMarkdownRender string={t('settings.autoDetectModels')} chatMessageLocation={undefined} /></div>}
    </div>
}


const RedoOnboardingButton = ({ className }: { className?: string }) => {
	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const { t } = useTranslation()
	return <div
		className={`text-void-fg-4 flex flex-nowrap text-nowrap items-center hover:brightness-110 cursor-pointer ${className}`}
		onClick={() => { cortexideSettingsService.setGlobalSetting('isOnboardingComplete', false) }}
	>
		{t('settings.seeOnboarding')}
	</div>

}







export const ToolApprovalTypeSwitch = ({ approvalType, size, desc }: { approvalType: ToolApprovalType, size: "xxs" | "xs" | "sm" | "sm+" | "md", desc: string }) => {
	const accessor = useAccessor()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const voidSettingsState = useSettingsState()
	const metricsService = accessor.get('IMetricsService')

	const onToggleAutoApprove = useCallback((approvalType: ToolApprovalType, newValue: boolean) => {
		cortexideSettingsService.setGlobalSetting('autoApprove', {
			...cortexideSettingsService.state.globalSettings.autoApprove,
			[approvalType]: newValue
		})
		metricsService.capture('Tool Auto-Accept Toggle', { enabled: newValue })
	}, [cortexideSettingsService, metricsService])

	return <>
		<VoidSwitch
			size={size}
			value={voidSettingsState.globalSettings.autoApprove[approvalType] ?? false}
			onChange={(newVal) => onToggleAutoApprove(approvalType, newVal)}
		/>
		<span className="text-void-fg-3 text-xs">{desc}</span>
	</>
}



export const OneClickSwitchButton = ({ fromEditor = 'VS Code', className = '' }: { fromEditor?: TransferEditorType, className?: string }) => {
	const { t } = useTranslation()
	const accessor = useAccessor()
	const extensionTransferService = accessor.get('IExtensionTransferService')

	const [transferState, setTransferState] = useState<{ type: 'done', error?: string } | { type: | 'loading' | 'justfinished' }>({ type: 'done' })



	const onClick = async () => {
		if (transferState.type !== 'done') return

		setTransferState({ type: 'loading' })

		const errAcc = await extensionTransferService.transferExtensions(os, fromEditor)

		// Even if some files were missing, consider it a success if no actual errors occurred
		const hadError = !!errAcc
		if (hadError) {
			setTransferState({ type: 'done', error: errAcc })
		}
		else {
			setTransferState({ type: 'justfinished' })
			setTimeout(() => { setTransferState({ type: 'done' }); }, 3000)
		}
	}

	return <>
		<VoidButtonBgDarken className={`max-w-48 p-4 ${className}`} disabled={transferState.type !== 'done'} onClick={onClick}>
			{transferState.type === 'done' ? t('settings.transferFrom').replace('{0}', fromEditor)
				: transferState.type === 'loading' ? <span className='text-nowrap flex flex-nowrap items-center gap-1'>{t('settings.transferring')}<IconLoading state="processing" inline /></span>
					: transferState.type === 'justfinished' ? <AnimatedCheckmarkButton text={t('settings.settingsTransferred')} className='bg-none' />
						: null
			}
		</VoidButtonBgDarken>
		{transferState.type === 'done' && transferState.error ? <WarningBox text={transferState.error} /> : null}
	</>
}


// full settings

// MCP Server component
const MCPServerComponent = ({ name, server }: { name: string, server: MCPServer }) => {
	const accessor = useAccessor();
	const { t } = useTranslation();
	const mcpService = accessor.get('IMCPService');

	const voidSettings = useSettingsState()
	const isOn = voidSettings.mcpUserStateOfName[name]?.isOn

	const removeUniquePrefix = (name: string) => name.split('_').slice(1).join('_')

	return (
		<div className="border border-void-border-2 bg-void-bg-1 py-3 px-4 rounded-sm my-2">
			<div className="flex items-center justify-between">
				{/* Left side - status and name */}
				<div className="flex items-center gap-2">
					{/* Status indicator */}
					<div className={`w-2 h-2 rounded-full
						${server.status === 'success' ? 'bg-green-500'
							: server.status === 'error' ? 'bg-red-500'
								: server.status === 'loading' ? 'bg-yellow-500'
									: server.status === 'offline' ? 'bg-void-fg-3'
										: ''}
					`}></div>

					{/* Server name */}
					<div className="text-sm font-medium text-void-fg-1">{name}</div>
				</div>

				{/* Right side - power toggle switch */}
				<VoidSwitch
					value={isOn ?? false}
					size='xs'
					disabled={server.status === 'error'}
					onChange={() => mcpService.toggleServerIsOn(name, !isOn)}
				/>
			</div>

			{/* Tools section */}
			{isOn && (
				<div className="mt-3">
					<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
						{(server.tools ?? []).length > 0 ? (
							(server.tools ?? []).map((tool: { name: string; description?: string }) => (
								<span
									key={tool.name}
									className="px-2 py-0.5 bg-void-bg-2 text-void-fg-3 rounded-sm text-xs"

									data-tooltip-id='cortex-tooltip'
									data-tooltip-content={tool.description || ''}
									data-tooltip-class-name='void-max-w-[300px]'
								>
									{removeUniquePrefix(tool.name)}
								</span>
							))
						) : (
							<span className="text-xs text-void-fg-3">{t('settings.noToolsAvailable')}</span>
						)}
					</div>
				</div>
			)}

			{/* Command badge */}
			{isOn && server.command && (
				<div className="mt-3">
					<div className="text-xs text-void-fg-3 mb-1">{t('settings.command')}</div>
					<div className="px-2 py-1 bg-void-bg-2 text-xs font-mono overflow-x-auto whitespace-nowrap text-void-fg-2 rounded-sm">
						{server.command}
					</div>
				</div>
			)}

			{/* Error message if present */}
			{server.error && (
				<div className="mt-3">
					<WarningBox text={server.error} />
				</div>
			)}
		</div>
	);
};

// Main component that renders the list of servers
const MCPServersList = () => {
	const mcpServiceState = useMCPServiceState()
	const { t } = useTranslation()

	let content: React.ReactNode
	if (mcpServiceState.error) {
		content = <div className="text-void-fg-3 text-sm mt-2">
			{mcpServiceState.error}
		</div>
	}
	else {
		const entries = Object.entries(mcpServiceState.mcpServerOfName)
		if (entries.length === 0) {
			content = <div className="text-void-fg-3 text-sm mt-2">
				{t('settings.noServersFound')}
			</div>
		}
		else {
			content = entries.map(([name, server]) => (
				<MCPServerComponent key={name} name={name} server={server} />
			))
		}
	}

	return <div className="my-2">{content}</div>
};

export const Settings = () => {
	const isDark = useIsDark()
	const { t } = useTranslation()
	// --- sidebar nav ---
	const [selectedSection, setSelectedSection] =
		useState<Tab>('models');

	const navItems: { tab: Tab; label: string }[] = [
		{ tab: 'models', label: t('settings.models') },
		{ tab: 'localProviders', label: t('settings.localProviders') },
		{ tab: 'providers', label: t('settings.mainProviders') },
		{ tab: 'featureOptions', label: t('settings.featureOptions') },
		{ tab: 'general', label: t('settings.general') },
		{ tab: 'mcp', label: t('settings.mcpShort') },
		{ tab: 'all', label: t('settings.allSettings') },
	];
	const shouldShowTab = (tab: Tab) => selectedSection === 'all' || selectedSection === tab;
	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')
	const environmentService = accessor.get('IEnvironmentService')
	const nativeHostService = accessor.get('INativeHostService')
	const settingsState = useSettingsState()
	const cortexideSettingsService = accessor.get('ICortexideSettingsService')
	const chatThreadsService = accessor.get('IChatThreadService')
	const notificationService = accessor.get('INotificationService')
	const mcpService = accessor.get('IMCPService')
	const storageService = accessor.get('IStorageService')
	const metricsService = accessor.get('IMetricsService')
	const isOptedOut = useIsOptedOut()

	const onDownload = (dataType: 'Chats' | 'Settings') => {
		let dataStr: string
		let downloadName: string
		if (dataType === 'Chats') {
			// Export chat threads
			dataStr = JSON.stringify(chatThreadsService.state, null, 2)
			downloadName = 'void-chats.json'
		}
		else if (dataType === 'Settings') {
			// Export user settings
			dataStr = JSON.stringify(cortexideSettingsService.state, null, 2)
			downloadName = 'void-settings.json'
		}
		else {
			dataStr = ''
			downloadName = ''
		}

		const blob = new Blob([dataStr], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = downloadName
		a.click()
		URL.revokeObjectURL(url)
	}


	// Add file input refs
	const fileInputSettingsRef = useRef<HTMLInputElement>(null)
	const fileInputChatsRef = useRef<HTMLInputElement>(null)

	const [s, ss] = useState(0)

	const handleUpload = (dataType: 'Chats' | 'Settings') => (e: React.ChangeEvent<HTMLInputElement>,) => {
		const files = e.target.files
		if (!files) return;
		const file = files[0]
		if (!file) return

		const reader = new FileReader();
		reader.onload = () => {
			try {
				const json = JSON.parse(reader.result as string);

				if (dataType === 'Chats') {
					chatThreadsService.dangerousSetState(json as any)
				}
				else if (dataType === 'Settings') {
					cortexideSettingsService.dangerousSetState(json as any)
				}

				notificationService.info(t('settings.importedSuccess').replace('{0}', dataType))
			} catch (err) {
				notificationService.notify({ message: t('settings.importFailed').replace('{0}', dataType), source: err + '', severity: Severity.Error, })
			}
		};
		reader.readAsText(file);
		e.target.value = '';

		ss(s => s + 1)
	}


	return (
		<div
			className={`@@void-scope ${isDark ? 'dark' : ''}`}
			style={{
				height: '100%',
				width: '100%',
				overflow: 'auto',
				backgroundColor: 'var(--vscode-editor-background)',
			}}
		>
			<div className="flex flex-col md:flex-row w-full gap-6 max-w-[900px] mx-auto mb-32" style={{ minHeight: '80vh' }}>
				{/* --- SIDEBAR --- */}

				<aside className="md:w-1/4 w-full p-6 shrink-0">
					{/* vertical tab list */}
					<div className="flex flex-col gap-2 mt-12">
						{navItems.map(({ tab, label }) => (
							<button
								key={tab}
								onClick={() => {
									if (tab === 'all') {
										setSelectedSection('all');
										window.scrollTo({ top: 0, behavior: 'smooth' });
									} else {
										setSelectedSection(tab);
									}
								}}
								className={`
          py-2 px-4 rounded-md text-left transition-all duration-200
          ${selectedSection === tab
										? 'bg-[var(--cortex-brand)] text-white font-medium shadow-sm'
										: 'bg-void-bg-2 hover:bg-void-bg-2/80 text-void-fg-1'}
        `}
							>
								{label}
							</button>
						))}
					</div>
				</aside>

				{/* --- MAIN PANE --- */}
				<main className="flex-1 p-6 select-none">



					<div className='max-w-3xl'>

						<h1 className='text-2xl w-full'>{t('settings.title')}</h1>

						<div className='w-full h-[1px] my-2' />

						{/* Models section (formerly FeaturesTab) */}
						<ErrorBoundary>
							<RedoOnboardingButton />
						</ErrorBoundary>

						<div className='w-full h-[1px] my-4' />

						{/* All sections in flex container with gap-12 */}
						<div className='flex flex-col gap-12'>
							{/* Models section (formerly FeaturesTab) */}
							<div className={shouldShowTab('models') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t('settings.models')}</h2>
									<ModelDump />
									<div className='w-full h-[1px] my-4' />
									<AutoDetectLocalModelsToggle />
									<RefreshableModels />
								</ErrorBoundary>
							</div>

							{/* Local Providers section */}
							<div className={shouldShowTab('localProviders') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t('settings.localProviders')}</h2>
							<h3 className={`text-void-fg-3 mb-2`}>{t('settings.localProvidersDesc')}</h3>

									<div className='opacity-80 mb-4'>
										<OllamaSetupInstructions sayWeAutoDetect={true} />
									</div>

									<VoidProviderSettings providerNames={localProviderNames} />
								</ErrorBoundary>
							</div>

							{/* Main Providers section */}
							<div className={shouldShowTab('providers') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t('settings.mainProviders')}</h2>
							<h3 className={`text-void-fg-3 mb-2`}>{t('settings.mainProvidersDesc')}</h3>

									<VoidProviderSettings providerNames={nonlocalProviderNames} />
									<div className='w-full h-[1px] my-4' />
									<RefreshableRemoteCatalogs />
								</ErrorBoundary>
							</div>

							{/* Feature Options section */}
							<div className={shouldShowTab('featureOptions') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className={`text-3xl mb-2`}>{t('settings.featureOptions')}</h2>

									<div className='flex flex-col gap-y-8 my-4'>
										<ErrorBoundary>
											{/* FIM */}
											<div>
												<h4 className={`text-base`}>{t('settings.feature.Autocomplete')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>
													<span>
														{t('settings.autocompleteDesc')}{' '}
													</span>
													<span
														className='hover:brightness-110'
														data-tooltip-id='cortex-tooltip'
														data-tooltip-content={t('settings.recommendOllama')}
														data-tooltip-class-name='void-max-w-[20px]'
													>
														{t('settings.autocompleteHint')}
													</span>
												</div>

												<div className='my-2'>
													{/* Enable Switch */}
													<ErrorBoundary>
														<div className='flex items-center gap-x-2 my-2'>
															<VoidSwitch
																size='xs'
																value={settingsState.globalSettings.enableAutocomplete}
																onChange={(newVal) => cortexideSettingsService.setGlobalSetting('enableAutocomplete', newVal)}
															/>
															<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.enableAutocomplete ? t('settings.enabled') : t('settings.disabled')}</span>
														</div>
													</ErrorBoundary>

													{/* Model Dropdown */}
													<ErrorBoundary>
														<div className={`my-2 ${!settingsState.globalSettings.enableAutocomplete ? 'hidden' : ''}`}>
															<ModelDropdown featureName={'Autocomplete'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
														</div>
													</ErrorBoundary>

												</div>

											</div>
										</ErrorBoundary>

										{/* Apply */}
										<ErrorBoundary>

											<div className='w-full'>
												<h4 className={`text-base`}>{t('settings.feature.Apply')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>{t('settings.applyDesc')}</div>

												<div className='my-2'>
													{/* Sync to Chat Switch */}
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.syncApplyToChat}
															onChange={(newVal) => cortexideSettingsService.setGlobalSetting('syncApplyToChat', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.syncApplyToChat ? t('settings.sameAsChat') : t('settings.differentModel')}</span>
													</div>

													{/* Model Dropdown */}
													<div className={`my-2 ${settingsState.globalSettings.syncApplyToChat ? 'hidden' : ''}`}>
														<ModelDropdown featureName={'Apply'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
													</div>
												</div>


												<div className='my-2'>
													{/* Fast Apply Method Dropdown */}
													<div className='flex items-center gap-x-2 my-2'>
														<FastApplyMethodDropdown />
													</div>
												</div>

											</div>
										</ErrorBoundary>




										{/* Tools Section */}
										<div>
											<h4 className={`text-base`}>{t('settings.tools')}</h4>
										<div className='text-sm text-void-fg-3 mt-1'>{t('settings.toolsDesc')}</div>

											<div className='my-2'>
												{/* Auto Accept Switch */}
												<ErrorBoundary>
													{[...toolApprovalTypes].map((approvalType) => {
														return <div key={approvalType} className="flex items-center gap-x-2 my-2">
															<ToolApprovalTypeSwitch size='xs' approvalType={approvalType} desc={t('settings.autoApprove').replace('{0}', approvalType)} />
														</div>
													})}

												</ErrorBoundary>

												{/* Tool Lint Errors Switch */}
												<ErrorBoundary>

													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.includeToolLintErrors}
															onChange={(newVal) => cortexideSettingsService.setGlobalSetting('includeToolLintErrors', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.includeToolLintErrors ? t('settings.fixLintErrors') : t('settings.fixLintErrors')}</span>
													</div>
												</ErrorBoundary>

												{/* Auto Accept LLM Changes Switch */}
												<ErrorBoundary>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.autoAcceptLLMChanges}
															onChange={(newVal) => cortexideSettingsService.setGlobalSetting('autoAcceptLLMChanges', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{t('settings.autoAcceptLLMChanges')}</span>
													</div>
												</ErrorBoundary>
											</div>
										</div>

										{/* Routing Policy Section */}
										<ErrorBoundary>
											<div>
												<h4 className={`text-base`}>{t('settings.routingPolicy')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>
													{t('settings.routingPolicyDesc')}
												</div>
												<div className='my-2'>
													<select
														className='text-xs bg-void-bg-1 text-void-fg-1 border border-void-border-1 rounded px-1 py-0.5'
														value={settingsState.globalSettings.routingPolicy ?? 'auto-cheapest'}
														onChange={(e) => cortexideSettingsService.setGlobalSetting('routingPolicy', e.target.value as ('auto-cheapest' | 'free-tier' | 'local-only'))}
														title={t('settings.routingPolicy')}
													>
														<option value='auto-cheapest'>{t('settings.routingPolicy.autoCheapest')}</option>
														<option value='free-tier'>{t('settings.routingPolicy.freeTier')}</option>
														<option value='local-only'>{t('settings.routingPolicy.localOnly')}</option>
													</select>
												</div>
											</div>
										</ErrorBoundary>

										{/* YOLO Mode Section */}
										<ErrorBoundary>
											<div>
												<h4 className={`text-base`}>{t('settings.yoloMode')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>
													{t('settings.yoloModeDesc')}
												</div>

												<div className='my-2'>
													{/* Enable YOLO Mode Switch */}
													<ErrorBoundary>
														<div className='flex items-center gap-x-2 my-2'>
															<VoidSwitch
																size='xs'
																value={settingsState.globalSettings.enableYOLOMode ?? false}
																onChange={(newVal) => cortexideSettingsService.setGlobalSetting('enableYOLOMode', newVal)}
															/>
															<span className='text-void-fg-3 text-xs pointer-events-none'>
																{settingsState.globalSettings.enableYOLOMode ? t('settings.enabled') : t('settings.disabled')}
															</span>
														</div>
													</ErrorBoundary>

													{/* Risk Threshold (only show when enabled) */}
													{settingsState.globalSettings.enableYOLOMode && (
														<div className='my-4 space-y-3'>
															<div>
																<label className='text-sm text-void-fg-2 mb-1 block'>
																	{t('settings.yoloRiskThreshold')}: {(settingsState.globalSettings.yoloRiskThreshold ?? 0.2).toFixed(2)}
																</label>
																<div className='text-xs text-void-fg-3 mb-2'>
																	{t('settings.yoloRiskDesc')}
																</div>
																<input
																	type='range'
																	min='0'
																	max='1'
																	step='0.05'
																	value={settingsState.globalSettings.yoloRiskThreshold ?? 0.2}
																	onChange={(e) => cortexideSettingsService.setGlobalSetting('yoloRiskThreshold', parseFloat(e.target.value))}
																	className='w-full'
																/>
															</div>

															<div>
																<label className='text-sm text-void-fg-2 mb-1 block'>
																	{t('settings.yoloConfidenceThreshold')}: {(settingsState.globalSettings.yoloConfidenceThreshold ?? 0.7).toFixed(2)}
																</label>
																<div className='text-xs text-void-fg-3 mb-2'>
																	{t('settings.yoloConfidenceDesc')}
																</div>
																<input
																	type='range'
																	min='0'
																	max='1'
																	step='0.05'
																	value={settingsState.globalSettings.yoloConfidenceThreshold ?? 0.7}
																	onChange={(e) => cortexideSettingsService.setGlobalSetting('yoloConfidenceThreshold', parseFloat(e.target.value))}
																	className='w-full'
																/>
															</div>
														</div>
													)}
												</div>
											</div>
										</ErrorBoundary>



										<div className='w-full'>
											<h4 className={`text-base`}>{t('settings.editor')}</h4>
								<div className='text-sm text-void-fg-3 mt-1'>{t('settings.editorDesc')}</div>

											<div className='my-2'>
												{/* Auto Accept Switch */}
												<ErrorBoundary>
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.showInlineSuggestions}
															onChange={(newVal) => cortexideSettingsService.setGlobalSetting('showInlineSuggestions', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.showInlineSuggestions ? t('settings.showSuggestionsOnSelect') : t('settings.showSuggestionsOnSelect')}</span>
													</div>
												</ErrorBoundary>
											</div>
										</div>

										{/* SCM */}
										<ErrorBoundary>

											<div className='w-full'>
												<h4 className={`text-base`}>{t('settings.feature.SCM')}</h4>
												<div className='text-sm text-void-fg-3 mt-1'>{t('settings.scmDesc')}</div>

												<div className='my-2'>
													{/* Sync to Chat Switch */}
													<div className='flex items-center gap-x-2 my-2'>
														<VoidSwitch
															size='xs'
															value={settingsState.globalSettings.syncSCMToChat}
															onChange={(newVal) => cortexideSettingsService.setGlobalSetting('syncSCMToChat', newVal)}
														/>
														<span className='text-void-fg-3 text-xs pointer-events-none'>{settingsState.globalSettings.syncSCMToChat ? t('settings.sameAsChat') : t('settings.differentModel')}</span>
													</div>

													{/* Model Dropdown */}
													<div className={`my-2 ${settingsState.globalSettings.syncSCMToChat ? 'hidden' : ''}`}>
														<ModelDropdown featureName={'SCM'} className='text-xs text-void-fg-3 bg-void-bg-1 border border-void-border-1 rounded p-0.5 px-1' />
													</div>
												</div>

											</div>
										</ErrorBoundary>
									</div>
								</ErrorBoundary>
							</div>

							{/* General section */}
							<div className={`${shouldShowTab('general') ? `` : 'hidden'} flex flex-col gap-12`}>
								{/* Language selector */}
								<div>
									<h2 className='text-3xl mb-2'>{t('settings.language')}</h2>
									<h4 className='text-void-fg-3 mb-4'>{t('settings.languageDesc')}</h4>
									<LanguageSelector />
								</div>

								{/* One-Click Switch section */}
								<div>
									<ErrorBoundary>
										<h2 className='text-3xl mb-2'>{t('settings.oneClickSwitch')}</h2>
						<h4 className='text-void-fg-3 mb-4'>{t('settings.oneClickSwitchDesc')}</h4>

										<div className='flex flex-col gap-2'>
											<OneClickSwitchButton className='w-48' fromEditor="VS Code" />
											<OneClickSwitchButton className='w-48' fromEditor="Cursor" />
											<OneClickSwitchButton className='w-48' fromEditor="Windsurf" />
										</div>
									</ErrorBoundary>
								</div>

								{/* Import/Export section */}
								<div>
									<h2 className='text-3xl mb-2'>{t('settings.importExport')}</h2>
						<h4 className='text-void-fg-3 mb-4'>{t('settings.importExportDesc')}</h4>
									<div className='flex flex-col gap-8'>
										{/* Settings Subcategory */}
										<div className='flex flex-col gap-2 max-w-48 w-full'>
											<input key={2 * s} ref={fileInputSettingsRef} type='file' accept='.json' className='hidden' onChange={handleUpload('Settings')} />
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => { fileInputSettingsRef.current?.click() }}>
												{t('settings.importSettings')}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => onDownload('Settings')}>
												{t('settings.exportSettings')}
											</VoidButtonBgDarken>
											<ConfirmButton className='px-4 py-1 w-full' onConfirm={() => { cortexideSettingsService.resetState(); }}>
												{t('settings.resetSettings')}
											</ConfirmButton>
										</div>

										{/* Chats Subcategory */}
										<div className='flex flex-col gap-2 max-w-48 w-full'>
											<input key={2 * s + 1} ref={fileInputChatsRef} type='file' accept='.json' className='hidden' onChange={handleUpload('Chats')} />
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => { fileInputChatsRef.current?.click() }}>
												{t('settings.importChats')}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1 w-full' onClick={() => onDownload('Chats')}>
												{t('settings.exportChats')}
											</VoidButtonBgDarken>
											<ConfirmButton className='px-4 py-1 w-full' onConfirm={() => { chatThreadsService.resetState(); }}>
												{t('settings.resetChats')}
											</ConfirmButton>
										</div>
									</div>
								</div>



								{/* Built-in Settings section */}
								<div>
									<h2 className={`text-3xl mb-2`}>{t('settings.builtinSettings')}</h2>
								<h4 className={`text-void-fg-3 mb-4`}>{t('settings.builtinSettingsDesc')}</h4>

									<ErrorBoundary>
										<div className='flex flex-col gap-2 justify-center max-w-48 w-full'>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.openSettings') }}>
												{t('settings.generalSettings')}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.openGlobalKeybindings') }}>
												{t('settings.keyboardSettings')}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { commandService.executeCommand('workbench.action.selectTheme') }}>
												{t('settings.themeSettings')}
											</VoidButtonBgDarken>
											<VoidButtonBgDarken className='px-4 py-1' onClick={() => { nativeHostService.showItemInFolder(environmentService.logsHome.fsPath) }}>
												{t('settings.openLogs')}
											</VoidButtonBgDarken>
										</div>
									</ErrorBoundary>
								</div>


								{/* Metrics section */}
								<div className='max-w-[600px]'>
									<h2 className={`text-3xl mb-2`}>{t('settings.metrics')}</h2>
						<h4 className={`text-void-fg-3 mb-4`}>{t('settings.metricsDesc')}</h4>

									<div className='my-2'>
										{/* Disable All Metrics Switch */}
										<ErrorBoundary>
											<div className='flex items-center gap-x-2 my-2'>
												<VoidSwitch
													size='xs'
													value={isOptedOut}
													onChange={(newVal) => {
														storageService.store(OPT_OUT_KEY, newVal, StorageScope.APPLICATION, StorageTarget.MACHINE)
														metricsService.capture(`Set metrics opt-out to ${newVal}`, {}) // this only fires if it's enabled, so it's fine to have here
													}}
												/>
												<span className='text-void-fg-3 text-xs pointer-events-none'>{t('settings.optOutRestart')}</span>
											</div>
										</ErrorBoundary>
									</div>
								</div>

								{/* AI Instructions section */}
								<div className='max-w-[600px]'>
									<h2 className={`text-3xl mb-2`}>{t('settings.aiInstructions')}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>
										<ChatMarkdownRender inPTag={true} string={`${t('settings.aiInstructionsDesc')}\n${t('settings.aiInstructionsDesc2')}`} chatMessageLocation={undefined} />
									</h4>
									<ErrorBoundary>
										<AIInstructionsBox />
									</ErrorBoundary>
									{/* --- Disable System Message Toggle --- */}
									<div className='my-4'>
										<ErrorBoundary>
											<div className='flex items-center gap-x-2'>
												<VoidSwitch
													size='xs'
													value={!!settingsState.globalSettings.disableSystemMessage}
													onChange={(newValue) => {
														cortexideSettingsService.setGlobalSetting('disableSystemMessage', newValue);
													}}
												/>
												<span className='text-void-fg-3 text-xs pointer-events-none'>
													{t('settings.disableSystemMessage')}
												</span>
											</div>
										</ErrorBoundary>
										<div className='text-void-fg-3 text-xs mt-1'>
								{t('settings.disableSystemMessageDesc')}
										</div>
									</div>
								</div>

							</div>



							{/* Project Rules section */}
							<div className={shouldShowTab('general') ? `max-w-[600px] mt-6` : 'hidden'}>
								<ErrorBoundary>
									<ProjectRulesSection />
								</ErrorBoundary>
							</div>

							{/* MCP section */}
							<div className={shouldShowTab('mcp') ? `` : 'hidden'}>
								<ErrorBoundary>
									<h2 className='text-3xl mb-2'>{t('settings.mcpShort')}</h2>
									<h4 className={`text-void-fg-3 mb-4`}>
										<ChatMarkdownRender inPTag={true} string={t('settings.mcpDesc')} chatMessageLocation={undefined} />
									</h4>
									<div className='my-2 flex flex-wrap gap-2'>
										<VoidButtonBgDarken className='px-4 py-1 max-w-48' onClick={async () => { await mcpService.revealMCPConfigFile() }}>
											{t('settings.addMcpServer')}
										</VoidButtonBgDarken>
										<VoidButtonBgDarken
											className='px-4 py-1 max-w-64'
											onClick={async () => {
												try {
													const result = await mcpService.addRecommendedMCPServer('playwright')
													accessor.get('INotificationService').info(
														result === 'added'
														? t('settings.playwrightAdded')
														: t('settings.playwrightExists')
													)
												} catch (e) {
													accessor.get('INotificationService').error(t('settings.playwrightAddFailed').replace('{0}', String(e)))
												}
											}}
										>
											{t('settings.playwrightButton')}
										</VoidButtonBgDarken>
									</div>

									<ErrorBoundary>
										<MCPServersList />
									</ErrorBoundary>
								</ErrorBoundary>
							</div>





						</div>

					</div>
				</main>
			</div>
		</div>
	);
}
