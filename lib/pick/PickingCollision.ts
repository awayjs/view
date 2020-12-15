import { Point, Vector3D } from '@awayjs/core';

import { IPickingEntity } from '../base/IPickingEntity';
import { ITraversable } from '../base/ITraversable';
import { IPartitionEntity } from '../base/IPartitionEntity';
import { PickGroup } from '../PickGroup';

/**
 * Value object ___ for a picking collision returned by a picking collider. Created as unique objects on display objects
 *
 * @see away.base.DisplayObject#pickingCollision
 *
 * @class away.pick.PickingCollision
 */
export class PickingCollision {
	/**
	 *
	 */
	public pickerEntity: IPickingEntity;

	/**
	 * The entity to which this collision object belongs.
	 */
	public entity: IPartitionEntity;

	/**
	 * The pickGroup to which this collision object belongs.
	 */
	public pickGroup: PickGroup;

	/**
	 * The traversable associated with a collision.
	 */
	public traversable: ITraversable;

	/**
	 * The local position of the collision on the renderable's surface.
	 */
	public position: Vector3D;

	/**
	 * The local normal vector at the position of the collision.
	 */
	public normal: Vector3D = new Vector3D();

	/**
	 * The uv coordinate at the position of the collision.
	 */
	public uv: Point;

	/**
	 * The index of the element where the collision took place.
	 */
	public elementIndex: number;

	/**
	 * The starting position of the colliding ray in local coordinates.
	 */
	public rayPosition: Vector3D = new Vector3D();

	/**
	 * The direction of the colliding ray in local coordinates.
	 */
	public rayDirection: Vector3D = new Vector3D();

	/**
	 * The starting position of the colliding ray in scene coordinates.
	 */
	public globalRayPosition: Vector3D;

	/**
	 * The direction of the colliding ray in scene coordinates.
	 */
	public globalRayDirection: Vector3D;

	/**
	 * Determines if the ray position is contained within the entity bounds.
	 */
	public rayOriginIsInsideBounds: boolean;

	/**
	 * The distance along the ray from the starting position to the calculated intersection entry point with the entity.
	 */
	public rayEntryDistance: number;

	/**
	 * Creates a new <code>PickingCollision</code> object.
	 *
	 * @param entity The entity to which this collision object belongs.
	 */
	constructor(entity: IPartitionEntity, pickGroup: PickGroup) {
		this.entity = entity;
		this.pickGroup = pickGroup;
	}
}