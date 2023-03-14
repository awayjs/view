import { IAsset } from '@awayjs/core';
import { IEntityTraverser } from './IEntityTraverser';

export interface IPartitionEntity extends IAsset
{

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}