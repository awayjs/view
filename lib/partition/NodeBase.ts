import {Plane3D, Vector3D, AbstractMethodError} from "@awayjs/core";

import {IPartitionEntity} from "../base/IPartitionEntity";

import {IPartitionTraverser} from "./IPartitionTraverser";
import {INode} from "./INode";
import {IContainerNode} from "./IContainerNode";
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';

/**
 * @class away.partition.NodeBase
 */
export class NodeBase implements IContainerNode
{
	protected _entity:IPartitionEntity;
	protected _partition:PartitionBase;
	protected _childNodes:Array<INode> = new Array<INode>();
	protected _numChildNodes:number = 0;

	protected _debugEntity:IPartitionEntity;

	public _collectionMark:number;// = 0;

	public parent:IContainerNode;

	public get pickObject():IPartitionEntity
	{
		return this._entity.pickObject;
	}

	public get boundsVisible():boolean
	{
		return false;
	}

	public getBoundsPrimitive(pickGroup:PickGroup):IPartitionEntity
	{
		throw new AbstractMethodError();
	}

	constructor(entity:IPartitionEntity, partition:PartitionBase)
	{
		this._entity = entity;
		this._partition = partition;
	}
	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 * @internal
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		return true;
	}

	public isVisible():boolean
	{
		return true;
	}

	/**
	 *
	 * @param rayPosition
	 * @param rayDirection
	 * @returns {boolean}
	 */
	public isIntersectingRay(rootEntity:IPartitionEntity, rayPosition:Vector3D, rayDirection:Vector3D, pickGroup:PickGroup):boolean
	{
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable():boolean
	{
		return true;
	}
	
	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return true;
	}


	/**
	 *
	 * @returns {boolean}
	 */
	public isMask():boolean
	{
		return false;
	}

	public dispose():void
	{
		this.parent = null;
		this._childNodes = null;
	}

	/**
	 *
	 * @param traverser
	 */
	public acceptTraverser(traverser:IPartitionTraverser):void
	{
		if (this._partition.root == this._entity)
			this._partition.updateEntities();

		//get the sub-traverser for the partition, if different, terminate this traversal
		if (traverser.partition != this._partition && traverser != traverser.getTraverser(this._partition))
			return;

		if (traverser.enterNode(this)) {
			for (var i:number = 0; i < this._numChildNodes; i++)
				this._childNodes[i].acceptTraverser(traverser);
		}
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iAddNode(node:INode):void
	{
		node.parent = this;
		
		this._childNodes[ this._numChildNodes++ ] = node;
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iRemoveNode(node:INode):void
	{
		var index:number = this._childNodes.indexOf(node);
		this._childNodes[index] = this._childNodes[--this._numChildNodes];
		this._childNodes.pop();
	}
}