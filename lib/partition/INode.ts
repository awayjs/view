import { IAsset, Plane3D, Vector3D } from '@awayjs/core';

import { ContainerNode } from './ContainerNode';

import { IPartitionTraverser } from './IPartitionTraverser';
import { PickGroup } from '../PickGroup';
import { IPartitionContainer } from '../base/IPartitionContainer';
import { View } from '../View';

/**
 * INode is an interface for the constructable class definition ContainerNode that is used to
 * create node objects in the partition pipeline that represent the contents of a container of Entity objects
 *
 * @class away.pool.INode
 */
export interface INode extends IAsset
{
	readonly view: View;

	//bounds:BoundingVolumeBase;

	//pickObject: IPartitionEntity;

	container: IPartitionContainer;

	boundsVisible: boolean;

	parent: ContainerNode;

	_collectionMark: number;

	isInFrustum(rootEntity: INode, planes: Array<Plane3D>, numPlanes: number, pickGroup: PickGroup): boolean;

	isRenderable(): boolean;

	isInvisible(): boolean;

	getMaskId(): number;

	getBoundsPrimitive(pickGroup: PickGroup): ContainerNode;

	isIntersectingRay(rootEntity: INode, rayPosition: Vector3D, rayDirection: Vector3D, pickGroup: PickGroup): boolean;

	acceptTraverser(traverser: IPartitionTraverser);

	isCastingShadow(): boolean;
}