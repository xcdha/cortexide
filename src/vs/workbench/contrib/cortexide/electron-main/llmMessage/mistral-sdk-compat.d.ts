declare module '@mistralai/mistralai/core.js' {
	export class MistralCore {
		constructor(options: { apiKey: string });
	}
}

declare module '@mistralai/mistralai/funcs/fimComplete.js' {
	export function fimComplete(client: unknown, request: unknown): Promise<unknown>;
}
