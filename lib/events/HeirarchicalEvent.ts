import { EventBase } from '@awayjs/core';
import { HierarchicalProperty } from '../base/HierarchicalProperty';

export class HeirarchicalEvent extends EventBase {

	/**
	 *
	 */
	public static INVALIDATE_PROPERTY: string = 'invalidateProperty';

	public readonly property: HierarchicalProperty;

	constructor(type: string, property: HierarchicalProperty) {
		super(type);

		this.property = property;
	}

	/**
	 * Clones the event.
	 * @return An exact duplicate of the current object.
	 */
	public clone(): HeirarchicalEvent {
		return new HeirarchicalEvent(this.type, this.property);
	}
}