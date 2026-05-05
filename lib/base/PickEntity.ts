import {
	IAssetClass,
	IAbstractionPool,
	Matrix3D,
	Box,
	Vector3D,
	Sphere,
	AbstractionBase,
	Point,
	Plane3D,
	AbstractionSet
} from '@awayjs/core';

import { PickGroup } from '../PickGroup';
import { _Pick_PickableBase } from './_Pick_PickableBase';
import { _IPick_PickableClass } from './_IPick_PickableClass';
import { PickingCollision } from '../pick/PickingCollision';
import { IEntityTraverser } from './IEntityTraverser';
import { BoundingVolumePool } from '../bounds/BoundingVolumePool';
import { BoundingVolumeBase } from '../bounds/BoundingVolumeBase';
import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { IBoundsPicker } from '../pick/IBoundsPicker';

import { ContainerNode } from '../partition/ContainerNode';
import { INode } from '../partition/INode';
import { IPickable } from './IPickable';

/**
 * @class away.pool.PickEntity
 */
export class PickEntity extends AbstractionBase implements IAbstractionPool, IEntityTraverser, IBoundsPicker {
	private static _store: Record<string,  _Pick_PickableBase[]> = {};

	public static MINIMAL_SCALE = 0.00001;

	private _boundingVolumePools: Record<string, BoundingVolumePool>;

	private _pickingCollision: PickingCollision;

	private _orientedBoxBounds: Box[] = [];
	private _orientedBoxBoundsDirty: boolean[] = [true, true];
	private _orientedSphereBounds: Sphere[] = [];
	private _orientedSphereBoundsDirty: boolean[] = [true, true];

	private static _pickPickableClassPool: Record<string,  _IPick_PickableClass> = {};

	private _activePickables: _Pick_PickableBase[] = [];

	public readonly abstractions: AbstractionSet;

	public get pickingCollision(): PickingCollision {
		return this._pickingCollision;
	}

	/**
	 *
	 */
	public get node(): ContainerNode {
		return <ContainerNode> this._asset;
	}

	/**
	 *
	 */
	public get pickGroup(): PickGroup {
		return (<PickGroup> this._pool);
	}

	public shapeFlag: boolean = false;

	constructor() {
		super();

		this.abstractions = new AbstractionSet(this);
	}

	/**
	 * //TODO
	 */
	public init(node: INode, pickGroup: PickGroup) {
		super.init(node, pickGroup);

		this._pickingCollision = new PickingCollision(this.node, this.pickGroup);

		this._boundingVolumePools = {};
	}

	public getBoundingVolume(target: INode = null, type: BoundingVolumeType = null): BoundingVolumeBase {
		if (target == null)
			target = <INode> this._asset;

		if (type == null)
			type = (<INode> this._asset).container.defaultBoundingVolume;

		const pool: BoundingVolumePool = this._boundingVolumePools[type]
									|| (this._boundingVolumePools[type] = new BoundingVolumePool(this, type));

		return pool.abstractions.getAbstraction<BoundingVolumeBase>(target);
	}

	/**
	 * Evaluates the display object to see if it overlaps or intersects with the
	 * point specified by the <code>x</code> and <code>y</code> parameters. The
	 * <code>x</code> and <code>y</code> parameters specify a point in the
	 * coordinate space of the Scene, not the display object container that
	 * contains the display object(unless that display object container is the
	 * Scene).
	 *
	 * @param x         The <i>x</i> coordinate to test against this object.
	 * @param y         The <i>y</i> coordinate to test against this object.
	 * @param shapeFlag Whether to check against the actual pixels of the object
	 *                  (<code>true</code>) or the bounding box
	 *                  (<code>false</code>).
	 * @param maskFlag  Whether to check against the object when it is used as
	 *                  mask (<code>false</code>).
	 * @return <code>true</code> if the display object overlaps or intersects
	 *         with the specified point; <code>false</code> otherwise.
	 */
	public hitTestPoint(x: number, y: number, shapeFlag: boolean = false): boolean {
		return this._hitTestPointInternal(<ContainerNode> this._asset, x, y, shapeFlag, false);
	}

