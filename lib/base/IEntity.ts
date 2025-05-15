import { IAsset } from '@awayjs/core';
import { IEntityTraverser } from './IEntityTraverser';

export interface IEntity extends IAsset
{

	/**
	 *
	 * @param renderer
	 * @private
	 */
	_acceptTraverser(traverser: IEntityTraverser);
}