import { Transform, ColorTransform, Matrix3D, IAsset, IAbstractionClass } from '@awayjs/core';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { ContainerNode } from '../partition/ContainerNode';
import { IPartitionClass } from '../partition/IPartitionClass';
import { PartitionBase } from '../partition/PartitionBase';
import { BoundsPicker } from '../pick/BoundsPicker';
import { IEntityTraverser } from './IEntityTraverser';
import { IPartitionContainer } from './IPartitionContainer';

export interface IPartitionEntity extends IAsset
{
	partitionClass:IPartitionClass;

	parent: IPartitionContainer;

	pickObjectFromTimeline: boolean;

	//isAncestor(entity: IPartitionEntity): boolean;

	//isDescendant(entity: IPartitionEntity): boolean;

	_iInternalUpdate(): void;

	//readonly maskId: number;

	//_iAssignedColorTransform(): ColorTransform;

	//maskOwners: Array<IPartitionEntity>;

	//maskMode: boolean;

	_registrationMatrix3D: Matrix3D;

	transform: Transform;

	//masks: Array<IPartitionEntity>;

	/**
	 *
	 */
	defaultBoundingVolume: BoundingVolumeType;

	//pickObject: IPartitionEntity;

	/**
	 *
	 */
	boundsVisible: boolean;

	/**
	 *
	 */
	getBoundsPrimitive(picker: BoundsPicker): IPartitionEntity;

	/**
	 *
	 */
	castsShadows: boolean;

	/**
	 * @internal
	 */
	mouseEnabled: boolean;

	/**
	 * @internal
	 */
	//visible: boolean;

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}