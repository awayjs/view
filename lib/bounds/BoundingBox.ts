import { Box, Matrix3D, PlaneClassification, Plane3D, Vector3D } from '@awayjs/core';

import { BoundingVolumeBase } from './BoundingVolumeBase';

/**
 * BoundingBox represents a bounding box volume that has its planes aligned to the local coordinate axes of the bounded object.
 * This is useful for most sprites.
 */
export class BoundingBox extends BoundingVolumeBase {
	private _matrix3D: Matrix3D;
	private _box: Box;
	private _x: number = 0;
	private _y: number = 0;
	private _z: number = 0;
	private _width: number = 0;
	private _height: number = 0;
	private _depth: number = 0;
	private _centerX: number = 0;
	private _centerY: number = 0;
	private _centerZ: number = 0;
	private _halfExtentsX: number = 0;
	private _halfExtentsY: number = 0;
	private _halfExtentsZ: number = 0;

	/**
	 * @inheritDoc
	 */
	public nullify(): void {
		this._x = this._y = this._z = 0;
		this._width = this._height = this._depth = 0;
		this._centerX = this._centerY = this._centerZ = 0;
		this._halfExtentsX = this._halfExtentsY = this._halfExtentsZ = 0;
	}

	/**
	 * @inheritDoc
	 */
	public isInFrustum(planes: Array<Plane3D>, numPlanes: number): boolean {
		if (this._invalid)
			this._update();

		if (this._box == null)
			return;

		for (let i: number = 0; i < numPlanes; ++i) {

			const plane: Plane3D = planes[i];
			const a: number = plane.a;
			const b: number = plane.b;
			const c: number = plane.c;
			const flippedExtentX: number = a < 0 ? -this._halfExtentsX : this._halfExtentsX;
			const flippedExtentY: number = b < 0 ? -this._halfExtentsY : this._halfExtentsY;
			const flippedExtentZ: number = c < 0 ? -this._halfExtentsZ : this._halfExtentsZ;
			const projDist: number = a * (this._centerX + flippedExtentX) + b * (this._centerY + flippedExtentY) + c * (this._centerZ + flippedExtentZ) - plane.d;

			if (projDist < 0)
				return false;
		}

		return true;
	}

	public rayIntersection(position: Vector3D, direction: Vector3D, targetNormal: Vector3D): number {
		if (this._invalid)
			this._update();

		if (this._box == null)
			return -1;

		return this._box.rayIntersection(position, direction, targetNormal);
	}

	public getBox(): Box {
		if (this._invalid)
			this._update();

		return this._box;
	}

	public classifyToPlane(plane: Plane3D): number {
		let a: number = plane.a;
		let b: number = plane.b;
		let c: number = plane.c;
		const centerDistance: number = a * this._centerX + b * this._centerY + c * this._centerZ - plane.d;

		if (a < 0)
			a = -a;

		if (b < 0)
			b = -b;

		if (c < 0)
			c = -c;

		const boundOffset: number = a * this._halfExtentsX + b * this._halfExtentsY + c * this._halfExtentsZ;

		return centerDistance > boundOffset ? PlaneClassification.FRONT : centerDistance < -boundOffset ? PlaneClassification.BACK : PlaneClassification.INTERSECT;
	}

	public _update(): void {
		super._update();

		let matrix3D: Matrix3D;
		if (this._targetCoordinateSpace != this._picker.entity) {
			if (this._targetCoordinateSpace == this._picker.entity.parent) {
				matrix3D = this._picker.entity.entity.transform.matrix3D;
			} else {
				matrix3D = this._picker.entity.getMatrix3D().clone();

				matrix3D.append(this._targetCoordinateSpace.getInverseMatrix3D());
			}
		}

		this._box = this._picker._getBoxBoundsInternal(matrix3D, this._strokeFlag, this._fastFlag, this._box);

		if (this._box == null)
			return;

		this._halfExtentsX = this._box.width / 2;
		this._halfExtentsY = this._box.height / 2;
		this._halfExtentsZ = this._box.depth / 2;
		this._centerX = this._box.x + this._halfExtentsX;
		this._centerY = this._box.y + this._halfExtentsY;
		this._centerZ = this._box.z + this._halfExtentsZ;
	}

	// public _createBoundsPrimitive():Sprite
	// {
	// 	this._prefab = new PrimitiveCubePrefab(null, ElementsType.LINE);

	// 	return <Sprite> this._prefab.getNewObject();
	// }
}