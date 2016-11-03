import {IAssetClass}					from "@awayjs/core/lib/library/IAssetClass";

import {TraverserBase}				from "@awayjs/graphics/lib/base/TraverserBase";
import {IContainerNode}				from "@awayjs/graphics/lib/base/IContainerNode";
import {IEntity}				from "@awayjs/graphics/lib/base/IEntity";

import {EntityNode}					from "../partition/EntityNode";
import {IEntityNodeClass}				from "../partition/IEntityNodeClass";
import {DisplayObjectNode}			from "../partition/DisplayObjectNode";

/**
 * @class away.partition.Partition
 */
export class PartitionBase
{
	private static _abstractionClassPool:Object = new Object();

	private _abstractionPool:Object = new Object();
	
	public _root:IEntity;
	public _rootNode:IContainerNode;

	private _updatesMade:Boolean = false;
	private _updateQueue:DisplayObjectNode;

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
		if (this._updatesMade)
			this.updateEntities();

		if (this._rootNode)
			this._rootNode.acceptTraverser(traverser);
	}

	public iMarkForUpdate(node:DisplayObjectNode):void
	{
		var t:DisplayObjectNode = this._updateQueue;

		while (t) {
			if (node == t)
				return;

			t = t._iUpdateQueueNext;
		}

		node._iUpdateQueueNext = this._updateQueue;

		this._updateQueue = node;
		this._updatesMade = true;
	}

	public iRemoveEntity(node:DisplayObjectNode):void
	{
		var t:DisplayObjectNode;

		if (node.parent) {
			node.parent.iRemoveNode(node);
			node.parent = null;
		}


		if (node == this._updateQueue) {
			this._updateQueue = node._iUpdateQueueNext;
		} else {
			t = this._updateQueue;
			while (t && t._iUpdateQueueNext != node)
				t = t._iUpdateQueueNext;

			if (t)
				t._iUpdateQueueNext = node._iUpdateQueueNext;
		}

		node._iUpdateQueueNext = null;

		if (!this._updateQueue)
			this._updatesMade = false;
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
		var node:DisplayObjectNode = this._updateQueue;
		while (node) {
			//required for controllers with autoUpdate set to true and queued events
			node._entity._iInternalUpdate();
			node = node._iUpdateQueueNext;
		}

		//reset head
		node = this._updateQueue;
		var targetNode:IContainerNode;
		var t:DisplayObjectNode;
		this._updateQueue = null;
		this._updatesMade = false;

		do {
			targetNode = this.findParentForNode(node);

			if (node.parent != targetNode) {
				if (node.parent)
					node.parent.iRemoveNode(node);
				targetNode.iAddNode(node);
			}

			t = node._iUpdateQueueNext;
			node._iUpdateQueueNext = null;

		} while ((node = t) != null);
	}

	/**
	 * @internal
	 */
	public _iRegisterEntity(entity:IEntity):void
	{
		if (entity.isEntity)
			this.iMarkForUpdate(this.getAbstraction(entity));
	}

	/**
	 * @internal
	 */
	public _iUnregisterEntity(entity:IEntity):void
	{
		if (entity.isEntity)
			this.iRemoveEntity(this.getAbstraction(entity));
	}

	public dispose()
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