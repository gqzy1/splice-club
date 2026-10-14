// Actual locked V2 UI, synthetic DOM only; NOT a real browser/wallet run.
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
import {afterEach,it,expect,vi} from 'vitest';
import {App} from '../src/App';
afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear();});
it('renders V2 identity and keeps all prepare buttons locked without touching V1 progress',async()=>{
 vi.stubGlobal('crypto',webcrypto);localStorage.setItem('splice.fast2c.operator.v1','{"original":"V1 progress"}');
 const fetch=vi.fn(()=>{throw new Error('Unexpected network call');});vi.stubGlobal('fetch',fetch);
 render(<App/>);await waitFor(()=>expect(screen.getByText(/SHA256 PASS/)).toBeTruthy());
 expect(screen.getByText(/FAST-2F \/ V2/)).toBeTruthy();
 expect(screen.getByText(/DEPLOYMENT LOCKED/)).toBeTruthy();
 for(const step of ['T01','T02','T03','T04'])expect(screen.getByRole('button',{name:`准备 ${step}（只读）`}).hasAttribute('disabled')).toBe(true);
 expect(localStorage.getItem('splice.fast2c.operator.v1')).toBe('{"original":"V1 progress"}');
 expect(fetch).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:/SIGN T01/})).toBeNull();
});
