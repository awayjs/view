import { EventDispatcher, IAbstractionClass, IAbstractionPool, IAsset, IAssetClass, UUID } from '@awayjs/core';

import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { PartitionBase } from './partition/PartitionBase';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';

/**
 * @class away.pool.PickGroup
 */
export class PickGroup extends EventDispatcher implements IAbstractionPool {
	private static _instance: PickGroup;
	private static _tabPickerPool: TabPickerPool;
	private _raycastPickerPool: RaycastPickerPool;
	private _boundsPickerPool: BoundsPickerPool;
	private _tabPickerPool: TabPickerPool;

	public readonly id: number;

	public static getInstance(): PickGroup {
		return PickGroup._instance || (PickGroup._instance = new PickGroup());
	}

	/**
	 * //TODO
	 *
	 * @param materialClassGL
	 */
	constructor() {
		super();
		this.id = UUID.Next();
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickGroup._tabPickerPool || (PickGroup._tabPickerPool = new TabPickerPool());
	}

	public requestAbstraction(asset: IAsset): IAbstractionClass {
		return PickEntity;
	}

	public getRaycastPicker(partition: PartitionBase): RaycastPicker {
		return partition.getAbstraction<RaycastPicker>(this._raycastPickerPool);
	}

	public getBoundsPicker(partition: PartitionBase): BoundsPicker {
		return partition.getAbstraction<BoundsPicker>(this._boundsPickerPool);
	}

	public getTabPicker(partition: PartitionBase): TabPicker {
		return partition.getAbstraction<TabPicker>(this._tabPickerPool);
	}
}

export class RaycastPickerPool implements IAbstractionPool {
	public readonly pickGroup: PickGroup;

	public readonly id: number;

	constructor(pickGroup: PickGroup) {
		this.id = UUID.Next();
		this.pickGroup = pickGroup;
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstractionClass {
		return RaycastPicker;
	}
}

export class BoundsPickerPool implements IAbstractionPool {
	public readonly pickGroup: PickGroup;

	public readonly id: number;

	constructor(pickGroup: PickGroup) {
		this.id = UUID.Next();
		this.pickGroup = pickGroup;
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstractionClass {
		return BoundsPicker;
	}
}

class TabPickerPool implements IAbstractionPool {

	public readonly id: number;

	constructor() {
		this.id = UUID.Next();
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstractionClass {
		return TabPicker;
	}
}