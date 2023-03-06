import { EventBase } from '@awayjs/core';
import { IPartitionContainer } from '../base/IPartitionContainer';
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
	public static UPDATE_ENTITY: string = 'updateEntity';

	/**
	 * 
	 */
	public readonly container: IPartitionContainer;

	/**
	 *
	 */
	public readonly index: number;

	constructor(type: string, container: IPartitionContainer = null, index: number = null) {
		super(type);

		this.container = container;

		this.index = index;
	}

	/**
	 * Clones the event.
	 * @return An exact duplicate of the current object.
	 */
	public clone(): ContainerEvent {
		return new ContainerEvent(this.type, this.container, this.index);
	}
}