export async function api<T>(path:string,options:{method?:string;body?:unknown;operatorToken?:string}={}) : Promise<T> {
  const response=await fetch(`/api/${path}`,{
    method:options.method||'GET',
    headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.operatorToken?{'x-operator-token':options.operatorToken}:{})},
    body:options.body?JSON.stringify(options.body):undefined,
    cache:'no-store'
  });
  const value=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(value?.error?.message||`Request failed (${response.status})`);
  return value as T;
}
