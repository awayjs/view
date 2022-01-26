import { IAsset, Plane3D, Vector3D } from '@awayjs/core';

import { ContainerNode } from './ContainerNode';

import { IPartitionTraverser } from './IPartitionTraverser';
import { PickGroup } from '../PickGroup';
import { PartitionBase } from './PartitionBase';
import { EntityNode } from './EntityNode';
import { View } from '../View';

/**
 * IDisplayObjectNode is an interface for the constructable class definition EntityNode that is used to
 * create node objects in the partition pipeline that represent the contents of a Entity
 *
 * @class away.pool.IDisplayObjectNode
 */
export interface INode extends IAsset
{
	readonly partition: PartitionBase;

	//readonly view: View;

	//bounds:BoundingVolumeBase;

	//pickObject: IPartitionEntity;

	boundsVisible: boolean;

	parent: ContainerNode;

	_collectionMark: number;

	isInFrustum(rootEntity: INode, planes: Array<Plane3D>, numPlanes: number, pickGroup: PickGroup): boolean;

	isRenderable(): boolean;

	isInvisible(): boolean;

	getMaskId(): number;

	getBoundsPrimitive(pickGroup: PickGroup): EntityNode;

	isIntersectingRay(rootEntity: INode, rayPosition: Vector3D, rayDirection: Vector3D, pickGroup: PickGroup): boolean;

	acceptTraverser(traverser: IPartitionTraverser);

	isCastingShadow(): boolean;

	setParent(node: ContainerNode);
}