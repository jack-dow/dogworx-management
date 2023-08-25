function Layout(props: { children: React.ReactNode; dialogs: React.ReactNode }) {
	return (
		<div>
			{props.children}
			{/* {props.dialogs} */}
		</div>
	);
}

export default Layout;
