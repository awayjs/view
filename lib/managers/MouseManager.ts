import {BuildMode, Vector3D} from "@awayjs/core";

import {PickingCollision, TouchPoint, PickGroup, IEntity} from "@awayjs/renderer";

import {DisplayObject, KeyboardEvent, MouseEvent, FrameScriptManager, TextField, MovieClip} from "@awayjs/scene";

import {View} from "../View";


/**
 * MouseManager enforces a singleton pattern and is not intended to be instanced.
 * it provides a manager class for detecting mouse hits on scene objects and sending out mouse events.
 */
export class MouseManager
{
	private static _instance:MouseManager;

	private _pickGroup:PickGroup;
	private _viewLookup:Array<View> = new Array<View>();
	private _containerLookup:Array<HTMLElement> = new Array<HTMLElement>();

	public _iActiveView:View;
	public _iUpdateDirty:boolean;
	public _iCollision:PickingCollision;
	public  _prevICollision:PickingCollision;
	private _iCollisionEntity:IEntity;
	private _prevICollisionEntity:IEntity;
	
	public _stage:DisplayObject;
	
	private _showCursor:boolean;
	
	private _nullVector:Vector3D = new Vector3D();
	private _queuedEvents:Array<MouseEvent> = new Array<MouseEvent>();

	private _mouseMoveEvent;

	private _mouseUp:MouseEvent = new MouseEvent(MouseEvent.MOUSE_UP);
	private _mouseClick:MouseEvent = new MouseEvent(MouseEvent.CLICK);
	private _mouseOut:MouseEvent = new MouseEvent(MouseEvent.MOUSE_OUT);
	private _mouseDown:MouseEvent = new MouseEvent(MouseEvent.MOUSE_DOWN);
	private _mouseMove:MouseEvent = new MouseEvent(MouseEvent.MOUSE_MOVE);
	private _mouseOver:MouseEvent = new MouseEvent(MouseEvent.MOUSE_OVER);
	private _mouseWheel:MouseEvent = new MouseEvent(MouseEvent.MOUSE_WHEEL);
	private _mouseDoubleClick:MouseEvent = new MouseEvent(MouseEvent.DOUBLE_CLICK);

	private onClickDelegate:(event) => void;
	private onDoubleClickDelegate:(event) => void;
	private onMouseDownDelegate:(event) => void;
	private onMouseMoveDelegate:(event) => void;
	private onMouseUpDelegate:(event) => void;
	private onMouseWheelDelegate:(event) => void;
	private onMouseOverDelegate:(event) => void;
	private onMouseOutDelegate:(event) => void;
	private onKeyDownDelegate:(event) => void;
	private onKeyUpDelegate:(event) => void;
	private onFirstTouchDelegate:(event) => void;

	private _useSoftkeyboard:boolean=false;

	private _objectInFocus:DisplayObject;
	private _mouseDownObject:DisplayObject;
	public  buttonEnabledDirty:boolean;
	private _isTouch:Boolean;
	public isAVM1Dragging:Boolean=false;
	
	public get showCursor():boolean{
		return this._showCursor;
	}
	public set showCursor(value:boolean){
		this._showCursor=value;
	}

	/**
	 * Creates a new <code>MouseManager</code> object.
	 */
	constructor(pickGroup:PickGroup)
	{
		this._pickGroup = pickGroup;
		this.onClickDelegate = (event) => this.onClick(event);
		this.onDoubleClickDelegate = (event) => this.onDoubleClick(event);
		this.onMouseDownDelegate = (event) => this.onMouseDown(event);
		this.onMouseMoveDelegate = (event) => this.onMouseMove(event);
		this.onMouseUpDelegate = (event) => this.onMouseUp(event);
		this.onMouseWheelDelegate = (event) => this.onMouseWheel(event);
		this.onMouseOverDelegate = (event) => this.onMouseOver(event);
		this.onMouseOutDelegate = (event) => this.onMouseOut(event);
		this.onKeyDownDelegate = (event) => this.onKeyDown(event);
		this.onKeyUpDelegate = (event) => this.onKeyUp(event);
		this.onFirstTouchDelegate = (event) => this.onFirstTouch(event);
		this.buttonEnabledDirty=false;
		this._isTouch=false;
		this._showCursor=true;
		window.addEventListener('touchstart', this.onFirstTouchDelegate, false);
	}
	public onFirstTouch(event):void{
		this._isTouch=true;
		// we only need to know once that a human touched the screen, so we can stop listening now
		window.removeEventListener('touchstart', this.onFirstTouchDelegate, false);
	}
	
