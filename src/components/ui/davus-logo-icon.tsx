import React from "react";

export function DavusLogoIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 2084 2084"
            className={className}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
        >
            <g>
                <clipPath id="_clip1_logo">
                    <path d="M852.344,1522.352c142.079,0 257.682,-115.451 257.682,-257.335l0,-704.362l-515.386,0l0,961.697l257.704,0Zm-435.373,177.539l0,-1316.667l870.833,0l0,881.793c0,239.757 -195.312,434.787 -435.373,434.787l-435.46,0.087Z" />
                </clipPath>
                <g clipPath="url(#_clip1_logo)">
                    <path d="M-27.713,555.534l558.659,1437.652l1201.519,-465.625l-558.637,-1437.652l-1201.541,465.625Z" fill="currentColor" />
                </g>
            </g>
            <g>
                <clipPath id="_clip2_logo">
                    <rect x="1489.518" y="383.225" width="175" height="175" />
                </clipPath>
                <g clipPath="url(#_clip2_logo)">
                    <path d="M1430.512,406.12l81.923,211.111l211.111,-81.923l-81.923,-211.111l-211.111,81.923Z" fill="currentColor" />
                </g>
            </g>
        </svg>
    );
}
