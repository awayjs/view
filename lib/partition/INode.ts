import {Plane3D, Vector3D} from "@awayjs/core";

import {IContainerNode} from "./IContainerNode";

import {IPartitionTraverser} from "./IPartitionTraverser";
import { IPartitionEntity } from '../base/IPartitionEntity';
import { PickGroup } from '../PickGroup';

/**
 * IDisplayObjectNode is an interface for the constructable class definition EntityNode that is used to
 * create node objects in the partition pipeline that represent the contents of a Entity
 *
 * @class away.pool.IDisplayObjectNode
 */
export interface INode
{
	//bounds:BoundingVolumeBase;

	pickObject:IPartitionEntity;

	boundsVisible:boolean;

	getBoundsPrimitive(pickGroup:PickGroup):IPartitionEntity;

	parent:IContainerNode;

	_collectionMark:number;

	isMask():boolean;

	isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean;
	
	isRenderable():boolean;

	isVisible():boolean;
	
	isIntersectingRay(rootEntity:IPartitionEntity, rayPosition:Vector3D, rayDirection:Vector3D, pickGroup:PickGroup):boolean;

	acceptTraverser(traverser:IPartitionTraverser);

	isCastingShadow():boolean;
}