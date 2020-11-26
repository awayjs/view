import { AbstractionBase, EventDispatcher, IAbstractionPool } from '@awayjs/core';

import { IPickingEntity } from './base/IPickingEntity';
import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { PartitionBase } from './partition/PartitionBase';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';

import { View } from './View';

/**
 * @class away.pool.PickGroup
 */
export class PickGroup extends EventDispatcher implements IAbstractionPool {
	private static _instancePool: Object = new Object();
	public static get instancePool(): Object {return PickGroup._instancePool;}

	private static _tabPickerPool: TabPickerPool;
	public readonly view: View;
	private _raycastPickerPool: RaycastPickerPool;
	private _boundsPickerPool: BoundsPickerPool;
	private _tabPickerPool: TabPickerPool;

	public readonly id:number;
	
	/**
	 * //TODO
	 *
	 * @param materialClassGL
	 */
	constructor(view: View) {
		super();
		this.id = AbstractionBase.ID_COUNT++;
		this.view = view;
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickGroup._tabPickerPool || (PickGroup._tabPickerPool = new TabPickerPool());
	}

	public static clearAllInstances(): void {
		for (const key in this._instancePool) {
			(this._instancePool[key] as PickGroup).clearAll();
			delete this._instancePool[key];
		}
	}

	public static getInstance(view: View): PickGroup {
		return this._instancePool[view.id] || (this._instancePool[view.id] = new PickGroup(view));
	}

	public static clearInstance(view: View): void {
		const pickGroup: PickGroup = this._instancePool[view.id];

		if (pickGroup) {
			pickGroup.clearAll();

			delete this._instancePool[view.id];
		}
	}

	/**
	 * Clears the resources used by the PickGroup.
	 */
	public clearAll(): void {

		this._raycastPickerPool.clearAll();
		this._boundsPickerPool.clearAll();
		this._tabPickerPool.clearAll();
	}

	public getRaycastPicker(partition: PartitionBase): RaycastPicker {
		return <RaycastPicker> partition.getAbstraction(this._raycastPickerPool, RaycastPicker);
	}

	public getBoundsPicker(partition: PartitionBase): BoundsPicker {
		return <BoundsPicker> partition.getAbstraction(this._boundsPickerPool, BoundsPicker);
	}

	public getTabPicker(partition: PartitionBase): TabPicker {
		return <TabPicker> partition.getAbstraction(this._tabPickerPool, TabPicker);
	}
}

export class RaycastPickerPool implements IAbstractionPool {
	public readonly pickGroup: PickGroup;

	public readonly id:number;

	constructor(pickGroup: PickGroup) {
		this.id = AbstractionBase.ID_COUNT++;
		this.pickGroup = pickGroup;
	}

	/**
	 * Clears the resources used by the RaycastPickerPool.
	 */
	public clearAll(): void {
	}
}

export class BoundsPickerPool implements IAbstractionPool {
	public readonly pickGroup: PickGroup;

	public readonly id:number;

	constructor(pickGroup: PickGroup) {
		this.id = AbstractionBase.ID_COUNT++;
		this.pickGroup = pickGroup;
	}

	/**
	 * Clears the resources used by the BoundsPickerPool.
	 */
	public clearAll(): void {
	}
}

class TabPickerPool implements IAbstractionPool {

	public readonly id:number;

	constructor() {
		this.id = AbstractionBase.ID_COUNT++;
	}

	/**
	 * Clears the resources used by the TabPickerPool.
	 */
	public clearAll(): void {
	}
}