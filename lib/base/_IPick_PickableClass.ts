import { _Pick_PickableBase } from './_Pick_PickableBase';

/**
 * IMaterialClassGL is an interface for the constructable class definition GL_MaterialBase that is used to
 * create render objects in the rendering pipeline to render the contents of a partition
 *
 * @class away.render.GL_MaterialBase
 */
export interface _IPick_PickableClass
{
	/**
	 *
	 */
	new(): _Pick_PickableBase;
}