import {IPartitionEntity} from "../base/IPartitionEntity";

import {EntityNode} from "./EntityNode";
import {PartitionBase} from "./PartitionBase";

/**
 * IPartitionEntityNodeClass is an interface for the constructable class definition EntityNode that is used to
 * create node objects in the partition pipeline that represent the contents of a Entity
 *
 * @class away.pool.IPartitionEntityNodeClass
 */
export interface IEntityNodeClass
{
	/**
	 *
	 */
	new(entity:IPartitionEntity, pool:PartitionBase):EntityNode;
}