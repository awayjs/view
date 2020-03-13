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
	public static get instancePool():Object {return PickGroup._instancePool};
	
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

	public static clearAllInstances():void
	{
		for(var key in this._instancePool){
			(this._instancePool[key] as PickGroup).clearAll();
			delete this._instancePool[key];
		}
	}

	public static getInstance(view:View):PickGroup
	{
		return this._instancePool[view.id] || (this._instancePool[view.id] = new PickGroup(view));
	}
	
	public static clearInstance(view:View):void
	{
		var pickGroup:PickGroup = this._instancePool[view.id];

		if (pickGroup) {
			pickGroup.clearAll();

			delete this._instancePool[view.id];
		}
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

	/**
	 * Clears the resources used by the PickGroup.
	 */
	public clearAll():void
	{
		//clear all entities associated with this pick group
		for (var key in this._entityPool)
			(this._entityPool[key] as PickEntity).onClear(null);

		this._raycastPickerPool.clearAll();
		this._boundsPickerPool.clearAll();
		this._tabPickerPool.clearAll();
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

	/**
	 * Clears the resources used by the RaycastPickerPool.
	 */
	public clearAll():void
	{
		//clear all raycastpickers associated with this pool
		for (var key in this._abstractionPool)
			(this._abstractionPool[key] as RaycastPicker).onClear(null);
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

	/**
	 * Clears the resources used by the BoundsPickerPool.
	 */
	public clearAll():void
	{
		//clear all boundspickers associated with this pool
		for (var key in this._abstractionPool)
			(this._abstractionPool[key] as BoundsPicker).onClear(null);
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
	
	/**
	 * Clears the resources used by the TabPickerPool.
	 */
	public clearAll():void
	{
		//clear all tabpickers associated with this pool
		for (var key in this._abstractionPool)
			(this._abstractionPool[key] as TabPicker).onClear(null);
	}
}