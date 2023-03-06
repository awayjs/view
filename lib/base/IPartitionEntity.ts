import { Transform, Matrix3D, IAsset } from '@awayjs/core';

import { BoundingVolumeType } from '../bounds/BoundingVolumeType';
import { IPartitionClass } from '../partition/IPartitionClass';
import { BoundsPicker } from '../pick/BoundsPicker';
import { IEntityTraverser } from './IEntityTraverser';
import { IPartitionContainer } from './IPartitionContainer';

export interface IPartitionEntity extends IAsset
{

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}