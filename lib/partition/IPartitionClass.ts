import { ContainerNode } from './ContainerNode';
import { PartitionBase } from './PartitionBase';

/**
 *
 */
export interface IPartitionClass
{
	/**
	 *
	 */
	new(node: ContainerNode): PartitionBase;
}