	public set useSoftkeyboard(value:boolean){

		this._useSoftkeyboard=value;
		if(!value && BuildMode.mode==BuildMode.AVM1){
			window.addEventListener("keydown", this.onKeyDownDelegate);
			window.addEventListener("keyup", this.onKeyUpDelegate);
		}
		else if(value){
			window.removeEventListener("keydown", this.onKeyDownDelegate);
			window.removeEventListener("keyup", this.onKeyUpDelegate);
		}
	}
	public get useSoftkeyboard():boolean{
		return this._useSoftkeyboard;
	}

	public registerContainer(container:HTMLElement):void
	{
		if(container && this._containerLookup.indexOf(container) == -1) {
			container.addEventListener("click", this.onClickDelegate);
			container.addEventListener("dblclick", this.onDoubleClickDelegate);
			container.addEventListener("touchstart", this.onMouseDownDelegate);
			container.addEventListener("mousedown", this.onMouseDownDelegate);
			container.addEventListener("touchmove", this.onMouseMoveDelegate);
			container.addEventListener("mousemove", this.onMouseMoveDelegate);
			container.addEventListener("mouseup", this.onMouseUpDelegate);
			container.addEventListener("touchend", this.onMouseUpDelegate);
			container.addEventListener("mousewheel", this.onMouseWheelDelegate);
			container.addEventListener("mouseover", this.onMouseOverDelegate);
			container.addEventListener("mouseout", this.onMouseOutDelegate);
			if(BuildMode.mode==BuildMode.AVM1){
				window.addEventListener("keydown", this.onKeyDownDelegate);
				window.addEventListener("keyup", this.onKeyUpDelegate);
			}
			this._containerLookup.push(container);
		}
	}

	public unregisterContainer(container:HTMLElement):void
	{
		if(container && this._containerLookup.indexOf(container) != -1) {
			container.removeEventListener("click", this.onClickDelegate);
			container.removeEventListener("dblclick", this.onDoubleClickDelegate);
			container.removeEventListener("touchstart", this.onMouseDownDelegate);
			container.removeEventListener("mousedown", this.onMouseDownDelegate);
			container.removeEventListener("touchmove", this.onMouseMoveDelegate);
			container.removeEventListener("mousemove", this.onMouseMoveDelegate);
			container.removeEventListener("touchend", this.onMouseUpDelegate);
			container.removeEventListener("mouseup", this.onMouseUpDelegate);
			container.removeEventListener("mousewheel", this.onMouseWheelDelegate);
			container.removeEventListener("mouseover", this.onMouseOverDelegate);
			container.removeEventListener("mouseout", this.onMouseOutDelegate);
			if(BuildMode.mode==BuildMode.AVM1){
				window.removeEventListener("keydown", this.onKeyDownDelegate);
				window.removeEventListener("keyup", this.onKeyUpDelegate);
			}

			this._containerLookup.slice(this._containerLookup.indexOf(container), 1);
		}
	}

	public static getInstance(pickGroup:PickGroup):MouseManager
	{
		if (this._instance)
			return this._instance;

		return (this._instance = new MouseManager(pickGroup));
	}

