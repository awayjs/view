import {Vector3D} from "@awayjs/core";

import {PickingCollision} from "@awayjs/renderer";

import {View} from "../View";

/**
 * Provides an interface for picking objects that can pick 3d objects from a view or scene.
 *
 * @interface away.pick.IPicker
 */
export interface IPicker
{
	/**
	 * Gets the collision object from the scene position and direction of the picking ray.
	 *
	 * @param position The position of the picking ray in scene-space.
	 * @param direction The direction of the picking ray in scene-space.
	 * @param scene The scene on which the picking object acts.
	 */
	getCollision(position:Vector3D, direction:Vector3D, view:View):PickingCollision;

	/**
	 * Determines whether the picker takes account of the mouseEnabled properties of entities. Defaults to true.
	 */
	onlyMouseEnabled:boolean; // GET / SET

	/**
	 * Disposes memory used by the IPicker object
	 */
	dispose();
}