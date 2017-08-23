import {IAssetClass} from "@awayjs/core";

import {TraverserBase, IContainerNode, IEntity} from "@awayjs/graphics";

import {EntityNode} from "./EntityNode";
import {IEntityNodeClass} from "./IEntityNodeClass";
import {DisplayObjectNode} from "./DisplayObjectNode";

/**
 * @class away.partition.Partition
 */
export class PartitionBase
{
	private static _abstractionClassPool:Object = new Object();

	private _abstractionPool:Object = new Object();
	
	public _root:IEntity;
	public _rootNode:IContainerNode;

	private _updateQueue:Object = {};

	public get root():IEntity
	{
		return this._root;
	}
	
	constructor(root:IEntity)
	{
		this._root = root;
	}

	public getAbstraction(entity:IEntity):EntityNode
	{
		return (this._abstractionPool[entity.id] || (this._abstractionPool[entity.id] = new (<IEntityNodeClass> PartitionBase._abstractionClassPool[entity.assetType])(entity, this)));
	}

	/**
	 *
	 * @param image
	 */
	public clearAbstraction(entity:IEntity):void
	{
		this._abstractionPool[entity.id] = null;
	}

	public traverse(traverser:TraverserBase):void
	{
		this.updateEntities();

		if (this._rootNode)
			this._rootNode.acceptTraverser(traverser);
	}

	public invalidateEntity(entity:IEntity):void
	{
		this._updateQueue[entity.id] = entity;
	}

	public updateEntity(entity:IEntity):void
	{
		entity._iInternalUpdate();

		if (entity.isEntity)
			this.updateNode(this.getAbstraction(entity));
	}

	public updateNode(node:DisplayObjectNode):void
	{
		var targetNode:IContainerNode = this.findParentForNode(node);

		if (node.parent != targetNode) {
			if (node.parent)
				node.parent.iRemoveNode(node);
			targetNode.iAddNode(node);
		}
	}

	public clearEntity(entity:IEntity):void
	{
		delete this._updateQueue[entity.id];

		if(entity.isEntity)
			this.clearNode(this.getAbstraction(entity));
	}

	public clearNode(node:DisplayObjectNode)
	{
		if (node.parent) {
			node.parent.iRemoveNode(node);
			node.parent = null;
		}
	}

	/**
	 *
	 * @param entity
	 * @returns {away.partition.NodeBase}
	 */
	public findParentForNode(node:DisplayObjectNode):IContainerNode
	{
		return this._rootNode;
	}

	private updateEntities():void
	{
		var entity:IEntity;

		//required for controllers with autoUpdate set to true and queued events
		for (var key in this._updateQueue)
			this.updateEntity(this._updateQueue[key]);

		//clear updateQueue
		this._updateQueue = {};
	}

	public dispose():void
	{
		//TODO
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerAbstraction(entityNodeClass:IEntityNodeClass, assetClass:IAssetClass):void
	{
		PartitionBase._abstractionClassPool[assetClass.assetType] = entityNodeClass;
	}
}