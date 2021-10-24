import { flexible, FlexibleLayoutParams } from "@src/elements/flexibleLayout";
import { Layoutable } from "@src/layouts/layoutable";
import { applyPadding } from "@src/layouts/flexibleLayout";
import { Direction } from "@src/positional/direction";
import { Paddable, Padding } from "@src/positional/padding";
import { Rectangle } from "@src/positional/rectangle";
import { WindowTemplate } from "@src/templates/windowTemplate";
import { WindowColour } from "@src/utilities/colour";
import { Event } from "@src/utilities/event";
import { Id } from "@src/utilities/identifier";
import { BuildOutput } from "./buildOutput";
import { widgetContainer } from "./widgetContainer";


/**
 * Parameters that apply to both the regular and tabbed window.
 */
interface BaseWindowParams extends Paddable
{
	/**
	 * The title at the top of the window.
	 */
	title?: string;

	/**
	 * The initial width of the window in pixels.
	 */
	width: number;

	/**
	 * The initial height of the window in pixels.
	 */
	height: number;

	/**
	 * The initial starting position of the window in pixels. If not set, the
	 * game finds the most suitable location on screen for you.
	 */
	x?: number;

	/**
	 * The initial starting position of the window in pixels. If not set, the
	 * game finds the most suitable location on screen for you.
	 */
	y?: number;

	/**
	 * The absolute minimum width the window can be resized to. If set, the
	 * window will be rescalable by the user.
	 */
	minWidth?: number;

	/**
	 * The absolute minimum height the window can be resized to. If set, the
	 * window will be rescalable by the user.
	 */
	minHeight?: number;

	/**
	 * The absolute maximum width the window can be resized to. If set, the
	 * window will be rescalable by the user.
	 */
	maxWidth?: number;

	/**
	 * The absolute maximum height the window can be resized to. If set, the
	 * window will be rescalable by the user.
	 */
	maxHeight?: number;

	/**
	 * Event that gets triggered for every tick the window is open.
	 */
	onUpdate?: () => void;

	/**
	 * Event that gets triggered when the window gets closed by either the
	 * user or a plugin.
	 */
	onClose?: () => void;
}


/**
 * The parameters for a regular window.
 */
export interface WindowParams extends BaseWindowParams
{
	/**
	 * The colours of the window.
	 *
	 * Usage:
	 *  1. Used for the window background.
	 *  2. Used for widget backgrounds.
	 */
	colours?: [WindowColour, WindowColour];

	/**
	 * Specify the content of this window.
	 */
	content: FlexibleLayoutParams;
}


/**
 * The parameters for a window that uses tabs.
 */
export interface TabbedWindowParams extends BaseWindowParams
{
	/**
	 * The colours of the window.
	 *
	 * Usage:
	 *  1. Used for the window background at the top.
	 *  2. Used for the background of each tab.
	 *  3. Used for widget details and backgrounds.
	 */
	colours?: [WindowColour, WindowColour, WindowColour];

	/**
	 * Specify which tab the window should open on. Starts at 0.
	 */
	startingTab?: number;

	/**
	 * Specify the tabs that this window has.
	 */
	tabs: FlexibleLayoutParams;
}


/**
 * Create a new fluently designed window.
 */
export function window(params: WindowParams | TabbedWindowParams): WindowTemplate
{
	const window: WindowDesc =
	{
		classification: `fui-${Id.new()}`,
		title: (params.title) ? params.title : "",
		colours: params.colours,
		width: params.width,
		height: params.height,
		x: params.x,
		y: params.y,
		minWidth: params.minWidth,
		minHeight: params.minHeight,
		maxWidth: params.maxWidth,
		maxHeight: params.maxHeight
	};

	const output = new BuildOutput(window);
	if ("content" in params)
	{
		createWindowLayout(output, window, params);
	}
	/*else if ("tabs" in params)
	{

	}*/

	const binder = output.binder;
	const open = output.open;
	const update = output.update;
	const close = output.close;

	if (binder.hasBindings())
	{
		const widgets = window.widgets;
		if (widgets)
		{
			// Update the template widgets always before the window opens.
			const container = widgetContainer(widgets);
			open.push(() => binder.update(container));
		}
		close.push(() => binder.unbind());
	}
	if (params.onUpdate)
	{
		update.push(params.onUpdate);
	}
	if (params.onClose)
	{
		close.push(params.onClose);
	}
	if (open.length > 0)
	{
		output.template.onOpen = (): void => Event.invoke(open);
	}
	if (update.length > 0)
	{
		window.onUpdate = (): void => Event.invoke(update);
	}
	if (close.length > 0)
	{
		window.onClose = (): void => Event.invoke(close);
	}
	return output.template;
}


/**
 * Create a regular window layout.
 */
function createWindowLayout(output: BuildOutput, window: WindowDesc, params: WindowParams): void
{
	const creator = flexible(params.content, Direction.Vertical);
	const control = creator.create(output);

	window.widgets = output.widgets;
	performLayout(output.widgets, control, window.width, window.height, params.padding);

	if (window.minWidth || window.minHeight || window.maxWidth || window.maxHeight)
	{
		setWindowLayoutResizing(output, window, control, params.padding);
	}
}


/**
 * Enables resizing the window by the user.
 */
function setWindowLayoutResizing(output: BuildOutput, window: WindowDesc, control: Layoutable, padding?: Padding): void
{
	const previous = { name: window.classification, width: window.width, height: window.height };
	output.update.push((): void =>
	{
		const instance = ui.getWindow(previous.name);
		const width = instance.width, height = instance.height;

		if (width === previous.width && height === previous.height)
			return;

		previous.width = width;
		previous.height = height;

		performLayout(instance.widgets, control, width, height, padding);
	});
}


/**
 * Recalculate the whole layout.
 */
function performLayout(widgets: Widget[], control: Layoutable, width: number, height: number, padding?: Padding): void
{
	// Skip the top bar (16px)
	const area: Rectangle = { x: 0, y: 16, width: width, height: height - 16 };
	if (padding !== undefined)
	{
		applyPadding(area, padding);
	}
	const container = widgetContainer(widgets);
	control.layout(container, area);
}
