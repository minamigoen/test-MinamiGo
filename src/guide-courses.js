export const GUIDE_SOURCE='https://www.town.minami.lg.jp/kankou-guide/';
export const GUIDE_COURSES=[
 {id:'ohama',name:'大浜海岸',duration:'約40分',distance:'距離は公式未掲載',stops:[{id:'guide-hiwasa-shrine',number:1},{id:'town-0000000002',number:2}],steps:['日和佐八幡神社','大浜海岸'],note:'産卵などの映像紹介を含む案内。実際の産卵見学が付くコースではありません。',lineNote:'参道の確認できた歩道区間だけを参考線で表示。神社・海岸への接続区間は未確認です。'},
 {id:'yakuouji',name:'たっぷり薬王寺',duration:'約1時間',distance:'約500m／石段は片道約150段',stops:[{id:'town-0000000003',number:1}],steps:['仁王門','女厄坂','男厄坂','本堂','大師堂','還暦厄坂','瑜祇塔','方丈','寺務所','仁王門'],note:'地図は寺院代表点1点。境内の立寄順は公式案内に基づきますが、各所の位置は未確認です。',lineNote:'境内の正確な歩行線は未確認のため描いていません。'},
 {id:'awae',name:'あわえ・町並み',duration:'約1時間',distance:'約3km（相談により変わります）',stops:[{id:'town-0000000003',number:'A'},{id:'town-0000000002',number:'B'}],steps:['出発は薬王寺または日和佐駅（相談）','門前町通り・桜町通り','厄除け橋','日和佐浦'],note:'出発・ルートは相談制。地図は薬王寺の出発候補と、公式説明に登場する大浜海岸の参考点です。A/Bは固定の集合順を示しません。',lineNote:'相談制のため固定の歩行線は描いていません。旧橋の石仏を現橋の地点として代用しません。'},
 {id:'caretta',name:'うみがめ博物館',duration:'約1時間（館内）',distance:'館内コース／距離は公式未掲載',stops:[{id:'town-0000000007',number:1}],steps:['日和佐うみがめ博物館 カレッタの館内案内'],note:'ガイド料と別に入館料が必要です。公式FAQに産卵見学の当面休止案内があります。',lineNote:'館内のコースです。駅からのアクセス約1.5kmをコース距離として表示していません。'},
 {id:'ebisu',name:'えびす洞',duration:'約40分',distance:'距離は公式未掲載',stops:[{id:'guide-ebisu-cave',number:1}],steps:['入口駐車場まで各自で移動・集合（位置は要確認）','えびす洞と周辺遊歩道（細かな周遊順は未確認）'],note:'急な石段があり、小さな子どもには危険との公式注意があります。安全な服装が必要で、海が荒れた日は中止です。',lineNote:'OSMの歩道・階段区間を参考表示。公式の確定経路・入口駐車場・周遊順を示す線ではありません。'}
];
export const COURSE_IDS=GUIDE_COURSES.map(c=>c.id);
export function guideCourse(id){return GUIDE_COURSES.find(c=>c.id===id)||null;}
export function validateGuideLines(input){
 if(input?.schemaVersion!==1||input.license!=='ODbL-1.0'||!Array.isArray(input.segments)||input.segments.length>30)throw Error('Invalid guide lines');const seen=new Set();
 return {...input,segments:input.segments.map(s=>{if(s.source!=='https://www.openstreetmap.org/way/'+s.way||!['not explicitly tagged','yes','permissive','designated','public'].includes(s.access)||!['not explicitly tagged','yes','permissive','designated','public'].includes(s.foot)||!['ohama','ebisu'].includes(s.course)||!Number.isSafeInteger(s.way)||seen.has(s.way)||!['footway','steps'].includes(s.highway)||['private','no'].includes(s.access)||['private','no'].includes(s.foot)||!Array.isArray(s.points)||s.points.length<2||s.points.length>100)throw Error('Unreviewed guide segment');seen.add(s.way);for(const p of s.points)if(p.length!==2||!p.every(Number.isFinite)||p[0]<33.72||p[0]>33.75||p[1]<134.52||p[1]>134.56)throw Error('Out-of-area guide segment');return s;})};
}
