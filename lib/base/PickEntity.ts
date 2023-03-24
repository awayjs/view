import {
	IAssetClass,
	IAbstractionPool,
	Matrix3D,
	Box,
	Vector3D,
	Sphere,
	AbstractionBase,
	Point,
	AssetEvent,
	Plane3D,
	IAsset,
	IAbstractionClass,
	UUID
} from '@awayjs/core';

import { ITraversable } from './ITraversable';
import { PickGroup } from '../PickGroup';
import { _Pick_PickableBase } from './_Pick_PickableBase';
import { _IPick_PickableClass } from './_IPick_PickableClass';
import { PickingCollision } from '../pick/PickingCollision';
import { IEntityTraverser } from './IEntityTraverser';
import { BoundingVolumePool } from '../bounds/BoundingVolumePool';
import { BoundingVolumeBase } from '../bounds/BoundingVolumeBase';
import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { IBoundsPicker } from '../pick/IBoundsPicker';
import { BoundsPickerEvent } from '../events/BoundsPickerEvent';

import { View } from '../View';
import { EntityNode } from '../partition/EntityNode';
import { ContainerNode } from '../partition/ContainerNode';

/**
 * @class away.pool.PickEntity
 */
export class PickEntity extends AbstractionBase implements IAbstractionPool, IEntityTraverser, IBoundsPicker {
	private _boundingVolumePools: NumberMap<BoundingVolumePool> = {};

	private _pickingCollision: PickingCollision;

	private _orientedBoxBounds: Box[] = [];
	private _orientedBoxBoundsDirty: boolean[] = [true, true];
	private _orientedSphereBounds: Sphere[] = [];
	private _orientedSphereBoundsDirty: boolean[] = [true, true];

	private static _pickPickableClassPool: Object = new Object();

	private _activePickables: _Pick_PickableBase[] = [];
	private _boundingVolumes: BoundingVolumeBase[] = [];
	private _pickables: _Pick_PickableBase[] = [];
	private _view: View;
	private _node: ContainerNode;
	private _pickGroup: PickGroup;

	public get pickingCollision(): PickingCollision {
		return this._pickingCollision;
	}

	/**
	 *
	 */
	public get view(): View {
		return this._view;
	}

	/**
	 *
	 */
	public get node(): ContainerNode {
		return this._node;
	}

	/**
	 *
	 */
	public get pickGroup(): PickGroup {
		return this._pickGroup;
	}

	public shapeFlag: boolean = false;

	public readonly id: number;

	/**
	 * //TODO
	 */
	constructor(entity: EntityNode, pickGroup: PickGroup) {
		super(entity, pickGroup);

		this.id = UUID.Next();
		this._node = entity.parent;
		this._view = this._node.view;
		this._pickGroup = pickGroup;
		this._pickingCollision = new PickingCollision(this._node, pickGroup);
	}

	public getBoundingVolume(target: ContainerNode = null, type: BoundingVolumeType = null): BoundingVolumeBase {
		if (target == null)
			target = this._node;

		if (type == null)
			type = this._node.container.defaultBoundingVolume;

		const pool: BoundingVolumePool = this._boundingVolumePools[type]
									|| (this._boundingVolumePools[type] = new BoundingVolumePool(this, type));

		return target.getAbstraction<BoundingVolumeBase>(pool);
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
		return this._hitTestPointInternal(this._node, x, y, shapeFlag, false);
	}

