import { ILayoutState } from "../interfaces/layout";
import { create } from "zustand";

const useLayoutStore = create<ILayoutState>((set) => ({
	activeMenuItem: "uploads", // Changed from "texts" to "uploads" - start with upload tab
	showMenuItem: false,
	cropTarget: null,
	showControlItem: false,
	showToolboxItem: false,
	activeToolboxItem: null,
	floatingControl: null,
	drawerOpen: false,
	controItemDrawerOpen: false,
	typeControlItem: "",
	labelControlItem: "",
	controlPanelPosition: {
		x: typeof window !== "undefined" ? window.innerWidth - 340 : 100, // Start at right side with 20px margin
		y: 100,
	},
	controlPanelSize: { width: 320, height: 400 }, // Default size
	timelineHeight: 300, // Default timeline height
	setCropTarget: (cropTarget) => set({ cropTarget }),
	setActiveMenuItem: (showMenu) => set({ activeMenuItem: showMenu }),
	setShowMenuItem: (showMenuItem) => set({ showMenuItem }),
	setShowControlItem: (showControlItem) => set({ showControlItem }),
	setShowToolboxItem: (showToolboxItem) => set({ showToolboxItem }),
	setActiveToolboxItem: (activeToolboxItem) => set({ activeToolboxItem }),
	setFloatingControl: (floatingControl) => set({ floatingControl }),
	setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
	trackItem: null,
	setTrackItem: (trackItem) => set({ trackItem }),
	setControItemDrawerOpen: (controItemDrawerOpen) =>
		set({ controItemDrawerOpen }),
	setTypeControlItem: (typeControlItem) => set({ typeControlItem }),
	setLabelControlItem: (labelControlItem) => set({ labelControlItem }),
	setControlPanelPosition: (position) =>
		set({ controlPanelPosition: position }),
	setControlPanelSize: (size) => set({ controlPanelSize: size }),
	setTimelineHeight: (height) => set({ timelineHeight: height }),
}));

export default useLayoutStore;
