/// <reference path="../../../lib/openrct2.d.ts" />

import { store } from "@src/bindings/stores/createStore";
import { label } from "@src/elements/controls/label";
import { window } from "@src/windows/window";
import test from "ava";
import Mock from "openrct2-mocks";


test("Standard properties are set", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const template = window({
		width: 100, height: 100,
		content: [
			label({
				text: "static",
				alignment: "centred",
				tooltip: "tip"
			})
		]
	});

	template.open();

	const widget = <LabelWidget>mock.createdWindows[0].widgets[0];
	t.is(widget.type, "label");
	t.is(widget.text, "static");
	t.is(widget.textAlign, "centred");
	t.is(widget.tooltip, "tip");
});


test("Text is bindable", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const text = store("Hello");
	const template = window({
		width: 100, height: 100,
		content: [
			label({ text: text })
		]
	});

	const instance1 = template.open();

	const label1 = <LabelWidget>mock.createdWindows[0].widgets[0];
	t.is(label1.text, "Hello");

	text.set("Bye");
	t.is(label1.text, "Bye");

	instance1.close();
	text.set("Still there");
	template.open();

	const label2 = <LabelWidget>mock.createdWindows[0].widgets[0];
	t.is(label2.text, "Still there");
});


test("Alignment is bindable", t =>
{
	const mock = Mock.ui();
	globalThis.ui = mock;

	const alignment = store<TextAlignment>("centred");
	const template = window({
		width: 100, height: 100,
		content: [
			label({ text: "test", alignment: alignment })
		]
	});

	const instance1 = template.open();

	const label1 = <LabelWidget>mock.createdWindows[0].widgets[0];
	t.is(label1.textAlign, "centred");

	alignment.set("left");
	t.is(label1.textAlign, "left");

	instance1.close();
	alignment.set("centred");
	template.open();

	const label2 = <LabelWidget>mock.createdWindows[0].widgets[0];
	t.is(label2.textAlign, "centred");
});
