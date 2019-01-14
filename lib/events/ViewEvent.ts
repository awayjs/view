import {EventBase} from "@awayjs/core";

import {View} from "../View";

export class ViewEvent extends EventBase
{
	public static INVALIDATE_VIEW_MATRIX3D:string = "invalidateViewMatrix3D";

	public static INVALIDATE_SIZE:string = "invalidateSize";

	private _view:View;

	constructor(type:string, view:View)
	{
		super(type);
		
		this._view = view;
	}

	public get view():View
	{
		return this._view;
	}
}