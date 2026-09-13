const admin=require('firebase-admin');
let db=null;
function init(){if(db)return db;let cred;if(process.env.FIREBASE_SERVICE_ACCOUNT_JSON){cred=admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));}else if(process.env.FIREBASE_SERVICE_ACCOUNT_PATH){cred=admin.credential.cert(require(require('path').resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)));}else {console.warn('[Firebase] credentials missing; using in-memory fallback.');return null;}admin.initializeApp({credential:cred});db=admin.firestore();return db;}
const memory=new Map();
function key(g,p){return `${g}:${p}`;}
async function getGuild(g){if(!init()){return memory.get(key(g,'config'))||{};}const s=await db.collection('guilds').doc(g).get();return s.exists?s.data():{};}
async function setGuild(g,data){if(!init()){memory.set(key(g,'config'),data);return;}await db.collection('guilds').doc(g).set(data,{merge:true});}
async function updateGuild(g,path,value){const data=await getGuild(g);let cur=data;const parts=path.split('.');for(let i=0;i<parts.length-1;i++){cur[parts[i]]=cur[parts[i]]||{};cur=cur[parts[i]];}cur[parts.at(-1)]=value;await setGuild(g,data);}
async function collection(g,name){if(!init()){const k=key(g,name);if(!memory.has(k))memory.set(k,[]);return memory.get(k);}return db.collection('guilds').doc(g).collection(name);}
module.exports={getGuild,setGuild,updateGuild,collection};
