import { AssetEvent, AbstractionBase, Matrix3D, Vector3D, AbstractMethodError, Sphere, Box } from '@awayjs/core';

import { ITraversable } from './ITraversable';
import { PickEntity } from './PickEntity';
import { PickGroup } from '../PickGroup';
import { PickingCollision } from '../pick/PickingCollision';

import { View } from '../View';
import { ContainerNode } from '../partition/ContainerNode';

/**
 * @class RenderableListItem
 */
export class _Pick_PickableBase extends AbstractionBase {

	protected _node: ContainerNode;

	/**
	 *
	 * @param renderable
	 * @param sourceEntity
	 * @param surface
	 * @param renderer
	 */
	public init(traversable: ITraversable, pickEntity: PickEntity): void {
		super.init(traversable, pickEntity);

		//store node references
		this._node = pickEntity.node;

		pickEntity.addPickable(this);
	}

	public onClear(event: AssetEvent): void {
		(<PickEntity> this._pool).removePickable(this);

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