	public setFocus(obj:DisplayObject){
		if(this._objectInFocus == obj){
			return;
		}
		if(this._objectInFocus){
			this._objectInFocus.setFocus(false, false);
		}
		this._objectInFocus=obj;

		if(this._objectInFocus){
			this._objectInFocus.setFocus(true, false);
		}
	}
	public getFocus(){
		return this._objectInFocus;
	}
	public focusNextTab(){
		if(this._viewLookup.length==0)
			return;
		var newFocus:DisplayObject=<DisplayObject>this._viewLookup[0].mousePicker.getNextTabEntity(this._objectInFocus);
		if(newFocus==this._objectInFocus)
			return;
		this._objectInFocus.setFocus(false, false);
		newFocus.setFocus(true, false);
		this._objectInFocus=newFocus;
	}
	public focusPreviousTab(){
		if(this._viewLookup.length==0)
			return;
		var newFocus:DisplayObject=<DisplayObject>this._viewLookup[0].mousePicker.getPrevTabEntity(this._objectInFocus);
		if(newFocus==this._objectInFocus)
			return;
		this._objectInFocus.setFocus(false, false);
		newFocus.setFocus(true, false);
		this._objectInFocus=newFocus;
	}
	

	private _isDragging:boolean=false;
	private _fireMouseOver:boolean=false;
	private _finalDispatchQueueObjects:DisplayObject[]=[];
	private _finalDispatchQueueEvents:any[]=[];
	private _prevActiveButton:DisplayObject=null;

