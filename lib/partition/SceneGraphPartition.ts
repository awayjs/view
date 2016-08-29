import {IAbstractionPool}				from "@awayjs/core/lib/library/IAbstractionPool";

import {DisplayObject}				from "@awayjs/display/lib/display/DisplayObject";
import {DisplayObjectContainer}		from "@awayjs/display/lib/display/DisplayObjectContainer";
import {ITraverser}				from "@awayjs/display/lib/ITraverser";
import {IContainerNode}				from "@awayjs/display/lib/partition/IContainerNode";

import {SceneGraphNode}				from "../partition/SceneGraphNode";
import {PartitionBase}				from "../partition/PartitionBase";
import {DisplayObjectNode}			from "../partition/DisplayObjectNode";

/**
 * @class away.partition.Partition
 */
export class SceneGraphPartition extends PartitionBase
{
	private _sceneGraphNodePool:SceneGraphNodePool;

	constructor(root:DisplayObject)
	{
		super(root);

		this._sceneGraphNodePool = new SceneGraphNodePool();
	}

	public traverse(traverser:ITraverser):void
	{
		super.traverse(traverser);
	}


	/**
	 *
	 * @param entity
	 * @returns {away.partition.NodeBase}
	 */
	public findParentForNode(node:DisplayObjectNode):IContainerNode
	{
		if (this._root == node._displayObject) {
			this._rootNode = <SceneGraphNode> node;
			return null;
		}

		if (!node.isSceneGraphNode && node._displayObject.isContainer)
			return this._sceneGraphNodePool.getAbstraction(<DisplayObjectContainer> node._displayObject);

		return this._sceneGraphNodePool.getAbstraction(node._displayObject.parent);
	}

	/**
	 * @internal
	 */
	public _iRegisterEntity(displayObject:DisplayObject):void
	{
		super._iRegisterEntity(displayObject);

		if (displayObject.isContainer)
			this.iMarkForUpdate(this._sceneGraphNodePool.getAbstraction(<DisplayObjectContainer> displayObject));
	}

	/**
	 * @internal
	 */
	public _iUnregisterEntity(displayObject:DisplayObject):void
	{
		super._iUnregisterEntity(displayObject);

		if (displayObject.isContainer)
			this.iRemoveEntity(this._sceneGraphNodePool.getAbstraction(<DisplayObjectContainer> displayObject));
	}
}


/**
 * @class away.pool.SceneGraphNodePool
 */
export class SceneGraphNodePool implements IAbstractionPool
{
	private _abstractionPool:Object = new Object();

	/**
	 * //TODO
	 *
	 * @param entity
	 * @returns EntityNode
	 */
	public getAbstraction(displayObjectContainer:DisplayObjectContainer):SceneGraphNode
	{
		return (this._abstractionPool[displayObjectContainer.id] || (this._abstractionPool[displayObjectContainer.id] = new SceneGraphNode(displayObjectContainer, this)));
	}

	/**
	 * //TODO
	 *
	 * @param entity
	 */
	public clearAbstraction(displayObjectContainer:DisplayObjectContainer):void
	{
		delete this._abstractionPool[displayObjectContainer.id];
	}
}