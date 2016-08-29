import {ITraverser}				from "@awayjs/display/lib/ITraverser";

import {EntityNode}					from "../partition/EntityNode";

/**
 * @class away.partition.PointLightNode
 */
export class PointLightNode extends EntityNode
{
	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:ITraverser):void
	{
		if (traverser.enterNode(this))
			traverser.applyPointLight(this._displayObject);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return false;
	}
}