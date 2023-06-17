import { Bindable } from "@src/bindings/bindable";
import { LayoutDirection } from "@src/elements/layouts/flexible/layoutDirection";
import { sizeKeys } from "@src/elements/layouts/paddingHelpers";
import { Paddable } from "@src/positional/paddable";
import { identifier } from "@src/utilities/identifier";
import * as Log from "@src/utilities/logger";
import { WindowBinder } from "./binders/windowBinder";
import { FrameRectangle } from "./frames/frameRectangle";
import { ParentWindow } from "./parentWindow";
import { TabLayoutable } from "./tabs/tabLayoutable";
import { WidgetDescMap, WidgetMap, addToWidgetMap } from "./widgets/widgetMap";
import { autoKey, setAxisSizeIfNumber } from "./windowHelpers";
import { WindowScale } from "./windowScale";
import { WindowTemplate } from "./windowTemplate";


/**
 * Parameters that apply to both the regular and tabbed window.
 */
export interface BaseWindowParams extends Paddable
{
	/**
	 * The title at the top of the window.
	 */
	title?: Bindable<string>;

	/**
	 * The initial width of the window in pixels, or `"auto"` to fit it to the child's
	 * frame if all children are absolute sized.
	 */
	width: number | WindowScale | "auto";

	/**
	 * The initial height of the window in pixels, or `"auto"` to fit it to the child's
	 * frame if all children are absolute sized.
	 */
	height: number | WindowScale | "auto";

	/**
	 * The initial starting position of the window in pixels.
	 *
	 * **Example usage:**
	 *  * `position: "default"` - the game finds the most suitable location on screen for you.
	 *  * `position: "center"` - the window will always open in the center of the screen.
	 *  * `position: { x, y }` - the window will always open at the specified screen location.
	 * @default "default"
	 */
	position?: "default" | "center" | { x: number; y: number };

	/**
	 * Event that gets triggered when the window is opened.
	 */
	onOpen?: () => void;

	/**
	 * Event that gets triggered for every tick the window is open.
	 */
	onUpdate?: () => void;

	/**
	 * Event that gets triggered when the window gets closed by either the user or a plugin.
	 */
	onClose?: () => void;
}


export const defaultTopBarSize: number = 15;

type ExtendedWindowParams = BaseWindowParams & { colours?: number[] };
type WindowPosition = BaseWindowParams["position"];

export const enum WindowFlags
{
	None = 0,
	RedrawNextTick = (1 << 0),

	Count = (1 << 1)
}


/**
 * A base window control for shared functionality between different window types.
 */
export abstract class BaseWindowControl implements WindowTemplate, ParentWindow
{
	readonly _description: WindowDesc;
	protected abstract _descriptionWidgetMap: WidgetMap;

	_window?: Window | null;
	private readonly _position?: WindowPosition;
	private readonly _windowBinder: WindowBinder | null;

	protected _lastWidth: number | "auto";
	protected _lastHeight: number | "auto";
	protected _activeWidgetMap?: WidgetMap | null;
	protected _flags = WindowFlags.None;

	constructor(params: ExtendedWindowParams)
	{
		const { width, height, position } = params;
		const windowBinder = new WindowBinder();

		const windowDesc = <WindowDesc>{
			classification: ("fui-" + identifier()),
			title: "",
			colours: params.colours,
			onUpdate: (): void =>
			{
				this._checkResizeAndRedraw();
				this._invoke(frame => frame.update());
			},
			onClose: (): void =>
			{
				Log.debug("BaseWindow.onClose() triggered");
				this._window = null; // to prevent infinite close loop
				this.close();
			}
		};
		this._lastWidth = setAxisSizeIfNumber(windowDesc, LayoutDirection.Horizontal, width);
		this._lastHeight = setAxisSizeIfNumber(windowDesc, LayoutDirection.Vertical, height);

		windowBinder.add(windowDesc, "title", params.title);
		this._windowBinder = (windowBinder._hasBindings()) ? windowBinder : null;
		this._position = position;
		this._description = windowDesc;
	}

