import { Matrix3D, PlaneClassification, Plane3D, Sphere, Vector3D } from '@awayjs/core';

import { BoundingVolumeBase } from './BoundingVolumeBase';

export class BoundingSphere extends BoundingVolumeBase {
	private _matrix3D: Matrix3D;
	private _sphere: Sphere;
	private _radius: number = 0;
	private _centerX: number = 0;
	private _centerY: number = 0;
	private _centerZ: number = 0;
	//private _prefab:PrimitiveSpherePrefab;

	public nullify(): void {
		this._centerX = this._centerY = this._centerZ = 0;
		this._radius = 0;
	}

	public isInFrustum(planes: Array<Plane3D>, numPlanes: number): boolean {
		if (this._invalid)
			this._update();

		for (let i: number = 0; i < numPlanes; ++i) {
			const plane: Plane3D = planes[i];
			const flippedExtentX: number = plane.a < 0 ? -this._radius : this._radius;
			const flippedExtentY: number = plane.b < 0 ? -this._radius : this._radius;
			const flippedExtentZ: number = plane.c < 0 ? -this._radius : this._radius;
			const projDist: number = plane.a * (this._centerX + flippedExtentX) + plane.b * (this._centerY + flippedExtentY) + plane.c * (this._centerZ + flippedExtentZ) - plane.d;
			if (projDist < 0) {
				return false;
			}
		}
		return true;
	}

	public rayIntersection(position: Vector3D, direction: Vector3D, targetNormal: Vector3D): number {
		if (this._invalid)
			this._update();

		return this._sphere.rayIntersection(position, direction, targetNormal);
	}

	public getSphere(): Sphere {
		if (this._invalid)
			this._update();

		return this._sphere;
	}

	//@override
	public classifyToPlane(plane: Plane3D): number {
		let a: number = plane.a;
		let b: number = plane.b;
		let c: number = plane.c;
		const dd: number = a * this._centerX + b * this._centerY + c * this._centerZ - plane.d;

		if (a < 0)
			a = -a;

		if (b < 0)
			b = -b;

		if (c < 0)
			c = -c;

		const rr: Number = (a + b + c) * this._radius;

		return dd > rr ? PlaneClassification.FRONT : dd < -rr ? PlaneClassification.BACK : PlaneClassification.INTERSECT;
	}

	public _update(): void {
		super._update();

		let matrix3D: Matrix3D;
		if (this._targetCoordinateSpace) {
			if (this._targetCoordinateSpace == this._picker.node) {
				matrix3D = this._picker.node.container.transform.matrix3D;
			} else {
				matrix3D = this._picker.node.getMatrix3D().clone();

				if (this._targetCoordinateSpace.parent)
					matrix3D.append(this._targetCoordinateSpace.parent.getInverseMatrix3D());
			}
		}

		this._sphere = this._picker._getSphereBoundsInternal(null, matrix3D, this._strokeFlag, this._fastFlag, this._sphere);

		const matrix: Matrix3D = this._picker.node.getMatrix3D();

		const cx: number = this._sphere.x;
		const cy: number = this._sphere.y;
		const cz: number = this._sphere.z;
		const r: number = this._sphere.radius;

		const raw: Float32Array = matrix._rawData;

		const m11: number = raw[0], m12: number = raw[4], m13: number = raw[8], m14: number = raw[12];
		const m21: number = raw[1], m22: number = raw[5], m23: number = raw[9], m24: number = raw[13];
		const m31: number = raw[2], m32: number = raw[6], m33: number = raw[10], m34: number = raw[14];

		this._centerX = cx * m11 + cy * m12 + cz * m13 + m14;
		this._centerY = cx * m21 + cy * m22 + cz * m23 + m24;
		this._centerZ = cx * m31 + cy * m32 + cz * m33 + m34;

		const rx: number = m11 + m12 + m13;
		const ry: number = m21 + m22 + m23;
		const rz: number = m31 + m32 + m33;
		this._radius = r * Math.sqrt((rx * rx + ry * ry + rz * rz) / 3);

		// if (this._prefab) {
		// 	this._prefab.radius = r;
		// 	this._boundsPrimitive.x = cx;
		// 	this._boundsPrimitive.y = cy;
		// 	this._boundsPrimitive.z = cz;
		// 	this._boundsPrimitive.transform.matrix3D = matrix;
		// }
	}

	// public _pCreateBoundsPrimitive():Sprite
	// {
	// 	this._prefab = new PrimitiveSpherePrefab(null, ElementsType.LINE);

	// 	return <Sprite> this._prefab.getNewObject();
	// }
}