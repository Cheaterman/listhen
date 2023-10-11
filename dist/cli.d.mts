import * as citty from 'citty';
import { ParsedArgs } from 'citty';
import { L as ListenOptions } from './shared/listhen.319583b0.mjs';
import 'node:http';
import 'node:https';
import 'node:net';
import 'get-port-please';
import 'crossws/adapters/node';

declare const main: citty.CommandDef<{
    port: {
        readonly type: "string";
        readonly description: "Port to listen on (use `PORT` environment variable to override)";
    };
    host: {
        readonly description: "Host to listen on. If no value or an empty string provided, will listen on all available interfaces (use `HOST` environment variable to override)";
    };
    clipboard: {
        readonly type: "boolean";
        readonly description: "Copy the URL to the clipboard";
    };
    open: {
        readonly type: "boolean";
        readonly description: "Open the URL in the browser";
    };
    https: {
        readonly type: "boolean";
        readonly description: "Enable HTTPS";
    };
    "https.cert": {
        readonly type: "string";
        readonly description: "Path to TLS certificate used with HTTPS in PEM format";
    };
    "https.key": {
        readonly type: "string";
        readonly description: "Path to TLS key used with HTTPS in PEM format";
    };
    "https.pfx": {
        readonly type: "string";
        readonly description: "Path to PKCS#12 (.p12/.pfx) keystore containing a TLS certificate and Key";
    };
    "https.passphrase": {
        readonly type: "string";
        readonly description: "Passphrase used for TLS key or keystore";
    };
    "https.validityDays": {
        readonly type: "string";
        readonly description: "Validity in days of the autogenerated TLS certificate (https: true)";
    };
    "https.domains": {
        readonly type: "string";
        readonly description: "Comma separated list of domains and IPs, the autogenerated certificate should be valid for (https: true)";
    };
    publicURL: {
        readonly type: "string";
        readonly description: "Displayed public URL (used for QR code)";
        readonly required: false;
    };
    qr: {
        readonly type: "boolean";
        readonly description: "Display The QR code of public URL when available";
        readonly required: false;
    };
    public: {
        readonly type: "boolean";
        readonly description: "Listen to all network interfaces";
        readonly required: false;
    };
    tunnel: {
        readonly type: "boolean";
        readonly description: "Open a tunnel using https://github.com/unjs/untun";
        readonly required: false;
    };
    socket: {
        readonly description: "Listen on a Unix Domain Socket/Windows Pipe, optionally with custom name or given absolute path";
        readonly required: false;
    };
    cwd: {
        type: "string";
        description: string;
    };
    entry: {
        type: "positional";
        description: string;
        required: true;
    };
    name: {
        type: "string";
        description: string;
    };
    baseURL: {
        type: "string";
        description: string;
    };
    watch: {
        type: "boolean";
        description: string;
        alias: string;
    };
    ws: {
        type: "boolean";
        description: string;
    };
}>;
declare const runMain: () => Promise<void>;
/** Returns unjs/citty compatible args object */
declare function getArgs(): {
    readonly port: {
        readonly type: "string";
        readonly description: "Port to listen on (use `PORT` environment variable to override)";
    };
    readonly host: {
        readonly description: "Host to listen on. If no value or an empty string provided, will listen on all available interfaces (use `HOST` environment variable to override)";
    };
    readonly clipboard: {
        readonly type: "boolean";
        readonly description: "Copy the URL to the clipboard";
    };
    readonly open: {
        readonly type: "boolean";
        readonly description: "Open the URL in the browser";
    };
    readonly https: {
        readonly type: "boolean";
        readonly description: "Enable HTTPS";
    };
    readonly "https.cert": {
        readonly type: "string";
        readonly description: "Path to TLS certificate used with HTTPS in PEM format";
    };
    readonly "https.key": {
        readonly type: "string";
        readonly description: "Path to TLS key used with HTTPS in PEM format";
    };
    readonly "https.pfx": {
        readonly type: "string";
        readonly description: "Path to PKCS#12 (.p12/.pfx) keystore containing a TLS certificate and Key";
    };
    readonly "https.passphrase": {
        readonly type: "string";
        readonly description: "Passphrase used for TLS key or keystore";
    };
    readonly "https.validityDays": {
        readonly type: "string";
        readonly description: "Validity in days of the autogenerated TLS certificate (https: true)";
    };
    readonly "https.domains": {
        readonly type: "string";
        readonly description: "Comma separated list of domains and IPs, the autogenerated certificate should be valid for (https: true)";
    };
    readonly publicURL: {
        readonly type: "string";
        readonly description: "Displayed public URL (used for QR code)";
        readonly required: false;
    };
    readonly qr: {
        readonly type: "boolean";
        readonly description: "Display The QR code of public URL when available";
        readonly required: false;
    };
    readonly public: {
        readonly type: "boolean";
        readonly description: "Listen to all network interfaces";
        readonly required: false;
    };
    readonly tunnel: {
        readonly type: "boolean";
        readonly description: "Open a tunnel using https://github.com/unjs/untun";
        readonly required: false;
    };
    readonly socket: {
        readonly description: "Listen on a Unix Domain Socket/Windows Pipe, optionally with custom name or given absolute path";
        readonly required: false;
    };
};
type ParsedListhenArgs = ParsedArgs<ReturnType<typeof getArgs>>;
/** Convert unjs/citty compatible args to listhen options */
declare function parseArgs(args: ParsedListhenArgs): Partial<ListenOptions>;

export { getArgs, main, parseArgs, runMain };
