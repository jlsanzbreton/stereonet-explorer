
import * as d3 from 'd3';
import { ProjectionType, Line, Plane, Point } from '../types';

/**
 * Converts degrees to radians.
 * @param deg - Angle in degrees.
 * @returns Angle in radians.
 */
const degreesToRadians = (deg: number): number => deg * (Math.PI / 180);

/**
 * Projects a line (defined by trend and plunge) onto a 2D stereonet plane.
 * @param trend - The azimuth of the line (0-360).
 * @param plunge - The inclination of the line from horizontal (0-90).
 * @param projection - The type of projection (Wulff or Schmidt).
 * @param radius - The radius of the stereonet circle.
 * @returns The projected {x, y} coordinates.
 */
export const projectLine = (trend: number, plunge: number, projection: ProjectionType, radius: number): Point => {
    const trendRad = degreesToRadians(trend);
    const plungeRad = degreesToRadians(90 - plunge); // co-plunge

    let r;
    if (projection === ProjectionType.Wulff) {
        // Equal-angle (Wulff) projection
        r = radius * Math.tan(plungeRad / 2);
    } else {
        // Equal-area (Schmidt) projection
        r = radius * Math.sqrt(2) * Math.sin(plungeRad / 2);
    }

    return {
        x: r * Math.sin(trendRad),
        y: -r * Math.cos(trendRad), // Negative to have North at the top
    };
};

/**
 * Calculates the pole to a given plane.
 * The pole is a line perpendicular to the plane.
 * @param plane - The plane object.
 * @returns A line object representing the pole.
 */
export const getPoleToPlane = (plane: Plane): Omit<Line, 'id' | 'type'> => {
    // For a plane with dip/dipDirection, the pole plunges 90-dip
    // and its trend is the same as the dipDirection.
    // However, for lower hemisphere projection, pole trend is dipDirection + 180
    const trend = (plane.dipDirection + 180) % 360;
    const plunge = 90 - plane.dip;

    return { trend, plunge };
};


/**
 * Generates an SVG path string for a plane's great circle.
 * This is done by plotting a series of lines that lie on the plane.
 * @param plane - The plane to plot.
 * @param projection - The projection type.
 * @param radius - The stereonet radius.
 * @returns An SVG path data string 'd'.
 */
export const getGreatCirclePath = (plane: Plane, projection: ProjectionType, radius: number): string | null => {
    const dipRad = degreesToRadians(plane.dip);
    const dipDirectionRad = degreesToRadians(plane.dipDirection);
    
    // For vertical planes, the great circle is a straight line through the center
    if (plane.dip === 90) {
        const start = {
            x: radius * Math.sin(dipDirectionRad),
            y: -radius * Math.cos(dipDirectionRad),
        };
        const end = {
            x: -radius * Math.sin(dipDirectionRad),
            y: radius * Math.cos(dipDirectionRad),
        };
        return `M ${start.x},${start.y} L ${end.x},${end.y}`;
    }

    const points: Point[] = [];
    // alpha is the angle along the great circle from the dip direction
    for (let alphaDeg = -90; alphaDeg <= 90; alphaDeg += 2) {
        const alpha = degreesToRadians(alphaDeg);

        // Formulas to find trend/plunge of a line on the plane
        const plunge = Math.asin(Math.sin(dipRad) * Math.cos(alpha));
        
        let trendOffset = Math.atan2(Math.tan(alpha), Math.cos(dipRad));
        const trend = degreesToRadians(plane.dipDirection) + trendOffset;

        const { x, y } = projectLine(trend * 180 / Math.PI, plunge * 180 / Math.PI, projection, radius);
        points.push({ x, y });
    }

    const lineGenerator = d3.line<Point>().x(d => d.x).y(d => d.y);
    return lineGenerator(points);
};
