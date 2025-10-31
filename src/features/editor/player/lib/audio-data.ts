import { IAudio, ITrackItem, IVideo } from "@designcombo/types";
import { AudioData, getAudioData, visualizeAudio } from "@remotion/media-utils";
import { isEqual } from "lodash";

interface AudioDataCache {
	data: AudioData;
	lastAccessed: number;
}

export class AudioDataManager {
	private fps = 30;
	private numberOfSamples = 512;
	public dataBars: number[] = [];
	public items: (ITrackItem & (IVideo | IAudio))[] = [];
	private audioDatas: { [key: string]: AudioDataCache } = {};
	private readonly MAX_CACHE_SIZE = 10;
	private frameCache: Map<number, number[]> = new Map();
	private readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutes
	private loadingPromises: Map<string, Promise<void>> = new Map(); // Previne carregamentos duplicados

	public setAudioDataManager(fps: number) {
		this.fps = fps;
	}

	private async loadAudioData(src: string, id: string): Promise<void> {
		// Se já existe um carregamento em andamento para este ID, retorna a promise existente
		if (this.loadingPromises.has(id)) {
			console.log(`⏳ Audio data already loading for ${id}, waiting...`);
			return this.loadingPromises.get(id);
		}

		// Se já tem o dado em cache, não recarrega
		if (this.audioDatas[id]) {
			console.log(`✅ Audio data already cached for ${id}`);
			this.audioDatas[id].lastAccessed = Date.now();
			return;
		}

		const loadingPromise = (async () => {
			try {
				console.log("🔄 Loading audio data for", src);
				const data = await getAudioData(src);
				this.audioDatas[id] = {
					data,
					lastAccessed: Date.now(),
				};
				console.log(`✅ Audio data loaded successfully for ${id}`);
				this.cleanupCache();
			} catch (error) {
				console.error(`❌ Error loading audio data for ${src}:`, error);

				// If it's an EncodingError (no audio track), just ignore it
				if (error instanceof Error && error.name === "EncodingError") {
					console.log(`ℹ️  No audio track found for ${src}, ignoring`);
					return;
				}

				// For other errors, still throw them
				throw error;
			} finally {
				// Remove da lista de carregamentos após concluir
				this.loadingPromises.delete(id);
			}
		})();

		this.loadingPromises.set(id, loadingPromise);
		return loadingPromise;
	}

	private cleanupCache(): void {
		const now = Date.now();
		const entries = Object.entries(this.audioDatas);

		if (entries.length > this.MAX_CACHE_SIZE) {
			const entriesToRemove = entries
				.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
				.slice(0, entries.length - this.MAX_CACHE_SIZE);

			for (const [id] of entriesToRemove) {
				delete this.audioDatas[id];
			}
		}

		// Remove expired cache entries
		for (const [id, cache] of entries) {
			if (now - cache.lastAccessed > this.CACHE_TTL) {
				delete this.audioDatas[id];
			}
		}
	}

	public async setItems(items: (ITrackItem & (IVideo | IAudio))[]) {
		// Previne chamadas desnecessárias se os items não mudaram
		if (isEqual(items, this.items)) {
			console.log('🔵 Items não mudaram, pulando setItems');
			return;
		}

		const newItemIds = items.map((item) => item.id);
		const currentItemIds = this.items.map((item) => item.id);
		const addItemIds = newItemIds.filter((id) => !currentItemIds.includes(id));
		const removeItemIds = currentItemIds.filter(
			(id) => !newItemIds.includes(id),
		);

		console.log(`🔄 setItems - Adding: ${addItemIds.length}, Removing: ${removeItemIds.length}`);

		// Remove items
		for (const id of removeItemIds) {
			this.removeItem(id);
		}

		// Add new items (sem await para não bloquear)
		for (const id of addItemIds) {
			const item = items.find((item) => item.id === id);
			if (item?.details.src) {
				// Fire and forget - não bloqueia
				this.loadAudioData(item.details.src, id).catch((error) => {
					console.error(`Failed to load audio for ${id}:`, error);
				});
			}
		}

		this.items = items;
		this.frameCache.clear(); // Clear frame cache when items change
	}

	public validateUpdateItems(
		validateItems: (ITrackItem & (IVideo | IAudio))[],
	) {
		let updatedCount = 0;
		for (const item of validateItems) {
			for (const audioDataItem of this.items) {
				if (!isEqual(audioDataItem, item) && audioDataItem.id === item.id) {
					this.updateItem(item);
					updatedCount++;
				}
			}
		}
		if (updatedCount > 0) {
			console.log(`🔄 validateUpdateItems - Updated ${updatedCount} items`);
		}
	}

	public removeItem(id: string) {
		delete this.audioDatas[id];
		this.frameCache.clear(); // Clear frame cache when items are removed
	}

	public async updateItem(newItem: ITrackItem & (IVideo | IAudio)) {
		this.items = this.items.map((item) => {
			if (item.id === newItem.id) {
				if (item.details.src !== newItem.details.src) {
					this.loadAudioData(newItem.details.src, item.id).catch(console.error);
				}
				return newItem;
			}
			return item;
		});
		this.frameCache.clear(); // Clear frame cache when items are updated
	}

	private combineValues = (
		length: number,
		sources: Array<number[]>,
	): number[] => {
		return Array.from({ length }).map((_, i) => {
			return sources.reduce((acc, source) => Math.max(acc, source[i]), 0);
		});
	};

	getAudioDataForFrame(frame: number): number[] {
		// Check cache first
		const cachedResult = this.frameCache.get(frame);
		if (cachedResult) {
			return cachedResult;
		}

		const visualizationValues = this.items.map((item, index) => {
			const cache = this.audioDatas[item.id];
			if (!cache) return Array(this.numberOfSamples).fill(0);

			const frameTime =
				frame -
				(this.items[index].display.from * this.fps) / 1000 +
				((this.items[index].trim?.from || 0) * this.fps) / 1000;

			if (
				(this.items[index].display.from * this.fps) / 1000 > frame ||
				(this.items[index].display.to * this.fps) / 1000 < frame
			) {
				return Array(this.numberOfSamples).fill(0);
			}

			const visualizationValues = visualizeAudio({
				audioData: cache.data,
				frame: frameTime,
				fps: this.fps,
				numberOfSamples: this.numberOfSamples,
			});

			// Update last accessed time
			cache.lastAccessed = Date.now();
			return visualizationValues;
		});

		const result = this.combineValues(
			this.numberOfSamples,
			visualizationValues,
		);

		// Cache the result
		this.frameCache.set(frame, result);

		// Limit cache size
		if (this.frameCache.size > 100) {
			const firstKey = this.frameCache.keys().next().value;
			if (firstKey !== undefined) {
				this.frameCache.delete(firstKey);
			}
		}

		return result;
	}
}

export const audioDataManager = new AudioDataManager();