	public _hitTestPointInternal(
		rootEntity: ContainerNode,
		x: number, y: number,
		shapeFlag: boolean = false, maskFlag: boolean = false): boolean
	// eslint-disable-next-line brace-style
	{

		if (this._node.getMaskId() != -1 && (!maskFlag || !shapeFlag))//allow masks for bounds hit tests
			return false;

		if (this._invalid)
			this._update();

		//set local tempPoint for later reference
		const tempPoint: Point = new Point(x,y);
		this._node.globalToLocal(tempPoint, tempPoint);

		//early out for box test
		const box: Box = this._getBoxBoundsInternal(null, false, true);

		if (box == null || !box.contains(tempPoint.x, tempPoint.y, 0))
			return false;

		//early out for non-shape tests
		if (!shapeFlag
			|| this._node.container.assetType == '[asset TextField]'
			|| this._node.container.assetType == '[asset Billboard]')
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
		const maskOwners: ContainerNode[] = this._node.getMaskOwners();
		if (maskOwners) {
			const numOwners: number = maskOwners.length;
			let entity: ContainerNode;
			let masks: ContainerNode[];
			let numMasks: number;
			let maskHit: boolean;

			for (let i = 0; i < numOwners; i++) {
				entity = maskOwners[i];
				if (!entity.isDescendant(rootEntity))
					continue;

				masks = entity.getMasks();
				numMasks = masks.length;
				maskHit = false;
				for (let j: number = 0; j < numMasks; j++) {
					entity = masks[j];
					if (!entity.isDescendant(rootEntity))
						continue;

					// todo: figure out why a mask can be null here!
					if (entity
						&& this._pickGroup
							.getBoundsPicker(entity.partition)
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
		return this._isInFrustumInternal(this._node, planes, numPlanes);
	}

	public _isInFrustumInternal(rootEntity: ContainerNode, planes: Array<Plane3D>, numPlanes: number): boolean {
		return this.getBoundingVolume(rootEntity).isInFrustum(planes, numPlanes);
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {
		return this._isIntersectingRayInternal(this._node, globalRayPosition, globalRayDirection);
	}

	/**
	 * @inheritDoc
	 */
	public _isIntersectingRayInternal(
		rootEntity: ContainerNode, globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {

		const invMatrix: Matrix3D = this._node.getInverseMatrix3D();
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
		matrix3D: Matrix3D = null,
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

	public applyTraversable(traversable: ITraversable): void {
		//is the traversable a mask?
		this._activePickables.push(traversable.getAbstraction(this));
	}

	public addBoundingVolume(boundingVolume: BoundingVolumeBase): void {
		this._boundingVolumes.push(boundingVolume);
	}

	public removeBoundingVolume(boundingVolume: BoundingVolumeBase): void {
		this._boundingVolumes.splice(this._boundingVolumes.indexOf(boundingVolume), 1);
	}

	public addPickable(pickable: _Pick_PickableBase): void {
		this._pickables.push(pickable);
	}

	public removePickable(pickable: _Pick_PickableBase): void {
		this._pickables.splice(this._pickables.indexOf(pickable), 1);
	}

	public onInvalidate(event: AssetEvent): void {
		super.onInvalidate(event);

		this._activePickables = [];
		this._orientedBoxBoundsDirty[0] = true;
		this._orientedBoxBoundsDirty[1] = true;
		this._orientedSphereBoundsDirty[0] = true;
		this._orientedSphereBoundsDirty[1] = true;

		this.dispatchEvent(new BoundsPickerEvent(BoundsPickerEvent.INVALIDATE_BOUNDS, this));
	}

	public onClear(event: AssetEvent): void {
		super.onClear(event);

		for (const key in this._boundingVolumePools) {
			this._boundingVolumePools[key].dispose();
			delete this._boundingVolumePools[key];
		}

		for (let i: number = this._boundingVolumes.length  - 1; i >= 0; i--)
			this._boundingVolumes[i].onClear(event);

		for (let i: number = this._pickables.length  - 1; i >= 0; i--)
			this._pickables[i].onClear(event);
	}

	public requestAbstraction(asset: IAsset): IAbstractionClass {
		return PickEntity._pickPickableClassPool[asset.assetType];
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerPickable(pickClass: _IPick_PickableClass, assetClass: IAssetClass): void {
		PickEntity._pickPickableClassPool[assetClass.assetType] = pickClass;
	}

	private _update(): void {
		this._invalid = false;
		(<EntityNode> this._asset).entity._acceptTraverser(this);
	}

	private _isIntersectingMasks(
		rootEntity: ContainerNode, globalRayPosition: Vector3D, globalRayDirection: Vector3D): boolean {

		//horrible hack for 2d masks
		//do the mask thang
		const maskOwners: ContainerNode[] = this._node.getMaskOwners();
		if (maskOwners) {
			const numOwners: number = maskOwners.length;
			let entity: ContainerNode;
			let masks: ContainerNode[];
			let numMasks: number;
			let maskHit: boolean;
			for (let i: number = 0; i < numOwners; i++) {
				entity = maskOwners[i];
				if (!entity.isDescendant(rootEntity))
					continue;

				masks = entity.getMasks();
				numMasks = masks.length;
				maskHit = false;
				for (let j: number = 0; j < numMasks; j++) {
					entity = masks[j];
					if (!entity.isDescendant(rootEntity))
						continue;

					// todo: figure out why a mask can be null here!
					if (entity
							&& this._pickGroup
								.getRaycastPicker(entity.partition)
								._getCollisionInternal(globalRayPosition, globalRayDirection, true, true, null)) {
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