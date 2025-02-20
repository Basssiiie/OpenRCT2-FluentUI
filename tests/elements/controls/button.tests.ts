/// <reference path="../../../lib/openrct2.d.ts" />

import { store } from "@src/bindings/stores/createStore";
import { button } from "@src/elements/controls/button";
import { window } from "@src/windows/window";
import test from "ava";
import Mock from "openrct2-mocks";
import { call } from "tests/helpers";


test("Standard properties are set", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const template = window({
		width: 100, height: 100,
		content: [
			button({ text: "Click me!", image: 123, isPressed: true, tooltip: "clickable" })
		]
	});
	template.open();

	const widget = <ButtonWidget>mock.createdWindows[0].widgets[0];
	t.is(widget.type, "button");
	t.is(widget.text, "Click me!");
	t.true(widget.isPressed);
	t.is(widget.tooltip, "clickable");
});


test("Text is bindable", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const text = store("bonjour");
	const template = window({
		width: 100, height: 100,
		content: [
			button({ text: text })
		]
	});
	template.open();

	const widget = <ButtonWidget>mock.createdWindows[0].widgets[0];
	t.is(widget.text, "bonjour");

	text.set("annyeong");
	t.is(widget.text, "annyeong");
});


test("Image is bindable", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const image = store(334);
	const template = window({
		width: 100, height: 100,
		content: [
			button({ image: image })
		]
	});
	template.open();

	const widget = <ButtonWidget>mock.createdWindows[0].widgets[0];
	t.is(widget.image, 334);

	image.set(543);
	t.is(widget.image, 543);
});


test("Is pressed is bindable", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const pressed = store(false);
	const template = window({
		width: 100, height: 100,
		content: [
			button({ isPressed: pressed })
		]
	});
	template.open();

	const widget = <ButtonWidget>mock.createdWindows[0].widgets[0];
	t.false(widget.isPressed);

	pressed.set(true);
	t.true(widget.isPressed);
});


test("Click event gets called", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;
	let count = 0;

	const template = window({
		width: 100, height: 100,
		content: [
			button({ onClick: () => count++ })
		]
	});
	template.open();

	const widget = <ButtonDesc>mock.createdWindows[0].widgets[0];
	t.is(count, 0);

	call(widget.onClick);
	t.is(count, 1);

	call(widget.onClick);
	t.is(count, 2);

	call(widget.onClick);
	t.is(count, 3);
});
