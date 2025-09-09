import { AbstractionBase, Matrix3D, Vector3D, AbstractMethodError, Sphere, Box } from '@awayjs/core';

import { PickEntity } from './PickEntity';
import { PickingCollision } from '../pick/PickingCollision';
import { IPickable } from './IPickable';

/**
 * @class RenderableListItem
 */
export class _Pick_PickableBase extends AbstractionBase {
	protected _orientedBoxBounds: Box;
	protected _orientedBoxBoundsDirty: boolean = true;
	protected _orientedSphereBounds: Sphere;
	protected _orientedSphereBoundsDirty = true;

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
	public init(pickable: IPickable, entity: PickEntity): void {
		super.init(pickable, entity, true);

		entity.addPickable(this);

		pickable._pickObjects[entity.id] = this;
	}

	public onInvalidate(): void {
		super.onInvalidate();

		this._orientedBoxBoundsDirty = true;
		this._orientedSphereBoundsDirty = true;
	}

	public onClear(): void {
		const entity = this.entity;
		if (entity) {
			entity.removePickable(this);
			delete (<IPickable> this.asset)._pickObjects[entity.id];
		} else {
			delete (<IPickable> this.asset)._pickObjects[this._poolId];
		}

		this._orientedBoxBounds = null;
		this._orientedBoxBoundsDirty = true;
		this._orientedSphereBounds = null;
		this._orientedSphereBoundsDirty = true;

		super.onClear();
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

	public _onInvalidateElements(): void {
		this._orientedBoxBoundsDirty = true;
		this._orientedSphereBoundsDirty = true;
	}
}