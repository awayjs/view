import { IAsset } from '@awayjs/core';
import { _Pick_PickableBase } from './_Pick_PickableBase';

/**
 * IPickable provides an interface for objects that can use materials.
 *
 * @interface away.base.IAsset
 */
export interface IPickable extends IAsset
{
	_pickObjects: Record<number, _Pick_PickableBase>;
}