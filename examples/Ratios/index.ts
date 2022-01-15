/// <reference path="../../lib/openrct2.d.ts" />

import { box, horizontal, label, vertical, window } from "openrct2-flexui";


const ratios = window({
	title: "Ratios (fui example)",
	width: 400, minWidth: 100, maxWidth: 10000,
	height: 300, minHeight: 75, maxHeight: 7500,
	padding: 5,
	content: [
		horizontal([
			box(
				label({
					text: "#1",
					alignment: "centred",
					padding: [ "50%", 0 ]
				})
			),
			vertical([
				box(
					label({
						text: "#2",
						alignment: "centred",
						padding: [ "50%", 0 ]
					})
				),
				horizontal([
					vertical([
						horizontal([
							box(
								label({
									text: "#5",
									alignment: "centred",
									padding: [ "50%", 0 ]
								})
							),
							vertical([
								box(
									label({
										text: "#6",
										alignment: "centred",
										padding: [ "50%", 0 ]
									})
								),
								box(
									label({
										text: ":-)",
										alignment: "centred",
										padding: [ "50%", 0 ]
									})
								)
							])
						]),
						box(
							label({
								text: "#4",
								alignment: "centred",
								padding: [ "50%", 0 ]
							})
						),
					]),
					box(
						label({
							text: "#3",
							alignment: "centred",
							padding: [ "50%", 0 ]
						})
					),
				])
			])
		])
	]
});


registerPlugin({
	name: "Ratios (fui-example)",
	version: "1.0",
	authors: ["Basssiiie"],
	type: "local",
	licence: "MIT",
	main: () =>
	{
		ui.registerMenuItem("(fui) Ratios", () => ratios.open());
	}
});