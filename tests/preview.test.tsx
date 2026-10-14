import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import * as chain from '../src/chain';
vi.mock('../src/chain',()=>({unresolvedSubmission:vi.fn(()=>false),gallery:vi.fn(async()=>[]),pending:vi.fn(()=>({hash:'unexpected-saved-pending'})),lineage:vi.fn(),write:vi.fn(),connect:vi.fn(),track:vi.fn(),walletError:(e:Error)=>e.message}));
it('preview blocks chain paths even with deployed config, saved transaction and w=1',async()=>{
 vi.stubEnv('VITE_OFFCHAIN_PREVIEW','true');vi.resetModules();
 const {default:App}=await import('../src/App');const {DEPLOYMENT:config}=await import('../src/config');
 const old={...config};config.address=('0x'+'a'.repeat(40)) as `0x${string}`;config.verifiedWorkId=1;
 localStorage.clear();history.replaceState({},'','/?w=1');window.scrollTo=vi.fn();
 render(<App/>);expect(screen.getByText(/SPLICE.CLUB — OFFCHAIN PLAY PREVIEW/)).toBeTruthy();expect(screen.getByRole('button',{name:/START PLAYING/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/SKIP INTRO/}));
 expect((screen.getByRole('button',{name:'OFFCHAIN PREVIEW'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'OFFCHAIN PREVIEW'}));
 expect((screen.getByRole('button',{name:/LET’S SPLICE/}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.queryByText(/Recheck saved transaction/)).toBeNull();
 expect(chain.connect).not.toHaveBeenCalled();expect(chain.gallery).not.toHaveBeenCalled();expect(chain.lineage).not.toHaveBeenCalled();expect(chain.write).not.toHaveBeenCalled();expect(chain.track).not.toHaveBeenCalled();
 Object.assign(config,old);cleanup();vi.unstubAllEnvs();
});
