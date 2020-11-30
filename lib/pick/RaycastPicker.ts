import { Vector3D, AbstractionBase, IAbstractionPool } from '@awayjs/core';
import { DisplayObject } from '@awayjs/scene';

import { PartitionBase } from '../partition/PartitionBase';
import { IPartitionTraverser } from '../partition/IPartitionTraverser';
import { INode } from '../partition/INode';

import { PickingCollision } from './PickingCollision';
import { PickEntity } from '../base/PickEntity';
import { PickGroup, RaycastPickerPool } from '../PickGroup';
import { IPickingEntity } from '../base/IPickingEntity';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export class RaycastPicker extends AbstractionBase implements IPartitionTraverser {
	private _dragEntity: IPickingEntity;
	protected _partition: PartitionBase;
	protected _entity: IPickingEntity;

	public get partition(): PartitionBase {
		return this._partition;
	}

	/**
     *
     * @returns {IPickingEntity}
     */
	public get entity(): IPickingEntity {
		return this._entity;
	}

	public shapeFlag: boolean = false;

	public findClosestCollision: boolean = false;

	private _pickGroup: PickGroup;

	private _rootEntity: IPickingEntity;
	private _shapeFlag: boolean;
	private _globalRayPosition: Vector3D;
	private _globalRayDirection: Vector3D;
	private _ignoredEntities: Array<IPickingEntity>;

	private _entities: PickEntity[] = [];
	private _pickers: RaycastPicker[] = [];
	private _collectedEntities: PickEntity[] = [];

	/**
	 * Creates a new <code>RaycastPicker</code> object.
	 *
	 * @param findClosestCollision Determines whether the picker searches for the closest bounds collision along the ray,
	 * or simply returns the first collision encountered. Defaults to false.
	 */
	constructor(partition: PartitionBase, pool: RaycastPickerPool) {
		super(partition, pool);

		this._pickGroup = pool.pickGroup;
		this._partition = partition;
		this._entity = <IPickingEntity> partition.root;
	}

	public traverse(): void {
		this._entities.length = 0;
		this._pickers.length = 0;
		this._partition.traverse(this);
	}

	public getTraverser(partition: PartitionBase): IPartitionTraverser {
		if (partition.root._iIsMouseEnabled() || (<IPickingEntity> partition.root).isDragEntity()) {
			const traverser: RaycastPicker = this._pickGroup.getRaycastPicker(partition);

			if (traverser._isIntersectingRayInternal(this._rootEntity, this._globalRayPosition, this._globalRayDirection, this._shapeFlag))
				this._pickers.push(traverser);

			return traverser;
		}

		return this;
	}

	public get dragEntity(): IPickingEntity {
		return this._dragEntity;
	}

	public set dragEntity(entity: IPickingEntity) {
		if (this._dragEntity == entity)
			return;

		if (this._dragEntity)
			this._dragEntity._stopDrag();

		this._dragEntity = entity;

		if (this._dragEntity)
			this._dragEntity._startDrag();
	}

	/**
	 * Returns true if the current node is at least partly in the frustum. If so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	public enterNode(node: INode): boolean {
		if (!node.isVisible() || node.maskId != this._rootEntity.maskId)
			return false;

		if (node.pickObject) {
			node.pickObject.partition.traverse(this);
			return false;
		}

		return  node.isIntersectingRay(this._rootEntity, this._globalRayPosition, this._globalRayDirection, this._pickGroup);
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(globalRayPosition: Vector3D, globalRayDirection: Vector3D, shapeFlag: boolean = false): boolean {
		return this._isIntersectingRayInternal(this._entity, globalRayPosition, globalRayDirection, shapeFlag);
	}

	/**
	 * @inheritDoc
	 */
	public _isIntersectingRayInternal(rootEntity: IPickingEntity, globalRayPosition: Vector3D, globalRayDirection: Vector3D, shapeFlag: boolean): boolean {
		this._rootEntity = rootEntity;
		this._globalRayPosition = globalRayPosition;
		this._globalRayDirection = globalRayDirection;
		this._shapeFlag = this.shapeFlag || shapeFlag;

		this.traverse();

		if (!this._entities.length && !this._pickers.length)
			return false;
		// this._pickingCollision.rayPosition = this._entity.transform.inverseConcatenatedMatrix3D.transformVector(globalRayPosition, this._pickingCollision.rayPosition);
		// this._pickingCollision.rayDirection = this._entity.transform.inverseConcatenatedMatrix3D.deltaTransformVector(globalRayDirection, this._pickingCollision.rayDirection);
		// this._pickingCollision.normal = this._pickingCollision.normal || new Vector3D();

		// var rayEntryDistance:number = this._pickGroup.getBoundsPicker(this._partition).getBoundingVolume().rayIntersection(this._pickingCollision.rayPosition, this._pickingCollision.rayDirection, this._pickingCollision.normal);

		// if (rayEntryDistance < 0)
		// 	return false;

		// this._pickingCollision.rayEntryDistance = rayEntryDistance;
		// this._pickingCollision.rayOriginIsInsideBounds = rayEntryDistance == 0;

		return true;
	}

	// public isIntersectingShape(findClosestCollision:boolean):boolean
	// {
	// 	//recalculates the rayEntryDistance and normal for shapes
	// 	var rayEntryDistance:number = Number.MAX_VALUE;
	// 	for (var i:number = 0; i < this._entities.length; ++i) {
	// 		if (this._entities[i].isIntersectingShape(findClosestCollision) && rayEntryDistance > this._entities[i].pickingCollision.rayEntryDistance) {
	// 			rayEntryDistance = this._entities[i].pickingCollision.rayEntryDistance;
	// 			this._pickingCollision.normal = this._entities[i].pickingCollision.normal;
	// 		}
	// 	}

	// 	if (rayEntryDistance == Number.MAX_VALUE) {
	// 		this._pickingCollision.rayEntryDistance = -1;
	// 		return false;
	// 	}

	// 	this._pickingCollision.rayEntryDistance = rayEntryDistance;

	// 	return true;
	// }

	/**
	 * @inheritDoc
	 */
	public getCollision(rayPosition: Vector3D, rayDirection: Vector3D, shapeFlag: boolean = false): PickingCollision {
		return this._getCollisionInternal(rayPosition, rayDirection, shapeFlag, false);
	}

	public _getCollisionInternal(rayPosition: Vector3D, rayDirection: Vector3D, shapeFlag: boolean, maskFlag: boolean) {
		//early out if no collisions detected
		if (!this._isIntersectingRayInternal(this._entity, rayPosition, rayDirection, shapeFlag))
			return null;

		//collect pickers
		this._collectEntities(this._collectedEntities, this._dragEntity);

		//console.log("entities: ", this._entities)
		const collision: PickingCollision = this._getPickingCollision();

		//discard collected pickers
		this._collectedEntities.length = 0;

		return collision;
	}

	public getObjectsUnderPoint(rayPosition: Vector3D, rayDirection: Vector3D): DisplayObject[] {
		
		if (!this._isIntersectingRayInternal(this._entity, rayPosition, rayDirection, true))
			return [];

		//collect pickers
		this._collectEntities(this._collectedEntities, this._dragEntity);

		//console.log("entities: ", this._entities)
		const colliders: DisplayObject[] = this._getColliders();

		//discard collected pickers
		this._collectedEntities.length = 0;

		return colliders;
	}

	public _collectEntities(collectedEntities: PickEntity[], dragEntity: IPickingEntity): void {
		const len: number = this._pickers.length;
		let picker: RaycastPicker;
		for (var i: number = 0; i < len; i++)
			if ((picker = this._pickers[i]).entity != dragEntity)
				picker._collectEntities(collectedEntities, dragEntity);

		//ensures that raycastPicker entities are always added last, for correct 2D picking
		let entity: PickEntity;
		for (var i: number = 0; i < this._entities.length; ++i) {
			(entity = this._entities[i]).pickingCollision.pickerEntity = this._entity;
			collectedEntities.push(entity);
		}
		// //need to re-calculate the rayEntryDistance for only those entities inside the picker
		// this._pickingCollision.rayEntryDistance = Number.MAX_VALUE;
		// for (var i:number = 0; i < this._entities.length; ++i) {
		// 	if (this._pickingCollision.rayEntryDistance > this._entities[i].pickingCollision.rayEntryDistance) {
		// 		this._pickingCollision.rayEntryDistance = this._entities[i].pickingCollision.rayEntryDistance;
		// 		this._pickingCollision.normal = this._entities[i].pickingCollision.normal;
		// 	}
		// }

		// this._pickingCollision.rayOriginIsInsideBounds = this._pickingCollision.rayEntryDistance == 0;
	}

	//		public getEntityCollision(position:Vector3D, direction:Vector3D, entities:Array<IPickingEntity>):PickingCollision
	//		{
	//			this._numRenderables = 0;
	//
	//			var renderable:IPickingEntity;
	//			var l:number = entities.length;
	//
	//			for (var c:number = 0; c < l; c++) {
	//				renderable = entities[c];
	//
	//				if (renderable.isIntersectingRay(position, direction))
	//					this._renderables[this._numRenderables++] = renderable;
	//			}
	//
	//			return this.getPickingCollision(this._raycastCollector);
	//		}

	public setIgnoreList(entities: Array<IPickingEntity>): void {
		this._ignoredEntities = entities;
	}

	// public getCollider(entity:IPickingEntity):IPickingCollider
	// {
	// 	return this.getPartition(entity).getAbstraction(entity).pickingCollider;
	// }

	// public setCollider(entity:IPickingEntity, collider:IPickingCollider)
	// {
	// 	this.getPartition(entity).getAbstraction(entity).pickingCollider = collider;
	// }

	private isIgnored(entity: IPickingEntity): boolean {
		if (this._ignoredEntities) {
			const len: number = this._ignoredEntities.length;
			for (let i: number = 0; i < len; i++)
				if (this._ignoredEntities[i] == entity)
					return true;
		}

		return false;
	}

	private sortOnNearT(entity1: PickEntity, entity2: PickEntity): number {
		//return entity1._iPickingCollision.rayEntryDistance > entity2._iPickingCollision.rayEntryDistance? 1 : -1;// use this for Icycle;
		return entity1.pickingCollision.rayEntryDistance > entity2.pickingCollision.rayEntryDistance ? 1 : entity1.pickingCollision.rayEntryDistance < entity2.pickingCollision.rayEntryDistance ? -1 : 0;
	}

	private _getPickingCollision(): PickingCollision {
		// Sort pickers from closest to furthest to reduce tests.
		this._collectedEntities = this._collectedEntities.sort(this.sortOnNearT); // TODO - test sort filter in JS

		// ---------------------------------------------------------------------
		// Evaluate triangle collisions when needed.
		// Replaces collision data provided by bounds collider with more precise data.
		// ---------------------------------------------------------------------

		let entity: PickEntity;
		let testCollision: PickingCollision;
		let bestCollision: PickingCollision;
		const len: number = this._collectedEntities.length;
		for (let i: number = 0; i < len; i++) {
			entity = this._collectedEntities[i];
			testCollision = entity.pickingCollision;

			if (bestCollision == null || testCollision.rayEntryDistance < bestCollision.rayEntryDistance) {
				if ((this._shapeFlag || entity.shapeFlag)) {
					testCollision.rayEntryDistance = Number.MAX_VALUE;
					// If a collision exists, update the collision data and stop all checks.
					if (entity.isIntersectingShape(this.findClosestCollision))
						bestCollision = testCollision;
				} else if (!testCollision.rayOriginIsInsideBounds) {
					// A bounds collision with no picking collider stops all checks.
					// Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
					// to enable the detection of a corresponsding triangle collision.
					// Therefore, bounds collisions with a ray origin inside its bounds can be ignored
					// if it has been established that there is NO triangle collider to test
					bestCollision = testCollision;
					break;
				}
			} else {
				//if the next rayEntryDistance of testCollision is greater than bestCollision,
				//there won't be a better collision available
				break;
			}
		}

		if (bestCollision)
			this.updatePosition(bestCollision);

		if (this._dragEntity) {
			if (this._dragEntity.assetType == '[asset MovieClip]' && this._dragEntity.adapter) {
				(<any> this._dragEntity.adapter).setDropTarget(bestCollision ? bestCollision.entity : null);
			}
		}

		return bestCollision;
	}
	private _getColliders(): DisplayObject[] {

		let colliders: DisplayObject[] = [];
		let entity: PickEntity;
		const len: number = this._collectedEntities.length;
		for (let i: number = 0; i < len; i++) {
			entity = this._collectedEntities[i];
			entity.pickingCollision.rayEntryDistance = Number.MAX_VALUE;
			if (entity.isIntersectingShape(false))
				colliders.push(<DisplayObject><any>entity.entity);
		}
		return colliders;
	}
	private updatePosition(pickingCollision: PickingCollision): void {
		const collisionPos: Vector3D = pickingCollision.position || (pickingCollision.position = new Vector3D());

		const rayDir: Vector3D = pickingCollision.rayDirection;
		const rayPos: Vector3D = pickingCollision.rayPosition;
		const t: number = pickingCollision.rayEntryDistance;
		collisionPos.x = rayPos.x + t * rayDir.x;
		collisionPos.y = rayPos.y + t * rayDir.y;
		collisionPos.z = rayPos.z + t * rayDir.z;
	}

	public dispose(): void {
		//TODO
	}

	/**
	 *
	 * @param entity
	 */
	public applyEntity(entity: IPickingEntity): void {
		if (!this.isIgnored(entity)) {
			const pickEntity: PickEntity = entity.getAbstraction<PickEntity>(this._pickGroup);
			this._entities.push(pickEntity);
		}
	}
}