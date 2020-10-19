import { AbstractionBase, IAbstractionPool, IAsset } from '@awayjs/core';

import { IPickingEntity } from './base/IPickingEntity';
import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { PartitionBase } from './partition/PartitionBase';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';

import { View } from './View';

export class ManagedMap<T> {
	_store: NumberMap<{entity: T, lastUse: number, id: number}> = {};
	_olderId = -1;
	_count = 0;

	/**
	 * @description Minimal ammout for running clean
	 */
	public minSize = 50;
	/**
	 * @description Maximal ammout for running clean
	 */

	public maxSize = 100;

	/**
	 * @description Max alive time of cached element before running clean
	 */
	public maxWaitTime = 5000;
	/**
	 * @description How much drop when clean process is ruuned
	 */
	public dropAmmout = 0.5;

	constructor(public name: string = '') {}

	runClean() {
		if (this._olderId === -1) return;
		if (this._count < this.minSize) return;

		let keys: string[];
		let entry = this._store[this._olderId];
		let needSort = true;

		if (!entry) {
			keys = Object.keys(this._store);
			keys.sort((a, b) =>{
				return this._store[a].lastUse - this._store[b].lastUse;
			});

			entry = this._store[keys[0]];
			needSort = false;
		}

		if (this._count < this.maxSize && performance.now() - entry.lastUse < this.maxWaitTime) {
			return;
		}

		if (needSort) {
			keys = Object.keys(this._store);
			keys.sort((a, b) =>{
				return this._store[a].lastUse - this._store[b].lastUse;
			});
		}

		const end = (keys.length * this.dropAmmout | 0);

		for (let i = 0; i < end; i++) {
			delete this._store[keys[i]];
			this._count--;
		}

		this._olderId = +keys[end] || -1;

		console.debug(`[ManagedMap:${this.name}] Collect items: ${end + 1}`);
	}

	set(key: number, value: T): T {
		const t = performance.now();
		let entry = this._store[key];

		if (!entry) {
			entry = this._store[key] = {
				lastUse: t,
				entity: value,
				id: key
			};

			this._count++;
		}

		entry.lastUse = t;

		if (this._olderId === -1) {
			this._olderId = key;
		}

		this.runClean();

		return value;
	}

	get(key: number): T | null {
		const entry = this._store[key];

		if (!entry) { return null; }

		entry.lastUse = performance.now();

		if (this._olderId === key) {
			this._olderId = -1;
			this.runClean();
		}

		return entry.entity;
	}

	delete(key: number): T | null {
		if (!this._store[key]) return null;

		const value = this._store[key];

		delete this._store[key];
		this._count--;

		if (this._olderId === key) {
			this._olderId = -1;
			this.runClean();
		}

		return value.entity;
	}

	clear(callback: (e: T) => void = null) {
		if (callback) {
			for (const k in this._store) {
				callback(this._store[k].entity);
			}
		}

		this._olderId = -1;
		this._store = {};
		this._count = 0;
	}
}

/**
 * @class away.pool.PickGroup
 */
export class PickGroup implements IAbstractionPool {
	public static MIN_POOL_SIZE = 100;
	public static MAX_POOL_SIZE = 1000;

	private static _instancePool = new ManagedMap<PickGroup>('PickGroup');
	/*public static get instancePool() {
		return PickGroup._instancePool
	};*/

	private static _tabPickerPool: TabPickerPool;
	private _view: View;
	private _entityPool = new ManagedMap<PickEntity>('PickEntity');
	private _raycastPickerPool: RaycastPickerPool;
	private _boundsPickerPool: BoundsPickerPool;
	private _tabPickerPool: TabPickerPool;