	public fireMouseEvents(forceMouseMove:boolean):void
	{

		this._finalDispatchQueueObjects.length=0;
		this._finalDispatchQueueEvents.length=0;

		this._fireMouseOver=false;

		this._iCollisionEntity = this._iCollision && this._iCollision.entity;
		while (this._iCollisionEntity && !this._iCollisionEntity._iIsMouseEnabled())
			this._iCollisionEntity = this._iCollisionEntity.parent;

		 // If colliding object has changed, queue over/out events.
		if (this._iCollisionEntity != this._prevICollisionEntity) {
			if (this._prevICollisionEntity){

				//todo: do this without any typing hacks (makes sure that a newly-disabled button still gets resetet on mouseout):
				if((<any>this._prevICollisionEntity).buttonReset){
					(<any>this._prevICollisionEntity).buttonReset();
				}
				if(!this._isTouch)
					this.queueDispatch(this._mouseOut, this._mouseMoveEvent, this._prevICollision, this._prevICollisionEntity, false);
			}

			this._prevActiveButton=null;
			if (this._iCollision){
				//console.log("new collision");
				//console.log("_iCollision", this._iCollision.entity.name);
				document.body.style.cursor = this._showCursor ? this._iCollisionEntity.getMouseCursor() : "none";
				if(!this._isTouch)
					this.queueDispatch(this._mouseOver, this._mouseMoveEvent);
				if((<any>this._iCollisionEntity).isButton && (<any>this._iCollisionEntity).buttonEnabled){
					this._prevActiveButton=<DisplayObject>this._iCollisionEntity;
					//console.log("new collision with active button", this._iCollision.entity.name);
				}
				else if((<any>this._iCollisionEntity).isButton){
					//console.log("new collision with inActive button", this._iCollision.entity.name);

				}
			}
			else{
				document.body.style.cursor = this._showCursor ? "initial" : "none";
				//console.log("no collision");

			}
			this._prevICollisionEntity = this._iCollisionEntity;
		}
		else{
			if(this._iCollision){
				//console.log("same collision", this._iCollisionEntity.name, this._iCollisionEntity._iIsVisible());

				if((<MovieClip>this._iCollisionEntity).isButton && (<any>this._iCollisionEntity).buttonEnabled){
					if(this._prevActiveButton!=this._iCollisionEntity){
						//console.log("state has changed to active", this._iCollisionEntity.name);
						this._prevActiveButton=<DisplayObject>this._iCollisionEntity;
						this._fireMouseOver=true;	
					}
				}
				else{
					if((<any>this._iCollisionEntity).isButton && this._prevActiveButton){
						//console.log("state has changed to inactive", this._iCollisionEntity.name);

					}
					this._prevActiveButton=null;

				}
			}
			else{
				//console.log("still no collision");
				this._prevActiveButton=null;

			}
		
		}


		 // Fire mouse move events here if forceMouseMove is on.
		 //if (forceMouseMove && this._iCollision)
		//	this.queueDispatch( this._mouseMove, this._mouseMoveEvent);

		var event:MouseEvent;
		var dispatcher:DisplayObject;

		//console.log("\n");

		// Dispatch all queued events.
		// queuedEvents.length might be changed during the loop, so we cant get the length before
		for (var i:number = 0; i < this._queuedEvents.length; ++i) {
			event = this._queuedEvents[i];
			dispatcher = <DisplayObject>event.entity;
			//console.log("this._queuedEvents", i, this._queuedEvents[i], dispatcher);


			// if the event was a click/mousedown, we set the dispatcher as _objectInFocus
			var tmpDispatcher=dispatcher;
			//if((event.type==MouseEvent.CLICK)||(event.type==MouseEvent.DOUBLE_CLICK)||(event.type==MouseEvent.MOUSE_DOWN)){
			if(event.type==MouseEvent.MOUSE_DOWN){
				
				this._fireMouseOver=false;
				this._isDragging=true;
				//console.log("MOUSE_DOWN", event.entity);
				//var prevFocusedObject:DisplayObject=this._objectInFocus;
				
				this._mouseDownObject=null;
				/*if(dispatcher){
					console.log("mouseEvent.dispatch", dispatcher, dispatcher.name, event.type, event);
				}*/

				// MOUSE_DOWN: check if this or any parent is mouse-enabled
				// if we found one, we update this._mouseDownObject to be that object
				// if a mouse-enabled object is found, the this._objectInFocus will be set to unFocused if it exists
				// if this._mouseDownObject is tab-enabled, we update this._objectInFocus to be that object
				
				if(this._isTouch){
					this.queueDispatch(this._mouseOver, this._mouseMoveEvent, this._iCollision);

				}

				var found:boolean=false;
				while (tmpDispatcher && !found) {
					if (tmpDispatcher._iIsMouseEnabled()){
						this._mouseDownObject=tmpDispatcher;
						if(this._objectInFocus)
							this._objectInFocus.setFocus(false, true);
						//if(tmpDispatcher.isTabEnabled){
							this._objectInFocus=this._mouseDownObject;
							this._mouseDownObject.setFocus(true, true);
						//}
						if(tmpDispatcher.isAsset(TextField)){
							(<TextField>tmpDispatcher).startSelectionByMouse(event);
						}
						found=true;
					}
					if(!found)
						tmpDispatcher = tmpDispatcher.parent;
				}
				/*if(this._objectInFocus)
					console.log("this._objectInFocus", this._objectInFocus.id, this._objectInFocus.name, this._objectInFocus);
				if(this._mouseDownObject)
					console.log("this._mouseDownObject", this._mouseDownObject.id, this._mouseDownObject.name, this._mouseDownObject);*/
				/*if(!this._objectInFocus){
					this._objectInFocus=prevFocusedObject;
				}
				if(prevFocusedObject!=this._objectInFocus){
					if(prevFocusedObject){
						prevFocusedObject.isInFocus=false;
					}
					if(this._objectInFocus){
						this._objectInFocus.isInFocus=true;
					}
				}*/
			}
			tmpDispatcher=dispatcher;
			var dispatchedMouseOutsideUPEvent:boolean=false;
			if(event.type==MouseEvent.MOUSE_UP){
				this._isDragging=false;
				this._fireMouseOver=false;
				//console.log("MOUSE_UP", event.entity);
				//this._fireMouseOver
				// if this is MOUSE_UP event, and not the _objectInFocuse,
				// dispatch a MOUSE_UP_OUTSIDE
				if(this._isTouch){
					this.queueDispatch(this._mouseOut, this._mouseMoveEvent, this._mouseDownObject?this._pickGroup.getAbstraction(this._mouseDownObject).pickingCollision:null);

				}

				//if (this._prevICollision && this._iCollision != this._prevICollision)
				//	this.queueDispatch(this._mouseOut, this._mouseMoveEvent, this._prevICollision);
				
				if(this.isAVM1Dragging && this._mouseDownObject){
                    dispatchedMouseOutsideUPEvent=true;
					this._mouseDownObject.dispatchEvent(event);
				}
				else if(this._mouseDownObject && this._mouseDownObject!=tmpDispatcher){
					// MOUSE_UP but _mouseDownObject has changed. 
					// we need to dispatch a MOUSE_UP_OUTSIDE on the old _mouseDownObject

					if (this._mouseDownObject._iIsMouseEnabled()){
						//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
						var newEvent:MouseEvent=event.clone();
						newEvent.type=MouseEvent.MOUSE_UP_OUTSIDE;
						//this._objectInFocus.dispatchEvent(newEvent);
						tmpDispatcher=this._mouseDownObject;
						while (tmpDispatcher) {
							if (tmpDispatcher._iIsMouseEnabled()) {
								dispatchedMouseOutsideUPEvent=true;
								//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
								//tmpDispatcher.dispatchEvent(newEvent);
								this._finalDispatchQueueObjects[this._finalDispatchQueueObjects.length]=tmpDispatcher;
								this._finalDispatchQueueEvents[this._finalDispatchQueueEvents.length]=newEvent;

							}
							tmpDispatcher = tmpDispatcher.parent;

						}
					}
				}
				this.isAVM1Dragging=false;
				if(this._mouseDownObject){
					if(this._mouseDownObject.isAsset(TextField)){
						// MOUSE_UP on a TextField. stop any textfield selection.
						(<TextField>this._mouseDownObject).stopSelectionByMouse(event);
					}
				}
				this._mouseDownObject=null;

				if(this._objectInFocus)
					this._objectInFocus.setFocus(true, true);
			}
			if(this._mouseDownObject && event.type==MouseEvent.MOUSE_MOVE){
				var mouseDownDispatcher=this._mouseDownObject;
				while (mouseDownDispatcher) {
					if (mouseDownDispatcher._iIsMouseEnabled()){
						//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
						//mouseDownDispatcher.dispatchEvent(event);
						this._finalDispatchQueueObjects[this._finalDispatchQueueObjects.length]=mouseDownDispatcher;
						this._finalDispatchQueueEvents[this._finalDispatchQueueEvents.length]=event;
						if(mouseDownDispatcher.isAsset(TextField)){
							(<TextField>mouseDownDispatcher).updateSelectionByMouse(event);
						}
					}
					mouseDownDispatcher = mouseDownDispatcher.parent;
				}
			}

			
			if(!(dispatchedMouseOutsideUPEvent && event.type == MouseEvent.MOUSE_UP)){
				//	console.log("mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
				// bubble event up the heirarchy until the top level parent is reached

				while (dispatcher) {
					if (dispatcher._iIsMouseEnabled()){
						//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
						//dispatcher.dispatchEvent(event);
						this._finalDispatchQueueObjects[this._finalDispatchQueueObjects.length]=dispatcher;
						this._finalDispatchQueueEvents[this._finalDispatchQueueEvents.length]=event;

					}

					dispatcher = dispatcher.parent;
				}
			}
			// not totally sure, but i think just calling it is easier and cheaper than any options for that
			// if nothing is queued, the function will return directly anyway
			FrameScriptManager.execute_queue();

		}

		var finalEventsLen:number=this._finalDispatchQueueObjects.length;
		while(finalEventsLen>0){
			finalEventsLen--;
			this._finalDispatchQueueObjects[finalEventsLen].dispatchEvent(this._finalDispatchQueueEvents[finalEventsLen]);

		}

		this._queuedEvents.length = 0;
		if(!this._isTouch && this._fireMouseOver){
			document.body.style.cursor = this._showCursor ? this._iCollision.entity.getMouseCursor() : "none";
			this.queueDispatch(this._mouseOver, this._mouseMoveEvent);
			event = this._queuedEvents[0];
			dispatcher = <DisplayObject> event.entity;
			while (dispatcher) {
				if (dispatcher._iIsMouseEnabled()){
					//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
					dispatcher.dispatchEvent(event);

				}

				dispatcher = dispatcher.parent;
			}
			this._queuedEvents.length = 0;
		}


		this._iUpdateDirty = false;
	}

//		public addViewLayer(view:View)
//		{
//			var stg:Stage = view.stage;
//
//			// Add instance to mouse3dmanager to fire mouse events for multiple views
//			if (!view.stageGL.mouse3DManager)
//				view.stageGL.mouse3DManager = this;
//
//			if (!hasKey(view))
//				_view3Ds[view] = 0;
//
//			_childDepth = 0;
//			traverseDisplayObjects(stg);
//			_viewCount = _childDepth;
//		}

