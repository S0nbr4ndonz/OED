import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../TooltipHelpComponent';
import * as React from 'react';
import { CreateVisualGroupComponent } from '../visual-group/CreateVisualGroupComponent'; //Replace with CreateGroupVisualComponent once made
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { selectAllGroups } from '../../redux/api/groupsApi';
import {selectAllMeters} from '../../redux/api/metersApi'
import { useAppSelector } from '../../redux/reduxHooks';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';


/**
 * Defines the meters and groups relationships graphics view
 * @returns Groups visual page element
 */
export default function VisualGroupDetailComponent(){

    /*Get Group and Meter data from Redux */
    const groupData = useAppSelector(selectAllGroups);
    const meterData = useAppSelector(selectAllMeters);
    

    const tooltipStyle = {
        ...tooltipBaseStyle,
        //Only an admin is permitted access to the group visuals page
        tooltipVisualGroupView: 'help.admin.groupvisuals'
    }

    return(
        <div>
            <TooltipHelpComponent page='visual-group'/>
            <div className='container-fluid'>
                <h1 style={titleStyle}>
                <FormattedMessage id='visual.group'></FormattedMessage> 
                <div style={tooltipStyle}>
                    <TooltipMarkerComponent page='visual-group' helpTextId={tooltipStyle.tooltipVisualGroupView} />
                </div>
                </h1>
            </div>

            <h2 style={titleStyle}>
                Group Visual Graph
            </h2>

            <p>

            </p>

            <div style={titleStyle}>
                <CreateVisualGroupComponent groups={groupData} meters={meterData}/>
             </div>
        </div>
    );
}