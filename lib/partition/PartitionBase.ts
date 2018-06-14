import {IAssetClass, IAbstractionPool, ProjectionEvent} from "@awayjs/core";

import {TraverserBase, IContainerNode, IEntity} from "@awayjs/renderer";

import {EntityNode} from "./EntityNode";
import {IEntityNodeClass} from "./IEntityNodeClass";
import {DisplayObjectNode} from "./DisplayObjectNode";
import { View } from '../View';

/**
 * @class away.partition.Partition
 */
export class PartitionBase implements IAbstractionPool
{
	private _onProjectionMatrixChangedDelegate:(event:ProjectionEvent) => void;
	
	private static _abstractionClassPool:Object = new Object();

	private _abstractionPool:Object = new Object();
	
	public _root:IEntity;
	public _view:View;
	public _rootNode:IContainerNode;

	private _updateQueue:Object = {};

	public get root():IEntity
	{
		return this._root;
	}

	public get view():View
	{
		return this._view;
	}
	
	constructor(root:IEntity, view:View)
	{
		this._root = root;
		this._view = view;

		this._onProjectionMatrixChangedDelegate = (event:ProjectionEvent) => this._onProjectionMatrixChanged(event);
		this._view.camera.projection.addEventListener(ProjectionEvent.MATRIX_CHANGED, this._onProjectionMatrixChangedDelegate);
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
		delete this._abstractionPool[entity.id];
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
		//required for controllers with autoUpdate set to true and queued events
		entity._iInternalUpdate(this._view.camera.projection);

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

	private _onProjectionMatrixChanged(event:ProjectionEvent):void
	{
		var entity:IEntity;

		//add all existing entities to the updateQueue
		for (var key in this._abstractionPool) {
			entity = this._abstractionPool[key]._entity;
			this._updateQueue[entity.id] = entity;
		}
	}
}