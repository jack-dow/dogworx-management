function VetsLayout(props: { children: React.ReactNode; sheets: React.ReactNode }) {
	return (
		<>
			{props.children}
			{props.sheets}
		</>
	);
}

export default VetsLayout;
