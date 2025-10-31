import React from "react";
import {
	IAudio,
	ICaption,
	IImage,
	IText,
	ITrackItem,
	ITrackItemAndDetails,
	IVideo,
} from "@designcombo/types";
import { useEffect, useState } from "react";
import BasicText from "./basic-text";
import BasicImage from "./basic-image";
import BasicVideo from "./basic-video";
import BasicAudio from "./basic-audio";
import useStore from "../store/use-store";
import useLayoutStore from "../store/use-layout-store";
import BasicCaption from "./basic-caption";
import { LassoSelect } from "lucide-react";
import { Rnd } from "react-rnd";

const Container = ({ children }: { children: React.ReactNode }) => {
	const { activeIds, trackItemsMap, transitionsMap } = useStore();
	const [trackItem, setTrackItem] = useState<ITrackItem | null>(null);
	const {
		setTrackItem: setLayoutTrackItem,
		controlPanelPosition,
		controlPanelSize,
		setControlPanelPosition,
		setControlPanelSize,
		timelineHeight,
	} = useLayoutStore();

	useEffect(() => {
		if (activeIds.length === 1) {
			const [id] = activeIds;
			const trackItem = trackItemsMap[id];
			if (trackItem) {
				setTrackItem(trackItem);
				setLayoutTrackItem(trackItem);

				// On first open, position panel on the right side
				const screenWidth = window.innerWidth;
				const rightX = screenWidth - controlPanelSize.width - 20; // 20px margin from right
				if (controlPanelPosition.x === 100) {
					// Only if still at default position
					setControlPanelPosition({
						x: rightX,
						y: controlPanelPosition.y,
					});
				}
			} else console.log(transitionsMap[id]);
		} else {
			setTrackItem(null);
			setLayoutTrackItem(null);
		}
	}, [activeIds, trackItemsMap]);

	// Calculate panel height and position based on timeline height
	useEffect(() => {
		const NAVBAR_HEIGHT = 0;// Height of navbar
		const SPACING = 65; // Spacing between panel and timeline
		const MIN_HEIGHT = 100;
		const MAX_HEIGHT =1000;

		const screenHeight = window.innerHeight;

		// Calculate available height (screen - navbar - timeline - spacing)
		const availableHeight =
			screenHeight - NAVBAR_HEIGHT - timelineHeight - SPACING;
		const newHeight = Math.min(
			MAX_HEIGHT,
			Math.max(MIN_HEIGHT, availableHeight),
		);

		// Calculate Y position so panel ends before timeline starts
		// Timeline starts at (screenHeight - timelineHeight)
		// Panel should end at (screenHeight - timelineHeight - SPACING)
		const newY = screenHeight - timelineHeight - SPACING - newHeight;

		// Ensure panel doesn't go above navbar
		const finalY = Math.max(NAVBAR_HEIGHT + 10, newY);

		setControlPanelSize({
			width: controlPanelSize.width,
			height: newHeight,
		});

		setControlPanelPosition({
			x: controlPanelPosition.x,
			y: finalY,
		});
	}, [timelineHeight]);

	// Don't show panel if no item is selected
	if (!trackItem) return null;

	return (
		<Rnd
			size={controlPanelSize}
			position={controlPanelPosition}
			onDragStop={(e, d) => {
				setControlPanelPosition({ x: d.x, y: d.y });
			}}
			onResizeStop={(e, direction, ref, delta, position) => {
				setControlPanelSize({
					width: ref.offsetWidth,
					height: ref.offsetHeight,
				});
				setControlPanelPosition(position);
			}}
			minWidth={280}
			minHeight={250}
			maxWidth={600}
			maxHeight={500}
			bounds="window"
			className="shadow-2xl rounded-lg overflow-hidden border border-border/80 bg-muted z-50"
			style={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div className="flex-1 overflow-hidden">
				{React.cloneElement(children as React.ReactElement<any>, {
					trackItem,
				})}
			</div>
		</Rnd>
	);
};

const ActiveControlItem = ({
	trackItem,
}: {
	trackItem?: ITrackItemAndDetails;
}) => {
	if (!trackItem) return null;

	return (
		<>
			{
				{
					text: <BasicText trackItem={trackItem as ITrackItem & IText} />,
					caption: (
						<BasicCaption trackItem={trackItem as ITrackItem & ICaption} />
					),
					image: <BasicImage trackItem={trackItem as ITrackItem & IImage} />,
					video: <BasicVideo trackItem={trackItem as ITrackItem & IVideo} />,
					audio: <BasicAudio trackItem={trackItem as ITrackItem & IAudio} />,
				}[trackItem.type as "text"]
			}
		</>
	);
};

export const ControlItem = () => {
	return (
		<Container>
			<ActiveControlItem />
		</Container>
	);
};
