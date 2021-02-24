import { IPartitionContainer } from './IPartitionContainer';

export interface ITabEntity extends IPartitionContainer
{

	tabEnabled: boolean;
	tabIndex: number;
}