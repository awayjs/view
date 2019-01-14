import { ITraversable } from './ITraversable';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export interface IEntityTraverser
{
	/**
	 * 
	 */
	applyTraversable(traversable:ITraversable):void
}