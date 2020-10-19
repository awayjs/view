import { IPartitionEntity } from './IPartitionEntity';

export interface IPickingEntity extends IPartitionEntity
{
	_startDrag(): void;

	_stopDrag(): void;

	isDragEntity(): boolean;
}