	/**
	 * //TODO
	 *
	 * @param materialClassGL
	 */
	constructor(view: View) {
		this._view = view;
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickGroup._tabPickerPool || (PickGroup._tabPickerPool = new TabPickerPool(this));

		this._raycastPickerPool.pool.minSize = PickGroup.MIN_POOL_SIZE;
		this._boundsPickerPool.pool.minSize = PickGroup.MIN_POOL_SIZE;
		this._tabPickerPool.pool.minSize = PickGroup.MIN_POOL_SIZE;
		this._entityPool.minSize = PickGroup.MIN_POOL_SIZE;

		this._raycastPickerPool.pool.maxSize = PickGroup.MAX_POOL_SIZE;
		this._boundsPickerPool.pool.maxSize = PickGroup.MAX_POOL_SIZE;
		this._tabPickerPool.pool.maxSize = PickGroup.MAX_POOL_SIZE;
		this._entityPool.maxSize = PickGroup.MAX_POOL_SIZE;
	}

	public static clearAllInstances(): void {
		this._instancePool.clear((e)=> e && e.clearAll());
	}

	public static getInstance(view: View): PickGroup {
		return this._instancePool.get(view.id) || this._instancePool.set(view.id, new PickGroup(view));
	}

	public static clearInstance(view: View): void {
		const pickGroup: PickGroup = this._instancePool.delete(view.id);

		if (pickGroup) {
			pickGroup.clearAll();
		}
	}

	public getAbstraction(entity: IPickingEntity): PickEntity {
		return this._entityPool.get(entity.id) || this._entityPool.set(entity.id, new PickEntity(this._view, entity, this));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(entity: IPickingEntity): void {
		this._entityPool.delete(entity.id);
	}

	/**
	 * Clears the resources used by the PickGroup.
	 */
	public clearAll(): void {
		//clear all entities associated with this pick group
		this._entityPool.clear((e) => e && e.onClear(null));

		this._raycastPickerPool.clearAll();
		this._boundsPickerPool.clearAll();
		this._tabPickerPool.clearAll();
	}

	public getRaycastPicker(partition: PartitionBase): RaycastPicker {
		return this._raycastPickerPool.getAbstraction(partition);
	}

	public getBoundsPicker(partition: PartitionBase): BoundsPicker {
		return this._boundsPickerPool.getAbstraction(partition);
	}

	public getTabPicker(partition: PartitionBase): TabPicker {
		return this._tabPickerPool.getAbstraction(partition);
	}
}

class GenericPool<T extends AbstractionBase> implements IAbstractionPool {
	pool: ManagedMap<T>;

	constructor(protected _pickGroup: PickGroup, protected _poolCtr: {new(...args): T, name?: string}) {
		//@ts-ignore
		this.pool = new ManagedMap(_poolCtr.name || this.constructor.name);
	}

	protected createEntry(asset: IAsset): T {
		return new this._poolCtr();
	}

	getAbstraction(asset: IAsset): T {
		return this.pool.get(asset.id) || this.pool.set(asset.id, this.createEntry(asset));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(asset: IAsset): void {
		this.pool.delete(asset.id);
	}

	/**
	 * Clears the resources used by the RaycastPickerPool.
	 */
	public clearAll(): void {
		//clear all raycastpickers associated with this pool
		this.pool.clear((e) => e && e.onClear && e.onClear(null));
	}
}

class RaycastPickerPool extends GenericPool<RaycastPicker> {
	constructor(pickGroup: PickGroup) {
		super(pickGroup, RaycastPicker);
	}

	createEntry(asset: PartitionBase) {
		return new RaycastPicker(this._pickGroup, asset, this);
	}

}

class BoundsPickerPool extends GenericPool<BoundsPicker> {
	constructor(pickGroup: PickGroup) {
		super(pickGroup, BoundsPicker);
	}

	createEntry(asset: PartitionBase) {
		return new BoundsPicker(this._pickGroup, asset, this);
	}

}

class TabPickerPool extends GenericPool<TabPicker> {
	constructor(pickGroup: PickGroup) {
		super(pickGroup, TabPicker);
	}

	createEntry(asset: PartitionBase) {
		return new TabPicker(asset, this);
	}

}
