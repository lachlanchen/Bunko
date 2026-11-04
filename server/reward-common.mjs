import {createHash} from 'node:crypto';
export class AppError extends Error {constructor(message,status=400){super(message);this.status=status}}
export const requireValue=(ok,message,status=400)=>{if(!ok)throw new AppError(message,status)};
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function tx(store,operation){store.db.exec('BEGIN IMMEDIATE');try{const result=operation();store.db.exec('COMMIT');return result}catch(e){store.db.exec('ROLLBACK');throw e}}
