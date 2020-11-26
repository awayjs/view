import { AssetEvent, AbstractionBase, Matrix3D, Vector3D, AbstractMethodError, Sphere, Box } from '@awayjs/core';

import { IPartitionEntity } from './IPartitionEntity';
import { ITraversable } from './ITraversable';
import { PickEntity } from './PickEntity';
import { PickGroup } from '../PickGroup';
import { PickingCollision } from '../pick/PickingCollision';

import { View } from '../View';

/**
 * @class RenderableListItem
 */
export class _Pick_PickableBase extends AbstractionBase {
	protected _view: View;
	protected _pickGroup: PickGroup;

	/**
	 *
	 */
	public sourceEntity: IPartitionEntity;

	/**
	 *
	 * @param renderable
	 * @param sourceEntity
	 * @param surface
	 * @param renderer
	 */
	constructor(traversable: ITraversable, pickEntity: PickEntity) {
		super(traversable, pickEntity);

		//store references
		this.sourceEntity = pickEntity.entity;
		this._view = pickEntity.view;
		this._pickGroup = pickEntity.pickGroup;
	}

	public onClear(event: AssetEvent): void {
		if (this._asset) {
			this._asset.removeEventListener(AssetEvent.CLEAR, this._onClearDelegate);
			this._asset.removeEventListener(AssetEvent.INVALIDATE, this._onInvalidateDelegate);
		}

		(<PickEntity> this._pool).clearAbstraction(this._asset);
		this._pool = null;
		this._asset = null;

		//this.sourceEntity = null;
		this._view = null;
	}

	public hitTestPoint(x: number, y: number, z: number): boolean {
		throw new AbstractMethodError();
	}

	public getBoxBounds(matrix3D: Matrix3D = null, strokeFlag: boolean = true, cache: Box = null, target: Box = null): Box {
		return target;
	}

	public getSphereBounds(center: Vector3D, matrix3D: Matrix3D = null, strokeFlag: boolean = true, cache: Sphere = null, target: Sphere = null): Sphere {
		return target;
	}

	public testCollision(collision: PickingCollision, closestFlag: boolean): boolean {
		throw new AbstractMethodError();
	}
}