	public registerView(view:View):void
	{
		if(view)
			this._viewLookup.push(view);
	}

	public unregisterView(view:View):void
	{
		if(view)
			this._viewLookup.slice(this._viewLookup.indexOf(view), 1);
	}

	public addEventsForViewBinary(touchMessage:ArrayBuffer, viewIdx:number=0):void
	{

		var newTouchEvent:any={};
		newTouchEvent.clientX = null;// we get the x position from the active touch
		newTouchEvent.clientY = null;// we get the y position from the active touch
		newTouchEvent.touches=[];
		newTouchEvent.changedTouches = [];
		newTouchEvent.preventDefault=function(){};
		var messageView:Float32Array=new Float32Array(touchMessage);
		// transfer touches to event
		var i=0;
		var cnt=0;
		var touchCnt=0;
		cnt++;//we temporary added 1 float to transfer fps from java to js. skip this
		var numTouches=messageView[cnt++];
		var touchtype=messageView[cnt++];
		var activeTouchID=messageView[cnt++];
		var x:number=0;
		var y:number=0;
		if ((touchtype != 1) && (touchtype != 6) && (touchtype != 12) && (touchtype != 262) && (touchtype != 518)) {
			// if this is not a UP command, we add all touches
			for(i=0; i< numTouches;i++){
				var newTouch:any={};
				newTouch.identifier=messageView[cnt++];
				newTouch.clientX=messageView[cnt++];
				newTouch.clientY=messageView[cnt++];
				newTouchEvent.touches[i]=newTouch;
				//newTouchEvent.changedTouches[i] = newTouch;
			}
			newTouchEvent.changedTouches[0] = newTouchEvent.touches[activeTouchID];
			x=newTouchEvent.changedTouches[0].clientX;
			y=newTouchEvent.changedTouches[0].clientY;
		}
		else{
			// if this is a UP command, we add all touches, except the active one
			if(numTouches==1){

				var newTouch:any = {};
				newTouch.identifier = messageView[cnt++];
				newTouch.clientX = messageView[cnt++];
				newTouch.clientY = messageView[cnt++];
				newTouchEvent.clientX = newTouch.clientX;
				newTouchEvent.clientY = newTouch.clientY;
				x = newTouchEvent.clientX;
				y = newTouchEvent.clientY;
			}
			else{
				for(i=0; i< numTouches;i++) {
					var newTouch:any = {};
					newTouch.identifier = messageView[cnt++];
					newTouch.clientX = messageView[cnt++];
					newTouch.clientY = messageView[cnt++];
					if (i != activeTouchID) {
						newTouchEvent.touches[touchCnt] = newTouch;
						//newTouchEvent.changedTouches[touchCnt++] = newTouch;
					}
					else {
						newTouchEvent.clientX = newTouch.clientX;
						newTouchEvent.clientY = newTouch.clientY;
						x = newTouchEvent.clientX;
						y = newTouchEvent.clientY;
					}
				}
			}
		}

		//console.log("Touch ID:"+touchtype+" activeTouchID "+activeTouchID+" numTouches "+numTouches+" x"+x+" y"+y);
		/*
		 public static final int ACTION_DOWN = 0;
		 public static final int ACTION_POINTER_1_DOWN = 5;
		 public static final int ACTION_POINTER_DOWN = 5;
		 public static final int ACTION_BUTTON_PRESS = 11;
		 public static final int ACTION_POINTER_2_DOWN = 261;
		 public static final int ACTION_POINTER_3_DOWN = 517;


		 public static final int ACTION_UP = 1;
		 public static final int ACTION_POINTER_1_UP = 6;
		 public static final int ACTION_POINTER_UP = 6;
		 public static final int ACTION_BUTTON_RELEASE = 12;
		 public static final int ACTION_POINTER_2_UP = 262;
		 public static final int ACTION_POINTER_3_UP = 518;

		 public static final int ACTION_MOVE = 2;


		 */
		if ((touchtype == 0) || (touchtype == 5) || (touchtype == 11) || (touchtype == 261) || (touchtype == 517)) {
			this.onMouseDown(newTouchEvent);
		}
		else if ((touchtype == 1) || (touchtype == 6) || (touchtype == 12) || (touchtype == 262) || (touchtype == 518)) {
			this.onMouseUp(newTouchEvent);
		}
		else if (touchtype == 2) {
			this.onMouseMove(newTouchEvent);
		}
		else {
			console.log("recieved unknown touch event-type: " + touchtype);
		}
	}
	
