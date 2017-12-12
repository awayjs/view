import {IAbstractionPool} from "@awayjs/core";

import {TraverserBase, IContainerNode, IEntity} from "@awayjs/renderer";

import {SceneGraphNode} from "./SceneGraphNode";
import {PartitionBase} from "./PartitionBase";
import {DisplayObjectNode} from "./DisplayObjectNode";

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
		if (this._root == node._entity && node.isSceneGraphNode) {
			this._rootNode = <SceneGraphNode> node;
			return null;
		}

		if (!node.isSceneGraphNode && node._entity.isContainer)
			return this._sceneGraphNodePool.getAbstraction(node._entity);

		return this._sceneGraphNodePool.getAbstraction(node._entity.parent);
	}


	public updateEntity(entity:IEntity):void
	{
		super.updateEntity(entity);

		if(entity.isContainer)
			this.updateNode(this._sceneGraphNodePool.getAbstraction(entity));
	}

	public clearEntity(entity:IEntity):void
	{
		super.clearEntity(entity);

		if(entity.isContainer)
			this.clearNode(this._sceneGraphNodePool.getAbstraction(entity));
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