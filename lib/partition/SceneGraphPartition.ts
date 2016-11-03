import {IAbstractionPool}				from "@awayjs/core/lib/library/IAbstractionPool";

import {TraverserBase}				from "@awayjs/graphics/lib/base/TraverserBase";
import {IContainerNode}				from "@awayjs/graphics/lib/base/IContainerNode";
import {IEntity}				from "@awayjs/graphics/lib/base/IEntity";

import {SceneGraphNode}				from "../partition/SceneGraphNode";
import {PartitionBase}				from "../partition/PartitionBase";
import {DisplayObjectNode}			from "../partition/DisplayObjectNode";

/**
 * @class away.partition.Partition
 */
export class SceneGraphPartition extends PartitionBase
{
	private _sceneGraphNodePool:SceneGraphNodePool;

	constructor(root:IEntity)
	{
		super(root);

		this._sceneGraphNodePool = new SceneGraphNodePool();
	}

	public traverse(traverser:TraverserBase):void
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
		if (this._root == node._entity) {
			this._rootNode = <SceneGraphNode> node;
			return null;
		}

		if (!node.isSceneGraphNode && node._entity.isContainer)
			return this._sceneGraphNodePool.getAbstraction(node._entity);

		return this._sceneGraphNodePool.getAbstraction(node._entity.parent);
	}

	/**
	 * @internal
	 */
	public _iRegisterEntity(entity:IEntity):void
	{
		super._iRegisterEntity(entity);

		if (entity.isContainer)
			this.iMarkForUpdate(this._sceneGraphNodePool.getAbstraction(entity));
	}

	/**
	 * @internal
	 */
	public _iUnregisterEntity(entity:IEntity):void
	{
		super._iUnregisterEntity(entity);

		if (entity.isContainer)
			this.iRemoveEntity(this._sceneGraphNodePool.getAbstraction(entity));
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
	public getAbstraction(entity:IEntity):SceneGraphNode
	{
		return (this._abstractionPool[entity.id] || (this._abstractionPool[entity.id] = new SceneGraphNode(entity, this)));
	}

	/**
	 * //TODO
	 *
	 * @param entity
	 */
	public clearAbstraction(entity:IEntity):void
	{
		delete this._abstractionPool[entity.id];
	}
}