import * as React from 'react';
import { CreateVisualGroupComponent } from '../visual-group/CreateVisualGroupComponent'; //Replace with CreateGroupVisualComponent once made
import { selectAllGroups } from '../../redux/api/groupsApi';
import { selectAllMeters } from '../../redux/api/metersApi'
import { useAppSelector } from '../../redux/reduxHooks';
import { titleStyle } from '../../styles/modalStyle';

/**
 * Defines the meters and groups relationships graphics view
 * @returns Groups visual page element
 */
export default function VisualGroupDetailComponent() {

	// Get Group and Meter data from Redux
	const groupData = useAppSelector(selectAllGroups);
	const meterData = useAppSelector(selectAllMeters);

	return (
		<div>
			<div style={titleStyle}>
				<CreateVisualGroupComponent groups={groupData} meters={meterData} />
			</div>
		</div>
	);
}