	public fireEventsForViewFromString(touchMessage:String, viewIdx:number=0):void
	{

		var newTouchEvent:any={};
		newTouchEvent.clientX = null;// set the x position from the active touch
		newTouchEvent.clientY = null;// set the y position from the active touch
		newTouchEvent.preventDefault=function(){};
		var touchesFromMessage=touchMessage.split(",");
		// transfer touches to event
		var i=0;
		var cnt=0;
		var numTouches=parseInt(touchesFromMessage[cnt++]);
		var touchtype=parseInt(touchesFromMessage[cnt++]);
		var activeTouch=parseInt(touchesFromMessage[cnt++]);
		newTouchEvent.touches=[];
		newTouchEvent.changedTouches = [];
		if((touchtype!=1)&&(touchtype!=6)){
			for(i=0; i< numTouches;i++){
				var newTouch:any={};
				newTouch.identifier=touchesFromMessage[cnt++];
				newTouch.clientX=touchesFromMessage[cnt++];
				newTouch.clientY=touchesFromMessage[cnt++];
				newTouchEvent.touches[i]=newTouch;
				newTouchEvent.changedTouches[i] = newTouch;
			};
			newTouchEvent.changedTouches[i] = newTouchEvent.touches[activeTouch];
		}
		else{
			for(i=0; i< numTouches;i++){
				if(i!=activeTouch){
					var newTouch:any={};
					newTouch.identifier=touchesFromMessage[cnt++];
					newTouch.clientX=touchesFromMessage[cnt++];
					newTouch.clientY=touchesFromMessage[cnt++];
					newTouchEvent.touches[i]=newTouch;
					newTouchEvent.changedTouches[i] = newTouch;
				}
				else{
					newTouchEvent.clientX =touchesFromMessage[cnt++];
					newTouchEvent.clientY =touchesFromMessage[cnt++];
					cnt++;
				}
			};


		}
		if(touchtype==0){//mousedown
			this.onMouseDown(newTouchEvent);
		}
		else if(touchtype==1){//mouseup
			this.onMouseUp(newTouchEvent);
		}
		else if(touchtype==2){//mousemove
			this.onMouseMove(newTouchEvent);

		}
		else if(touchtype==261){//mousedownPointer
			this.onMouseDown(newTouchEvent);

		}
		else if(touchtype==6){//mouseupPointer
			this.onMouseUp(newTouchEvent);
		}
	}
	// ---------------------------------------------------------------------
	// Private.
	// ---------------------------------------------------------------------

