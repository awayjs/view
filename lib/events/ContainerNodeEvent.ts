import { EventBase } from '@awayjs/core';

export class ContainerNodeEvent extends EventBase {

	/**
	 *
	 */
	public static INVALIDATE_MATRIX3D: string = 'invalidateMatrix3D';
	public static INVALIDATE_COLOR_TRANSFORM: string = 'invalidateColorTransform';

	/**
	 * A child was added, removed or reparented, renderToImage toggled, or a
	 * mask assignment changed. Not fired for transform or filter updates.
	 */
	public static INVALIDATE_STRUCTURE: string = 'invalidateStructure';

	constructor(type: string) {
		super(type);
	}

	/**
	 * Clones the event.
	 * @return An exact duplicate of the current object.
	 */
	public clone(): ContainerNodeEvent {
		return new ContainerNodeEvent(this.type);
	}
}
