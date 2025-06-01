import { Plane3D, Vector3D, AbstractMethodError, AbstractionBase, AssetEvent, TransformEvent } from '@awayjs/core';

import { BoundingVolumePool } from './BoundingVolumePool';
import { ContainerNode } from '../partition/ContainerNode';
import { ContainerNodeEvent } from '../events/ContainerNodeEvent';
import { INode } from '../partition/INode';

export class BoundingVolumeBase extends AbstractionBase {
	private _onInvalidateMatrix3DDelegate: (event: TransformEvent) => void;

	protected _targetCoordinateSpace: ContainerNode;
	protected _strokeFlag: boolean;
	protected _fastFlag: boolean;
	//protected _boundsPrimitive:Sprite;
	
	public get pool(): BoundingVolumePool {
		return this._useWeak ? (<WeakRef<BoundingVolumePool>> this._pool).deref() : <BoundingVolumePool> this._pool;
	}

	public init(asset: ContainerNode, pool: BoundingVolumePool): void {
		super.init(asset, pool, true);

		const picker = this.pool.picker;
		this._targetCoordinateSpace = asset;
		this._strokeFlag = pool.strokeFlag;
		this._fastFlag = pool.fastFlag;

		this._onInvalidateMatrix3DDelegate = (event: TransformEvent) => this._onInvalidateMatrix3D(event);

		picker.addBoundingVolume(this);

		if (this._targetCoordinateSpace != picker.node) {
			let targetEntity: INode = picker.node;

			while (targetEntity && targetEntity != this._targetCoordinateSpace) {
				targetEntity.container.transform.addEventListener(TransformEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
				targetEntity = targetEntity.parent;
			}

			if (!targetEntity) //case when targetCoordinateSpace is not part of the same displaylist ancestry
				this._targetCoordinateSpace.addEventListener(ContainerNodeEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);

		}
	}

	public _onInvalidateMatrix3D(event: TransformEvent): void {
		this._invalid = true;
	}

	public onClear(event: AssetEvent): void {
		const picker = this.pool?.picker;

		if (picker) {
			picker.removeBoundingVolume(this);

			if (this._targetCoordinateSpace != picker.node) {
				let targetEntity: INode = picker.node;

				while (targetEntity && targetEntity != this._targetCoordinateSpace) {
					targetEntity.container.transform.removeEventListener(TransformEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
					targetEntity = targetEntity.parent;
				}

				if (!targetEntity) //case when targetCoordinateSpace is not part of the same displaylist ancestry
					this._targetCoordinateSpace.removeEventListener(ContainerNodeEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
			}
		}
		

		this._targetCoordinateSpace = null;

		super.onClear(event);
		//this._boundsPrimitive = null;
	}

	// public get boundsPrimitive():DisplayObject
	// {
	// 	if (this._boundsPrimitive == null) {
	// 		this._boundsPrimitive = this._createBoundsPrimitive();

	// 		this._invalid = true;
	// 	}

	// 	if(this._invalid)
	// 		this._update();

	// 	this._boundsPrimitive.transform.matrix3D = this._boundingEntity.transform.concatenatedMatrix3D;

	// 	return this._boundsPrimitive;
	// }

	public nullify(): void {
		throw new AbstractMethodError();
	}

	public isInFrustum(planes: Array<Plane3D>, numPlanes: number): boolean {
		throw new AbstractMethodError();
	}

	public clone(): BoundingVolumeBase {
		throw new AbstractMethodError();
	}

	public rayIntersection(position: Vector3D, direction: Vector3D, targetNormal: Vector3D): number {
		return -1;
	}

	public classifyToPlane(plane: Plane3D): number {
		throw new AbstractMethodError();
	}

	public _update(): void {
		this._invalid = false;
	}

	// public _createBoundsPrimitive():Sprite
	// {
	// 	throw new AbstractMethodError();
	// }
}