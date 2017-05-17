import {Vector3D, getTimer} from "@awayjs/core";

import {IEntity, TraverserBase, PickingCollision} from "@awayjs/graphics";

import {DisplayObject, TouchPoint, Camera, CameraEvent, IView, Scene} from "@awayjs/scene";

import {RendererEvent, DefaultRenderer, RendererBase} from "@awayjs/renderer";

import {IPicker} from "./pick/IPicker";
import {IPickingCollider} from "./pick/IPickingCollider";
import {RaycastPicker} from "./pick/RaycastPicker";
import {MouseManager} from "./managers/MouseManager";
import {PartitionBase} from "./partition/PartitionBase";
import {BasicPartition} from "./partition/BasicPartition";

export class View implements IView
{

	/*
	 *************************************************************************************************************************
	 * Development Notes
	 *************************************************************************************************************************
	 *
	 * ShareContext     - this is not being used at the moment integration with other frameworks is not yet implemented or tested
	 *                    and ( _localPos / _globalPos ) position of viewport are the same for the moment
	 *
	 * Background
	 *                  - this is currently not being included in our tests and is currently disabled
	 *
	 ******************clear********************************************************************************************************
	 */

	// Protected
	public _pScene:Scene;
	public _pCamera:Camera;
	public _pRenderer:RendererBase;

	// Private
	private _width:number = 0;
	private _height:number = 0;

	private _time:number = 0;
	private _deltaTime:number = 0;
	private _backgroundColor:number = 0x000000;
	private _backgroundAlpha:number = 1;

	private _viewportDirty:boolean = true;
	private _scissorDirty:boolean = true;

	private _onProjectionChangedDelegate:(event:CameraEvent) => void;
	private _onViewportUpdatedDelegate:(event:RendererEvent) => void;
	private _onScissorUpdatedDelegate:(event:RendererEvent) => void;
	private _mouseManager:MouseManager;
	private _mousePicker:IPicker = new RaycastPicker();
	private _partitions:Object = new Object();

	private _htmlElement:HTMLDivElement;
	private _shareContext:boolean;
	public _pMouseX:number;
	public _pMouseY:number;
	public _pTouchPoints:Array<TouchPoint> = new Array<TouchPoint>();

	/*
	 ***********************************************************************
	 * Disabled / Not yet implemented
	 ***********************************************************************
	 *
	 * private _background:away.textures.Texture2DBase;
	 *
	 * public _pTouch3DManager:away.managers.Touch3DManager;
	 *
	 */
	constructor(renderer:RendererBase = null, scene:Scene = null, camera:Camera = null)
	{
		this._onProjectionChangedDelegate = (event:CameraEvent) => this._onProjectionChanged(event);
		this._onViewportUpdatedDelegate = (event:RendererEvent) => this._onViewportUpdated(event);
		this._onScissorUpdatedDelegate = (event:RendererEvent) => this._onScissorUpdated(event);

		this.scene = scene || new Scene();
		this.camera = camera || new Camera();
		this.renderer = renderer || new DefaultRenderer();

		//make sure document border is zero
		if(typeof document !== "undefined") {
			document.body.style.margin = "0px";

			this._htmlElement = document.createElement("div");
			this._htmlElement.style.position = "absolute";
			this._htmlElement.style.left = "0px";
			this._htmlElement.style.top = "0px";

			document.body.appendChild(this._htmlElement);
		}

		this._mouseManager = MouseManager.getInstance();
		this._mouseManager.registerView(this);

//			if (this._shareContext)
//				this._mouse3DManager.addViewLayer(this);
	}

	public layeredView:boolean; //TODO: something to enable this correctly

	public getPartition(entity:IEntity):PartitionBase
	{
		//use registered partition for the displayobject or fallback for scene
		return this._partitions[entity.partition.id] || this._partitions[this._pScene.id];
	}

	public setPartition(entity:IEntity, partition:PartitionBase):void
	{
		var oldPartition:PartitionBase = this._partitions[entity.id];
		if (oldPartition == partition)
			return;
		
		//clears all existing entities on the partition
		entity.isPartition = false;
		
		if (oldPartition) {
			oldPartition.dispose();
			delete this._partitions[entity.id];
		}
		
		if (partition) {
			this._partitions[entity.id] = partition;
			entity.isPartition = true;
		}
	}

	public getCollider(entity:DisplayObject):IPickingCollider
	{
		return this.getPartition(entity).getAbstraction(entity).pickingCollider;
	}

	public setCollider(entity:DisplayObject, collider:IPickingCollider)
	{
		this.getPartition(entity).getAbstraction(entity).pickingCollider = collider;
	}
	
