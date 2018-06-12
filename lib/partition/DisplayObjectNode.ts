import {AssetEvent, IAbstractionPool, AbstractionBase, Plane3D, Vector3D} from "@awayjs/core";

import {TraverserBase, INode} from "@awayjs/renderer";

import {DisplayObjectEvent, DisplayObject} from "@awayjs/scene";

import {SceneGraphNode} from "./SceneGraphNode";

/**
 * @class away.partition.EntityNode
 */
export class DisplayObjectNode extends AbstractionBase implements INode
{
	public numEntities:number = 0;

	public isSceneGraphNode:boolean = false;

	public _iUpdateQueueNext:DisplayObjectNode;

	private _onInvalidatePartitionBoundsDelegate:(event:DisplayObjectEvent) => void;
	
	public _entity:DisplayObject;

	public _iCollectionMark:number;// = 0;

	public parent:SceneGraphNode;

	private _boundsType:string;

	public get debugVisible():boolean
	{
		return this._entity.debugVisible;
	}

	constructor(entity:DisplayObject, pool:IAbstractionPool)
	{
		super(entity, pool);

		this._onInvalidatePartitionBoundsDelegate = (event:DisplayObjectEvent) => this._onInvalidatePartitionBounds(event);

		this._entity = entity;
		this._entity.addEventListener(DisplayObjectEvent.INVALIDATE_PARTITION_BOUNDS, this._onInvalidatePartitionBoundsDelegate);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return this._entity.castsShadows;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isMask():boolean
	{
		return this._entity.maskMode;
	}

	public onClear(event:AssetEvent):void
	{
		super.onClear(event);

		this._entity.removeEventListener(DisplayObjectEvent.INVALIDATE_PARTITION_BOUNDS, this._onInvalidatePartitionBoundsDelegate);
		this._entity = null;
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		return true;
	}


	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(rayPosition:Vector3D, rayDirection:Vector3D):boolean
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
	
	public renderBounds(traverser:TraverserBase):void
	{
		traverser.applyEntity(this._entity.getBoundingVolume().boundsPrimitive);
	}
	

	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:TraverserBase):void
	{
		// do nothing here
	}

	public _onInvalidatePartitionBounds(event:DisplayObjectEvent):void
	{
		// do nothing here
	}
}