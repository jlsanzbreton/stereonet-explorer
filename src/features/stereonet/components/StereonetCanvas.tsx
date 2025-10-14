import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { StructuralData, ProjectionType, Plane, Point } from '../model/types';
import { COLORS } from '../model/transforms';
import { projectLine, getPoleToPlane, getGreatCirclePath } from '@/core/projection';

interface StereonetCanvasProps {
    data: StructuralData[];
    projection: ProjectionType;
    showGrid: boolean;
    showPoles: boolean;
}

const StereonetCanvas: React.FC<StereonetCanvasProps> = ({ data, projection, showGrid, showPoles }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                const size = Math.min(width, height);
                setDimensions({ width: size, height: size });
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current) return;
        const { width, height } = dimensions;
        const radius = Math.min(width, height) / 2 * 0.9;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);
            
        svg.selectAll('*').remove(); // Clear previous render

        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute')
            .style('z-index', '10')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0,0,0,0.7)')
            .style('color', '#fff')
            .style('padding', '5px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px');

        // Draw Grid
        if (showGrid) {
            // Primitive circle
            g.append('circle')
                .attr('r', radius)
                .attr('fill', 'none')
                .attr('stroke', COLORS.GRID_MAJOR)
                .attr('stroke-width', 1.5);
            
            // FIX: Strongly type d3.line generator to work with Point objects.
            const lineGenerator = d3.line<Point>().x((d) => d.x).y((d) => d.y);

            // Grid lines (great circles and small circles)
            for (let i = 10; i <= 90; i += 10) {
                 // Great circles (meridians)
                 if (i < 90) {
                    const planeNS: Plane = { id: `grid-ns-${i}`, type: 'plane', dipDirection: 90, dip: i };
                    g.append('path')
                        .attr('d', getGreatCirclePath(planeNS, projection, radius))
                        .attr('fill', 'none').attr('stroke', COLORS.GRID_MINOR).attr('stroke-width', 0.5);

                    const planeEW: Plane = { id: `grid-ew-${i}`, type: 'plane', dipDirection: 0, dip: i };
                     g.append('path')
                         .attr('d', getGreatCirclePath(planeEW, projection, radius))
                         .attr('fill', 'none').attr('stroke', COLORS.GRID_MINOR).attr('stroke-width', 0.5);
                 }

                // Small circles (parallels) - cones of constant angle from vertical
                const parallelPoints = d3.range(0, 361, 5).map(trend => {
                    return projectLine(trend, 90 - i, projection, radius);
                });
                g.append('path')
                    .attr('d', lineGenerator(parallelPoints))
                    .attr('fill', 'none')
                    .attr('stroke', COLORS.GRID_MINOR)
                    .attr('stroke-width', 0.5);
            }
        }
        
        // Cardinal directions
        const directions = [
            { label: t('canvas.cardinal.north'), x: 0, y: -radius - 10 },
            { label: t('canvas.cardinal.south'), x: 0, y: radius + 20 },
            { label: t('canvas.cardinal.east'), x: radius + 10, y: 5 },
            { label: t('canvas.cardinal.west'), x: -radius - 20, y: 5 },
        ];
        g.selectAll('.cardinal-label')
            .data(directions)
            .enter()
            .append('text')
            .attr('class', 'cardinal-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#333')
            .text(d => d.label);

        // Draw data
        data.forEach(item => {
            if (item.type === 'plane') {
                const path = getGreatCirclePath(item, projection, radius);
                if (path) {
                    // Draw the great circle
                    g.append('path')
                        .attr('d', path)
                        .attr('fill', 'none')
                        .attr('stroke', COLORS.PLANE)
                        .attr('stroke-width', 2)
                        .on('mouseover', () => {
                            tooltip
                                .style('visibility', 'visible')
                                .text(t('canvas.tooltip.plane', { dipDirection: item.dipDirection, dip: item.dip }));
                        })
                        .on('mousemove', (event) => {
                            tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
                        })
                        .on('mouseout', () => {
                            tooltip.style('visibility', 'hidden');
                        });
                    
                    // Add label for the plane
                    const strike = (item.dipDirection - 90 + 360) % 360;
                    const labelPos = projectLine(strike, 0, projection, radius * 0.96);
                    g.append('text')
                        .attr('x', labelPos.x)
                        .attr('y', labelPos.y)
                        .attr('dy', strike > 90 && strike < 270 ? -3 : 10) // Adjust position slightly
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '10px')
                        .attr('fill', COLORS.PLANE)
                        .style('pointer-events', 'none')
                        .text(t('canvas.labels.plane', { dipDirection: item.dipDirection, dip: item.dip }));
                }
                if (showPoles) {
                    const pole = getPoleToPlane(item);
                    const { x, y } = projectLine(pole.trend, pole.plunge, projection, radius);
                    g.append('rect')
                        .attr('x', x - 3)
                        .attr('y', y - 3)
                        .attr('width', 6)
                        .attr('height', 6)
                        .attr('fill', COLORS.POLE)
                        .on('mouseover', () => {
                            tooltip
                                .style('visibility', 'visible')
                                .text(
                                    t('canvas.tooltip.pole', {
                                        trend: pole.trend.toFixed(0),
                                        plunge: pole.plunge.toFixed(0),
                                        planeDipDirection: item.dipDirection,
                                        planeDip: item.dip,
                                    })
                                );
                        })
                        .on('mousemove', (event) => {
                            tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
                        })
                        .on('mouseout', () => {
                            tooltip.style('visibility', 'hidden');
                        });
                }
            } else if (item.type === 'line') {
                const { x, y } = projectLine(item.trend, item.plunge, projection, radius);
                g.append('circle')
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', 4)
                    .attr('fill', COLORS.LINE)
                    .on('mouseover', () => {
                        tooltip
                            .style('visibility', 'visible')
                            .text(t('canvas.tooltip.line', { trend: item.trend, plunge: item.plunge }));
                    })
                    .on('mousemove', (event) => {
                        tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
                    })
                    .on('mouseout', () => {
                        tooltip.style('visibility', 'hidden');
                    });
            }
        });
        
        return () => {
           tooltip.remove();
        };

    }, [data, projection, dimensions, showGrid, showPoles, t, i18n.language]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default StereonetCanvas;
