import {DisplayObject} from "@awayjs/scene";

import {NodeBase} from "./NodeBase";
import {PartitionBase} from "./PartitionBase";


/**
 * @class away.partition.Partition
 */
export class BasicPartition extends PartitionBase
{
	constructor(root:DisplayObject)
	{
		super(root);

		this._rootNode = new NodeBase();
	}
}