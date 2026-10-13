/** @OnlyCurrentDoc */
/** Bound to the owner's PRIVATE management spreadsheet. Never deploy as a public web app.
 * User deliberately runs export. No shared-drive permission or OAuth configuration changes.
 * Keep private PDF, photo files, coordinates pending verification and contact details out.
 */
function onOpen() { SpreadsheetApp.getUi().createMenu('MinamiGo 公開データ').addItem('承認済み行をJSON表示','exportPublicData').addToUi(); }
function exportPublicData() {
 const sheet=SpreadsheetApp.getActive().getSheetByName('spots');
 if(!sheet)throw new Error('spots タブを作成してください');
 const values=sheet.getDataRange().getValues(),headers=values.shift();
 const allowed=['id','name','category','description','address','lat','lng','hours','closed','price','tel','url','source','verifiedAt','accessNote','imageryDate','streetViewUrl','mapQuery','mapPlaceId','locationLabel','mapScope','directionsMode','photoUrl','photoAlt','photoSource','photoLicense','photoCredit','relatedLinks','foodType','officialCheckedAt'];
 for(const required of ['publicApproved','id','name','category','source','verifiedAt'])if(!headers.includes(required))throw new Error('必要な列: '+required);
 const rows=values.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]]))).filter(r=>r.publicApproved===true).map(r=>{
   const out={publicApproved:true,locationVerified:r.locationVerified===true,photoApproved:r.photoApproved===true};for(const key of allowed)if(r[key]!==''&&r[key]!==null&&r[key]!==undefined){if(key.startsWith('photo')&&r.photoApproved!==true)continue;if(key==='directionsMode'&&r.locationVerified!==true&&r.mapScope!=='name-address')continue;if(key==='relatedLinks'){out[key]=JSON.parse(String(r[key]));}else if(key==='lat'||key==='lng'){if(r.locationVerified!==true)continue;out[key]=Number(r[key]);}else if((key==='verifiedAt'||key==='officialCheckedAt')&&r[key] instanceof Date)out[key]=Utilities.formatDate(r[key],'Asia/Tokyo','yyyy-MM-dd');else out[key]=String(r[key]);}return out;
 });
 const json=JSON.stringify({rows},null,2);
 // Render using textContent via base64; source text cannot execute in the dialog.
 const encoded=Utilities.base64Encode(json,Utilities.Charset.UTF_8);
 const html=HtmlService.createHtmlOutput('<html><body><h2>公開候補JSON</h2><p>内容を確認して保存し、検証コマンドを実行してください。元シートの共有権限は変更しません。</p><button id="download">JSONを保存</button><pre id="preview" style="white-space:pre-wrap"></pre><script>const bytes=Uint8Array.from(atob("'+encoded+'"),c=>c.charCodeAt(0));const text=new TextDecoder().decode(bytes);document.getElementById("preview").textContent=text;document.getElementById("download").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download="approved-export.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};</script></body></html>').setWidth(700).setHeight(600);
 SpreadsheetApp.getUi().showModalDialog(html,'公開データのレビュー');
}
