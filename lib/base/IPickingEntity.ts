import { IPartitionEntity } from './IPartitionEntity';
import { BoundingVolumeType } from '../bounds/BoundingVolumeType';


export interface IPickingEntity extends IPartitionEntity
{
	_startDrag():void;

	_stopDrag():void;

	isDragEntity():boolean;
}