import { Plane3D, Vector3D, AbstractMethodError, AbstractionBase, TransformEvent } from '@awayjs/core';

import { BoundingVolumePool } from './BoundingVolumePool';
import { ContainerNodeEvent } from '../events/ContainerNodeEvent';
import { INode } from '../partition/INode';

export class BoundingVolumeBase extends AbstractionBase {
	private _onInvalidateMatrix3DDelegate: (event: TransformEvent) => void;

	protected _strokeFlag: boolean;
	protected _fastFlag: boolean;
	//protected _boundsPrimitive:Sprite;

	public init(targetCoordinateSpace: INode, pool: BoundingVolumePool): void {
		super.init(targetCoordinateSpace, pool);

		const picker = pool.picker;
		this._strokeFlag = pool.strokeFlag;
		this._fastFlag = pool.fastFlag;

		this._onInvalidateMatrix3DDelegate = (event: TransformEvent) => this._onInvalidateMatrix3D(event);

		if (targetCoordinateSpace != picker.node) {
			let targetEntity: INode = picker.node;

			while (targetEntity && targetEntity != targetCoordinateSpace) {
				targetEntity.container.transform.addEventListener(TransformEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
				targetEntity = targetEntity.parent;
			}

			if (!targetEntity) //case when targetCoordinateSpace is not part of the same displaylist ancestry
				targetCoordinateSpace.addEventListener(ContainerNodeEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);

		}
	}

	public _onInvalidateMatrix3D(event: TransformEvent): void {
		this._invalid = true;
	}

	public onClear(): void {
		const targetCoordinateSpace: INode = <INode> this._asset;
		const picker = (<BoundingVolumePool> this._pool).picker;

		if (picker && targetCoordinateSpace != picker.node) {
			let targetEntity: INode = picker.node;

			while (targetEntity && targetEntity != targetCoordinateSpace) {
				targetEntity.container?.transform.removeEventListener(TransformEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
				targetEntity = targetEntity.parent;
			}

			if (!targetEntity) //case when targetCoordinateSpace is not part of the same displaylist ancestry
				targetCoordinateSpace.removeEventListener(ContainerNodeEvent.INVALIDATE_MATRIX3D, this._onInvalidateMatrix3DDelegate);
		}

		super.onClear();
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