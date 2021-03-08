import { Transform, Matrix3D, IAsset } from '@awayjs/core';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { IPartitionClass } from '../partition/IPartitionClass';
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
	getScrollRectPrimitive(): IPartitionEntity;

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