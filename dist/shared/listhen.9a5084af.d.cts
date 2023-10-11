import { Server } from 'node:http';
import { Server as Server$1 } from 'node:https';
import { AddressInfo } from 'node:net';
import { GetPortInput } from 'get-port-please';

interface Certificate {
    key: string;
    cert: string;
    passphrase?: string;
}
interface HTTPSOptions {
    cert?: string;
    key?: string;
    pfx?: string;
    passphrase?: string;
    validityDays?: number;
    domains?: string[];
}
interface ListenOptions {
    name: string;
    port: GetPortInput;
    hostname: string;
    showURL: boolean;
    baseURL: string;
    open: boolean;
    https: boolean | HTTPSOptions;
    clipboard: boolean;
    isTest: boolean;
    isProd: boolean;
    autoClose: boolean;
    _entry?: string;
    /**
     * Used as main public url to display
     * @default The first public IPV4 address listening to
     */
    publicURL?: string;
    /**
     * Print QR Code for public IPv4 address
     *
     * @default true
     */
    qr?: boolean;
    /**
     * When enabled, listhen tries to listen to all network interfaces
     *
     * @default `false` for development and `true` for production
     */
    public: boolean;
    /**
     * Open a tunnel using https://github.com/unjs/untun
     */
    tunnel?: boolean;
    /**
     * Listhen on a unix domain socket/windows pipe, optionally with custom name
     *
     */
    socket: boolean | string;
}
type GetURLOptions = Pick<Partial<ListenOptions>, "baseURL" | "publicURL">;
type ShowURLOptions = Pick<Partial<ListenOptions>, "baseURL" | "name" | "publicURL" | "qr">;
interface ListenURL {
    url: string;
    type: "local" | "network" | "tunnel";
}
interface Listener {
    url: string;
    address: AddressInfo;
    server: Server | Server$1;
    https: false | Certificate;
    close: () => Promise<void>;
    open: () => Promise<void>;
    showURL: (options?: ShowURLOptions) => Promise<void>;
    getURLs: (options?: GetURLOptions) => Promise<ListenURL[]>;
}

export type { Certificate as C, GetURLOptions as G, HTTPSOptions as H, ListenOptions as L, ShowURLOptions as S, Listener as a, ListenURL as b };