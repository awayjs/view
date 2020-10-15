import { AbstractionBase, Plane3D, Vector3D, AssetEvent, Box } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';

import { IPartitionTraverser } from './IPartitionTraverser';
import { INode } from './INode';
import { IContainerNode } from './IContainerNode';
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';
import { IPickingEntity } from '../base/IPickingEntity';

/**
 * @class away.partition.EntityNode
 */
export class EntityNode extends AbstractionBase implements INode {
	public _iUpdateQueueNext: EntityNode;

	public _collectionMark: number;// = 0;

	public parent: IContainerNode;

	public get entity(): IPartitionEntity {
		return <IPartitionEntity> this._asset;
	}

	public get pickObject(): IPartitionEntity {
		return (<IPartitionEntity> this._asset).pickObject;
	}

	public get boundsVisible(): boolean {
		return (<IPartitionEntity> this._asset).boundsVisible;
	}

	/**
	 *
	 * @returns {number}
	 */
	public get maskId(): number {
		return (<IPartitionEntity> this._asset).maskId;
	}

	public getBoundsPrimitive(pickGroup: PickGroup): IPartitionEntity {
		return (<IPartitionEntity> this._asset).getBoundsPrimitive(pickGroup);
	}

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
		(<PartitionBase> this._pool).clearEntity((<IPartitionEntity> this._asset));

		super.onClear(event);
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
	public isInFrustum(rootEntity: IPartitionEntity, planes: Array<Plane3D>, numPlanes: number, pickGroup: PickGroup): boolean {
		if (!(<IPartitionEntity> this._asset)._iIsVisible())
			return false;

		return true;
		return pickGroup.getAbstraction(<IPickingEntity> this._asset)._isInFrustumInternal(rootEntity, planes, numPlanes);
	}

	public isVisible(): boolean {
		return (<IPartitionEntity> this._asset)._iIsVisible();
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(rootEntity: IPartitionEntity, globalRayPosition: Vector3D, globalRayDirection: Vector3D, pickGroup: PickGroup): boolean {
		// if (!(<IPartitionEntity> this._asset).partition)
		// 	return false;

		// var box:Box = pickGroup.getBoundsPicker((<IPartitionEntity> this._asset).partition).getBoxBounds(null, false, true);

		// if (box == null)
		// 	return false;

		// if (box.rayIntersection((<IPartitionEntity> this._asset).transform.inverseConcatenatedMatrix3D.transformVector(globalRayPosition), (<IPartitionEntity> this._asset).transform.inverseConcatenatedMatrix3D.deltaTransformVector(globalRayDirection)) < 0)
		// 	return false;

		return pickGroup.getAbstraction(<IPickingEntity> this._asset)._isIntersectingRayInternal(rootEntity, globalRayPosition, globalRayDirection);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable(): boolean {
		return (<IPartitionEntity> this._asset)._iAssignedColorTransform()._isRenderable();
	}

	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser: IPartitionTraverser): void {
		if (traverser.enterNode(this))
			traverser.applyEntity((<IPartitionEntity> this._asset));
	}
}