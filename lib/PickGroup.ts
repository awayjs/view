import { AbstractionSet, EventDispatcher, IAbstraction, IAbstractionPool, IAsset, IAssetClass, UUID } from '@awayjs/core';

import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';
import { INode } from './partition/INode';

/**
 * @class away.pool.PickGroup
 */
export class PickGroup extends EventDispatcher implements IAbstractionPool {
	private static _store: IAbstraction[] = [];
	private static _instance: PickGroup;
	private static _tabPickerPool: TabPickerPool;

	private _raycastPickerPool: RaycastPickerPool;
	private _boundsPickerPool: BoundsPickerPool;
	private _tabPickerPool: TabPickerPool;

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

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
		this.abstractions = new AbstractionSet(this);
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickGroup._tabPickerPool || (PickGroup._tabPickerPool = new TabPickerPool());
	}

	public requestAbstraction(asset: IAsset): IAbstraction {
		return PickGroup._store.length ? PickGroup._store.pop() : new PickEntity();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		PickGroup._store.push(abstraction);
	}

	public getRaycastPicker(node: INode): RaycastPicker {
		return this._raycastPickerPool.abstractions.getAbstraction<RaycastPicker>(node);
	}

	public getBoundsPicker(node: INode): BoundsPicker {
		return this._boundsPickerPool.abstractions.getAbstraction<BoundsPicker>(node);
	}

	public getTabPicker(node: INode): TabPicker {
		return this._tabPickerPool.abstractions.getAbstraction<TabPicker>(node);
	}
}

export class RaycastPickerPool implements IAbstractionPool {
	private static _store: IAbstraction[] = [];

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

	public readonly pickGroup: PickGroup;

	constructor(pickGroup: PickGroup) {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
		this.pickGroup = pickGroup;
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstraction {
		return RaycastPickerPool._store.length ? RaycastPickerPool._store.pop() : new RaycastPicker();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		RaycastPickerPool._store.push(abstraction);
	}
}

export class BoundsPickerPool implements IAbstractionPool {
	private static _store: IAbstraction[] = [];

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

	public readonly pickGroup: PickGroup;

	constructor(pickGroup: PickGroup) {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
		this.pickGroup = pickGroup;
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstraction {
		return BoundsPickerPool._store.length ? BoundsPickerPool._store.pop() : new BoundsPicker();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		BoundsPickerPool._store.push(abstraction);
	}
}

class TabPickerPool implements IAbstractionPool {
	private static _store: IAbstraction[] = [];

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

	constructor() {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
	}

	public requestAbstraction(assetClass: IAssetClass): IAbstraction {
		return TabPickerPool._store.length ? TabPickerPool._store.pop() : new TabPicker();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		TabPickerPool._store.push(abstraction);
	}
}