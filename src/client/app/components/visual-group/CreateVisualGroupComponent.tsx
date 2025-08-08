

import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAppSelector } from '../../redux/reduxHooks';
import { GroupData } from '../../../../client/app/types/redux/groups'
import { MeterData } from '../../../../client/app/types/redux/meters'
import { selectAllMeters } from '../../redux/api/metersApi';
import { selectAllGroups, selectGroupDataById } from '../../redux/api/groupsApi';
import { eventManager } from 'react-toastify/dist/core';
//import { CardColumns } from 'reactstrap';

/**
 *   Visual graph component that shows the relationship between all groups and meters
 * entered by an admin
 * @returns D3 force graph visual
 */

interface CreateVisualGroupProps {
    groups: GroupData[];
    meters: MeterData[];
}

type GroupNodeType = 'unselectedGroup' | 'selectedGroup' | 'childGroup' | 'deepGroup';
type MeterNodeType = 'meter' | 'childMeter' | 'deepMeter';
type AllNodeType = GroupNodeType | MeterNodeType;

export const CreateVisualGroupComponent: React.FC<CreateVisualGroupProps> = ({
    groups,
    meters
}) => {
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const intl = useIntl();

    /*Get Group data and Meter data from redux*/
    const allGroups: GroupData[] = useAppSelector(selectAllGroups);
    const allMeters: MeterData[] = useAppSelector(selectAllMeters);

    const selectedGroup: GroupData | undefined = allGroups.find(group => group.id === selectedGroupId);

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



        // Greedy algorithm: always pick the meter that shares the most groups with the last placed meter
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
<<<<<<< HEAD
    const allNodeTypes: AllNodeType[] = ['meter', 'childMeter', 'deepMeter', 'unselectedGroup', 'selectedGroup', 'childGroup', 'deepGroup'];
    const colors = ['#000000', '#DAE8FC', '#FFE6CC', '#b4331fff', '#FFF2CC', '#DAE8FC', '#FFE6CC'];
=======
    const allNodeTypes: AllNodeType[] = ['meter', 'childMeter', 'deepMeter', 'group', 'selectedGroup', 'childGroup', 'deepGroup'];
    const colors = ['#000000', '#DAE8FC', '#D5E8D4', '#b4331fff', '#FFF2CC', '#DAE8FC', '#DAE8FC'];
>>>>>>> 3bd7c39f8d709745029995460e94f236432c8f2d
    const colorSchema = d3.scaleOrdinal<string, string>()
        .domain(allNodeTypes)
        .range(colors);

    /*Create stroke schema for meter and group props*/
    interface StrokeStyle {
        color: string;
        width: number;
        dasharray: string;
        opacity: number;
    }
    
    const strokeStyles: StrokeStyle[] = [
        { color: '#000000', width: 1, dasharray: '5,5', opacity: 0.5 },      // meter
        { color: '#6C8EBF', width: 3, dasharray: 'none', opacity: 1.0 },     // childMeter
        { color: '#82B366', width: 3, dasharray: 'none', opacity: 1.0 },     // deepMeter
        { color: '#000000', width: 1, dasharray: '5,5', opacity: 0.5 },      // group
        { color: '#D6B656', width: 3, dasharray: 'none', opacity: 1.0 },   // selectedGroup
        { color: '#6C8EBF', width: 3, dasharray: 'none', opacity: 1.0 },     // childGroup
        { color: '#DAE8FC', width: 3, dasharray: 'none', opacity: 1.0 }      // deepGroup
    ];
    
    const strokeSchema = d3.scaleOrdinal<string, StrokeStyle>()
        .domain(allNodeTypes)
        .range(strokeStyles);

    /* Create data container to pass to D3 to force graph */
    const data: { nodes: any[], links: any[] } = {
        nodes: [],
        links: []
    };

    sortedGroupedMeters.map(value => {
        let nodeType: MeterNodeType = 'meter';
        
        if (selectedGroup) {
            if (selectedGroup.childMeters.includes(value.id)) {
                nodeType = 'childMeter';
            } else if (selectedGroup.deepMeters.includes(value.id)) {
                nodeType = 'deepMeter';
            }
        }

        data.nodes.push({
            'name': value.name,
            'id': `meter_${value.id}`,
            'meterType': value.meterType,
            'type': nodeType
        })
    });

    allGroups.map(value => {
        let nodeType: GroupNodeType = 'unselectedGroup';

        if (selectedGroup) {
            if (selectedGroupId === value.id) {
                nodeType = 'selectedGroup';
            } else if (selectedGroup.childGroups.includes(value.id)) {
                nodeType = 'childGroup';
            }
        }

        data.nodes.push({
            'name': value.name,
            'id': `group_${value.id}`,
            'childGroups': value.childGroups,
            'childMeters': value.childMeters,
            'type': nodeType
        });
    });

    allGroups.forEach(group => {
        let childGroupType: GroupNodeType = 'group'; // node type of child groups of the current group
        let childMeterType: MeterNodeType = 'meter'; // node type of child meters of the current group

        if (selectedGroup) {
            if (selectedGroupId === group.id) { // current group is the selected group
                childGroupType = 'childGroup';
                childMeterType = 'childMeter';
            } else if (selectedGroup.childGroups.includes(group.id)) { // current group is a child group of the selected group
                childGroupType = 'deepGroup';
                childMeterType = 'deepMeter';
            }
        }

        group.childGroups.forEach(childGroup => {
            data.links.push({
                'target': `group_${group.id}`,
                'source': `group_${childGroup}`,
                'type': 'Group-to-Group',
                'sourceType': childGroupType
            })
        })

        group.childMeters.forEach(meter => {
            data.links.push({
                'target': `group_${group.id}`,
                'source': `meter_${meter}`,
                'type': 'meter-to-group',
                'sourceType': childMeterType
            })
        })
    });

    const topSortAndPlaceGroups = (groups: GroupData[]): GroupData[][] => {
        // Build adjacency list (child -> parents relationship)
        const adjacencyList = new Map<number, number[]>();
        const inDegree = new Map<number, number>();

        // Initialize
        groups.forEach(group => {
            adjacencyList.set(group.id, []);
            inDegree.set(group.id, 0);
        });

        // Build graph: for each group, add edges from child to parent
        groups.forEach(group => {
            group.childGroups.forEach(childGroupId => {
                // Add edge from child to parent 
                const childEdges = adjacencyList.get(childGroupId) || [];
                childEdges.push(group.id);
                adjacencyList.set(childGroupId, childEdges);

                // Increment in-degree of parent
                inDegree.set(group.id, (inDegree.get(group.id) || 0) + 1);
            });
        });

        // Kahn's algorithm for topological sort
        const queue: number[] = [];
        const result: GroupData[] = [];

        // Add all groups with in-degree 0 (leaf nodes)
        groups.forEach(group => {
            if ((inDegree.get(group.id) || 0) === 0) {
                queue.push(group.id);
            }
        });

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const currentGroup = groups.find(g => g.id === currentId);
            if (currentGroup) {
                result.push(currentGroup);
            }

            // Process children of current group
            const children = groups.filter(g => g.childGroups.includes(currentId));
            children.forEach(child => {
                inDegree.set(child.id, (inDegree.get(child.id) || 0) - 1);
                if ((inDegree.get(child.id) || 0) === 0) {
                    queue.push(child.id);
                }
            });
        }

        // Check for cycles
        if (result.length !== groups.length) {
            throw new Error('Cycle detected in group hierarchy');
        }

        // Now place in columns based on topological order
        const columns: GroupData[][] = [];
        const groupToColumn = new Map<number, number>();

        result.forEach(group => {
            let maxParentColumn = -1;

            // Find the maximum column of any parent
            group.childGroups.forEach(childGroupId => {
                const parentColumn = groupToColumn.get(childGroupId) || 0;
                maxParentColumn = Math.max(maxParentColumn, parentColumn);
            });

            const columnIndex = maxParentColumn + 1;

            // Ensure we have enough columns
            while (columns.length <= columnIndex) {
                columns.push([]);
            }

            columns[columnIndex].push(group);
            groupToColumn.set(group.id, columnIndex);
        });

        return columns;
    };

    const columns = topSortAndPlaceGroups(allGroups);

    const sortGroupsByChildren = (columns: GroupData[][], meters: MeterData[]): GroupData[][] => {

        const sortedGroups: GroupData[][] = [];

        if (columns.length == 0) return columns;

        columns.forEach((column, columnIndex) => {
            if (column.length <= 1) {
                sortedGroups.push(column);
                return;
            }

            const currentSortedColumn: GroupData[] = [];

            if (columnIndex < 1) {
                for (const meter of meters) {
                    const parentGroups = allGroups.filter(group => group.childMeters.includes(meter.id) && column.includes(group));

                    /*Saving the length before pushing current parent group. 
                    This ensures that a group with a single meter child is 
                    placed closer to it's meter child*/
                    const currentLength = currentSortedColumn.length;
                    for (const parent of parentGroups) {
                        if (currentSortedColumn.includes(parent)) continue;

                        /*If any parent group has the meter as their only child, then insert that parent 
                        before any of the other parents currently in parentGroup. To ensure less edge interceptions*/
                        if (parent.childMeters.length == 1 && currentLength > 0) {
                            currentSortedColumn.splice(currentLength, 0, parent);
                            continue;
                        }


                        currentSortedColumn.push(parent);
                    }
                }
            }
            else {

                const previousColumn: GroupData[] = columns[columnIndex - 1];


                for (const currentGroup of previousColumn) {
                    const parentGroups = allGroups.filter(group => group.childGroups.includes(currentGroup.id) && column.includes(group));


                    if (parentGroups.length === 0) continue;

                    /*Saving the length before pushing current parent group. 
                    This ensures that a group with a single meter child is 
                    placed closer to it's meter child*/
                    const currentLength = currentSortedColumn.length;
                    for (const parent of parentGroups) {
                        if (currentSortedColumn.includes(parent)) continue;

                        /*If any parent group has the meter as their only child, then insert that parent 
                        before any of the other parents currently in parentGroup. To ensure less edge interceptions*/
                        if (parent.childGroups.length == 1 && currentLength > 0) {
                            currentSortedColumn.splice(currentLength, 0, parent);
                            continue;
                        }


                        currentSortedColumn.push(parent);
                    }

                }



            }

            sortedGroups.push(currentSortedColumn);
        });

        return sortedGroups;
    };

    const sortedFinally = sortGroupsByChildren(columns, sortedGroupedMeters);

    /*visuals start here */
    useEffect(() => {
        /* View-box dimensions */
        const width = window.innerWidth;
        const height = 750;

        /* Grab data via shallow copy */
        const nodes = data.nodes.map(d => ({ ...d }));
        const links = data.links.map(d => ({ ...d }));

        const meterTypes: MeterNodeType[] = ['meter', 'childMeter', 'deepMeter'];
        const groupTypes: GroupNodeType[] = ['unselectedGroup', 'selectedGroup', 'childGroup', 'deepGroup'];
        
        // Separate meter and group nodes
        const meterNodeData = nodes.filter(node => meterTypes.includes(node.type));
        const groupNodeData = nodes.filter(node => groupTypes.includes(node.type));

        // Position meter nodes in a column on the left
        const meterColumnX = -width / 2 + 200; // 100px from left edge
        const meterSpacing = 80; // Space between meters
        const meterStartY = -height / 2 + 100; // Start 100px from top

        meterNodeData.forEach((node, index) => {
            node.x = meterColumnX;
            node.y = meterStartY + (index * meterSpacing);
            node.fx = node.x; // Fix position
            node.fy = node.y;
        });

        // Position group nodes in columns
        const groupColumnX = -width / 2 + 400;
        const groupSpacing = 80; // Space between groups in a column
        const groupStartY = -height / 2 + 100;
        const columnSpacing = 200; // Space between columns

        // Iterate through each column
        sortedFinally.forEach((column, columnIndex) => {
            // Iterate through each group in the current column
            column.forEach((group, groupIndex) => {
                // Find the corresponding node in groupNodeData
                const node = groupNodeData.find(n => n.id === `group_${group.id}`);
                if (node) {
                    // Position the group in its column
                    node.x = groupColumnX + (columnIndex * columnSpacing);
                    node.y = groupStartY + (groupIndex * groupSpacing);
                    node.fx = node.x; // Fix position
                    node.fy = node.y;
                }
            });
        });

        groupNodeData.forEach(node => {
            node.originalX = node.x;
            node.originalY = node.y;
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

        /* End arrow heads - create separate markers for each node type */
        const defs = g.append('defs');
        
        allNodeTypes.forEach(nodeType => {
            const strokeStyle = strokeSchema(nodeType);
            const markerId = `arrow-end-${nodeType}`;
            
            defs.append('marker')
                .attr('id', markerId)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 10)
                .attr('refY', 0)
                .attr('markerWidth', 8)
                .attr('markerHeight', 6)
                .attr('markerUnits', 'userSpaceOnUse') // Fixed size regardless of stroke width
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', strokeStyle.color)
                .attr('stroke', strokeStyle.color)
        });

        /* Link Style */
        const link = g.selectAll('line')
            .data(links)
            .enter().append('line')
<<<<<<< HEAD
            .style('stroke', 'black')
            .attr('stroke-dasharray', ('5,5'))
            .attr('marker-end', 'url(#arrow-end)')
=======
            .attr('stroke', d => strokeSchema(d.sourceType).color)
            .attr('stroke-width', d => strokeSchema(d.sourceType).width)
            .attr('stroke-dasharray', d => strokeSchema(d.sourceType).dasharray)
            .attr('stroke-opacity', d => strokeSchema(d.sourceType).opacity)
            .attr('marker-end', d => `url(#arrow-end-${d.sourceType})`)
>>>>>>> 3bd7c39f8d709745029995460e94f236432c8f2d

        /* Node Style */
        const groupNodes = g.selectAll('.group-node')
            .data(groupNodeData)
            .enter().append('circle')
            .attr('r', 20)
            .attr('fill', d => colorSchema(d.type))
            .attr('data-id', d => d.id)
            .style('cursor', 'pointer')
            .on('click', (event, d) => onGroupSelect(d.id))
            .attr('stroke', d => strokeSchema(d.type).color)
            .attr('stroke-width', d => strokeSchema(d.type).width)
            .attr('stroke-dasharray', d => strokeSchema(d.type).dasharray)
            .attr('stroke-opacity', d => strokeSchema(d.type).opacity)
            .attr('fill-opacity', 0.5);

        const meterNodes = g.selectAll('.meter-node')
            .data(meterNodeData)
            .enter().append('rect')
            .attr('width', 60)
            .attr('height', 40)
            .attr('fill', d => colorSchema(d.type))
            .attr('fill-opacity', d => (d.type === 'childMeter' || d.type === 'deepMeter') ? 1 : 0)
            .attr('stroke', d => strokeSchema(d.type).color)
            .attr('stroke-width', d => strokeSchema(d.type).width)
            .attr("stroke-dasharray", d => strokeSchema(d.type).dasharray)
            .attr('stroke-opacity', d => strokeSchema(d.type).opacity)
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
                .attr('x1', d => {
                    /*translate where links begin to have them start at 
                    the edge of an element instead of the center of one*/

                    /*if link starts from a meter*/
                    if (d.type == 'meter-to-group') {


                        /*take half of the width of the meter's rectangle element*/
                        const halfWidth = 30;

                        /*Translate the  beginning of the link 
                        by the halfwidth, to have it start at the edge*/
                        return d.source.x + halfWidth;
                    }
                    else {
                        /* link starts from a group node*/

                        /*radius for a group node is set to 20 for all nodes*/
                        const radius = 20;

                        /*translate link by the radius to have it start from the edge*/
                        return d.source.x + radius;
                    }
                })
                .attr('y1', d => d.source.y)
                .attr('x2', d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const nodeRadius = 20;

                    return d.target.x - (dx / length) * nodeRadius;

                })
                .attr('y2', d => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const nodeRadius = 20;

                    return d.target.y - (dy / length) * nodeRadius;
                });

            groupNodes
                .attr('cx', d => d.fx || d.x)  // Use fixed position if available
                .attr('cy', d => d.fy || d.y);

            meterNodes
                .attr('x', d => (d.fx || d.x) - 30)
                .attr('y', d => (d.fy || d.y) - 20);

            label
                .attr('x', d => d.fx || d.x)
                .attr('y', d => (d.fy || d.y) - 25);
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

            d3.select(event.subject)
                .transition()
                .duration(2000)
                .ease(d3.easeLinear)
                .tween('position', () => {
                    const startX = event.subject.x;
                    const startY = event.subject.y;
                    const endX = event.subject.originalX;
                    const endY = event.subject.originalY;

                    return (t: number) => {
                        event.subject.x = startX + (endX - startX) * t;
                        event.subject.y = startY + (endY - startY) * t
                    }
                })
                .on('end', () => {
                    event.subject.fx = event.subject.originalX;
                    event.subject.fy = event.subject.originalY;
                });
        }

        /* Color Legend */
        const legend = g.append('g')
            .attr('transform', `translate(${-width / 2 + 20}, ${-height / 2 + 20})`);

        colorSchema.domain().forEach((item, i) => {
            const legendEntry = legend.append('g')
                .attr('transform', `translate(0, ${i * 30})`);

            if (item == 'meter') {
                legendEntry.append('rect')
                    .attr('width', 40)
                    .attr('height', 25)
                    .attr('fill-opacity', 0)
                    .attr('stroke', colorSchema(item))
                    .attr('stroke-width', 2)
                    .attr("stroke-dasharray", "5,5")
                    .attr('x', -5)  // Center the rectangle
                    .attr('y', 0); // Center the rectangle
            }
            else if (item == 'childMeter') {
                legendEntry.append('rect')
                    .attr('width', 40)
                    .attr('height', 25)
                    .attr('fill', colorSchema(item))
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .attr('x', -5)  // Center the rectangle
                    .attr('y', 0); // Center the rectangle
            }
            else if (item == 'deepMeter') {
                legendEntry.append('rect')
                    .attr('width', 40)
                    .attr('height', 25)
                    .attr('fill', colorSchema(item))
                    .attr('stroke', 'black')                    
                    .attr('stroke-width', 2)
                    .attr('x', -5)  // Center the rectangle
                    .attr('y', 0); // Center the rectangle
            }
            else if (item == 'unselectedGroup') {
                legendEntry.append('circle')
                    .attr('r', 15)
                    .attr('cx', 15) // Center the circle horizontally
                    .attr('cy', 15) // Center the circle vertically
                    .attr('fill', colorSchema(item))
                    .attr('fill-opacity', 0.5)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', ('5,5'));
            }
            else if (item == 'selectedGroup') {
                legendEntry.append('circle')
                    .attr('r', 15)
                    .attr('cx', 15) // Center the circle horizontally
                    .attr('cy', 15) // Center the circle vertically
                    .attr('fill', colorSchema(item))
                    .attr('fill-opacity', 0.5)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);
            }
            else if (item == 'childGroup') {
                legendEntry.append('circle')
                    .attr('r', 15)
                    .attr('cx', 15) // Center the circle horizontally
                    .attr('cy', 15) // Center the circle vertically
                    .attr('fill', colorSchema(item))
                    .attr('fill-opacity', 0.5)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)            }
            else if (item == 'deepGroup') {
                legendEntry.append('circle')
                    .attr('r', 15)
                    .attr('cx', 15) // Center the circle horizontally
                    .attr('cy', 15) // Center the circle vertically
                    .attr('fill', colorSchema(item))
                    .attr('fill-opacity', 0.5)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)            
                }



            // Text label
            legendEntry.append('text')
                .attr('x', 40) // Position the text to the right of the circle
                .attr('y', 20) // Align the text vertically with the circle
                .style('fill', '#000')
                .style('font-size', '12px')
                .style('alignment-middle', 'middle')
                /* internationalizing color legend text */
                .text(intl.formatMessage({ id: `legend.graph.text.${item}` }));
        });

        // Calculate SVG dimensions after all elements are created
        calculateSvgDimensions();

        // Cleanup function - runs when component unmounts or dependencies change
        return () => {
            console.log("Cleaning up D3 visualization");
            const existingSvg = d3.select('#sample svg');
            if (!existingSvg.empty()) {
                existingSvg.remove();
            }
        };
    }, [allGroups, allMeters, selectedGroupId]);

    const onGroupSelect = (newSelectionId: string) => {
        // remove "group_" prefix from id
        if (selectedGroupId === Number(newSelectionId.slice(6))) {
            setSelectedGroupId(null);
        } else {
            setSelectedGroupId(Number(newSelectionId.slice(6)));
            console.log(selectedGroupId);
        }
    }

    return (
        <div>
            <div id='sample' style={{ width: '100%', height: '100vh', overflowY: 'auto', overflowX: 'auto' }} />
        </div>
    );


}