import {TraverserBase}				from "@awayjs/graphics/lib/base/TraverserBase";

import {EntityNode}					from "../partition/EntityNode";

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