

import * as React from 'react';
import * as d3 from 'd3';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useAppSelector } from '../../redux/reduxHooks';
import { GroupData } from '../../../../client/app/types/redux/groups'
import { MeterData } from '../../../../client/app/types/redux/meters'
import { selectAllMeters } from '../../redux/api/metersApi';
import { selectAllGroups } from '../../redux/api/groupsApi';

/**
 *   Visual graph component that shows the relationship between all groups and meters
 * entered by an admin
 * @returns D3 force graph visual
 */

interface CreateVisualGroupProps {
    groups: GroupData[];
    meters: MeterData[];
}

export const CreateVisualGroupComponent: React.FC<CreateVisualGroupProps> = ({
    groups,
    meters
}) => {

    const intl = useIntl();

    /*Get Group data and Meter data from redux*/
    const allGroups: GroupData[] = useAppSelector(selectAllGroups);
    const allMeters: MeterData[] = useAppSelector(selectAllMeters);

    const groupedMeterIds: Set<number> = new Set(
        allGroups.flatMap(group => group.deepMeters)
    );

    const groupedMeters: MeterData[] = allMeters.filter(meterData => groupedMeterIds.has(meterData.id));
    
    // Sort meters to minimize distance between meters that share groups
    const sortMetersByGroupRelationships = (meters: MeterData[]): MeterData[] => {
        if (meters.length <= 1) return meters;
        
        const sortedMeters: MeterData[] = [];
        const usedMeterIds = new Set<number>();
        
        // Start with the first meter
        sortedMeters.push(meters[0]);
        usedMeterIds.add(meters[0].id);
        
        // Pick the meter that shares the most groups with the last placed meter
        while (sortedMeters.length < meters.length) {
            const lastMeter = sortedMeters[sortedMeters.length - 1];
            let bestNextMeter: MeterData | null = null;
            let maxSharedGroups = -1;
            
            // Find the meter that shares the most groups with the last placed meter
            for (const meter of meters) {
                if (usedMeterIds.has(meter.id)) continue;
                
                // Count shared groups between lastMeter and current meter
                const sharedGroups = allGroups.filter(group => 
                    group.deepMeters.includes(lastMeter.id) && 
                    group.deepMeters.includes(meter.id)
                ).length;
                
                if (sharedGroups > maxSharedGroups) {
                    maxSharedGroups = sharedGroups;
                    bestNextMeter = meter;
                }
            }
            
            // If no shared groups, pick the first unused meter
            if (bestNextMeter === null) {
                bestNextMeter = meters.find(m => !usedMeterIds.has(m.id))!;
            }
            
            sortedMeters.push(bestNextMeter);
            usedMeterIds.add(bestNextMeter.id);
        }
        
        return sortedMeters;
    };
    
    const sortedGroupedMeters = sortMetersByGroupRelationships(groupedMeters);

    /*Create color schema for meter and group props*/
    const colors = ['#000000', '#b4331fff'];
    const colorSchema = d3.scaleOrdinal<string, string>()
        .domain(['meter', 'group'])
        .range(colors);

    /* Create data container to pass to D3 to force graph */
    const data: { nodes: any[], links: any[] } = {
        nodes: [],
        links: []
    };

    // console.log("All Group Ids: " + allGroups.map(g => g.id));
    // console.log("All Meter Ids: " + sortedGroupedMeters.map(m => m.id));

    sortedGroupedMeters.map(value =>
        data.nodes.push({
            'name': value.name,
            'id': `meter_${value.id}`,
            'meterType': value.meterType,
            'type': 'meter'
        })
    );

    allGroups.map(value =>
        data.nodes.push({
            'name': value.name,
            'id': `group_${value.id}`,
            'childGroups': value.childGroups,
            'childMeters': value.childMeters,
            'type': 'group'
        })
    );

    allGroups.forEach(group => {
        group.childGroups.forEach(childGroup => {
            data.links.push({
                'source': `group_${group.id}`,
                'target': `group_${childGroup}`,
                'type': 'Group-to-Group'
            })
        })

        group.childMeters.forEach(meter => {
            data.links.push({
                'source': `group_${group.id}`,
                'target': `meter_${meter}`,
                'type': 'group-to-meter'
            })
        })
    });

    /*visuals start here */
    useEffect(() => {
        /* View-box dimensions */
        const width = window.innerWidth;
        const height = 750;

        /* Grab data via shallow copy */
        const nodes = data.nodes.map(d => ({ ...d }));
        const links = data.links.map(d => ({ ...d }));

        // Separate meter and group nodes
        const meterNodeData = nodes.filter(d => d.type === 'meter');
        const groupNodeData = nodes.filter(d => d.type === 'group');

        // Position meter nodes in a column on the left
        const meterColumnX = -width / 2 + 200; // 100px from left edge
        const meterSpacing = 80; // Space between meters
        const startY = -height / 2 + 100; // Start 100px from top

        meterNodeData.forEach((node, index) => {
            node.x = meterColumnX;
            node.y = startY + (index * meterSpacing);
            node.fx = node.x; // Fix position
            node.fy = node.y;
        });

        // Calculate SVG dimensions immediately after positioning meter nodes
        const calculateSvgDimensions = () => {
            // Get the bounding box of all content
            const bbox = g.node()!.getBBox();

            // Add padding
            const padding = 50;
            const contentWidth = bbox.width + (padding * 2);
            const contentHeight = bbox.height + (padding * 2);

            // Update SVG dimensions
            svg
                .attr('width', contentWidth)
                .attr('height', contentHeight)
                .attr('viewBox', [bbox.x - padding, bbox.y - padding, contentWidth, contentHeight]);
        };

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                /* Set all link ids (from data.links) */
                .id((d: any) => d.id)
                /* For demo purposes, default link length is 90 */
                .distance(90)
            )
            .force('x', d3.forceX().strength(0.1)) // Weaker force for groups
            .force('y', d3.forceY().strength(0.1)); // Weaker force for groups

        const svg = d3.select('#sample')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

        const g = svg
            .append('g');

        /* End arrow head */
        g.append('defs').append('marker')
            .attr('id', 'arrow-end')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        /* Link Style */
        const link = g.selectAll('line')
            .data(links)
            .enter().append('line')
            .style('stroke', '#aaa')
            .attr('marker-end', 'url(#arrow-end)')

        /* Node Style */
        const groupNodes = g.selectAll('.group-node')
            .data(groupNodeData)
            .enter().append('circle')
            .attr('r', 20)
            .attr('fill', d => colorSchema(d.type));

        const meterNodes = g.selectAll('.meter-node')
            .data(meterNodeData)
            .enter().append('rect')
            .attr('width', 60)
            .attr('height', 40)
            .attr('fill', d => colorSchema(d.type))
            .attr('fill-opacity', 0)
            .attr('stroke', d => colorSchema(d.type))
            .attr('stroke-width', 2)
            .attr("stroke-dasharray", "5,5")
            .attr('x', d => d.x - 30)  // Center the rectangle
            .attr('y', d => d.y - 20); // Center the rectangle

        /* Drag behavior - only for group nodes */
        groupNodes.call(d3.drag()
            .on('start', dragstart)
            .on('drag', dragged)
            .on('end', dragend));

        /* Node label style */
        const label = g.selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .text(function (d) { return d.name })
            .style('text-anchor', 'middle')
            .style('fill', '#000')
            .style('font-family', 'Arial')
            .style('font-size', 14);

        /* Update element positions when moved */
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            groupNodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', function (d) { return d.x; })
                .attr('y', function (d) { return d.y - 25; });
        });

        // eslint-disable-next-line jsdoc/require-jsdoc
        function dragstart(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // eslint-disable-next-line jsdoc/require-jsdoc
        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // eslint-disable-next-line jsdoc/require-jsdoc
        function dragend(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        /* Color Legend */
        const legend = g.append('g')
            .attr('transform', `translate(${-width / 2 + 20}, ${-height / 2 + 20})`);

        colorSchema.domain().forEach((item, i) => {
            const legendEntry = legend.append('g')
                .attr('transform', `translate(0, ${i * 30})`);

            // Rectangle color box
            legendEntry.append('circle')
                .attr('r', 15)
                .attr('cx', 15) // Center the circle horizontally
                .attr('cy', 15) // Center the circle vertically
                .attr('fill', colorSchema(item));

            // Text label
            legendEntry.append('text')
                .attr('x', 40) // Position the text to the right of the circle
                .attr('y', 20) // Align the text vertically with the circle
                .style('fill', '#000')
                .style('font-size', '14px')
                .style('alignment-middle', 'middle')
                /* internationalizing color legend text */
                .text(intl.formatMessage({ id: `legend.graph.text.${item}` }));
        });

        // Calculate SVG dimensions after all elements are created
        calculateSvgDimensions();
    }, []);

    return (
        <div>
            <div id='sample' style={{ width: '100%', height: '100vh', overflowY: 'auto', overflowX: 'auto' }} />
        </div>
    );


}