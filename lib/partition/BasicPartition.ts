import {IPartitionEntity} from "../base/IPartitionEntity";

import {NodeBase} from "./NodeBase";
import {PartitionBase} from "./PartitionBase";


/**
 * @class away.partition.Partition
 */
export class BasicPartition extends PartitionBase
{
	constructor(root:IPartitionEntity)
	{
		super(root);

		this._rootNode = new NodeBase(root, this);
	}
}