import type { Settings } from './Settings.types.js';
export type { CrosshairSettings, StaminaSettings, PerfSettings, Settings } from './Settings.types.js';
export { DEFAULT_SETTINGS } from './Settings.config.js';
export declare function loadSettings(): Settings;
export declare function saveSettings(settings: Settings): void;
