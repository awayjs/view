import {MaterialBase}						from "@awayjs/graphics/lib/materials/MaterialBase";
import {TriangleElements}				from "@awayjs/graphics/lib/elements/TriangleElements";
import {LineElements}					from "@awayjs/graphics/lib/elements/LineElements";
import {PickingCollision}				from "@awayjs/graphics/lib/pick/PickingCollision";

import {Billboard}					from "@awayjs/display/lib/display/Billboard";

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
	testBillboardCollision(billboard:Billboard, material:MaterialBase, pickingCollision:PickingCollision):boolean

	/**
	 * Tests a <code>TriangleElements</code> object for a collision with the picking ray.
	 *
	 * @param triangleElements
	 * @param material
	 * @param pickingCollision
	 * @param shortestCollisionDistance
	 */
	testTriangleCollision(triangleElements:TriangleElements, material:MaterialBase, pickingCollision:PickingCollision, count:number, offset?:number):boolean

	/**
	 * Tests a <code>LineElements</code> object for a collision with the picking ray.
	 *
	 * @param lineElements
	 * @param material
	 * @param pickingCollision
	 * @param shortestCollisionDistance
	 */
	testLineCollision(lineElements:LineElements, material:MaterialBase, pickingCollision:PickingCollision, count:number, offset?:number):boolean

}