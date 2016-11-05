import {AssetEvent}					from "@awayjs/core/lib/events/AssetEvent";
import {IAbstractionPool}				from "@awayjs/core/lib/library/IAbstractionPool";
import {AbstractionBase}				from "@awayjs/core/lib/library/AbstractionBase";

import {Plane3D}						from "@awayjs/core/lib/geom/Plane3D";
import {Vector3D}						from "@awayjs/core/lib/geom/Vector3D";

import {TraverserBase}				from "@awayjs/graphics/lib/base/TraverserBase";
import {INode}						from "@awayjs/graphics/lib/base/INode";
import {IEntity}				from "@awayjs/graphics/lib/base/IEntity";

import {DisplayObjectEvent}			from "@awayjs/scene/lib/events/DisplayObjectEvent";
import {AxisAlignedBoundingBox}		from "@awayjs/scene/lib/bounds/AxisAlignedBoundingBox";
import {BoundingSphere}				from "@awayjs/scene/lib/bounds/BoundingSphere";
import {BoundingVolumeBase}			from "@awayjs/scene/lib/bounds/BoundingVolumeBase";
import {BoundsType}					from "@awayjs/scene/lib/bounds/BoundsType";
import {NullBounds}					from "@awayjs/scene/lib/bounds/NullBounds";

import {SceneGraphNode}				from "../partition/SceneGraphNode";

/**
 * @class away.partition.EntityNode
 */
export class DisplayObjectNode extends AbstractionBase implements INode
{
	public numEntities:number = 0;

	public isSceneGraphNode:boolean = false;

	public _iUpdateQueueNext:DisplayObjectNode;

	private _onInvalidatePartitionBoundsDelegate:(event:DisplayObjectEvent) => void;
	
	public _entity:IEntity;
	private _boundsDirty:boolean = true;
	private _bounds:BoundingVolumeBase;

	public _iCollectionMark:number;// = 0;

	public parent:SceneGraphNode;

	private _boundsType:string;

	public get debugVisible():boolean
	{
		return this._entity.debugVisible;
	}

	/**
	 * @internal
	 */
	public get bounds():BoundingVolumeBase
	{
		if (this._boundsDirty)
			this._updateBounds();

		return this._bounds;
	}

	constructor(entity:IEntity, pool:IAbstractionPool)
	{
		super(entity, pool);

		this._onInvalidatePartitionBoundsDelegate = (event:DisplayObjectEvent) => this._onInvalidatePartitionBounds(event);

		this._entity = entity;
		this._entity.addEventListener(DisplayObjectEvent.INVALIDATE_PARTITION_BOUNDS, this._onInvalidatePartitionBoundsDelegate);

		this._boundsType = this._entity.boundsType;
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

		if (this._bounds)
			this._bounds.dispose();

		this._bounds = null;
	}

	public onInvalidate(event:AssetEvent):void
	{
		super.onInvalidate(event);

		if (this._boundsType != this._entity.boundsType) {
			this._boundsType = this._entity.boundsType;
			this._boundsDirty = true;
		}
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
		traverser.applyEntity(this.bounds.boundsPrimitive);
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

	private _updateBounds():void
	{
		if (this._bounds)
			this._bounds.dispose();

		if (this._boundsType == BoundsType.AXIS_ALIGNED_BOX)
			this._bounds = new AxisAlignedBoundingBox(this._entity);
		else if (this._boundsType == BoundsType.SPHERE)
			this._bounds = new BoundingSphere(this._entity);
		else if (this._boundsType == BoundsType.NULL)
			this._bounds = new NullBounds();

		this._boundsDirty = false;
	}
}