	private queueDispatch(event:MouseEvent, sourceEvent, collision:PickingCollision = null, collisionEntity:IEntity = null, queueEvent:boolean=true):void
	{
		// 2D properties.
		if (sourceEvent) {
			event.delta = sourceEvent.wheelDelta;
			event.ctrlKey = sourceEvent.ctrlKey;
			event.altKey = sourceEvent.altKey;
			event.shiftKey = sourceEvent.shiftKey;
			event.screenX = (sourceEvent.clientX != null)? sourceEvent.clientX : sourceEvent.changedTouches[0].clientX;
			event.screenY = (sourceEvent.clientY != null)? sourceEvent.clientY : sourceEvent.changedTouches[0].clientY;
		}

		if (collision == null)
			collision = this._iCollision;

		if (collisionEntity == null)
			collisionEntity = this._iCollisionEntity;

		// 3D properties.
		if (collision) {
			// Object.
			event.entity = collisionEntity;
			event.renderable = collision.renderable;
			// UV.
			event.uv = collision.uv;
			// Position.
			event.position = collision.position? collision.position.clone() : null;
			// Normal.
			event.normal = collision.normal? collision.normal.clone() : null;
			// Face index.
			event.elementIndex = collision.elementIndex;
		} else {
			// Set all to null.
			event.uv = null;
			event.entity = null;
			event.position = this._nullVector;
			event.normal = this._nullVector;
			event.elementIndex = 0;
		}

		if(queueEvent){
			// Store event to be dispatched later.
			this._queuedEvents.push(event);
			return;
		}
		var dispatcher = <DisplayObject> event.entity;
		while (dispatcher) {
			if (dispatcher._iIsMouseEnabled()){
				//console.log("		dispatcher mouse event", event.type, "on:", dispatcher, dispatcher.adapter.constructor.name);
				dispatcher.dispatchEvent(event);

			}
			dispatcher = dispatcher.parent;
		}

	}

