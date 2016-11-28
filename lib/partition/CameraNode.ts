import {TraverserBase} from "@awayjs/graphics";

import {EntityNode} from "./EntityNode";

/**
 * @class away.partition.CameraNode
 */
export class CameraNode extends EntityNode
{
	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:TraverserBase):void
	{
		// todo: dead end for now, if it has a debug sprite, then sure accept that
	}
}