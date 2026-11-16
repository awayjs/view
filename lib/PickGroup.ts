import { AbstractionBase, AbstractionSet, EventDispatcher, IAbstraction, IAbstractionPool, IAsset, IAssetClass, UUID } from '@awayjs/core';

import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';
import { INode } from './partition/INode';
import { View } from './View';

export class PickPool extends AbstractionBase implements IAbstractionPool {
	private static _tabPickerPool: TabPickerPool;

	private _raycastPickerPool: RaycastPickerPool;
	private _boundsPickerPool: BoundsPickerPool;
	private _tabPickerPool: TabPickerPool;
	private _store: IAbstraction[] = [];

	public readonly abstractions: AbstractionSet;

	public get view(): View {
		return this._useWeak ? (<WeakRef<View>> this._asset).deref() : <View> this._asset;
	}

	public get group(): PickGroup {
		return <PickGroup> this._pool;
	}

	constructor() {
		super();
		this.abstractions = new AbstractionSet(this);
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickPool._tabPickerPool || (PickPool._tabPickerPool = new TabPickerPool());
	}

	public init(view: View, pickGroup: PickGroup) {
		super.init(view, pickGroup, true);
	}

	public requestAbstraction(asset: IAsset): IAbstraction {
		return this._store.length ? this._store.pop() : new PickEntity();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		this._store.push(abstraction);
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

/**
 * @class away.pool.PickGroup
 */
export class PickGroup implements IAbstractionPool {
	private static _store: IAbstraction[] = [];
	private static _instance: PickGroup;

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

	public static getPool(view: View): PickPool {
		const instance = PickGroup._instance || (PickGroup._instance = new PickGroup());

		return instance.abstractions.getAbstraction<PickPool>(view);
	}

	/**
	 * //TODO
	 *
	 * @param materialClassGL
	 */
	constructor() {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
	}

	public requestAbstraction(asset: IAsset): IAbstraction {
		return PickGroup._store.length ? PickGroup._store.pop() : new PickPool();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		PickGroup._store.push(abstraction);
	}
}

export class RaycastPickerPool implements IAbstractionPool {
	private static _store: IAbstraction[] = [];

	public readonly id: number;

	public readonly abstractions: AbstractionSet;

	public readonly pickPool: PickPool;

	constructor(pickPool: PickPool) {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
		this.pickPool = pickPool;
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

	public readonly pickPool: PickPool;

	constructor(pickPool: PickPool) {
		this.id = UUID.Next();
		this.abstractions = new AbstractionSet(this);
		this.pickPool = pickPool;
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