

import * as React from 'react';
import * as d3 from 'd3';
import { useEffect } from 'react';
import {useIntl} from 'react-intl';
import { useAppSelector } from '../../redux/reduxHooks';
import {GroupData} from '../../../../client/app/types/redux/groups'
import {MeterData} from '../../../../client/app/types/redux/meters'
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
    const allGroups = useAppSelector(selectAllGroups);
    const allMeters = useAppSelector(selectAllMeters);


    /*Create color schema for meter and group props*/
    const colors=['#1F77B4','#b4331fff'];
    const colorSchema = d3.scaleOrdinal<string,string>()
        .domain(['meter','group'])
        .range(colors);


    /* Create data container to pass to D3 to force graph */
    const data: {nodes: any[], links: any[]} = {
        nodes: [],
        links: []
    };


    allMeters.map(value =>
        data.nodes.push({
            'name':value.name,
            'id': value.id,
            'meterType':value.meterType,
            'type': 'meter'
        })
    );

    allGroups.map(value =>
        data.nodes.push({
            'name':value.name,
            'id':value.id,
            'childGroups': value.childGroups,
            'childMeters': value.childMeters,
            'type':'group'
        })
    );

    allGroups.forEach( group =>{
        group.childGroups.forEach( childGroup => {
            data.links.push({
                'source':group.id,
                'target': childGroup,
                'type' : 'Group-to-Group'

            })
        })

        group.childMeters.forEach( meter => {
            data.links.push({
                'source': group.id,
                'target': meter,
                'type':'group-to-meter'
            })
        })
    });


    
    /*visuals start here */
    useEffect(()=>{

        /* View-box dimensions */
        const width = window.innerWidth;
        const height = 750;

       

        /* Grab data */
        const nodes = data.nodes.map(d => ({...d}));
        const links = data.links.map(d => ({...d}));

  


        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                /* Set all link ids (from data.links) */
                .id((d: any) => d.id)
                /* For demo purposes, default link length is 90 */
                .distance(90)
            )
            .force('x', d3.forceX())
            .force('y', d3.forceY());

        const svg = d3.select('#sample')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width:100%, height:auto')
            .append('g');
        
        /* End arrow head */
        svg.append('defs').append('marker')
            .attr('id', 'arrow-end')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight',4)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        /* Link Style */
        const link = svg.selectAll('line')
            .data(links)
            .enter().append('line')
            .style('stroke', '#aaa')
            .attr('marker-end', 'url(#arrow-end)')

            /* Node Style */
        const node = svg.selectAll('.node')
            .data(nodes)
            .enter().append('circle')
            .attr('r',20)
            .attr('fill', d=>colorSchema(d.type));
        
            /* Drag behavior */
        node.call(d3.drag()
            .on('start', dragstart)
            .on('drag', dragged)
            .on('end', dragend));

        /* Node label style */
        const label = svg.selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .text(function (d) {return d.name})
            .style('text-anchor', 'middle')
			.style('fill', '#000')
			.style('font-family', 'Arial')
			.style('font-size', 14);

        /* Update element positions when moved */
        simulation.on('tick', ()=>{
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

            node
			    .attr('cx', d => d.x)
				.attr('cy', d => d.y);

			label
				.attr('x', function(d){ return d.x; })
				.attr('y', function (d) {return d.y - 25; });
        })

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
		const legend = svg.append('g')
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
				.text(intl.formatMessage({id : `legend.graph.text.${item}`}));
		});


    }, []);


    


    return (
        <div>
			<div id='sample' style={{ border: '1px solid black', height: '800px' }}></div>
		</div>
    );


}