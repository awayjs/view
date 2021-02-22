import { AbstractionBase, Plane3D, Vector3D, AssetEvent, IAbstractionPool, Matrix3D, ColorTransform, Point } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { INode } from './INode';
import { ContainerNode } from './ContainerNode';
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';
import { PickEntity } from '../base/PickEntity';
import { HierarchicalProperty } from '../base/HierarchicalProperty';

/**
 * @class away.partition.EntityNode
 */
export class EntityNode extends AbstractionBase implements INode {
	private _parent: ContainerNode;
	private _boundsVisible: boolean;
	private _boundsPrimitive:EntityNode;
	private _boundsPrimitiveDirty:boolean;
	
	public _iUpdateQueueNext: EntityNode;

	public _collectionMark: number;// = 0;

	public get parent(): ContainerNode
	{
		return this._parent;
	}

	public get pool(): IAbstractionPool {
		return this._pool;
	}

	public get entity(): IPartitionEntity {
		return <IPartitionEntity> this._asset;
	}

	public get partition(): PartitionBase {
		return <PartitionBase> this._pool;
	}

	public get boundsVisible(): boolean {
		if (this._boundsVisible != (<IPartitionEntity> this._asset).boundsVisible) {
			this._boundsVisible = (<IPartitionEntity> this._asset).boundsVisible
			
			if (this._boundsVisible) {
				this._boundsPrimitiveDirty = true;
			} else if (this._boundsPrimitive) {
				this._boundsPrimitive.setParent(null);
				this._boundsPrimitive = null;
			}
		}

		return this._boundsVisible;
	}

	/**
	 *
	 * @returns {number}
	 */
	constructor(entity: IPartitionEntity, partition: PartitionBase) {
		super(entity, partition);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow(): boolean {
		return (<IPartitionEntity> this._asset).castsShadows;
	}

	public onClear(event: AssetEvent): void {
		(<PartitionBase> this._pool).clearEntity(this);

		super.onClear(event);

		this.clear();
	}

	
	public onInvalidate(event: AssetEvent): void {
		super.onInvalidate(event);

		this.invalidate();
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */
	public isInFrustum(rootEntity: ContainerNode, planes: Array<Plane3D>, numPlanes: number, pickGroup: PickGroup): boolean {
		if (this.isInvisible())
			return false;

		return true;
		return this._asset.getAbstraction<PickEntity>(pickGroup)._isInFrustumInternal(rootEntity, planes, numPlanes);
	}

	public isInvisible(): boolean {

		return this._parent.isInvisible();
	}

	public getMaskId(): number {

		return this._parent.getMaskId();
	}

	public getBoundsPrimitive(pickGroup: PickGroup): EntityNode {
		if (this._boundsPrimitiveDirty) {
			this._boundsPrimitiveDirty = false;

			this._boundsPrimitive = this.entity
				.getBoundsPrimitive(pickGroup.getBoundsPicker(this.partition))
				.getAbstraction<EntityNode>(this.partition);

			this._boundsPrimitive.setParent(this._parent);
		}

		return this._boundsPrimitive;
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(rootEntity: ContainerNode, globalRayPosition: Vector3D, globalRayDirection: Vector3D, pickGroup: PickGroup): boolean {
		// if (!(<IPartitionEntity> this._asset).partition)
		// 	return false;

		// var box:Box = pickGroup.getBoundsPicker((<IPartitionEntity> this._asset).partition).getBoxBounds(null, false, true);

		// if (box == null)
		// 	return false;

		// if (box.rayIntersection((<IPartitionEntity> this._asset).transform.inverseConcatenatedMatrix3D.transformVector(globalRayPosition), (<IPartitionEntity> this._asset).transform.inverseConcatenatedMatrix3D.deltaTransformVector(globalRayDirection)) < 0)
		// 	return false;

		return this.getAbstraction<PickEntity>(pickGroup)._isIntersectingRayInternal(rootEntity, globalRayPosition, globalRayDirection);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable(): boolean {
		const p = this.parent;

		const tree = p.getIsCacheAsBitmap();
		const self = p.getIsCacheSource();

		// we can render only when self cached (because handle a cache texture) or when both is not cached
		const rendered = self || (!tree && !self);

		return p.getColorTransform()._isRenderable() && rendered;
	}

	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser: IPartitionTraverser): void {
		if (traverser.enterNode(this))
			traverser.applyEntity(this);
	}

	public setParent(parent: ContainerNode): void {
		this._parent = parent;
	}
}