import {
	IAssetClass,
	IAbstractionPool,
	AssetBase,
	IAbstractionClass,
	IAsset,
	PerspectiveProjection,
	CoordinateSystem,
	Transform,
	Vector3D,
} from '@awayjs/core';

import { IPartitionTraverser } from './IPartitionTraverser';
import { ContainerNode } from './ContainerNode';
import { EntityNode } from './EntityNode';
import { INode } from './INode';
import { View } from '../View';

/**
 * @class away.partition.Partition
 */
export class PartitionBase extends AssetBase implements IAbstractionPool {
	private static _abstractionClassPool: Record<string, IAbstractionClass> = {};
	private static _defaultProjection: PerspectiveProjection;

	private _invalid: boolean;
	private _localNode: ContainerNode;
	private _children: Array<PartitionBase> = new Array<PartitionBase>();
	private _updateQueue: Record<number, EntityNode> = {};

	protected _rootNode: ContainerNode;
	protected _parent: PartitionBase;

	public get parent(): PartitionBase {
		return this._parent;
	}

	public get rootNode(): ContainerNode {
		return <ContainerNode> this._rootNode;
	}

	constructor(rootNode: ContainerNode) {
		super();

		this._rootNode = rootNode;
	}

	public getLocalNode(): ContainerNode {

		if (!this._localNode) {
			/**
			* projection is not simple object
			* not needed spawn it for every cached partition
			* it has 3 matrices = 100 bytes + Transform,
			* that have 4 matrices + a lot of vectors (16 bytes) = 300 bytes,
			* And this is under heavy extending. 1 projection allocate more that 4kb per instance
			*/
			let projection = PartitionBase._defaultProjection;
			if (!projection) {
				projection = new PerspectiveProjection();
				projection.coordinateSystem = CoordinateSystem.LEFT_HANDED;
				projection.originX = -1;
				projection.originY = -1;
				projection.transform = new Transform();
				projection.transform.moveTo(0, 0, -1000);
				projection.transform.lookAt(new Vector3D());
			}

			const view = new View(projection, this._rootNode.view.stage);
			view.backgroundAlpha = 0;

			this._localNode = view.getNode(this._rootNode.container);
			this._localNode.transformDisabled = true;
			this.addChild(this._localNode.partition);
		}

		return this._localNode;
	}

	public clearLocalNode(): void {
		if (this._localNode) {
			this.removeChild(this._localNode.partition);
			this._localNode.onClear(null);
			this._localNode = null;
		}
	}

	public addChild(child: PartitionBase): void {
		this._children.push(child);

		child.setParent(this);

		// this.updateNode(child.rootNode);
		this.invalidate();
	}

	public removeChild(child: PartitionBase): void {

		//child.clear();

		this._children.splice(this._children.indexOf(child), 1)[0];

		child.setParent(null);

		// this._rootNode.removeNode(child.rootNode);
		this.invalidate();
	}

	public setParent(parent: PartitionBase): void {
		this._parent = parent;
	}

	public traverse(traverser: IPartitionTraverser): void {
		this._rootNode.acceptTraverser(traverser);
	}

	public invalidateEntity(entityNode: EntityNode): void {
		this.invalidate();

		this._updateQueue[entityNode.id] = entityNode;
	}

	public updateEntity(entityNode: EntityNode): void {
		//TODO: remove reliance on view
		//required for controllers with autoUpdate set to true and queued events
		entityNode.parent.container._iInternalUpdate();

		this.updateNode(entityNode);
	}

	public updateNode(node: INode): void {
		//const targetNode: ContainerNode = this.findParentForNode(node);

		// if (targetNode && node.parent != targetNode) {
		// 	if (node.parent)
		// 		node.parent.removeNode(node);
		// 	targetNode.addNode(node);
		// }
	}

	public clearEntity(entityNode: EntityNode): void {
		this.invalidate();

		delete this._updateQueue[entityNode.id];

		// const node: INode = entity.getAbstraction<EntityNode>(this);
		// node.parent.removeNode(node);
	}

	/**
	 *
	 * @param entity
	 * @returns {away.partition.NodeBase}
	 */
	public findParentForNode(node: INode): ContainerNode {
		return this._rootNode;
	}

	public updateEntities(): void {
		this._invalid = false;

		for (const key in this._updateQueue)
			this.updateEntity(this._updateQueue[key]);

		//clear updateQueue
		this._updateQueue = {};
	}

	public invalidate(): void {
		if (this._invalid)
			return;

		this._invalid = true;

		super.invalidate();

		if (this._parent)
			this._parent.invalidate();
	}

	public clear(): void {
		super.clear();

		if (this._localNode) {
			this._localNode.clear();
			this._localNode = null;
		}
	}

	public dispose(): void {
	}

	// public _setScene(scene: IPartitionEntity): void {
	// 	if (this._scene == scene)
	// 		return;

	// 	this._scene = scene;

	// 	const len: number = this._children.length;
	// 	for (let i: number = 0; i < len; ++i)
	// 		this._children[i]._setScene(scene);
	// }

	public requestAbstraction(asset: IAsset): IAbstractionClass {
		return PartitionBase._abstractionClassPool[asset.assetType];
	}

	/**
	 *
	 * @param imageObjectClass
	 */
	public static registerAbstraction(abstractionClass: IAbstractionClass, assetClass: IAssetClass): void {
		PartitionBase._abstractionClassPool[assetClass.assetType] = abstractionClass;
	}
}