	public _hitTestPointInternal(
		rootEntity: ContainerNode,
		x: number, y: number,
		shapeFlag: boolean = false, maskFlag: boolean = false): boolean
	// eslint-disable-next-line brace-style
	{
		const node: ContainerNode = (<ContainerNode> this._asset);

		if (node.getMaskId() != -1 && (!maskFlag || !shapeFlag))//allow masks for bounds hit tests
			return false;

		if (this._invalid)
			this._update();

		//set local tempPoint for later reference
		const tempPoint: Point = new Point(x,y);
		node.globalToLocal(tempPoint, tempPoint);

		//early out for box test
		const box: Box = this._getBoxBoundsInternal(null, false, true);

		if (box == null || !box.contains(tempPoint.x, tempPoint.y, 0))
			return false;

		//early out for non-shape tests
		if (!shapeFlag
			|| node.container.assetType == '[asset TextField]'
			|| node.container.assetType == '[asset Billboard]')
			return true;

		let shapeHit: boolean = false;

		for (let i = this._activePickables.length - 1; i >= 0; i--) {
			if (this._activePickables[i].hitTestPoint(tempPoint.x, tempPoint.y, 0)) {
				shapeHit = true;
				break;
			}
		}

		if (!shapeHit)
			return false;

		//do the mask thang
		const maskOwners: ContainerNode[] = node.getMaskOwners();
		if (maskOwners) {
			const numOwners: number = maskOwners.length;
			let node: ContainerNode;
			let masks: ContainerNode[];
			let numMasks: number;
			let maskHit: boolean;

			for (let i = 0; i < numOwners; i++) {
				node = maskOwners[i];
				if (!node.isDescendant(rootEntity))
					continue;

				masks = node.getMasks();
				numMasks = masks.length;
				maskHit = false;
				for (let j: number = 0; j < numMasks; j++) {
					node = masks[j];
					if (!node.isDescendant(rootEntity))
						continue;

					if (this.pickGroup
						.getBoundsPicker(node)
						._hitTestPointInternal(rootEntity, x, y, shapeFlag, true)
					) {
						maskHit = true;
						break;
					}
				}

				if (!maskHit)
					return false;
			}
		}

		return true;
	}

	public isInFrustum(planes: Array<Plane3D>, numPlanes: number): boolean {
		return this._isInFrustumInternal(<ContainerNode> this._asset, planes, numPlanes);
	}

