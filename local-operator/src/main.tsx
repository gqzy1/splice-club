import {createRoot} from 'react-dom/client';
import {App} from './App';
import './style.css';
if(location.hostname!=='127.0.0.1'||location.port!=='4179')document.body.textContent='STOP: 只能通过 START_SPLICE_LOCAL.cmd 在 http://127.0.0.1:4179 运行。';
else createRoot(document.getElementById('root')!).render(<App/>);
