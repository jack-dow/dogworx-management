import { useCallback, useEffect, useState } from "react";


const eventListerOptions = {
	passive: true,
};

export function useViewportSize() {
	const [windowSize, setWindowSize] = useState({
		width: 0,
		height: 0,
	});

	const setSize = useCallback(() => {
		setWindowSize({ width: window.innerWidth || 0, height: window.innerHeight || 0 });
	}, []);

	useEffect(() => {
		const handleResize = () => {
			setSize();
		};

		window.addEventListener("resize", handleResize, eventListerOptions);
		window.addEventListener("orientationchange", handleResize, eventListerOptions);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}, [setSize]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(setSize, []);

	return windowSize;
}
