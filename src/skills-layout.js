export const SKILLS_START=.198;
export const SKILLS_END=.273;
export const clamp01=x=>Math.max(0,Math.min(1,x));
export const smooth01=x=>{x=clamp01(x);return x*x*(3-2*x);};
export const skillsZoom=p=>smooth01((p-.198)/.015);
export const skillsIndex=(p,count=6)=>Math.min(count-1,Math.floor(clamp01((p-.214)/.052)*count));
