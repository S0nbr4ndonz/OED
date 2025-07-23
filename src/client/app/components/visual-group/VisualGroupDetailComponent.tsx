
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../TooltipHelpComponent';
import * as React from 'react';
import { CreateVisualUnitComponent } from '../visual-unit/CreateVisualUnitComponent'; //Replace with CreateGroupVisualComponent once made
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { selectCik } from '../../redux/api/conversionsApi';
import { selectConversionsDetails } from '../../redux/api/conversionsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';

export default function VisualGroupDetailComponent(){

    const conversionData = useAppSelector(selectConversionsDetails);
    const cikData = useAppSelector(selectCik);

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

            <div style={titleStyle}>
                <CreateVisualUnitComponent conversions={conversionData}/>
             </div>
        </div>
    );
}