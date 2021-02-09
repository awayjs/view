import { EventBase } from '@awayjs/core';
import { IPartitionEntity } from '../base/IPartitionEntity';

export class ContainerEvent extends EventBase {

	/**
	 *
	 */
	public static ADD_CHILD_AT: string = 'addChildAt';

	/**
	 * 
	 */
	public static REMOVE_CHILD_AT: string = 'removeChildAt';

	/**
	 * 
	 */
	public static INVALIDATE_ENTITY: string = 'invalidateEntity';

	/**
	 * 
	 */
	public static CLEAR_ENTITY: string = 'clearEntity';

	/**
	 * 
	 */
	public readonly entity: IPartitionEntity;

	/**
	 * 
	 */
	public readonly index: number;

	constructor(type: string, entity:IPartitionEntity = null, index: number = null) {
		super(type);

		this.entity = entity;

		this.index = index;
	}

	/**
	 * Clones the event.
	 * @return An exact duplicate of the current object.
	 */
	public clone(): ContainerEvent {
		return new ContainerEvent(this.type, this.entity, this.index);
	}
}