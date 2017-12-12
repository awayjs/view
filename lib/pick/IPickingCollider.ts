import {IMaterial, PickingCollision} from "@awayjs/renderer";

import {TriangleElements, LineElements} from "@awayjs/graphics";

import {Billboard} from "@awayjs/scene";

/**
 * Provides an interface for picking colliders that can be assigned to individual entities in a scene for specific picking behaviour.
 * Used with the <code>RaycastPicker</code> picking object.
 *
 * @see away.entities.Entity#pickingCollider
 * @see away.pick.RaycastPicker
 *
 * @interface away.pick.IPickingCollider
 */
export interface IPickingCollider
{

	/**
	 * Tests a <code>Billboard</code> object for a collision with the picking ray.
	 *
	 * @param billboard
	 * @param material
	 * @param pickingCollision
	 * @param shortestCollisionDistance
	 */
	testBillboardCollision(billboard:Billboard, material:IMaterial, pickingCollision:PickingCollision):boolean

	/**
	 * Tests a <code>TriangleElements</code> object for a collision with the picking ray.
	 *
	 * @param triangleElements
	 * @param material
	 * @param pickingCollision
	 * @param shortestCollisionDistance
	 */
	testTriangleCollision(triangleElements:TriangleElements, material:IMaterial, pickingCollision:PickingCollision, count:number, offset?:number):boolean

	/**
	 * Tests a <code>LineElements</code> object for a collision with the picking ray.
	 *
	 * @param lineElements
	 * @param material
	 * @param pickingCollision
	 * @param shortestCollisionDistance
	 */
	testLineCollision(lineElements:LineElements, material:IMaterial, pickingCollision:PickingCollision, count:number, offset?:number):boolean

}