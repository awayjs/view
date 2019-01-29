import {Transform, ColorTransform, Matrix3D, Vector3D, IAsset, Point} from "@awayjs/core";

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { IPartitionTraverser } from '../partition/IPartitionTraverser';
import { PartitionBase } from '../partition/PartitionBase';
import { PickGroup } from '../PickGroup';
import { IEntityTraverser } from './IEntityTraverser';


export interface IPartitionEntity extends IAsset
{
	parent:IPartitionEntity;

	isAncestor(entity:IPartitionEntity):boolean;

	isDescendant(entity:IPartitionEntity):boolean;

	_iInternalUpdate():void;
	
	maskId:number;

	_iAssignedColorTransform():ColorTransform;

	maskOwners:Array<IPartitionEntity>;

	maskMode:boolean;

	_registrationMatrix3D:Matrix3D;

	transform:Transform;

	masks:Array<IPartitionEntity>;
	
	partition:PartitionBase;
		
	/**
	 * 
	 */
	defaultBoundingVolume:BoundingVolumeType;
	
	pickObject:IPartitionEntity;

	/**
	 *
	 */
	boundsVisible:boolean;

	/**
	 * 
	 */
	getBoundsPrimitive(pickGroup:PickGroup):IPartitionEntity;
	
	/**
	 *
	 */
	castsShadows:boolean;

	/**
	 * @internal
	 */
	_iIsMouseEnabled():boolean;

	/**
	 * @internal
	 */
	_iIsVisible():boolean;

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser:IEntityTraverser);
}