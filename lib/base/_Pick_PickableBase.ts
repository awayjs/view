import { AssetEvent, AbstractionBase, Matrix3D, Vector3D, AbstractMethodError, Sphere, Box } from '@awayjs/core';

import { ITraversable } from './ITraversable';
import { PickEntity } from './PickEntity';
import { PickingCollision } from '../pick/PickingCollision';

/**
 * @class RenderableListItem
 */
export class _Pick_PickableBase extends AbstractionBase {

	public get entity(): PickEntity {
		return this._useWeak ? (<WeakRef<PickEntity>> this._pool).deref() : <PickEntity> this._pool;
	}

	/**
	 *
	 * @param renderable
	 * @param sourceEntity
	 * @param surface
	 * @param renderer
	 */
	public init(traversable: ITraversable, entity: PickEntity): void {
		super.init(traversable, entity, true);

		entity.addPickable(this);
	}

	public onClear(event: AssetEvent): void {
		this.entity?.removePickable(this);

		super.onClear(event);
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