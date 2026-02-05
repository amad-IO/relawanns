// import svgPaths from "./svg-z3r0xbdjjt";
const svgPaths: any = {}; // Placeholder

function Group() {
    return (
        <div className="absolute h-[296.692px] left-0 top-0 w-[317.556px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 318 297">
                <g id="Group 1">
                    <g id="Vector">
                        <path d={svgPaths.p2e35180} fill="var(--fill-0, black)" />
                        <path d={svgPaths.p2b1a6af0} fill="#FEDCC8" />
                        <path d={svgPaths.p25a7e100} fill="#FEDCC8" />
                    </g>
                    <g id="Vector_2">
                        <path d={svgPaths.p12cfa400} fill="var(--fill-0, black)" />
                        <path d={svgPaths.p388216c0} fill="#FEDCC8" />
                        <path d={svgPaths.p22f5ea80} fill="#FEDCC8" />
                    </g>
                    <g id="Heart">
                        <path d={svgPaths.p2c233580} fill="var(--fill-0, #ED505B)" id="Vector_3" />
                    </g>
                </g>
            </svg>
        </div>
    );
}

export default function Frame() {
    return (
        <div className="relative size-full">
            <Group />
        </div>
    );
}