	// ---------------------------------------------------------------------
	// Listeners.
	// ---------------------------------------------------------------------

	public onKeyDown(event):void
	{
		event.preventDefault();

		if(this._objectInFocus || this._stage){
			//console.log("dispatch keydown on ", this._objectInFocus);
			var newEvent:KeyboardEvent=new KeyboardEvent(KeyboardEvent.KEYDOWN, event.key, event.code);
			newEvent.isShift=event.shiftKey;
			newEvent.isCTRL=event.ctrlKey;
			newEvent.isAlt=event.altKey;
			if(this._objectInFocus)
				this._objectInFocus.dispatchEvent(newEvent);
			if(this._stage)
				this._stage.dispatchEvent(newEvent);
		}

	}
	public onKeyUp(event):void
	{
		event.preventDefault();

		if(this._objectInFocus || this._stage){
			//console.log("dispatch keydown on ", this._objectInFocus);
			var newEvent:KeyboardEvent=new KeyboardEvent(KeyboardEvent.KEYUP, event.key, event.code);
			newEvent.isShift=event.shiftKey;
			newEvent.isCTRL=event.ctrlKey;
			newEvent.isAlt=event.altKey;
			if(this._objectInFocus)
				this._objectInFocus.dispatchEvent(newEvent);
			if(this._stage)
				this._stage.dispatchEvent(newEvent);
		}

	}

	public onMouseMove(event):void
	{
		event.preventDefault();

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseMove, this._mouseMoveEvent = event);
	}

	private onMouseOut(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseOut, event);
	}

	private onMouseOver(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch( this._mouseOver, event);
	}

	private onClick(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseClick, event);
	}

	private onDoubleClick(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseDoubleClick, event);
	}


	private _isDown:boolean=false;

	public onMouseDown(event):void
	{
		if(this._isDown){
			return;
		}
		this._isDown=true;
		event.preventDefault();

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseDown, event);
	}

	public onMouseUp(event):void
	{
		if(!this._isDown){
			return;
		}
		this._isDown=false;
		event.preventDefault();

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseUp , event);
	}

	private onMouseWheel(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseWheel, event);
	}


	private updateColliders(event):void
	{
		var view:View;
		var mouseX:number = (event.clientX != null)? event.clientX : event.changedTouches[0].clientX;
		var mouseY:number = (event.clientY != null)? event.clientY : event.changedTouches[0].clientY;
		var len:number = this._viewLookup.length;
		for (var i:number = 0; i < len; i++) {
			view = this._viewLookup[i];
			view._touchPoints.length = 0;

			if (event.touches) {
				var touch;
				var len:number = event.touches.length;
				for (var i:number = 0; i < len; i++) {
					touch = event.touches[i];
					view._touchPoints.push(new TouchPoint(touch.clientX + view.x, touch.clientY + view.y, touch.identifier));
				}
			}

			if (this._iUpdateDirty)
				continue;

			if (mouseX < view.x){
				view._mouseX = view.x;
			}
			else if (mouseX > view.x + view.width){
				view._mouseX = view.x+ view.width;

			}
			else{
				view._mouseX = mouseX - view.x;

			}
			if(mouseY < view.y){
				view._mouseY = view.y;

			} 
			else if(mouseY > view.y + view.height) {
				view._mouseY = view.y+ view.height;
			}
			else {
				view._mouseY = mouseY - view.y;
			}

			view.updateCollider();

			if (view.layeredView && this._iCollision)
				break;
			
		}

		this._iUpdateDirty = true;
	}
}