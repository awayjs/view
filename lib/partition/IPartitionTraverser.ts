import { ContainerNode } from './ContainerNode';
import { INode } from './INode';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export interface IPartitionTraverser
{
	node: INode;

	getTraverser(node: ContainerNode): IPartitionTraverser | void;

	/**
	 * Returns true if the current node is at least partly in the frustum. If so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	enterNode(node: INode): boolean;

	/**
	 *
	 * @param entity
	 */
	applyEntity(node: INode): void;
}