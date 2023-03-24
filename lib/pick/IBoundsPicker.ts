import { Box, Vector3D, Sphere, IEventDispatcher, Matrix3D } from '@awayjs/core';
import { BoundingVolumeBase } from '../bounds/BoundingVolumeBase';
import { ContainerNode } from '../partition/ContainerNode';
import { INode } from '../partition/INode';

/**
 * Provides an interface for picking objects that can pick 3d objects from a view or scene.
 *
 * @interface away.pick.IBoundsPicker
 */
export interface IBoundsPicker extends IEventDispatcher
{
	node: ContainerNode;

	addBoundingVolume(boundingVolume: BoundingVolumeBase): void

	removeBoundingVolume(boundingVolume: BoundingVolumeBase): void

	_hitTestPointInternal(rootEntity: INode, x: number, y: number, shapeFlag?: boolean, maskFlag?: boolean): boolean

	_getBoxBoundsInternal(matrix3D?: Matrix3D, strokeFlag?: boolean, fastFlag?: boolean, cache?: Box, target?: Box): Box

	_getSphereBoundsInternal(center?: Vector3D, matrix3D?: Matrix3D, strokeFlag?: boolean, fastFlag?: boolean, cache?: Sphere, target?: Sphere): Sphere

}