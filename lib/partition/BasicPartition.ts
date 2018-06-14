import {DisplayObject} from "@awayjs/scene";

import {NodeBase} from "./NodeBase";
import {PartitionBase} from "./PartitionBase";
import { View } from '../View';


/**
 * @class away.partition.Partition
 */
export class BasicPartition extends PartitionBase
{
	constructor(root:DisplayObject, view:View)
	{
		super(root, view);

		this._rootNode = new NodeBase();
	}
}