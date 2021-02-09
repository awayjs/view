import { IPartitionContainer } from './IPartitionContainer';
import { IPartitionEntity } from './IPartitionEntity';

export interface ITabEntity extends IPartitionContainer
{
	
	tabEnabled: boolean;
	tabIndex: number;
}