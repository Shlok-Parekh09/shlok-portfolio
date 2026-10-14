export const LIST_TOP=210,LIST_BOTTOM=650,ROW_HEIGHT=112;
export const maxScroll=count=>Math.max(0,count*ROW_HEIGHT-(LIST_BOTTOM-LIST_TOP));
export const clampScroll=(offset,count)=>Math.max(0,Math.min(maxScroll(count),offset));
// Canvas is painted rotated 180 degrees and uploaded with flipY=false.
export const laptopPoint=uv=>({x:(1-uv.x)*1200,y:(1-uv.y)*720});
export function songAt(uv,offset,count){const {x,y}=laptopPoint(uv);if(x<48||x>1152||y<LIST_TOP||y>=LIST_BOTTOM)return -1;const i=Math.floor((y-LIST_TOP+offset)/ROW_HEIGHT);return i>=0&&i<count?i:-1;}