	public _isInFrustumInternal(rooNode: ContainerNode, planes: Array<Plane3D>, numPlanes: number): boolean {
		return this.getBoundingVolume(rooNode).isInFrustum(planes, numPlanes);
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {
		return this._isIntersectingRayInternal(<ContainerNode> this._asset, globalRayPosition, globalRayDirection);
	}

	/**
	 * @inheritDoc
	 */
	public _isIntersectingRayInternal(
		rootEntity: INode, globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {

		const invMatrix: Matrix3D = (<ContainerNode> this._asset).getInverseMatrix3D();
		invMatrix.transformVector(globalRayPosition, this._pickingCollision.rayPosition);
		invMatrix.deltaTransformVector(globalRayDirection, this._pickingCollision.rayDirection);

		//early out for bounds test
		const boundVolume = this.getBoundingVolume();
		const rayEntryDistance = boundVolume.rayIntersection(
			this._pickingCollision.rayPosition,
			this._pickingCollision.rayDirection,
			this._pickingCollision.normal);

		//check masks
		if (rayEntryDistance < 0 || !this._isIntersectingMasks(rootEntity, globalRayPosition, globalRayDirection))
			return false;

		this._pickingCollision.rayEntryDistance = rayEntryDistance;
		this._pickingCollision.globalRayPosition = globalRayPosition;
		this._pickingCollision.globalRayDirection = globalRayDirection;
		this._pickingCollision.rayOriginIsInsideBounds = rayEntryDistance == 0;

		return true;
	}

	public isIntersectingShape(findClosestCollision: boolean): boolean {
		let shapeHit: boolean = false;
		for (let i: number = this._activePickables.length - 1; i >= 0; i--) {
			if (this._activePickables[i].testCollision(this._pickingCollision, findClosestCollision)) {
				if (!findClosestCollision)
					return true;
				else
					shapeHit = true;
			}
		}

		return shapeHit;
	}

	public _getBoxBoundsInternal(
		invTargetMatrix: Matrix3D = null,
		strokeFlag: boolean = true,
		fastFlag: boolean = true,
		cache: Box = null,
		target: Box = null): Box
	// eslint-disable-next-line brace-style
	{
		if (this._invalid)
			this._update();

		const numPickables: number = this._activePickables.length;

		if (numPickables) {

			let matrix3D;

			if (invTargetMatrix) { // a null invTargetMatrix means local coords to the node so matrix3D is identity
				matrix3D = (<ContainerNode> this._asset).getMatrix3D().clone();
				matrix3D.append(invTargetMatrix);
			}

			if (fastFlag) {
				let obb: Box;
				const strokeIndex: number = strokeFlag ? 1 : 0;

				if (this._orientedBoxBoundsDirty[strokeIndex]) {
					this._orientedBoxBoundsDirty[strokeIndex] = false;

					for (let i = 0; i < numPickables; i++) {
						obb = this._activePickables[i].getBoxBounds(
							null, strokeFlag, this._orientedBoxBounds[strokeIndex], obb);
					}

					this._orientedBoxBounds[strokeIndex] = obb;
				} else {
					obb = this._orientedBoxBounds[strokeIndex];
				}

				if (obb != null) {
					target = (matrix3D)
						? matrix3D.transformBox(obb).union(target, target || cache)
						: obb.union(target, target || cache);
				}
			} else {
				for (let i = 0; i < numPickables; i++)
					target = this._activePickables[i].getBoxBounds(matrix3D, strokeFlag, cache, target);
			}
		}

		return target;
	}

	public _getSphereBoundsInternal(
		center: Vector3D = null,
		matrix3D: Matrix3D = null,
		strokeFlag: boolean = true,
		fastFlag: boolean = true,
		cache: Sphere = null,
		target: Sphere = null): Sphere
	// eslint-disable-next-line brace-style
	{
		if (this._invalid)
			this._update();

		const box: Box = this._getBoxBoundsInternal(matrix3D, strokeFlag);

		if (box == null)
			return;

		if (!center) {
			center = new Vector3D();
			center.x = box.x + box.width / 2;
			center.y = box.y + box.height / 2;
			center.z = box.z + box.depth / 2;
		}

		const numPickables: number = this._activePickables.length;

		if (numPickables) {
			if (fastFlag) {
				let osb: Sphere;
				const strokeIndex: number = strokeFlag ? 1 : 0;

				if (this._orientedSphereBoundsDirty[strokeIndex]) {
					this._orientedSphereBoundsDirty[strokeIndex] = false;

					for (let i = 0; i < numPickables; i++) {
						osb = this._activePickables[i].getSphereBounds(
							center, null, strokeFlag, this._orientedSphereBounds[strokeIndex], osb);
					}

					this._orientedSphereBounds[strokeIndex] = osb;
				} else {
					osb = this._orientedSphereBounds[strokeIndex];
				}

				if (osb != null) {
					target = (matrix3D)
						? matrix3D.transformSphere(osb).union(target, target || cache)
						: osb.union(target, target || cache);
				}
			} else {
				for (let i = 0; i < numPickables; i++)
					target = this._activePickables[i].getSphereBounds(center, matrix3D, strokeFlag, cache, target);
			}
		}

		return target;
	}

	public applyTraversable(pickable: IPickable): void {
		//is the pickable a mask?
		this._activePickables.push(this.abstractions.getAbstraction(pickable));
	}

	public onInvalidate(): void {
		super.onInvalidate();

		this._activePickables = [];
		this._orientedBoxBoundsDirty[0] = true;
		this._orientedBoxBoundsDirty[1] = true;
		this._orientedSphereBoundsDirty[0] = true;
		this._orientedSphereBoundsDirty[1] = true;

		for (const key in this._boundingVolumePools)
			this._boundingVolumePools[key].abstractions.forEach((boundingVolume: BoundingVolumeBase) => boundingVolume.onInvalidate());
	}

	public onClear(): void {
		super.onClear();

		for (const key in this._boundingVolumePools)
			this._boundingVolumePools[key].abstractions.forEach((boundingVolume: BoundingVolumeBase) => boundingVolume.onClear());

		this._boundingVolumePools = null;

		this.abstractions.forEach((pickable: _Pick_PickableBase) => pickable.onClear());

		this._pickingCollision = null;
		this._activePickables = [];
		this._orientedBoxBoundsDirty[0] = true;
		this._orientedBoxBoundsDirty[1] = true;
		this._orientedSphereBoundsDirty[0] = true;
		this._orientedSphereBoundsDirty[1] = true;
	}

	public requestAbstraction(pickable: IPickable): _Pick_PickableBase {
		const store = PickEntity._store[pickable.assetType];
		return store.length ? store.pop() : new PickEntity._pickPickableClassPool[pickable.assetType]();
	}

	public storeAbstraction(abstraction: _Pick_PickableBase, assetType: string): void {
		PickEntity._store[assetType].push(abstraction);
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerPickable(pickClass: _IPick_PickableClass, assetClass: IAssetClass): void {
		PickEntity._pickPickableClassPool[assetClass.assetType] = pickClass;
		PickEntity._store[assetClass.assetType] = [];
	}

	private _update(): void {
		this._invalid = false;
		const entity = (<ContainerNode> this._asset).container.getEntity();
		entity._acceptTraverser(this);
	}

	private _isIntersectingMasks(
		rootEntity: INode, globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {

		//horrible hack for 2d masks
		//do the mask thang
		const maskOwners: ContainerNode[] = (<ContainerNode> this._asset).getMaskOwners();
		if (maskOwners) {
			const numOwners: number = maskOwners.length;
			let node: ContainerNode;
			let masks: ContainerNode[];
			let numMasks: number;
			let maskHit: boolean;
			for (let i: number = 0; i < numOwners; i++) {
				node = maskOwners[i];
				if (!node.isDescendant(rootEntity))
					continue;

				masks = node.getMasks();
				numMasks = masks.length;
				maskHit = false;
				for (let j: number = 0; j < numMasks; j++) {
					node = masks[j];
					if (!node.isDescendant(rootEntity))
						continue;

					if (this.pickGroup
						.getRaycastPicker(node)
						._getCollisionInternal(globalRayPosition, globalRayDirection, true, true, null)
					) {
						maskHit = true;
						break;
					}
				}

				if (!maskHit)
					return false;
			}
		}

		return true;
	}
}