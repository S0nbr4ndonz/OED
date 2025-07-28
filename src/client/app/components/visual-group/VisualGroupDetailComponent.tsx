
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../TooltipHelpComponent';
import * as React from 'react';
import { CreateVisualGroupComponent } from '../visual-group/CreateVisualGroupComponent'; //Replace with CreateGroupVisualComponent once made
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { selectAllGroups } from '../../redux/api/groupsApi';
import {selectAllMeters} from '../../redux/api/metersApi'
import { useAppSelector } from '../../redux/reduxHooks';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
//import {getDeepGroupsByID} from '../../../../server/models/Group';

export default function VisualGroupDetailComponent(){

    const groupData = useAppSelector(selectAllGroups);
    const meterData = useAppSelector(selectAllMeters);
    

    const tooltipStyle = {
        ...tooltipBaseStyle,
        tooltipVisualGroupView: 'help.admin.groupvisuals'
    }

    return(
        <div>
            <TooltipHelpComponent page='visual-group'/>
            <div className-='container-fluid'>
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