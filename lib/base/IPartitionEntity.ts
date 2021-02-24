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
	partitionClass: IPartitionClass;

	parent: IPartitionContainer;

	pickObjectFromTimeline: boolean;

	_iInternalUpdate(): void;

	_registrationMatrix3D: Matrix3D;

	transform: Transform;

	/**
	 *
	 */
	defaultBoundingVolume: BoundingVolumeType;

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
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}