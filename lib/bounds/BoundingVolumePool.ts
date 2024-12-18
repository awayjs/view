import { IAbstractionPool, IAbstractionClass, IAsset, UUID, IAbstraction } from '@awayjs/core';

import { BoundingVolumeType } from './BoundingVolumeType';
import { BoundingBox } from './BoundingBox';
import { BoundingSphere } from './BoundingSphere';
import { NullBounds } from './NullBounds';
import { IBoundsPicker } from '../pick/IBoundsPicker';

export class BoundingVolumePool implements IAbstractionPool {
	private static _boundingBoxStore: IAbstraction[] = [];
	private static _boundingSphereStore: IAbstraction[] = [];
	private static _nullStore: IAbstraction[] = [];
	private static _storeDict: Object = {
		[BoundingVolumeType.BOX] : BoundingVolumePool._boundingBoxStore,
		[BoundingVolumeType.BOX_FAST] : BoundingVolumePool._boundingBoxStore,
		[BoundingVolumeType.BOX_BOUNDS] : BoundingVolumePool._boundingBoxStore,
		[BoundingVolumeType.BOX_BOUNDS_FAST] : BoundingVolumePool._boundingBoxStore,
		[BoundingVolumeType.SPHERE] : BoundingVolumePool._boundingSphereStore,
		[BoundingVolumeType.SPHERE_FAST] : BoundingVolumePool._boundingSphereStore,
		[BoundingVolumeType.SPHERE_BOUNDS] : BoundingVolumePool._boundingSphereStore,
		[BoundingVolumeType.SPHERE_BOUNDS_FAST] : BoundingVolumePool._boundingSphereStore,
		[BoundingVolumeType.NULL] : BoundingVolumePool._nullStore
	}
	private static _strokeDict: Object = {
		[BoundingVolumeType.BOX] : false,
		[BoundingVolumeType.BOX_FAST] : false,
		[BoundingVolumeType.BOX_BOUNDS] : true,
		[BoundingVolumeType.BOX_BOUNDS_FAST] : true,
		[BoundingVolumeType.SPHERE] : false,
		[BoundingVolumeType.SPHERE_FAST] : false,
		[BoundingVolumeType.SPHERE_BOUNDS] : true,
		[BoundingVolumeType.SPHERE_BOUNDS_FAST] : true,
		[BoundingVolumeType.NULL] : false
	}

	private static _fastDict: Object = {
		[BoundingVolumeType.BOX] : false,
		[BoundingVolumeType.BOX_FAST] : true,
		[BoundingVolumeType.BOX_BOUNDS] : false,
		[BoundingVolumeType.BOX_BOUNDS_FAST] : true,
		[BoundingVolumeType.SPHERE] : false,
		[BoundingVolumeType.SPHERE_FAST] : true,
		[BoundingVolumeType.SPHERE_BOUNDS] : false,
		[BoundingVolumeType.SPHERE_BOUNDS_FAST] : true,
		[BoundingVolumeType.NULL] : false
	}

	private static _boundsDict: Object = {
		[BoundingVolumeType.BOX] : BoundingBox,
		[BoundingVolumeType.BOX_FAST] : BoundingBox,
		[BoundingVolumeType.BOX_BOUNDS] : BoundingBox,
		[BoundingVolumeType.BOX_BOUNDS_FAST] : BoundingBox,
		[BoundingVolumeType.SPHERE] : BoundingSphere,
		[BoundingVolumeType.SPHERE_FAST] : BoundingSphere,
		[BoundingVolumeType.SPHERE_BOUNDS] : BoundingSphere,
		[BoundingVolumeType.SPHERE_BOUNDS_FAST] : BoundingSphere,
		[BoundingVolumeType.NULL] : NullBounds
	}

	private readonly _boundingVolumeClass: IAbstractionClass;
	private readonly _store: IAbstraction[];

	public readonly picker: IBoundsPicker;

	public readonly strokeFlag: boolean;

	public readonly fastFlag: boolean;

	public readonly id: number;

	constructor(picker: IBoundsPicker, boundingVolumeType: BoundingVolumeType) {
		this.id = UUID.Next();
		this.picker = picker;
		this.strokeFlag = BoundingVolumePool._strokeDict[boundingVolumeType];
		this.fastFlag = BoundingVolumePool._fastDict[boundingVolumeType];
		this._boundingVolumeClass = BoundingVolumePool._boundsDict[boundingVolumeType];
		this._store = BoundingVolumePool._storeDict[boundingVolumeType];

	}

	public requestAbstraction(asset: IAsset): IAbstraction {
		return this._store.length ? this._store.pop() : new this._boundingVolumeClass();
	}

	public storeAbstraction(abstraction: IAbstraction): void {
		this._store.push(abstraction);
	}

	public dispose(): void {

	}
}