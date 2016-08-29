import {DisplayObject}				from "@awayjs/display/lib/display/DisplayObject";

import {NodeBase}						from "../partition/NodeBase";
import {PartitionBase}				from "../partition/PartitionBase";


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