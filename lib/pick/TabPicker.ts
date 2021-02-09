import { Vector3D, AbstractionBase, IAbstractionPool } from '@awayjs/core';

import { IPartitionEntity } from '../base/IPartitionEntity';
import { PartitionBase } from '../partition/PartitionBase';
import { IPartitionTraverser } from '../partition/IPartitionTraverser';
import { INode } from '../partition/INode';

import { ITabEntity } from '../base/ITabEntity';
import { EntityNode } from '../partition/EntityNode';
import { IPartitionContainer } from '../base/IPartitionContainer';
import { IPartitionClass } from '../partition/IPartitionClass';
import { ContainerNode } from '../partition/ContainerNode';

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export class TabPicker extends AbstractionBase implements IPartitionTraverser {
	protected _partition: PartitionBase;
	protected _entity: ContainerNode;

	public get partition(): PartitionBase {
		return this._partition;
	}

	/**
     *
     * @returns {IPartitionEntity}
     */
	public get entity(): ContainerNode {
		return this._entity;
	}

	private _tabNodes: EntityNode[] = [];
	private _customTabNodes: EntityNode[][] = [];
	private _customTabNodesSorted: EntityNode[] = [];

	/**
	 * Creates a new <code>RaycastPicker</code> object.
	 *
	 * @param findClosestCollision Determines whether the picker searches for the closest bounds collision along the ray,
	 * or simply returns the first collision encountered. Defaults to false.
	 */
	constructor(partition: PartitionBase, pool: IAbstractionPool) {
		super(partition, pool);

		this._partition = partition;
		this._entity = partition.rootNode;
	}

	private sortTabEnabledEntities(): void {
		if (this._customTabNodes.length <= 0 && this._tabNodes.length <= 0)
			return;

		const snapGridY: number = 10;
		let len: number = 0;
		const orderedOnY: EntityNode[][] = [];
		let i: number = 0;
		let e: number = 0;
		if (this._customTabNodes.length > 0) {

			while (i < this._customTabNodes.length) {
				if (this._customTabNodes[i]) {
					this._customTabNodes[i] = this._customTabNodes[i].reverse();
				}

				i++;
			}
			return;
		}

		//  first sort into rows based on global y-position, snapping y-positions to a grid
		//  than sort the rows by global x-position
		len = this._tabNodes.length;
		for (i = 0; i < len; i++) {
			const enabledNode = this._tabNodes[i];
			const scenePosition: Vector3D = enabledNode.parent.getMatrix3D().position;
			//console.log("enabledEntity.scenePosition.y", scenePosition.y);
			const ySnappedToGrid = Math.floor(scenePosition.y / snapGridY);
			if (orderedOnY.length <= ySnappedToGrid) {
				orderedOnY.length = ySnappedToGrid + 1;
			}
			if (!orderedOnY[ySnappedToGrid])
				orderedOnY[ySnappedToGrid] = [];
			orderedOnY[ySnappedToGrid].push(enabledNode);
		}

		this._tabNodes.length = 0;
		for (i = 0; i < orderedOnY.length; i++) {
			let entityRow = orderedOnY[i];
			if (entityRow) {
				//console.log("entityRow", entityRow.length);
				entityRow = entityRow.sort(function(a, b) {
					return a.parent.getMatrix3D().position.x > b.parent.getMatrix3D().position.x ? 1 : -1;
				});
				for (e = 0; e < entityRow.length; e++) {

					//console.log("2enabledEntity.scenePosition.y", entityRow[e].transform.concatenatedMatrix3D.position.y);
					//console.log("2enabledEntity.scenePosition.x", entityRow[e].transform.concatenatedMatrix3D.position.x);
					this._tabNodes[this._tabNodes.length] = entityRow[e];
				}
			}
		}

	}

	public traverse(): void {
		this._tabNodes.length = 0;
		this._customTabNodes.length = 0;
		this._customTabNodesSorted.length = 0;
		this._partition.traverse(this);

		this.sortTabEnabledEntities();
		this._invalid = false;
	}

	public getTraverser(partition: PartitionBase): IPartitionTraverser {
		return this;
	}

	public getNextTabEntity(currentFocus: EntityNode): EntityNode {
		if (this._invalid)
			this.traverse();

		if (this._customTabNodes.length <= 0 && this._tabNodes.length <= 0)
			return currentFocus;

		if (this._customTabNodes.length > 0) {
			var i: number = 0;
			let i2: number = 0;
			let t: number = 0;
			let t2: number = 0;
			if (currentFocus) {
				while (i < this._customTabNodes.length) {
					if (this._customTabNodes[i]) {
						for (t = 0; t < this._customTabNodes[i].length; t++) {
							if (this._customTabNodes[i][t] == currentFocus) {
								t2 = t + 1;
								while (t2 < this._customTabNodes[i].length) {
									if (this._customTabNodes[i][t2])
										return this._customTabNodes[i][t2];
									t2++;
								}
								i2 = i + 1;
								while (i2 < this._customTabNodes.length) {
									if (this._customTabNodes[i2]) {
										for (t2 = 0; t2 < this._customTabNodes[i2].length; t2++) {
											if (this._customTabNodes[i2][t2])
												return this._customTabNodes[i2][t2];
										}
									}
									i2++;
								}
								i2 = 0;
								while (i2 < this._customTabNodes.length) {
									if (this._customTabNodes[i2]) {
										for (t2 = 0; t2 < this._customTabNodes[i2].length; t2++) {
											if (this._customTabNodes[i2][t2])
												return this._customTabNodes[i2][t2];
										}
									}
									i2++;
								}
							}
						}
					}
					i++;
				}
			}
			i2 = 0;
			while (i2 < this._customTabNodes.length) {
				if (this._customTabNodes[i2]) {
					for (t2 = 0; t2 < this._customTabNodes[i2].length; t2++) {
						if (this._customTabNodes[i2][t2])
							return this._customTabNodes[i2][t2];
					}
				}
				i2++;
			}
			return currentFocus;
		}
		const len: number = this._tabNodes.length;
		for (var i: number = 0; i < len; i++) {
			if (this._tabNodes[i] == currentFocus) {
				if (i == len - 1) {
					return this._tabNodes[0];
				}
				return this._tabNodes[i + 1];
			}
		}
		// this point we would already have exit out if tabEntities.length was 0
		return this._tabNodes[0];

	}

	public getPrevTabEntity(currentFocus: EntityNode): EntityNode {
		if (this._invalid)
			this.traverse();

		if (this._customTabNodes.length <= 0 && this._tabNodes.length <= 0)
			return currentFocus;

		if (this._customTabNodes.length > 0) {
			var i: number = this._customTabNodes.length;
			let i2: number = 0;
			let t: number = 0;
			let t2: number = 0;
			if (currentFocus) {
				while (i > 0) {
					i--;
					if (this._customTabNodes[i]) {
						for (t = this._customTabNodes[i].length - 1; t >= 0; t--) {
							if (this._customTabNodes[i][t] == currentFocus) {
								t2 = t - 1;
								while (t2 > 0) {
									t2--;
									if (this._customTabNodes[i][t2])
										return this._customTabNodes[i][t2];
								}
								i2 = i - 1;
								while (i2 > 0) {
									i2--;
									if (this._customTabNodes[i2]) {
										for (t2 = this._customTabNodes[i2].length - 1;t2 >= 0; t2--) {
											if (this._customTabNodes[i2][t2])
												return this._customTabNodes[i2][t2];
										}
									}
								}
								i2 = this._customTabNodes.length;
								while (i2 > 0) {
									i2--;
									if (this._customTabNodes[i2]) {
										for (t2 = this._customTabNodes[i2].length - 1; t2 >= 0; t2--) {
											if (this._customTabNodes[i2][t2])
												return this._customTabNodes[i2][t2];
										}
									}
								}
							}
						}
					}
				}
			}
			i2 = this._customTabNodes.length - 1;
			while (i2 > 0) {
				i2--;
				if (this._customTabNodes[i2]) {
					for (t2 = this._customTabNodes[i2].length - 1;t2 >= 0; t2--) {
						if (this._customTabNodes[i2][t2])
							return this._customTabNodes[i2][t2];
					}
				}
			}
			return currentFocus;
		}
		if (currentFocus) {
			const len: number = this._tabNodes.length;
			for (var i: number = len - 1; i >= 0; i--) {
				if (this._tabNodes[i] == currentFocus) {
					if (i == 0) {
						return this._tabNodes[this._tabNodes.length - 1];
					}
					return this._tabNodes[i - 1];
				}
			}
		}
		// this point we would already have exit out if tabEntities.length was 0
		return this._tabNodes[0];

	}

	/**
	 * Returns true if the current node is at least partly in the frustum. If so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	public enterNode(node: INode): boolean {
		if (node.isInvisible())
			return false;
		return true;
	}

	public dispose(): void {
		//TODO
	}

	/**
	 *
	 * @param entity
	 */
	public applyEntity(entity: EntityNode): void {
		const tabNode = entity;
		const tabEntity = <ITabEntity> tabNode.entity;
		if (tabEntity.tabEnabled) {
			if (tabEntity.assetType != '[asset TextField]' || (<any> tabEntity).type == 'input') {
				// add the entity to the correct tab list.
				if (tabEntity.tabIndex >= 0) {
					if (this._customTabNodes.length < tabEntity.tabIndex)
						this._customTabNodes.length = tabEntity.tabIndex;
					if (!this._customTabNodes[tabEntity.tabIndex]) {
						this._customTabNodes[tabEntity.tabIndex] = [];
					}
					this._customTabNodes[tabEntity.tabIndex].push(tabNode);
				} else {
					this._tabNodes[this._tabNodes.length] = tabNode;
				}

			}
		}
	}
}