	/**
	 * Checks if the template has been marked dirty, and redraws if that's the case.
	 */
	private _checkResizeAndRedraw(): void
	{
		const window = this._window;
		const activeWidgets = this._activeWidgetMap;
		if (!window || !activeWidgets)
		{
			return;
		}

		const flags = this._flags;
		let lastWidth = this._lastWidth;
		let lastHeight = this._lastHeight;

		if (!(flags & WindowFlags.RedrawNextTick))
		{
			const newWidth = window.width;
			const newHeight = window.height;
			const widthChanged = (lastWidth != autoKey && lastWidth != newWidth);
			const heightChanged = (lastHeight != autoKey && lastHeight != newHeight);
			if (!widthChanged && !heightChanged)
			{
				return; // nothing has changed, do nothing
			}

			Log.debug("BaseWindow.checkResizeAndRedraw() user has resized the window from", this._lastWidth, "x", this._lastHeight, "to", newWidth, "x", newHeight);
			if (widthChanged)
			{
				this._lastWidth = lastWidth = newWidth;
			}
			if (heightChanged)
			{
				this._lastHeight = lastHeight = newHeight;
			}
		}

		const startTime = Log.time();
		Log.debug("BaseWindow.checkResizeAndRedraw() window size: (", lastWidth, "x", lastHeight, ")...");

		this._layout(window, activeWidgets, lastWidth, lastHeight);
		this._flags &= ~WindowFlags.RedrawNextTick;

		Log.debug("BaseWindow.checkResizeAndRedraw() finished in", (Log.time() - startTime), "ms");
	}

	/**
	 * Creates a new rectangle area for use in layouting child widgets.
	 */
	protected _createFrameRectangle(width: number | "auto", height: number | "auto", extraTopPadding = defaultTopBarSize): FrameRectangle
	{
		const area = <FrameRectangle>{ x: 0, y: extraTopPadding };
		setFrameSizeForDirection(area, width, 0, LayoutDirection.Horizontal);
		setFrameSizeForDirection(area, height, extraTopPadding, LayoutDirection.Vertical);
		return area;
	}

	abstract _layout(window: Window | WindowDesc, widgets: WidgetDescMap, width: number | "auto", height: number | "auto"): void;

	protected abstract _invoke(callback: (frame: TabLayoutable) => void): void;

	redraw(): void
	{
		this._flags |= WindowFlags.RedrawNextTick;
	}

	open(): void
	{
		if (this._window)
		{
			// Multiple windows currently not supported, just refocus current window.
			this.focus();
			return;
		}

		const description = this._description;
		const binder = this._windowBinder;
		this._layout(description, this._descriptionWidgetMap, this._lastWidth, this._lastHeight);
		setWindowPosition(description, this._position);

		if (binder)
		{
			binder._bind(this);
		}

		const window = ui.openWindow(description);
		const activeWidgets = addToWidgetMap(window.widgets);

		this._window = window;
		this._activeWidgetMap = activeWidgets;
		this._invoke(frame => frame.open(window, activeWidgets));
	}

	close(): void
	{
		this._invoke(frame => frame.close());
		if (this._window)
		{
			this._window.close();
		}
		const binder = this._windowBinder;
		if (binder)
		{
			binder._unbind();
		}
		this._window = null;
		this._activeWidgetMap = null;
	}

	focus(): void
	{
		if (this._window)
		{
			this._window.bringToFront();
		}
	}
}


/**
 * Updates the x and y of the window description to match the preferred position.
 */
function setWindowPosition(window: WindowDesc, position: WindowPosition): void
{
	if (!position || position === "default")
		return;

	if (position === "center")
	{
		window.x = (ui.width / 2) - (window.width / 2);
		window.y = (ui.height / 2) - (window.height / 2);
		return;
	}

	window.x = position.x;
	window.y = position.y;
}


/**
 * Sets the size for the frame for the specific direction if not `"auto"`, including padding.
 */
function setFrameSizeForDirection(area: FrameRectangle, value: number | "auto", extraPadding: number, direction: LayoutDirection): void
{
	area[sizeKeys[direction]] = (value == autoKey)
		? value
		: value - (extraPadding + 1);
}