	public get mouseX():number
	{
		return this._pMouseX;
	}

	public get mouseY():number
	{
		return this._pMouseY;
	}

	get touchPoints():Array<TouchPoint>
	{
		return this._pTouchPoints;
	}

	public getLocalMouseX(displayObject:DisplayObject):number
	{
		return displayObject.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._pMouseX, this._pMouseY, 1000)).x;
	}

	public getLocalMouseY(displayObject:DisplayObject):number
	{
		return displayObject.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._pMouseX, this._pMouseY, 1000)).y;
	}

	public getLocalTouchPoints(displayObject:DisplayObject):Array<TouchPoint>
	{
		var localPosition:Vector3D;
		var localTouchPoints:Array<TouchPoint> = new Array<TouchPoint>();

		var len:number = this._pTouchPoints.length;
		for (var i:number = 0; i < len; i++) {
			localPosition = displayObject.transform.inverseConcatenatedMatrix3D.transformVector(this.unproject(this._pTouchPoints[i].x, this._pTouchPoints[i].y, 1000));
			localTouchPoints.push(new TouchPoint(localPosition.x, localPosition.y, this._pTouchPoints[i].id));
		}

		return localTouchPoints;
	}

	/**
	 *
	 */
	public get htmlElement():HTMLDivElement
	{
		return this._htmlElement;
	}
	/**
	 *
	 */
	public get renderer():RendererBase
	{
		return this._pRenderer;
	}

	public set renderer(value:RendererBase)
	{
		if (this._pRenderer == value)
			return;

		if (this._pRenderer) {
			this._pRenderer.dispose();
			this._pRenderer.removeEventListener(RendererEvent.VIEWPORT_UPDATED, this._onViewportUpdatedDelegate);
			this._pRenderer.removeEventListener(RendererEvent.SCISSOR_UPDATED, this._onScissorUpdatedDelegate);
		}

		this._pRenderer = value;

		this._pRenderer.addEventListener(RendererEvent.VIEWPORT_UPDATED, this._onViewportUpdatedDelegate);
		this._pRenderer.addEventListener(RendererEvent.SCISSOR_UPDATED, this._onScissorUpdatedDelegate);

		//reset back buffer
		this._pRenderer._iBackgroundR = ((this._backgroundColor >> 16) & 0xff)/0xff;
		this._pRenderer._iBackgroundG = ((this._backgroundColor >> 8) & 0xff)/0xff;
		this._pRenderer._iBackgroundB = (this._backgroundColor & 0xff)/0xff;
		this._pRenderer._iBackgroundAlpha = this._backgroundAlpha;
		this._pRenderer.width = this._width;
		this._pRenderer.height = this._height;
		this._pRenderer.shareContext = this._shareContext;
	}

	/**
	 *
	 */
	public get shareContext():boolean
	{
		return this._shareContext;
	}

	public set shareContext(value:boolean)
	{
		if (this._shareContext == value)
			return;

		this._shareContext = value;

		if (this._pRenderer)
			this._pRenderer.shareContext = this._shareContext;
	}

	/**
	 *
	 */
	public get backgroundColor():number
	{
		return this._backgroundColor;
	}

	public set backgroundColor(value:number)
	{
		if (this._backgroundColor == value)
			return;

		this._backgroundColor = value;

		this._pRenderer._iBackgroundR = ((value >> 16) & 0xff)/0xff;
		this._pRenderer._iBackgroundG = ((value >> 8) & 0xff)/0xff;
		this._pRenderer._iBackgroundB = (value & 0xff)/0xff;
	}

	/**
	 *
	 * @returns {number}
	 */
	public get backgroundAlpha():number
	{
		return this._backgroundAlpha;
	}

	/**
	 *
	 * @param value
	 */
	public set backgroundAlpha(value:number)
	{
		if (value > 1)
			value = 1;
		else if (value < 0)
			value = 0;

		if (this._backgroundAlpha == value)
			return;

		this._pRenderer._iBackgroundAlpha = this._backgroundAlpha = value;
	}

	/**
	 *
	 * @returns {Camera3D}
	 */
	public get camera():Camera
	{
		return this._pCamera;
	}

	/**
	 * Set camera that's used to render the scene for this viewport
	 */
	public set camera(value:Camera)
	{
		if (this._pCamera == value)
			return;

		if (this._pCamera)
			this._pCamera.removeEventListener(CameraEvent.PROJECTION_CHANGED, this._onProjectionChangedDelegate);

		this._pCamera = value;

		if (this._pScene)
			(<PartitionBase> this._partitions[this._pScene.id])._iRegisterEntity(this._pCamera);

		this._pCamera.addEventListener(CameraEvent.PROJECTION_CHANGED, this._onProjectionChangedDelegate);
		this._scissorDirty = true;
		this._viewportDirty = true;
	}

	/**
	 *
	 * @returns {away.containers.Scene3D}
	 */
	public get scene():Scene
	{
		return this._pScene;
	}

	/**
	 * Set the scene that's used to render for this viewport
	 */
	public set scene(value:Scene)
	{
		if (this._pScene == value)
			return;

		if (this._pScene) {
			this._pScene._iUnregisterView(this);
			(<PartitionBase> this._partitions[this._pScene.id]).dispose();
		}

		this._pScene = value;

		this._partitions[this._pScene.id] = new BasicPartition(this._pScene);
		this._pScene._iRegisterView(this);

		if (this._pCamera)
			(<PartitionBase> this._partitions[this._pScene.id])._iRegisterEntity(this._pCamera);
	}

	/**
	 *
	 * @returns {number}
	 */
	public get deltaTime():number
	{
		return this._deltaTime;
	}

	/**
	 *
	 */
	public get width():number
	{
		return this._width;
	}

	public set width(value:number)
	{
		if (this._width == value)
			return;

		if(this._shareContext) {
			this._pRenderer.scissorRect.width = value;
			//this._pRenderer.viewPort.width = value;
			this._scissorDirty = true;
			//this._viewportDirty = false;
			return;
		}
		this._width = value;
		this._pRenderer.width = value;
		if(this._htmlElement) {
			this._htmlElement.style.width = value + "px";
		}
	}

	/**
	 *
	 */
	public get height():number
	{
		return this._height;
	}

	public set height(value:number)
	{
		if (this._height == value)
			return;

		if(this._shareContext) {
			this._pRenderer.scissorRect.height = 100;
			//this._pRenderer.viewPort.height = 100;
			this._scissorDirty = true;
			//this._viewportDirty = false;
			return;
		}
		this._height = value;
		this._pRenderer.height = value;
		if(this._htmlElement) {
			this._htmlElement.style.height = value + "px";
		}
	}

	/**
	 *
	 */
	public get mousePicker():IPicker
	{
		return this._mousePicker;
	}

	public set mousePicker(value:IPicker)
	{
		if (this._mousePicker == value)
			return;

		if (value == null)
			this._mousePicker = new RaycastPicker();
		else
			this._mousePicker = value;
	}

	/**
	 *
	 */
	public get x():number
	{
		return this._pRenderer.x;
	}

	public set x(value:number)
	{
		if (this._pRenderer.x == value)
			return;

		this._pRenderer.x = value;
		if(this._shareContext){
			this._pRenderer.scissorRect.x = value;
			//this._pRenderer.viewPort.x = value;
			this._scissorDirty=true;
			//this._viewportDirty = false;
			return;
		}
		if(this._htmlElement) {
			this._htmlElement.style.left = value + "px";
		}
	}

	/**
	 *
	 */
	public get y():number
	{
		return this._pRenderer.y;
	}

	public set y(value:number)
	{
		if (this._pRenderer.y == value)
			return;

		this._pRenderer.y = value;
		if(this._shareContext){
			this._pRenderer.scissorRect.y = value;
			//this._pRenderer.viewPort.y = value;
			this._scissorDirty=true;
			//this._viewportDirty = false;
			return;
		}
		if(this._htmlElement) {
			this._htmlElement.style.top = value + "px";
		}
	}

	/**
	 *
	 */
	public get visible():boolean
	{
		return (this._htmlElement && this._htmlElement.style.visibility == "visible");
	}

	public set visible(value:boolean)
	{
		if(this._htmlElement) {
			this._htmlElement.style.visibility = value? "visible" : "hidden";
		}
		//TODO transfer visible property to associated context (if one exists)
	}

	/**
	 *
	 * @returns {number}
	 */
	public get renderedFacesCount():number
	{
		return 0; //TODO
		//return this._pEntityCollector._pNumTriangles;//numTriangles;
	}

	/**
	 * Renders the view.
	 */
	public render():void
	{
		this.pUpdateTime();

		//update view and size data

		if (this._scissorDirty) {
			this._scissorDirty = false;
			this._pCamera.projection.setViewRect(this._pRenderer.scissorRect.x, this._pRenderer.scissorRect.y, this._pRenderer.scissorRect.width, this._pRenderer.scissorRect.height);
		}

		if (this._viewportDirty) {
			this._viewportDirty = false;
			this._pCamera.projection.setStageRect(this._pRenderer.viewPort.x, this._pRenderer.viewPort.y, this._pRenderer.viewPort.width, this._pRenderer.viewPort.height);
		}

		// update picking
		if (!this._shareContext) {
			if (this.forceMouseMove && this._htmlElement == this._mouseManager._iActiveDiv && !this._mouseManager._iUpdateDirty)
				this._mouseManager._iCollision = this.getViewCollision(this._pMouseX, this._pMouseY, this);

			this._mouseManager.fireMouseEvents(this.forceMouseMove);
			//_touch3DManager.fireTouchEvents();
		}
		//_touch3DManager.updateCollider();

		//render the contents of the scene
		this._pRenderer.render(this);
	}

	/**
	 *
	 */
	public pUpdateTime():void
	{
		var time:number = getTimer();

		if (this._time == 0)
			this._time = time;

		this._deltaTime = time - this._time;
		this._time = time;
	}

	/**
	 *
	 */
	public dispose():void
	{
		this._pRenderer.dispose();

		// TODO: imeplement mouseManager / touch3DManager
		this._mouseManager.unregisterView(this);

		//this._touch3DManager.disableTouchListeners(this);
		//this._touch3DManager.dispose();

		this._mouseManager = null;
		//this._touch3DManager = null;

		this._pRenderer = null;
	}

	/**
	 *
	 */
	private _onProjectionChanged(event:CameraEvent):void
	{
		this._scissorDirty = true;
		this._viewportDirty = true;
	}

	/**
	 *
	 */
	private _onViewportUpdated(event:RendererEvent):void
	{
		this._viewportDirty = true;
	}

	/**
	 *
	 */
	private _onScissorUpdated(event:RendererEvent):void
	{
		this._scissorDirty = true;
	}

	public project(point3d:Vector3D):Vector3D
	{
		var v:Vector3D = this._pCamera.project(point3d);
		v.x = v.x*this._pRenderer.viewPort.width/2 + this._width*this._pCamera.projection.originX;
		v.y = v.y*this._pRenderer.viewPort.height/2 + this._height*this._pCamera.projection.originY;

		return v;
	}

	public unproject(sX:number, sY:number, sZ:number):Vector3D
	{
		return this._pCamera.unproject((2*sX - this._width)/this._pRenderer.viewPort.width, (2*sY - this._height)/this._pRenderer.viewPort.height, sZ);

	}

	/* TODO: implement Touch3DManager
	 public get touchPicker():IPicker
	 {
	 return this._touch3DManager.touchPicker;
	 }
	 */
	/* TODO: implement Touch3DManager
	 public set touchPicker( value:IPicker)
	 {
	 this._touch3DManager.touchPicker = value;
	 }
	 */

	public forceMouseMove:boolean;

	/*TODO: implement Background
	 public get background():away.textures.Texture2DBase
	 {
	 return this._background;
	 }
	 */
	/*TODO: implement Background
	 public set background( value:away.textures.Texture2DBase )
	 {
	 this._background = value;
	 this._renderer.background = _background;
	 }
	 */

	// TODO: required dependency stageGL
	public updateCollider():void
	{
		if (!this._shareContext) {
			if (this._htmlElement == this._mouseManager._iActiveDiv)
				this._mouseManager._iCollision = this.getViewCollision(this._pMouseX, this._pMouseY, this);
		} else {
			var collidingObject:PickingCollision = this.getViewCollision(this._pMouseX, this._pMouseY, this);

			if (this.layeredView || this._mouseManager._iCollision == null || collidingObject.rayEntryDistance < this._mouseManager._iCollision.rayEntryDistance)
				this._mouseManager._iCollision = collidingObject;
		}
	}
	
	public getViewCollision(x:number, y:number, view:View):PickingCollision
	{
		//update ray
		var rayPosition:Vector3D = view.unproject(x, y, 0);
		var rayDirection:Vector3D = view.unproject(x, y, 1).subtract(rayPosition);

		return this._mousePicker.getCollision(rayPosition, rayDirection, this);
	}


	public traversePartitions(traverser:TraverserBase):void
	{
		for (var key in this._partitions)
			this._partitions[key].traverse(traverser);
	}

	public registerObject(displayObject:DisplayObject)
	{
		this.getPartition(displayObject)._iRegisterEntity(displayObject);
	}

	public unRegisterObject(displayObject:DisplayObject)
	{
		this.getPartition(displayObject)._iUnregisterEntity(displayObject);
	}
}