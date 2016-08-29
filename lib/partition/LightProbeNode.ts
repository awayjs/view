import {ITraverser}				from "@awayjs/display/lib/ITraverser";

import {EntityNode}					from "../partition/EntityNode";

/**
 * @class away.partition.LightProbeNode
 */
export class LightProbeNode extends EntityNode
{
	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:ITraverser):void
	{
		if (traverser.enterNode(this))
			traverser.applyLightProbe(this._displayObject);
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