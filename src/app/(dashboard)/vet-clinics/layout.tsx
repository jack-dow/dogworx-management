function VetClinicsLayout(props: { children: React.ReactNode; sheets: React.ReactNode }) {
	return (
		<>
			{props.children}
			{props.sheets}
		</>
	);
}

export default VetClinicsLayout;
