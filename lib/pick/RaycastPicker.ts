import { Vector3D, AbstractionBase } from '@awayjs/core';

import { PartitionBase } from '../partition/PartitionBase';
import { IPartitionTraverser } from '../partition/IPartitionTraverser';
import { INode } from '../partition/INode';

import { PickingCollision } from './PickingCollision';
import { PickEntity } from '../base/PickEntity';
import { PickGroup, RaycastPickerPool } from '../PickGroup';
import { IPartitionEntity } from '../base/IPartitionEntity';
import { EntityNode } from '../partition/EntityNode';
import { ContainerNode } from '../partition/ContainerNode';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations. Performs
 * an initial coarse boundary calculation to return a subset of entities whose
 * bounding volumes intersect with the specified ray, then triggers an optional
 * picking collider on individual renderable objects to further determine the
 * precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export class RaycastPicker extends AbstractionBase implements IPartitionTraverser {
	private static _rayPosition: Vector3D = new Vector3D();
	private static _rayDirection: Vector3D = new Vector3D();

	private _dragNode: ContainerNode;

	public readonly partition: PartitionBase;

	public readonly rootNode: ContainerNode;

	public readonly pickGroup: PickGroup;

	public shapeFlag: boolean = false;

	public findClosestCollision: boolean = false;

	/**
	 *
	 */
	public layeredView: boolean; //TODO: something to enable this correctly

	private _rootEntity: ContainerNode;
	private _shapeFlag: boolean;
	private _globalRayPosition: Vector3D;
	private _globalRayDirection: Vector3D;
	private _ignoredEntities: Array<IPartitionEntity>;

	private _entities: PickEntity[] = [];
	private _pickers: RaycastPicker[] = [];
	private _collectedEntities: PickEntity[] = [];

	constructor(partition: PartitionBase, pool: RaycastPickerPool) {
		super(partition, pool);

		this.pickGroup = pool.pickGroup;
		this.partition = partition;
		this.rootNode = partition.rootNode;
	}

	public traverse(): void {
		this._entities.length = 0;
		this._pickers.length = 0;
		this.partition.traverse(this);
	}

	public getTraverser(partition: PartitionBase): IPartitionTraverser {
		if (!partition.rootNode.isMouseDisabled() || partition.rootNode.isDragEntity()) {
			const traverser: RaycastPicker = this.pickGroup.getRaycastPicker(partition);

			if (traverser._isIntersectingRayInternal(
				this._rootEntity,
				this._globalRayPosition,
				this._globalRayDirection,
				this._shapeFlag)
			) {
				this._pickers.push(traverser);
			}

			return traverser;
		}

		return this;
	}

	public get dragNode(): ContainerNode {
		return this._dragNode;
	}

	public set dragNode(node: ContainerNode) {
		if (this._dragNode == node)
			return;

		if (this._dragNode)
			this._dragNode.stopDrag();

		this._dragNode = node;

		if (this._dragNode)
			this._dragNode.startDrag();
	}

	/**
	 * Returns true if the current node is at least partly in the frustum. If
	 * so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	public enterNode(node: INode): boolean {
		if (node.isInvisible() || node.getMaskId() != this._rootEntity.getMaskId())
			return false;

		if ((<ContainerNode> node).pickObjectNode) {
			(<ContainerNode> node).pickObjectNode.partition.traverse(this);
			return false;
		}

		return node.isIntersectingRay(
			this._rootEntity, this._globalRayPosition, this._globalRayDirection, this.pickGroup);
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(
		globalRayPosition: Vector3D,
		globalRayDirection: Vector3D,
		shapeFlag: boolean = false
	): boolean {
		return this._isIntersectingRayInternal(this.rootNode, globalRayPosition, globalRayDirection, shapeFlag);
	}

	/**
	 * @inheritDoc
	 */
	public _isIntersectingRayInternal(
		rootEntity: ContainerNode, globalRayPosition: Vector3D, globalRayDirection: Vector3D, shapeFlag: boolean
	): boolean {
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
	public getCollision(
		rayPosition: Vector3D,
		rayDirection: Vector3D,
		shapeFlag: boolean = false,
		startingCollision: PickingCollision = null
	): PickingCollision {
		return this._getCollisionInternal(
			rayPosition, rayDirection, shapeFlag, false, startingCollision);
	}

	public getViewCollision(
		x: number, y: number, shapeFlag: boolean = false, startingCollision: PickingCollision = null
	) {
		const view = this.pickGroup.view;

		//update ray
		const rayPosition = view.unproject(x, y, 0, RaycastPicker._rayPosition);
		const rayDirection = view.unproject(x, y, 1, RaycastPicker._rayDirection);

		// decrementBy is non-alloc method instead of substract
		rayDirection.decrementBy(rayPosition);

		return this._getCollisionInternal(rayPosition, rayDirection, shapeFlag, false, startingCollision);
	}

	public _getCollisionInternal(
		rayPosition: Vector3D,
		rayDirection: Vector3D,
		shapeFlag: boolean,
		maskFlag: boolean,
		startingCollision: PickingCollision
	) {
		//early out if no collisions detected
		if (!this._isIntersectingRayInternal(this.rootNode, rayPosition, rayDirection, shapeFlag))
			return null;

		//collect pickers
		this._collectEntities(this._collectedEntities, this._dragNode);

		//console.log("entities: ", this._entities)
		const collision: PickingCollision = this._getPickingCollision(startingCollision);

		//discard collected pickers
		this._collectedEntities.length = 0;

		return collision;
	}

	public getObjectsUnderPoint(rayPosition: Vector3D, rayDirection: Vector3D): IPartitionEntity[] {

		if (!this._isIntersectingRayInternal(this.rootNode, rayPosition, rayDirection, true))
			return [];

		//collect pickers
		this._collectEntities(this._collectedEntities, this._dragNode);

		//console.log("entities: ", this._entities)
		const colliders: IPartitionEntity[] = this._getColliders();

		//discard collected pickers
		this._collectedEntities.length = 0;

		return colliders;
	}

	public _collectEntities(collectedEntities: PickEntity[], dragNode: INode): void {
		const len: number = this._pickers.length;
		let picker: RaycastPicker;
		for (let i = 0; i < len; i++)
			if ((picker = this._pickers[i]).rootNode != dragNode)
				picker._collectEntities(collectedEntities, dragNode);

		//ensures that raycastPicker entities are always added last, for correct 2D picking
		let entity: PickEntity;
		for (let i = 0; i < this._entities.length; ++i) {
			(entity = this._entities[i]).pickingCollision.rootNode = this.rootNode;
			collectedEntities.push(entity);
		}
	}

	public setIgnoreList(entities: Array<IPartitionEntity>): void {
		this._ignoredEntities = entities;
	}

	private isIgnored(entity: IPartitionEntity): boolean {
		if (this._ignoredEntities) {
			const len: number = this._ignoredEntities.length;
			for (let i: number = 0; i < len; i++)
				if (this._ignoredEntities[i] == entity)
					return true;
		}

		return false;
	}

	private static sortOnNearT(entity1: PickEntity, entity2: PickEntity): number {
		return entity1.pickingCollision.rayEntryDistance > entity2.pickingCollision.rayEntryDistance
			? 1
			: entity1.pickingCollision.rayEntryDistance < entity2.pickingCollision.rayEntryDistance
				? -1
				: 0;
	}

	private _getPickingCollision(bestCollision: PickingCollision = null): PickingCollision {
		// Sort pickers from closest to furthest to reduce tests.
		// TODO - test sort filter in JS
		this._collectedEntities = this._collectedEntities.sort(RaycastPicker.sortOnNearT);
		// ---------------------------------------------------------------------
		// Evaluate triangle collisions when needed.
		// Replaces collision data provided by bounds collider with more precise data.
		// ---------------------------------------------------------------------

		let entity: PickEntity;
		let testCollision: PickingCollision;
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
			RaycastPicker.updatePosition(bestCollision);

		if (this._dragNode) {
			if (this._dragNode.container.assetType == '[asset MovieClip]' && this._dragNode.container.adapter) {
				(<any> this._dragNode.container.adapter).setDropTarget(bestCollision ? bestCollision.entityNode : null);
			}
		}

		return bestCollision;
	}

	private _getColliders(): IPartitionEntity[] {

		const colliders: IPartitionEntity[] = [];
		let pickEntity: PickEntity;
		const len: number = this._collectedEntities.length;
		for (let i: number = 0; i < len; i++) {
			pickEntity = this._collectedEntities[i];
			pickEntity.pickingCollision.rayEntryDistance = Number.MAX_VALUE;
			if (pickEntity.isIntersectingShape(false))
				colliders.push(pickEntity.node.container);
		}
		return colliders;
	}

	private static updatePosition(pickingCollision: PickingCollision): void {
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
	public applyEntity(entity: EntityNode): void {

		if (!this.isIgnored(entity.entity)) {
			const pickEntity: PickEntity = entity.getAbstraction<PickEntity>(this.pickGroup);
			this._entities.push(pickEntity);
		}
	}
}