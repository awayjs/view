import { AbstractionBase, Plane3D, Vector3D, AssetEvent } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { INode } from './INode';
import { ContainerNode } from './ContainerNode';
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';
import { PickEntity } from '../base/PickEntity';

/**
 * @class away.partition.EntityNode
 */
export class EntityNode extends AbstractionBase implements INode {
	private _parent: ContainerNode;
	private _boundsVisible: boolean;
	private _boundsPrimitive: EntityNode;
	private _boundsPrimitiveDirty: boolean;

	public _iUpdateQueueNext: EntityNode;

	public _collectionMark: number;// = 0;

	public get parent(): ContainerNode {
		return this._parent;
	}

	public get entity(): IPartitionEntity {
		return <IPartitionEntity> this._asset;
	}

	public get partition(): PartitionBase {
		return <PartitionBase> this._pool;
	}

	public get boundsVisible(): boolean {
		if (this._boundsVisible != this._parent.container.boundsVisible) {
			this._boundsVisible = this._parent.container.boundsVisible;

			if (this._boundsVisible) {
				this._boundsPrimitiveDirty = true;
			} else if (this._boundsPrimitive) {
				this._boundsPrimitive.setParent(null);
				this._boundsPrimitive = null;
			}
		}

		return this._boundsVisible;
	}

	constructor(entity: IPartitionEntity, partition: PartitionBase) {
		super(entity, partition);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow(): boolean {
		return this._parent.container.castsShadows;
	}

	public onClear(event: AssetEvent): void {
		(<PartitionBase> this._pool).clearEntity(this);

		super.onClear(event);

		this.clear();
	}

	public onInvalidate(event: AssetEvent): void {
		(<PartitionBase> this._pool).invalidateEntity(this);

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
	public isInFrustum(
		_rootEntity: ContainerNode, _planes: Array<Plane3D>, _numPlanes: number, _pickGroup: PickGroup): boolean {

		if (this.isInvisible())
			return false;

		return true;
		//return this._asset.getAbstraction<PickEntity>(pickGroup)._isInFrustumInternal(rootEntity, planes, numPlanes);
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

			this._boundsPrimitive = this.parent.container
				.getBoundsPrimitive(pickGroup.getBoundsPicker(this.partition))
				.getAbstraction<EntityNode>(this.partition);

			this._boundsPrimitive.setParent(this._parent);
		}

		return this._boundsPrimitive;
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(
		rootEntity: ContainerNode, globalRayPosition: Vector3D, globalRayDirection: Vector3D, pickGroup: PickGroup
	): boolean {
		return this
			.getAbstraction<PickEntity>(pickGroup)
			._isIntersectingRayInternal(rootEntity, globalRayPosition, globalRayDirection);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable(): boolean {
		return this.parent.getColorTransform()._isRenderable();
	}

	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser: IPartitionTraverser): void {
		if (traverser.enterNode(this))
			traverser.applyEntity(this);
	}

	public setParent(parent: ContainerNode): void {

		if (!parent)
			this.onClear(null);

		this._parent = parent;
	}
}