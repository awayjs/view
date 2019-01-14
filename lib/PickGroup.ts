import {IAbstractionPool} from "@awayjs/core";



import {IPickingEntity} from "./base/IPickingEntity";
import { PickEntity } from './base/PickEntity';
import { RaycastPicker } from './pick/RaycastPicker';
import { PartitionBase } from './partition/PartitionBase';
import { BoundsPicker } from './pick/BoundsPicker';
import { TabPicker } from './pick/TabPicker';

import { View } from './View';

/**
 * @class away.pool.PickGroup
 */
export class PickGroup implements IAbstractionPool
{
	private static _instancePool:Object = new Object();
	private static _tabPickerPool:TabPickerPool;
	private _view:View;
	private _entityPool:Object = new Object();
	private _raycastPickerPool:RaycastPickerPool;
	private _boundsPickerPool:BoundsPickerPool;
	private _tabPickerPool:TabPickerPool;

	/**
	 * //TODO
	 *
	 * @param materialClassGL
	 */
	constructor(view:View)
	{
		this._view = view;
		this._raycastPickerPool = new RaycastPickerPool(this);
		this._boundsPickerPool = new BoundsPickerPool(this);
		this._tabPickerPool = PickGroup._tabPickerPool || (PickGroup._tabPickerPool = new TabPickerPool());
	}

	public static getInstance(view:View):PickGroup
	{
		return this._instancePool[view.id] || (this._instancePool[view.id] = new PickGroup(view));
	}

	public getAbstraction(entity:IPickingEntity):PickEntity
	{
		return this._entityPool[entity.id] || (this._entityPool[entity.id] = new PickEntity(this._view, entity, this));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(entity:IPickingEntity):void
	{
		delete this._entityPool[entity.id];
	}

	public getRaycastPicker(partition:PartitionBase):RaycastPicker
	{
		return this._raycastPickerPool.getAbstraction(partition);
	}

	public getBoundsPicker(partition:PartitionBase):BoundsPicker
	{
		return this._boundsPickerPool.getAbstraction(partition);
	}
	
	public getTabPicker(partition:PartitionBase):TabPicker
	{
		return this._tabPickerPool.getAbstraction(partition);
	}
}

class RaycastPickerPool implements IAbstractionPool
{
	private _abstractionPool:Object = new Object();
	private _pickGroup:PickGroup;

	constructor(pickGroup:PickGroup)
	{
		this._pickGroup = pickGroup;
	}

	/**
	 * //TODO
	 *
	 * @param entity
	 * @returns EntityNode
	 */
	public getAbstraction(partition:PartitionBase):RaycastPicker
	{
		return (this._abstractionPool[partition.id] || (this._abstractionPool[partition.id] = new RaycastPicker(this._pickGroup, partition, this)));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(partition:PartitionBase):void
	{
		delete this._abstractionPool[partition.id];
	}
}


class BoundsPickerPool implements IAbstractionPool
{
	private _abstractionPool:Object = new Object();
	private _pickGroup:PickGroup;

	constructor(pickGroup:PickGroup)
	{
		this._pickGroup = pickGroup;
	}

	/**
	 * //TODO
	 *
	 * @param entity
	 * @returns EntityNode
	 */
	public getAbstraction(partition:PartitionBase):BoundsPicker
	{
		return (this._abstractionPool[partition.id] || (this._abstractionPool[partition.id] = new BoundsPicker(this._pickGroup, partition, this)));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(partition:PartitionBase):void
	{
		delete this._abstractionPool[partition.id];
	}
}


class TabPickerPool implements IAbstractionPool
{
	private _abstractionPool:Object = new Object();

	constructor()
	{
	}

	/**
	 * //TODO
	 *
	 * @param entity
	 * @returns EntityNode
	 */
	public getAbstraction(partition:PartitionBase):TabPicker
	{
		return (this._abstractionPool[partition.id] || (this._abstractionPool[partition.id] = new TabPicker(partition, this)));
	}

	/**
	 *
	 * @param entity
	 */
	public clearAbstraction(partition:PartitionBase):void
	{
		delete this._abstractionPool[partition.id];
	}
}