import { RequestListener } from 'node:http';
import { L as ListenOptions, a as Listener } from './shared/listhen.9a5084af.cjs';
export { C as Certificate, G as GetURLOptions, H as HTTPSOptions, b as ListenURL, S as ShowURLOptions } from './shared/listhen.9a5084af.cjs';
import { ConsolaInstance } from 'consola';
import * as h3 from 'h3';
import 'node:https';
import 'node:net';
import 'get-port-please';

declare function listen(handle: RequestListener, _options?: Partial<ListenOptions>): Promise<Listener>;

interface DevServerOptions {
    cwd?: string;
    staticDirs?: string[];
    logger?: ConsolaInstance;
}
declare function createDevServer(entry: string, options: DevServerOptions): Promise<{
    cwd: string;
    resolver: {
        relative: (path: string) => string;
        formateRelative: (path: string) => string;
        import: (id: string) => Promise<any>;
        resolve: (id: string) => string;
        tryResolve: (id: string) => string | undefined;
    };
    nodeListener: h3.NodeListener;
    reload: (_initial?: boolean) => Promise<void>;
    _entry: string | undefined;
}>;

interface WatchOptions extends DevServerOptions {
    cwd?: string;
    logger?: ConsolaInstance;
    ignore?: string[];
    publicDirs?: string[];
}
declare function listenAndWatch(entry: string, options: Partial<ListenOptions & WatchOptions>): Promise<Listener>;

export { type DevServerOptions, ListenOptions, Listener, type WatchOptions, createDevServer, listen, listenAndWatch };
